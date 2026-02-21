/* ============================================
   FOREX PULSE — Signal Generator Service
   ============================================ */

import store from './store.js';
import { fetchTimeSeries, getPipSize } from './api.js';
import { calculateDetailedSignal } from './signalService.js';

/**
 * Generate a detailed trade signal for a single pair by fetching data
 */
export async function generateSignalForPair(pair, timeframe = '1h') {
  const candles = await fetchTimeSeries(pair, timeframe, 100);
  if (!candles || candles.length < 30) return null;

  const quotes = store.get('quotes') || {};
  const quote = quotes[pair];

  return calculateDetailedSignal(pair, candles, quote);
}

/**
 * Scan all watchlist pairs and return ranked trade signals.
 */
export async function generateTradeSignals(timeframe = '1h') {
  let watchlist = store.get('watchlist') || [];
  if (watchlist.length === 0) {
    watchlist = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'];
  }

  const signals = [];
  for (const pair of watchlist) {
    try {
      const sig = await generateSignalForPair(pair, timeframe);
      // For scanning, we only want actual trade signals (not neutral)
      if (sig && sig.signal !== 'neutral') {
        // Add current prices for UI
        const quote = store.get('quotes')?.[pair];
        sig.currentBid = quote ? (quote.bid || quote.close) : sig.entryPrice;
        sig.currentAsk = quote ? (quote.ask || quote.close) : sig.entryPrice;
        sig.timeframe = timeframe;
        signals.push(sig);
      }
    } catch (err) {
      console.warn(`Signal generation failed for ${pair}:`, err);
    }
  }

  signals.sort((a, b) => b.strength - a.strength);
  return signals;
}
