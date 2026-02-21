/* ============================================
   FOREX PULSE — API Service (Twelve Data) – Optimized
   ============================================ */

const BASE_URL = 'https://api.twelvedata.com';

// Rate limiting
const RATE_LIMIT = 8;
const RATE_WINDOW = 60000;
let requestTimestamps = [];

// Cache
const cache = new Map();
const CACHE_TTL = {
  quote: 10000,
  timeSeries: 60000,
  forexPairs: 3600000,
};

function getApiKey() {
  return localStorage.getItem('forexpulse_api_key') || '';
}

function setApiKey(key) {
  localStorage.setItem('forexpulse_api_key', key);
}

function getCacheKey(endpoint, params) {
  return `${endpoint}:${JSON.stringify(params)}`;
}

function getCached(key, ttl) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function throttledFetch(url) {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(t => now - t < RATE_WINDOW);

  if (requestTimestamps.length >= RATE_LIMIT) {
    const waitTime = RATE_WINDOW - (now - requestTimestamps[0]) + 100;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  requestTimestamps.push(Date.now());

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message || 'API Error');
  }
  return data;
}

// === API Methods ===

export async function fetchForexPairs() {
  const cacheKey = getCacheKey('forex_pairs', {});
  const cached = getCached(cacheKey, CACHE_TTL.forexPairs);
  if (cached) return cached;

  const apiKey = getApiKey();
  if (!apiKey) return getDefaultPairs();

  try {
    const data = await throttledFetch(`${BASE_URL}/forex_pairs?apikey=${apiKey}`);
    const pairs = data.data || [];
    setCache(cacheKey, pairs);
    return pairs;
  } catch (err) {
    console.warn('Failed to fetch forex pairs, using defaults:', err);
    return getDefaultPairs();
  }
}

export async function fetchQuote(symbol) {
  const cacheKey = getCacheKey('quote', { symbol });
  const cached = getCached(cacheKey, CACHE_TTL.quote);
  if (cached) return cached;

  const apiKey = getApiKey();
  if (!apiKey) return generateMockQuote(symbol);

  try {
    const data = await throttledFetch(`${BASE_URL}/quote?symbol=${symbol}&apikey=${apiKey}`);
    setCache(cacheKey, data);
    return data;
  } catch (err) {
    console.warn('Failed to fetch quote, using mock:', err);
    return generateMockQuote(symbol);
  }
}

export async function fetchTimeSeries(symbol, interval = '1h', outputSize = 100) {
  const cacheKey = getCacheKey('time_series', { symbol, interval, outputSize });
  const cached = getCached(cacheKey, CACHE_TTL.timeSeries);
  if (cached) return cached;

  const apiKey = getApiKey();
  if (!apiKey) return generateMockTimeSeries(symbol, interval, outputSize);

  try {
    const data = await throttledFetch(
      `${BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputSize}&apikey=${apiKey}`
    );
    const values = (data.values || []).reverse();
    setCache(cacheKey, values);
    return values;
  } catch (err) {
    console.warn('Failed to fetch time series, using mock:', err);
    return generateMockTimeSeries(symbol, interval, outputSize);
  }
}

export async function fetchIndicator(symbol, indicator, interval = '1h', params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const queryParams = new URLSearchParams({ symbol, interval, apikey: apiKey, ...params });

  try {
    const data = await throttledFetch(`${BASE_URL}/${indicator}?${queryParams.toString()}`);
    return (data.values || []).reverse();
  } catch (err) {
    console.warn(`Failed to fetch ${indicator}:`, err);
    return null;
  }
}

export async function fetchEconomicCalendar() {
  // Twelve Data doesn't provide a free economic calendar top-level
  // We'll generate a realistic mock one for this terminal
  return generateMockCalendar();
}

// === Mock/Default Data ===

function generateMockCalendar() {
  const events = [
    { id: 1, event: 'Non-Farm Payrolls', country: 'USD', impact: 'high', previous: '353k', estimate: '185k', actual: null, time: '13:30', date: new Date().toISOString() },
    { id: 2, event: 'CPI m/m', country: 'USD', impact: 'high', previous: '0.3%', estimate: '0.4%', actual: null, time: '13:30', date: new Date().toISOString() },
    { id: 3, event: 'Unemployment Rate', country: 'USD', impact: 'high', previous: '3.7%', estimate: '3.7%', actual: null, time: '13:30', date: new Date().toISOString() },
    { id: 4, event: 'ECB Press Conference', country: 'EUR', impact: 'high', previous: '—', estimate: '—', actual: null, time: '14:45', date: new Date().toISOString() },
    { id: 5, event: 'BOE Interest Rate Decision', country: 'GBP', impact: 'high', previous: '5.25%', estimate: '5.25%', actual: null, time: '12:00', date: new Date().toISOString() },
    { id: 6, event: 'Retail Sales m/m', country: 'AUD', impact: 'medium', previous: '1.1%', estimate: '0.4%', actual: '0.3%', time: '00:30', date: new Date().toISOString() },
  ];
  return events;
}

