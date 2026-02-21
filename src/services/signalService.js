/* ============================================
   FOREX PULSE — Signal Calculation Service
   ============================================ */

import {
  calculateRSI,
  calculateMACD,
  calculateEMA,
  calculateATR,
  generateSignal,
} from './indicators.js';
import { getPipSize } from './api.js';

/**
 * Pure function to calculate a detailed signal object from candle data.
 * No API calls here - just pure math on provided data.
 */
export function calculateDetailedSignal(pair, candles, quote = null) {
  if (!candles || candles.length < 30) return null;

  const closes = candles.map(c => parseFloat(c.close));
  const signal = generateSignal(candles);

  // Skip neutral signals if requested (usually for scanning)
  // but we return the full object for analysis components
  
  const atrValues = calculateATR(candles);
  const latestATR = atrValues.filter(v => v !== null).pop() || null;

  const pipSize = getPipSize(pair);
  const decimals = pair.includes('JPY') ? 3 : 5;
  const direction = signal.signal.includes('buy') ? 'buy' : 'sell';

  // Entry price from live quote or last candle close
  const entryPrice = quote
    ? parseFloat(direction === 'buy' ? (quote.ask || quote.close) : (quote.bid || quote.close))
    : closes[closes.length - 1];

  // ATR-based SL/TP (Standard factor: 1.5 for SL, 2.5 for TP)
  let slDistance, tpDistance;
  if (latestATR) {
    slDistance = latestATR * 1.5;
    tpDistance = latestATR * 2.5;
  } else {
    slDistance = entryPrice * 0.003;
    tpDistance = entryPrice * 0.005;
  }

  let stopLoss = direction === 'buy' ? entryPrice - slDistance : entryPrice + slDistance;
  let takeProfit = direction === 'buy' ? entryPrice + tpDistance : entryPrice - tpDistance;

  const slPips = Math.round(slDistance / pipSize);
  const tpPips = Math.round(tpDistance / pipSize);
  const riskReward = slPips > 0 ? (tpPips / slPips).toFixed(2) : '∞';

  // Indicators
  const rsi = calculateRSI(closes);
  const macd = calculateMACD(closes);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);

  const latestRSI = rsi.filter(v => v !== null).pop() || 50;
  const macdHist = macd.histogram.filter(v => v !== null);
  const latestMACD = macdHist.pop() || 0;
  const latestEMA20 = ema20.filter(v => v !== null).pop();
  const latestEMA50 = ema50.filter(v => v !== null).pop();

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
      emaTrend: latestEMA20 > latestEMA50 ? 'bullish' : 'bearish',
    },
    reasons: signal.reasons,
    timestamp: new Date().toISOString(),
  };
}
