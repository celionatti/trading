/* ============================================
   FOREX PULSE — Trade Engine (Enhanced)
   ============================================ */

import store from './store.js';
import { getPipSize } from './api.js';

let tradeIdCounter = Date.now();

/**
 * Toast feedback helper
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div style="flex:1;">${message}</div>
    <button style="background:none;border:none;color:inherit;cursor:pointer;opacity:0.5;">✕</button>
  `;
  container.appendChild(toast);
  
  const timeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);

  toast.querySelector('button').onclick = () => {
    clearTimeout(timeout);
    toast.remove();
  };
}

function createToastContainer() {
  const c = document.createElement('div');
  c.id = 'toast-container';
  c.className = 'toast-container';
  document.body.appendChild(c);
  return c;
}

export const TRADE_MODES = {
  scalp: {
    label: 'Scalp',
    icon: '⚡',
    defaultSL: 15,
    defaultTP: 25,
    holdTime: '1-30 min',
    timeframes: ['1min', '5min', '15min'],
    description: 'Quick entries and exits, small pip targets',
    color: '#f59e0b',
  },
  day: {
    label: 'Day Trade',
    icon: '☀️',
    defaultSL: 50,
    defaultTP: 100,
    holdTime: '30 min - 1 day',
    timeframes: ['15min', '1h', '4h'],
    description: 'Intraday positions, close before market end',
    color: '#3b82f6',
  },
  swing: {
    label: 'Swing',
    icon: '🌊',
    defaultSL: 100,
    defaultTP: 250,
    holdTime: '1 day - 2 weeks',
    timeframes: ['4h', '1day'],
    description: 'Hold positions for days, larger targets',
    color: '#8b5cf6',
  },
};

export const ORDER_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP: 'stop',
};

function generateId(prefix = 'T') {
  return `${prefix}${++tradeIdCounter}`;
}

export function calculatePipValue(pair, lotSize) {
  const pipSize = getPipSize(pair);
  const baseUnits = lotSize * 100000;
  if (pair.endsWith('USD')) return baseUnits * pipSize;
  
  const quote = store.get('quotes')?.[pair];
  const rate = quote ? parseFloat(quote.close || quote.bid) : 1;
  return pair.startsWith('USD') ? (baseUnits * pipSize) / rate : baseUnits * pipSize;
}

export function calculatePips(pair, entryPrice, currentPrice, direction) {
  const pipSize = getPipSize(pair);
  return (direction === 'buy' ? currentPrice - entryPrice : entryPrice - currentPrice) / pipSize;
}

/**
 * Open a Trade or Pending Order
 */
