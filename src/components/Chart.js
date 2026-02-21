/* ============================================
   FOREX PULSE — Chart Component (Optimized)
   ============================================ */

import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import store from '../services/store.js';
import { fetchTimeSeries } from '../services/api.js';
import { calculateEMA, calculateBollingerBands } from '../services/indicators.js';

const TIMEFRAMES = [
  { value: '1min', label: '1M' },
  { value: '5min', label: '5M' },
  { value: '15min', label: '15M' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1day', label: '1D' },
];

export function renderChart(container, options = {}) {
  const pair = options.pair || store.get('selectedPair');
  const interval = store.get('ui.chartInterval');
  const instanceId = `chart-${pair.replace('/', '-')}-${Math.random().toString(36).substr(2, 9)}`;

  // Instance state
  const state = {
    chart: null,
    candleSeries: null,
    ema20Series: null,
    ema50Series: null,
    bbUpperSeries: null,
    bbLowerSeries: null,
    resizeObserver: null,
    loadingData: false,
    pair: pair
  };

  container.innerHTML = `
    <div class="card" style="height:100%;display:flex;flex-direction:column;">
      <div class="card-header" style="flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:var(--space-3);">
          <span style="font-size:var(--text-lg);font-weight:var(--font-bold);">${pair}</span>
          <span class="badge badge-info" id="chart-price-badge">—</span>
        </div>
        <div class="tabs" id="chart-timeframes">
          ${TIMEFRAMES.map(tf => `
            <button class="tab${tf.value === interval ? ' active' : ''}" data-tf="${tf.value}">
              ${tf.label}
            </button>
          `).join('')}
        </div>
      </div>
      <div id="chart-container" style="flex:1;min-height:0;"></div>
    </div>
  `;

  container.querySelectorAll('#chart-timeframes .tab').forEach(el => {
    el.addEventListener('click', () => {
      store.set('ui.chartInterval', el.dataset.tf);
      loadChartData(state, el.dataset.tf);
      container.querySelectorAll('#chart-timeframes .tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
    });
  });

  initChart(state, container.querySelector('#chart-container'));
  loadChartData(state, interval);

  // Stable subscriptions with unique IDs
  store.subscribe('selectedPair', (newPair) => {
    // Only update if this instance is the main chart (no pair explicitly passed)
    if (!options.pair) {
      state.pair = newPair;
      const label = container.querySelector('.card-header span:first-child');
      if (label) label.textContent = newPair;
      loadChartData(state, store.get('ui.chartInterval'));
    }
  }, `${instanceId}-pair`);

  store.subscribe('quotes', (quotes) => {
    const q = quotes?.[state.pair];
    const badge = container.querySelector('#chart-price-badge');
    if (q && badge) {
      const change = parseFloat(q.percent_change || 0);
      badge.textContent = `${q.close || q.bid} (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)`;
      badge.className = `badge ${change >= 0 ? 'badge-profit' : 'badge-loss'}`;
    }
  }, `${instanceId}-quotes`);

  // Return a cleanup function
  return () => {
    if (state.resizeObserver) state.resizeObserver.disconnect();
    if (state.chart) state.chart.remove();
    store.unsubscribe(`${instanceId}-pair`);
    store.unsubscribe(`${instanceId}-quotes`);
  };
}

function initChart(state, container) {
  const isDark = store.get('settings.theme') !== 'light';

  state.chart = createChart(container, {
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: isDark ? '#94a3b8' : '#475569',
      fontFamily: "'Inter', sans-serif",
      fontSize: 11,
    },
    grid: {
      vertLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
      horzLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)' },
      horzLine: { color: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)' },
    },
    rightPriceScale: {
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    },
    timeScale: {
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      timeVisible: true,
      secondsVisible: false,
    },
    handleScroll: true,
    handleScale: true,
  });

  state.candleSeries = state.chart.addCandlestickSeries({
    upColor: '#10b981',
    downColor: '#ef4444',
    borderUpColor: '#10b981',
    borderDownColor: '#ef4444',
    wickUpColor: '#10b981',
    wickDownColor: '#ef4444',
  });

  state.ema20Series = state.chart.addLineSeries({ color: '#3b82f6', lineWidth: 1, lineStyle: 0, title: 'EMA 20' });
  state.ema50Series = state.chart.addLineSeries({ color: '#f59e0b', lineWidth: 1, lineStyle: 0, title: 'EMA 50' });
  state.bbUpperSeries = state.chart.addLineSeries({ color: 'rgba(139, 92, 246, 0.4)', lineWidth: 1, lineStyle: 2, title: 'BB Upper' });
  state.bbLowerSeries = state.chart.addLineSeries({ color: 'rgba(139, 92, 246, 0.4)', lineWidth: 1, lineStyle: 2, title: 'BB Lower' });

  // Throttled resize
  let resizeTimeout;
  state.resizeObserver = new ResizeObserver((entries) => {
    if (resizeTimeout) return;
    resizeTimeout = requestAnimationFrame(() => {
      resizeTimeout = null;
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && state.chart) state.chart.applyOptions({ width, height });
      }
    });
  });
  state.resizeObserver.observe(container);
}

async function loadChartData(state, interval) {
  if (!state.chart || !state.candleSeries || state.loadingData) return;
  state.loadingData = true;

  try {
    const data = await fetchTimeSeries(state.pair, interval, 150);
    // Check if component was cleaned up during fetch
    if (!state.chart || !state.candleSeries) return;

    if (!data || data.length === 0) return;

    const candles = data.map(d => ({
      time: Math.floor(new Date(d.datetime).getTime() / 1000),
      open: parseFloat(d.open),
      high: parseFloat(d.high),
      low: parseFloat(d.low),
      close: parseFloat(d.close),
    }));

    // Deduplicate & sort
    const seen = new Set();
    const uniqueCandles = [];
    for (const c of candles) {
      if (!seen.has(c.time)) {
        seen.add(c.time);
        uniqueCandles.push(c);
      }
    }
    uniqueCandles.sort((a, b) => a.time - b.time);

    if (state.candleSeries) state.candleSeries.setData(uniqueCandles);

    // Indicators
    const closes = uniqueCandles.map(c => c.close);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const bb = calculateBollingerBands(closes);

    const toLineData = (values) =>
      values.map((v, i) => v !== null ? { time: uniqueCandles[i].time, value: v } : null)
        .filter(Boolean);

    if (state.ema20Series) state.ema20Series.setData(toLineData(ema20));
    if (state.ema50Series) state.ema50Series.setData(toLineData(ema50));
    if (state.bbUpperSeries) state.bbUpperSeries.setData(toLineData(bb.upper));
    if (state.bbLowerSeries) state.bbLowerSeries.setData(toLineData(bb.lower));

    if (state.chart) state.chart.timeScale().fitContent();
  } catch (err) {
    console.error('Failed to load chart data:', err);
  } finally {
    state.loadingData = false;
  }
}
