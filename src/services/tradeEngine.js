/* ============================================
   FOREX PULSE — Trade Engine (Simulated Broker)
   ============================================ */

import store from './store.js';
import { getPipSize } from './api.js';

let tradeIdCounter = Date.now();

// Trade mode presets
const TRADE_MODES = {
  scalp: {
    label: 'Scalp',
    icon: '⚡',
    defaultSL: 15,    // pips
    defaultTP: 25,    // pips
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

function generateTradeId() {
  return `T${++tradeIdCounter}`;
}

function calculatePipValue(pair, lotSize) {
  // Standard lot = 100,000 units, pip value ~$10 for EUR/USD
  const pipSize = getPipSize(pair);
  const baseUnits = lotSize * 100000;

  if (pair.endsWith('USD')) {
    return baseUnits * pipSize;
  } else if (pair.startsWith('USD')) {
    const quote = store.get('quotes')?.[pair];
    const rate = quote ? parseFloat(quote.close || quote.bid) : 1;
    return (baseUnits * pipSize) / rate;
  } else {
    // Cross pair — approximate
    return baseUnits * pipSize;
  }
}

function calculatePips(pair, entryPrice, currentPrice, direction) {
  const pipSize = getPipSize(pair);
  const diff = direction === 'buy'
    ? currentPrice - entryPrice
    : entryPrice - currentPrice;
  return diff / pipSize;
}

export function openTrade({ pair, direction, lotSize, stopLoss, takeProfit, mode }) {
  const quotes = store.get('quotes');
  const quote = quotes?.[pair];
  if (!quote) throw new Error(`No quote available for ${pair}`);

  const entryPrice = direction === 'buy'
    ? parseFloat(quote.ask || quote.close)
    : parseFloat(quote.bid || quote.close);

  const pipSize = getPipSize(pair);
  const decimals = pair.includes('JPY') ? 3 : 5;

  // Calculate SL/TP prices
  let slPrice, tpPrice;
  if (direction === 'buy') {
    slPrice = stopLoss ? (entryPrice - stopLoss * pipSize).toFixed(decimals) : null;
    tpPrice = takeProfit ? (entryPrice + takeProfit * pipSize).toFixed(decimals) : null;
  } else {
    slPrice = stopLoss ? (entryPrice + stopLoss * pipSize).toFixed(decimals) : null;
    tpPrice = takeProfit ? (entryPrice - takeProfit * pipSize).toFixed(decimals) : null;
  }

  const pipValue = calculatePipValue(pair, lotSize);
  const marginRequired = (lotSize * 100000) / store.get('settings.leverage');

  // Check margin
  const freeMargin = store.get('freeMargin');
  if (marginRequired > freeMargin) {
    throw new Error('Insufficient margin');
  }

  const trade = {
    id: generateTradeId(),
    pair,
    direction,
    lotSize,
    entryPrice: entryPrice.toFixed(decimals),
    currentPrice: entryPrice.toFixed(decimals),
    stopLoss: slPrice,
    takeProfit: tpPrice,
    stopLossPips: stopLoss || 0,
    takeProfitPips: takeProfit || 0,
    mode: mode || store.get('settings.tradeMode'),
    pipValue,
    marginRequired,
    unrealizedPL: 0,
    pips: 0,
    openTime: new Date().toISOString(),
    status: 'open',
  };

  // Update state
  const positions = [...(store.get('positions') || []), trade];
  store.set('positions', positions);
  store.set('margin', store.get('margin') + marginRequired);
  store.updateEquity();

  showToast(`${direction.toUpperCase()} ${pair} @ ${trade.entryPrice}`, 'success');

  return trade;
}

export function closeTrade(tradeId, reason = 'manual') {
  const positions = store.get('positions') || [];
  const tradeIndex = positions.findIndex(t => t.id === tradeId);
  if (tradeIndex === -1) throw new Error('Trade not found');

  const trade = { ...positions[tradeIndex] };
  trade.closePrice = trade.currentPrice;
  trade.closeTime = new Date().toISOString();
  trade.realizedPL = trade.unrealizedPL;
  trade.status = 'closed';
  trade.closeReason = reason;

  // Remove from positions
  const newPositions = positions.filter(t => t.id !== tradeId);
  store.set('positions', newPositions);

  // Add to history
  const history = [trade, ...(store.get('history') || [])];
  store.set('history', history);

  // Update balance
  store.set('balance', store.get('balance') + trade.realizedPL);
  store.set('margin', Math.max(0, store.get('margin') - trade.marginRequired));
  store.updateEquity();

  const plSign = trade.realizedPL >= 0 ? '+' : '';
  showToast(
    `Closed ${trade.pair}: ${plSign}$${trade.realizedPL.toFixed(2)} (${reason})`,
    trade.realizedPL >= 0 ? 'success' : 'error'
  );

  return trade;
}

export function modifyTrade(tradeId, { stopLoss, takeProfit }) {
  const positions = store.get('positions') || [];
  const tradeIndex = positions.findIndex(t => t.id === tradeId);
  if (tradeIndex === -1) throw new Error('Trade not found');

  const trade = { ...positions[tradeIndex] };
  const pipSize = getPipSize(trade.pair);
  const decimals = trade.pair.includes('JPY') ? 3 : 5;
  const entry = parseFloat(trade.entryPrice);

  if (stopLoss !== undefined) {
    trade.stopLossPips = stopLoss;
    if (trade.direction === 'buy') {
      trade.stopLoss = stopLoss ? (entry - stopLoss * pipSize).toFixed(decimals) : null;
    } else {
      trade.stopLoss = stopLoss ? (entry + stopLoss * pipSize).toFixed(decimals) : null;
    }
  }

  if (takeProfit !== undefined) {
    trade.takeProfitPips = takeProfit;
    if (trade.direction === 'buy') {
      trade.takeProfit = takeProfit ? (entry + takeProfit * pipSize).toFixed(decimals) : null;
    } else {
      trade.takeProfit = takeProfit ? (entry - takeProfit * pipSize).toFixed(decimals) : null;
    }
  }

  const newPositions = [...positions];
  newPositions[tradeIndex] = trade;
  store.set('positions', newPositions);

  showToast(`Modified ${trade.pair} SL/TP`, 'info');
  return trade;
}

export function updatePositionPrices(quotes) {
  const positions = store.get('positions');
  if (!positions || positions.length === 0) return;

  let updated = false;
  const newPositions = positions.map(trade => {
    const quote = quotes[trade.pair];
    if (!quote) return trade;

    const currentPrice = trade.direction === 'buy'
      ? parseFloat(quote.bid || quote.close)
      : parseFloat(quote.ask || quote.close);

    const pips = calculatePips(trade.pair, parseFloat(trade.entryPrice), currentPrice, trade.direction);
    const unrealizedPL = pips * trade.pipValue;

    const updatedTrade = {
      ...trade,
      currentPrice: currentPrice.toFixed(trade.pair.includes('JPY') ? 3 : 5),
      pips: Math.round(pips * 10) / 10,
      unrealizedPL: Math.round(unrealizedPL * 100) / 100,
    };

    // Check SL/TP
    if (trade.stopLoss && shouldTriggerSL(updatedTrade, currentPrice)) {
      setTimeout(() => closeTrade(trade.id, 'stop-loss'), 0);
    } else if (trade.takeProfit && shouldTriggerTP(updatedTrade, currentPrice)) {
      setTimeout(() => closeTrade(trade.id, 'take-profit'), 0);
    }

    updated = true;
    return updatedTrade;
  });

  if (updated) {
    store.set('positions', newPositions);
    store.updateEquity();
  }
}

function shouldTriggerSL(trade, price) {
  const sl = parseFloat(trade.stopLoss);
  return trade.direction === 'buy' ? price <= sl : price >= sl;
}

function shouldTriggerTP(trade, price) {
  const tp = parseFloat(trade.takeProfit);
  return trade.direction === 'buy' ? price >= tp : price <= tp;
}

// Toast helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.1rem;">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
    <span style="font-size: var(--text-sm);">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeIn 300ms ease-out reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

export function getTradeStats() {
  const history = store.get('history') || [];
  if (history.length === 0) {
    return { totalTrades: 0, wins: 0, losses: 0, winRate: 0, totalPL: 0, avgPL: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, bestTrade: 0, worstTrade: 0, consecutiveWins: 0, consecutiveLosses: 0 };
  }

  const wins = history.filter(t => t.realizedPL > 0);
  const losses = history.filter(t => t.realizedPL <= 0);
  const totalPL = history.reduce((s, t) => s + t.realizedPL, 0);
  const grossProfit = wins.reduce((s, t) => s + t.realizedPL, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.realizedPL, 0));

  let consWins = 0, consLosses = 0, maxConsWins = 0, maxConsLosses = 0;
  history.forEach(t => {
    if (t.realizedPL > 0) {
      consWins++;
      consLosses = 0;
      maxConsWins = Math.max(maxConsWins, consWins);
    } else {
      consLosses++;
      consWins = 0;
      maxConsLosses = Math.max(maxConsLosses, consLosses);
    }
  });

  return {
    totalTrades: history.length,
    wins: wins.length,
    losses: losses.length,
    winRate: (wins.length / history.length * 100).toFixed(1),
    totalPL: Math.round(totalPL * 100) / 100,
    avgPL: Math.round(totalPL / history.length * 100) / 100,
    profitFactor: grossLoss > 0 ? Math.round(grossProfit / grossLoss * 100) / 100 : grossProfit > 0 ? Infinity : 0,
    avgWin: wins.length > 0 ? Math.round(grossProfit / wins.length * 100) / 100 : 0,
    avgLoss: losses.length > 0 ? Math.round(-grossLoss / losses.length * 100) / 100 : 0,
    bestTrade: wins.length > 0 ? Math.max(...wins.map(t => t.realizedPL)) : 0,
    worstTrade: losses.length > 0 ? Math.min(...losses.map(t => t.realizedPL)) : 0,
    consecutiveWins: maxConsWins,
    consecutiveLosses: maxConsLosses,
  };
}

export { TRADE_MODES, calculatePipValue, calculatePips };
export { showToast };