function getDefaultPairs() {
  return [
    { symbol: 'EUR/USD', currency_group: 'Major', currency_base: 'Euro', currency_quote: 'US Dollar' },
    { symbol: 'GBP/USD', currency_group: 'Major', currency_base: 'British Pound', currency_quote: 'US Dollar' },
    { symbol: 'USD/JPY', currency_group: 'Major', currency_base: 'US Dollar', currency_quote: 'Japanese Yen' },
    { symbol: 'USD/CHF', currency_group: 'Major', currency_base: 'US Dollar', currency_quote: 'Swiss Franc' },
    { symbol: 'AUD/USD', currency_group: 'Major', currency_base: 'Australian Dollar', currency_quote: 'US Dollar' },
    { symbol: 'USD/CAD', currency_group: 'Major', currency_base: 'US Dollar', currency_quote: 'Canadian Dollar' },
    { symbol: 'NZD/USD', currency_group: 'Major', currency_base: 'New Zealand Dollar', currency_quote: 'US Dollar' },
    { symbol: 'EUR/GBP', currency_group: 'Minor', currency_base: 'Euro', currency_quote: 'British Pound' },
    { symbol: 'EUR/JPY', currency_group: 'Minor', currency_base: 'Euro', currency_quote: 'Japanese Yen' },
    { symbol: 'GBP/JPY', currency_group: 'Minor', currency_base: 'British Pound', currency_quote: 'Japanese Yen' },
  ];
}

const basePrices = {
  'EUR/USD': 1.0850,
  'GBP/USD': 1.2650,
  'USD/JPY': 149.50,
  'USD/CHF': 0.8780,
  'AUD/USD': 0.6540,
  'USD/CAD': 1.3580,
  'NZD/USD': 0.6120,
  'EUR/GBP': 0.8570,
  'EUR/JPY': 162.20,
  'GBP/JPY': 189.15,
};

// Running prices — persisted between ticks for smooth movement
const livePrices = {};

function getBasePrice(symbol) {
  return basePrices[symbol] || 1.0000;
}

function getPipSize(symbol) {
  return symbol.includes('JPY') ? 0.01 : 0.0001;
}

function getLivePrice(symbol) {
  if (!livePrices[symbol]) {
    livePrices[symbol] = getBasePrice(symbol);
  }
  return livePrices[symbol];
}

/**
 * Generates a mock quote using a random-walk from the last known price
 * instead of re-randomizing from scratch. Much cheaper + realistic.
 */
function generateMockQuote(symbol) {
  const pip = getPipSize(symbol);
  const decimals = symbol.includes('JPY') ? 3 : 5;

  // Random walk: tiny step from last price
  const last = getLivePrice(symbol);
  const step = (Math.random() - 0.498) * pip * 8; // slight upward bias
  const price = last + step;
  livePrices[symbol] = price;

  const spread = pip * (1.5 + Math.random() * 1.5);
  const change = price - getBasePrice(symbol);

  return {
    symbol,
    open: (price - step * 0.3).toFixed(decimals),
    high: (price + pip * 5).toFixed(decimals),
    low: (price - pip * 5).toFixed(decimals),
    close: price.toFixed(decimals),
    previous_close: (price - change).toFixed(decimals),
    change: change.toFixed(decimals),
    percent_change: ((change / getBasePrice(symbol)) * 100).toFixed(3),
    bid: price.toFixed(decimals),
    ask: (price + spread).toFixed(decimals),
    timestamp: new Date().toISOString(),
    _isMock: true
  };
}

// Pre-generated time-series cache to avoid regeneration
const seriesCache = new Map();

function generateMockTimeSeries(symbol, interval, count) {
  const cacheKey = `${symbol}_${interval}_${count}`;
  if (seriesCache.has(cacheKey)) return seriesCache.get(cacheKey);

  const base = getBasePrice(symbol);
  const pip = getPipSize(symbol);
  const decimals = symbol.includes('JPY') ? 3 : 5;
  const candles = [];
  let price = base;

  const now = Date.now();
  const intervalMs = {
    '1min': 60000,
    '5min': 300000,
    '15min': 900000,
    '30min': 1800000,
    '1h': 3600000,
    '4h': 14400000,
    '1day': 86400000,
  };
  const step = intervalMs[interval] || 3600000;

  for (let i = 0; i < count; i++) {
    const trend = Math.sin(i * 0.05) * pip * 30;
    const noise = (Math.random() - 0.5) * pip * 80;
    const open = price;
    const close = price + trend + noise;
    const high = Math.max(open, close) + Math.random() * pip * 30;
    const low = Math.min(open, close) - Math.random() * pip * 30;

    candles.push({
      datetime: new Date(now - (count - i) * step).toISOString(),
      open: open.toFixed(decimals),
      high: high.toFixed(decimals),
      low: low.toFixed(decimals),
      close: close.toFixed(decimals),
    });

    price = close;
  }

  seriesCache.set(cacheKey, candles);
  return candles;
}

// === Live Price Simulation ===

let priceUpdateCallbacks = [];
let priceUpdateInterval = null;

export function onPriceUpdate(callback) {
  priceUpdateCallbacks.push(callback);
  return () => {
    priceUpdateCallbacks = priceUpdateCallbacks.filter(cb => cb !== callback);
  };
}

export function startPriceUpdates(symbols, intervalMs = 3000) {
  if (priceUpdateInterval) clearInterval(priceUpdateInterval);

  // Initial fetch
  updatePrices(symbols);

  priceUpdateInterval = setInterval(() => {
    updatePrices(symbols);
  }, intervalMs);
}

export function stopPriceUpdates() {
  if (priceUpdateInterval) {
    clearInterval(priceUpdateInterval);
    priceUpdateInterval = null;
  }
}

async function updatePrices(symbols) {
  const apiKey = getApiKey();
  const quotes = {};

  if (apiKey) {
    for (const symbol of symbols) {
      try {
        quotes[symbol] = await fetchQuote(symbol);
      } catch (e) {
        quotes[symbol] = generateMockQuote(symbol);
      }
    }
  } else {
    for (const symbol of symbols) {
      quotes[symbol] = generateMockQuote(symbol);
    }
  }

  priceUpdateCallbacks.forEach(cb => cb(quotes));
}

export { getApiKey, setApiKey, getBasePrice, getPipSize, generateMockQuote };