export function executeOrder(params) {
  const { 
    pair, direction, lotSize, stopLoss, takeProfit, 
    type = ORDER_TYPES.MARKET, price = null, mode = 'day',
    notes = '', tags = []
  } = params;

  const quotes = store.get('quotes');
  const quote = quotes?.[pair];
  if (!quote && type === ORDER_TYPES.MARKET) throw new Error(`No quote for ${pair}`);

  const pipSize = getPipSize(pair);
  const decimals = pair.includes('JPY') ? 3 : 5;

  if (type === ORDER_TYPES.MARKET) {
    const entryPrice = direction === 'buy' ? parseFloat(quote.ask || quote.close) : parseFloat(quote.bid || quote.close);
    return createTrade({ ...params, entryPrice, decimals, pipSize });
  } else {
    // Pending Order (Limit/Stop)
    const order = {
      id: generateId('O'),
      pair, direction, lotSize, type,
      targetPrice: parseFloat(price).toFixed(decimals),
      stopLossPips: stopLoss || 0,
      takeProfitPips: takeProfit || 0,
      mode, notes, tags,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    const orders = [...(store.get('orders') || []), order];
    store.set('orders', orders);
    showToast(`${type.toUpperCase()} order placed: ${pair} @ ${order.targetPrice}`, 'info');
    return order;
  }
}

/**
 * Legacy wrapper for opening a market trade
 */
export function openTrade(params) {
  return executeOrder({ ...params, type: ORDER_TYPES.MARKET });
}

export function modifyTrade(tradeId, updates) {
  const positions = store.get('positions') || [];
  const idx = positions.findIndex(t => t.id === tradeId);
  if (idx === -1) return;

  const trade = positions[idx];
  const decimals = trade.pair.includes('JPY') ? 3 : 5;
  const pipSize = getPipSize(trade.pair);

  if (updates.stopLoss !== undefined) {
    trade.stopLossPips = updates.stopLoss;
    trade.stopLoss = updates.stopLoss === 0 ? null : (trade.direction === 'buy' ? parseFloat(trade.entryPrice) - updates.stopLoss * pipSize : parseFloat(trade.entryPrice) + updates.stopLoss * pipSize).toFixed(decimals);
  }
  if (updates.takeProfit !== undefined) {
    trade.takeProfitPips = updates.takeProfit;
    trade.takeProfit = updates.takeProfit === 0 ? null : (trade.direction === 'buy' ? parseFloat(trade.entryPrice) + updates.takeProfit * pipSize : parseFloat(trade.entryPrice) - updates.takeProfit * pipSize).toFixed(decimals);
  }

  store.set('positions', [...positions]);
  showToast(`Modified ${trade.pair} SL/TP`, 'info');
}

function createTrade(params) {
  const { pair, direction, lotSize, stopLoss, takeProfit, mode, notes, tags, entryPrice, decimals, pipSize } = params;

  let slPrice = stopLoss ? (direction === 'buy' ? entryPrice - stopLoss * pipSize : entryPrice + stopLoss * pipSize).toFixed(decimals) : null;
  let tpPrice = takeProfit ? (direction === 'buy' ? entryPrice + takeProfit * pipSize : entryPrice - takeProfit * pipSize).toFixed(decimals) : null;

  const marginRequired = (lotSize * 100000) / store.get('settings.leverage');
  if (marginRequired > store.get('freeMargin')) throw new Error('Insufficient margin');

  const trade = {
    id: generateId('T'),
    pair, direction, lotSize, entryPrice: entryPrice.toFixed(decimals),
    currentPrice: entryPrice.toFixed(decimals),
    stopLoss: slPrice, takeProfit: tpPrice,
    stopLossPips: stopLoss || 0, takeProfitPips: takeProfit || 0,
    mode: mode || store.get('settings.tradeMode'),
    pipValue: calculatePipValue(pair, lotSize),
    marginRequired, unrealizedPL: 0, pips: 0,
    openTime: new Date().toISOString(),
    status: 'open', notes: notes || '', tags: tags || []
  };

  store.set('positions', [...(store.get('positions') || []), trade]);
  store.set('margin', store.get('margin') + marginRequired);
  store.updateEquity();
  showToast(`${direction.toUpperCase()} ${pair} @ ${trade.entryPrice}`, 'success');
  return trade;
}

export function closeTrade(tradeId, reason = 'manual') {
  const positions = store.get('positions') || [];
  const idx = positions.findIndex(t => t.id === tradeId);
  if (idx === -1) return;

  const trade = { ...positions[idx], status: 'closed', closePrice: positions[idx].currentPrice, closeTime: new Date().toISOString(), realizedPL: positions[idx].unrealizedPL, closeReason: reason };
  store.set('positions', positions.filter(t => t.id !== tradeId));
  store.set('history', [trade, ...(store.get('history') || [])]);
  store.set('balance', store.get('balance') + trade.realizedPL);
  store.set('margin', Math.max(0, store.get('margin') - trade.marginRequired));
  store.updateEquity();
  showToast(`Closed ${trade.pair}: ${trade.realizedPL >= 0 ? '+' : ''}$${trade.realizedPL.toFixed(2)}`, trade.realizedPL >= 0 ? 'success' : 'error');
}

export function cancelOrder(orderId) {
  const orders = store.get('orders') || [];
  store.set('orders', orders.filter(o => o.id !== orderId));
  showToast('Order cancelled', 'info');
}

export function updatePositionPrices(quotes) {
  // Update open positions
  const positions = store.get('positions') || [];
  if (positions.length > 0) {
    const newPositions = positions.map(trade => {
      const q = quotes[trade.pair];
      if (!q) return trade;
      const price = trade.direction === 'buy' ? parseFloat(q.bid || q.close) : parseFloat(q.ask || q.close);
      const pips = calculatePips(trade.pair, parseFloat(trade.entryPrice), price, trade.direction);
      const ut = { ...trade, currentPrice: price.toFixed(trade.pair.includes('JPY') ? 3 : 5), pips: Math.round(pips * 10) / 10, unrealizedPL: Math.round(pips * trade.pipValue * 100) / 100 };
      if (trade.stopLoss && (trade.direction === 'buy' ? price <= parseFloat(trade.stopLoss) : price >= parseFloat(trade.stopLoss))) setTimeout(() => closeTrade(trade.id, 'stop-loss'), 0);
      else if (trade.takeProfit && (trade.direction === 'buy' ? price >= parseFloat(trade.takeProfit) : price <= parseFloat(trade.takeProfit))) setTimeout(() => closeTrade(trade.id, 'take-profit'), 0);
      return ut;
    });
    store.set('positions', newPositions);
  }

  // Check pending orders
  const orders = store.get('orders') || [];
  if (orders.length > 0) {
    orders.forEach(order => {
      const q = quotes[order.pair];
      if (!q) return;
      const price = parseFloat(q.close || q.bid);
      const target = parseFloat(order.targetPrice);
      let trigger = false;
      if (order.type === ORDER_TYPES.LIMIT) trigger = order.direction === 'buy' ? price <= target : price >= target;
      else if (order.type === ORDER_TYPES.STOP) trigger = order.direction === 'buy' ? price >= target : price <= target;
      if (trigger) {
        cancelOrder(order.id);
        try { createTrade({ ...order, entryPrice: price, decimals: order.pair.includes('JPY') ? 3 : 5, pipSize: getPipSize(order.pair) }); } catch (e) { showToast(`Failed to trigger order: ${e.message}`, 'error'); }
      }
    });
  }
  store.updateEquity();
}

/**
 * Risk Calculator Helper
 */
export function calculateLotSize(riskAmount, slPips, pair) {
  const pipValue = calculatePipValue(pair, 1); 
  if (slPips <= 0) return 0.01;
  const lots = riskAmount / (slPips * pipValue);
  return Math.max(0.01, Math.round(lots * 100) / 100);
}

/**
 * Analytics Data Generator
 */
export function getTradeStats() {
  const history = store.get('history') || [];
  const positions = store.get('positions') || [];
  const totalPL = positions.reduce((s, p) => s + p.unrealizedPL, 0);

  if (history.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      avgProfit: 0,
      totalPL,
      wins: 0,
      losses: 0,
      avgWin: 0,
      avgLoss: 0,
      bestTrade: 0,
      worstTrade: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0
    };
  }

  const wins = history.filter(t => t.realizedPL > 0);
  const losses = history.filter(t => t.realizedPL <= 0);
  
  const grossProfit = wins.reduce((s, t) => s + t.realizedPL, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.realizedPL, 0));
  
  const realizedPL = history.reduce((s, t) => s + t.realizedPL, 0);

  return {
    totalTrades: history.length,
    winRate: Math.round((wins.length / history.length) * 100),
    profitFactor: grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : (grossProfit / grossLoss),
    avgProfit: realizedPL / history.length,
    totalPL: realizedPL + totalPL,
    wins: wins.length,
    losses: losses.length,
    avgWin: wins.length > 0 ? grossProfit / wins.length : 0,
    avgLoss: losses.length > 0 ? grossLoss / losses.length : 0,
    bestTrade: Math.max(...history.map(t => t.realizedPL)),
    worstTrade: Math.min(...history.map(t => t.realizedPL)),
    consecutiveWins: 0, // Simplified
    consecutiveLosses: 0 // Simplified
  };
}
