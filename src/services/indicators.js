/* ============================================
   FOREX PULSE — Technical Indicators
   ============================================ */

/**
 * Calculate EMA (Exponential Moving Average)
 */
export function calculateEMA(data, period) {
  if (data.length < period) return [];
  const multiplier = 2 / (period + 1);
  const ema = [];

  // SMA for first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema.push(sum / period);

  for (let i = period; i < data.length; i++) {
    ema.push((data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
  }

  // Pad with nulls
  const result = new Array(period - 1).fill(null).concat(ema);
  return result;
}

/**
 * Calculate SMA (Simple Moving Average)
 */
export function calculateSMA(data, period) {
  if (data.length < period) return [];
  const sma = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j];
    }
    sma.push(sum / period);
  }

  return new Array(period - 1).fill(null).concat(sma);
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return [];

  const gains = [];
  const losses = [];

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  let avgGain = gains.slice(0, period).reduce((s, g) => s + g, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((s, l) => s + l, 0) / period;

  const rsi = [];
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }

  return new Array(period).fill(null).concat(rsi);
}

/**
 * Calculate MACD
 */
export function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine = [];
  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }

  const validMacd = macdLine.filter(v => v !== null);
  const signalEMA = calculateEMA(validMacd, signalPeriod);
  const signalLine = new Array(closes.length - validMacd.length).fill(null)
    .concat(signalEMA);

  const histogram = [];
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macdLine[i] - signalLine[i]);
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(closes, period = 20, stdDev = 2) {
  const sma = calculateSMA(closes, period);
  const upper = [];
  const lower = [];

  for (let i = 0; i < closes.length; i++) {
    if (sma[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = closes.slice(Math.max(0, i - period + 1), i + 1);
      const mean = sma[i];
      const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / slice.length;
      const std = Math.sqrt(variance);
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }

  return { upper, middle: sma, lower };
}

/**
 * Calculate ATR (Average True Range)
 */
export function calculateATR(candles, period = 14) {
  if (candles.length < 2) return [];

  const trueRanges = [];
  for (let i = 1; i < candles.length; i++) {
    const high = parseFloat(candles[i].high);
    const low = parseFloat(candles[i].low);
    const prevClose = parseFloat(candles[i - 1].close);
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }

  const atr = [];
  let sum = 0;
  for (let i = 0; i < Math.min(period, trueRanges.length); i++) {
    sum += trueRanges[i];
  }
  atr.push(sum / period);

  for (let i = period; i < trueRanges.length; i++) {
    atr.push((atr[atr.length - 1] * (period - 1) + trueRanges[i]) / period);
  }

  return new Array(period).fill(null).concat(atr);
}

/**
 * Generate trading signal based on indicators
 */
export function generateSignal(candles) {
  if (!candles || candles.length < 30) {
    return { signal: 'neutral', strength: 0, reasons: [] };
  }

  const closes = candles.map(c => parseFloat(c.close));
  const rsi = calculateRSI(closes);
  const macd = calculateMACD(closes);
  const bb = calculateBollingerBands(closes);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);

  const latestRSI = rsi.filter(v => v !== null).pop();
  const latestMACD = macd.histogram.filter(v => v !== null);
  const latestHistogram = latestMACD[latestMACD.length - 1];
  const prevHistogram = latestMACD[latestMACD.length - 2];
  const currentPrice = closes[closes.length - 1];
  const latestEMA20 = ema20.filter(v => v !== null).pop();
  const latestEMA50 = ema50.filter(v => v !== null).pop();
  const latestBBUpper = bb.upper.filter(v => v !== null).pop();
  const latestBBLower = bb.lower.filter(v => v !== null).pop();

  let score = 0;
  const reasons = [];

  // RSI
  if (latestRSI < 30) {
    score += 2;
    reasons.push('RSI oversold (' + latestRSI.toFixed(1) + ')');
  } else if (latestRSI > 70) {
    score -= 2;
    reasons.push('RSI overbought (' + latestRSI.toFixed(1) + ')');
  } else if (latestRSI < 45) {
    score += 1;
    reasons.push('RSI bullish zone');
  } else if (latestRSI > 55) {
    score -= 1;
    reasons.push('RSI bearish zone');
  }

  // MACD
  if (latestHistogram > 0 && prevHistogram < 0) {
    score += 2;
    reasons.push('MACD bullish crossover');
  } else if (latestHistogram < 0 && prevHistogram > 0) {
    score -= 2;
    reasons.push('MACD bearish crossover');
  } else if (latestHistogram > 0) {
    score += 1;
    reasons.push('MACD positive');
  } else {
    score -= 1;
    reasons.push('MACD negative');
  }

  // EMA trend
  if (latestEMA20 > latestEMA50) {
    score += 1;
    reasons.push('EMA20 above EMA50 (bullish trend)');
  } else {
    score -= 1;
    reasons.push('EMA20 below EMA50 (bearish trend)');
  }

  // Bollinger Bands
  if (currentPrice < latestBBLower) {
    score += 1;
    reasons.push('Price below lower BB (oversold)');
  } else if (currentPrice > latestBBUpper) {
    score -= 1;
    reasons.push('Price above upper BB (overbought)');
  }

  // Price vs EMA
  if (currentPrice > latestEMA20) {
    score += 0.5;
  } else {
    score -= 0.5;
  }

  // Volatility check
  const atr = calculateATR(candles);
  const latestATR = atr.filter(v => v !== null).pop();
  const avgATR = atr.filter(v => v !== null).slice(-20).reduce((s,v) => s+v, 0) / 20;
  const highVol = latestATR > avgATR * 1.2;
  const lowVol = latestATR < avgATR * 0.8;

  if (highVol) reasons.push('High volatility detected (ATR expanding)');
  if (lowVol) reasons.push('Low volatility / Consolidation');

  const maxScore = 5.0; // Adjusted max score
  const strength = Math.min(100, Math.max(0, (Math.abs(score) / maxScore) * 100));
  let signal;

  if (score >= 2.0) signal = 'strong_buy';
  else if (score >= 1.0) signal = 'buy';
  else if (score <= -2.0) signal = 'strong_sell';
  else if (score <= -1.0) signal = 'sell';
  else signal = 'neutral';

  return { signal, strength: Math.round(strength), reasons, score, rsi: latestRSI };
}
