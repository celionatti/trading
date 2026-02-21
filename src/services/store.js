/* ============================================
   FOREX PULSE — State Store (Optimized)
   ============================================ */

const STORAGE_KEY = 'forexpulse_state';

const defaultState = {
  // Account
  balance: 10000.00,
  equity: 10000.00,
  margin: 0,
  freeMargin: 10000.00,

  // Watchlist
  watchlist: [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', // Forex
    'BTC/USD', 'ETH/USD', // Crypto
    'AAPL', 'TSLA', // Stocks
    'XAU/USD', 'WTI/USD' // Commodities
  ],

  // Live quotes
  quotes: {},

  // Selected pair
  selectedPair: 'EUR/USD',

  // Open positions and Pending orders
  positions: [],
  orders: [],

  // Trade history and Calendar
  history: [],
  calendar: [],

  // Settings
  settings: {
    apiKey: '',
    defaultLotSize: 0.01,
    defaultStopLoss: 50,
    defaultTakeProfit: 100,
    riskPercent: 1, // Default risk 1%
    tradeMode: 'day',
    theme: 'dark',
    leverage: 100,
    currency: 'USD',
  },

  // UI state
  ui: {
    sidebarCollapsed: false,
    currentPage: 'dashboard',
    chartInterval: '1h',
    chartType: 'candlestick',
    marketCategory: 'Forex',
    dashboardSideCollapsed: false,
    tradeSideCollapsed: false,
    marketSessionsCollapsed: false
  }
};

class Store {
  constructor() {
    this.state = this.loadState();
    this.listeners = new Map();
    this.batchTimeout = null;
    this.pendingKeys = new Set();
    this._saveTimer = null;
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return this.deepMerge(structuredClone(defaultState), parsed);
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
    return structuredClone(defaultState);
  }

  deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  // Debounced save — coalesce rapid writes into one save
  saveState() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      try {
        const toSave = { ...this.state };
        delete toSave.quotes;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (e) {
        console.warn('Failed to save state:', e);
      }
    }, 500);
  }

  get(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.state);
  }

  set(key, value) {
    const keys = key.split('.');
    let obj = this.state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;

    // Batch notifications via rAF
    this.pendingKeys.add(key);
    if (!this.batchTimeout) {
      this.batchTimeout = requestAnimationFrame(() => {
        const keysToNotify = [...this.pendingKeys];
        this.pendingKeys.clear();
        this.batchTimeout = null;
        keysToNotify.forEach(k => this.notify(k));
      });
    }

    // Save (debounced, skip for quotes)
    if (!key.startsWith('quotes')) {
      this.saveState();
    }
  }

  /**
   * Subscribe with a stable ID to prevent duplicate listeners.
   * If `id` is provided and a listener with that id already exists
   * for the given key, the old one is replaced (not stacked).
   */
  subscribe(key, callback, id) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Map());
    }
    const map = this.listeners.get(key);
    const listenerId = id || callback;
    map.set(listenerId, callback);

    return () => {
      map.delete(listenerId);
    };
  }

  unsubscribe(id) {
    this.listeners.forEach(map => map.delete(id));
  }

  notify(key) {
    // Notify exact key listeners
    this.listeners.get(key)?.forEach(cb => cb(this.get(key)));

    // Notify parent listeners
    const parts = key.split('.');
    while (parts.length > 1) {
      parts.pop();
      const parentKey = parts.join('.');
      this.listeners.get(parentKey)?.forEach(cb => cb(this.get(parentKey)));
    }

    // Notify wildcard
    this.listeners.get('*')?.forEach(cb => cb(this.state));
  }

  updateEquity() {
    const positions = this.get('positions') || [];
    const unrealizedPL = positions.reduce((sum, pos) => sum + (pos.unrealizedPL || 0), 0);
    const balance = this.get('balance');
    this.set('equity', balance + unrealizedPL);
    this.set('freeMargin', balance + unrealizedPL - this.get('margin'));
  }

  reset() {
    this.state = structuredClone(defaultState);
    this.saveState();
    this.listeners.forEach((callbacks) => {
      callbacks.forEach(cb => {
        try { cb(); } catch (e) { /* skip */ }
      });
    });
  }
}

const store = new Store();
export default store;
