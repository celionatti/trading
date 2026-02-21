/* ============================================
   FOREX PULSE — State Store
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
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
    'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
    'EUR/JPY', 'GBP/JPY'
  ],

  // Live quotes
  quotes: {},

  // Selected pair
  selectedPair: 'EUR/USD',

  // Open positions
  positions: [],

  // Trade history
  history: [],

  // Settings
  settings: {
    apiKey: '',
    defaultLotSize: 0.01,
    defaultStopLoss: 50,    // pips
    defaultTakeProfit: 100, // pips
    riskPercent: 2,         // % of account
    tradeMode: 'day',       // scalp, day, swing
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
  }
};

class Store {
  constructor() {
    this.state = this.loadState();
    this.listeners = new Map();
    this.batchTimeout = null;
    this.pendingKeys = new Set();
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

  saveState() {
    try {
      const toSave = { ...this.state };
      delete toSave.quotes; // Don't persist live quotes
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
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

    // Batch notifications
    this.pendingKeys.add(key);
    if (!this.batchTimeout) {
      this.batchTimeout = requestAnimationFrame(() => {
        this.pendingKeys.forEach(k => this.notify(k));
        this.pendingKeys.clear();
        this.batchTimeout = null;
      });
    }

    // Save (debounced for quote updates)
    if (!key.startsWith('quotes')) {
      this.saveState();
    }
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
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

  // Account helpers
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
    this.listeners.forEach((callbacks, key) => {
      callbacks.forEach(cb => cb(this.get(key)));
    });
  }
}

// Singleton
const store = new Store();
export default store;
