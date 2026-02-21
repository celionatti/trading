/* ============================================
   FOREX PULSE — Signal Generator Service
   ============================================ */

import store from './store.js';
import { fetchTimeSeries } from './api.js';
import { getPipSize } from './api.js';
import {
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  generateSignal,
} from './indicators.js';

/**
 * Generate a detailed trade signal for a single pair
 * with concrete entry, SL, and TP prices based on ATR volatility.
 */
export async function generateSignalForPair(pair, timeframe = '1h') {
  const quotes = store.get('quotes') || {};
  const quote = quotes[pair];

  const candles = await fetchTimeSeries(pair, timeframe, 100);
  if (!candles || candles.length < 30) {
    return null;
  }

  const closes = candles.map(c => parseFloat(c.close));
  const signal = generateSignal(candles);

  // Skip neutral signals
  if (signal.signal === 'neutral') return null;

  // ATR for dynamic SL/TP
  const atrValues = calculateATR(candles);
  const validATR = atrValues.filter(v => v !== null);
  const latestATR = validATR.length > 0 ? validATR[validATR.length - 1] : null;

  const pipSize = getPipSize(pair);
  const decimals = pair.includes('JPY') ? 3 : 5;
  const direction = signal.signal.includes('buy') ? 'buy' : 'sell';

  // Entry price from live quote or last candle close
  const entryPrice = quote
    ? parseFloat(direction === 'buy' ? (quote.ask || quote.close) : (quote.bid || quote.close))
    : closes[closes.length - 1];

  // ATR-based SL/TP
  let slDistance, tpDistance;
  if (latestATR) {
    slDistance = latestATR * 1.5;
    tpDistance = latestATR * 2.5;
  } else {
    // Fallback: percentage-based
    slDistance = entryPrice * 0.003;
    tpDistance = entryPrice * 0.005;
  }

  let stopLoss, takeProfit;
  if (direction === 'buy') {
    stopLoss = entryPrice - slDistance;
    takeProfit = entryPrice + tpDistance;
  } else {
    stopLoss = entryPrice + slDistance;
    takeProfit = entryPrice - tpDistance;
  }

  const slPips = Math.round(slDistance / pipSize);
  const tpPips = Math.round(tpDistance / pipSize);
  const riskReward = slPips > 0 ? (tpPips / slPips).toFixed(2) : '∞';

  // Indicator snapshot
  const rsi = calculateRSI(closes);
  const macd = calculateMACD(closes);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);

  const latestRSI = rsi.filter(v => v !== null).pop() || 50;
  const macdHist = macd.histogram.filter(v => v !== null);
  const latestMACD = macdHist.length > 0 ? macdHist[macdHist.length - 1] : 0;
  const latestEMA20 = ema20.filter(v => v !== null).pop();
  const latestEMA50 = ema50.filter(v => v !== null).pop();
  const emaTrend = latestEMA20 > latestEMA50 ? 'bullish' : 'bearish';

  return {
    id: `${pair}-${Date.now()}`,
    pair,
    direction,
    signal: signal.signal,
    strength: signal.strength,
    entryPrice: entryPrice.toFixed(decimals),
    stopLoss: stopLoss.toFixed(decimals),
    takeProfit: takeProfit.toFixed(decimals),
    slPips,
    tpPips,
    riskReward,
    atr: latestATR ? latestATR.toFixed(decimals) : null,
    indicators: {
      rsi: latestRSI,
      macd: latestMACD,
      ema20: latestEMA20,
      ema50: latestEMA50,
      emaTrend,
    },
    reasons: signal.reasons,
    timeframe,
    timestamp: new Date().toISOString(),
    currentBid: quote ? (quote.bid || quote.close) : entryPrice.toFixed(decimals),
    currentAsk: quote ? (quote.ask || quote.close) : entryPrice.toFixed(decimals),
  };
}

/**
 * Scan all watchlist pairs and return ranked trade signals.
 */
export async function generateTradeSignals(timeframe = '1h') {
  let watchlist = store.get('watchlist') || [];
  
  // Safety: If watchlist is empty, use some defaults for scanning
  if (watchlist.length === 0) {
    watchlist = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'];
  }

  const signals = [];

  for (const pair of watchlist) {
    try {
      const signal = await generateSignalForPair(pair, timeframe);
      if (signal) signals.push(signal);
    } catch (err) {
      console.warn(`Signal generation failed for ${pair}:`, err);
    }
  }

  // Sort by strength descending
  signals.sort((a, b) => b.strength - a.strength);

  return signals;
}
