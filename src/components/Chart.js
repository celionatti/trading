/* ============================================
   FOREX PULSE — Chart Component
   ============================================ */

import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import store from '../services/store.js';
import { fetchTimeSeries } from '../services/api.js';
import { calculateEMA, calculateBollingerBands } from '../services/indicators.js';

let chart = null;
let candleSeries = null;
let volumeSeries = null;
let ema20Series = null;
let ema50Series = null;
let bbUpperSeries = null;
let bbLowerSeries = null;
let resizeObserver = null;

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

  // Timeframe click handlers
  container.querySelectorAll('#chart-timeframes .tab').forEach(el => {
    el.addEventListener('click', () => {
      store.set('ui.chartInterval', el.dataset.tf);
      loadChartData(pair, el.dataset.tf);
      container.querySelectorAll('#chart-timeframes .tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
    });
  });

  initChart(container.querySelector('#chart-container'));
  loadChartData(pair, interval);

  // Update when pair changes
  store.subscribe('selectedPair', (newPair) => {
    const label = container.querySelector('.card-header span:first-child');
    if (label) label.textContent = newPair;
    loadChartData(newPair, store.get('ui.chartInterval'));
  });

  // Update price badge on quotes
  store.subscribe('quotes', () => {
    const q = store.get('quotes')?.[store.get('selectedPair')];
    const badge = container.querySelector('#chart-price-badge');
    if (q && badge) {
      const change = parseFloat(q.percent_change || 0);
      badge.textContent = `${q.close || q.bid} (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)`;
      badge.className = `badge ${change >= 0 ? 'badge-profit' : 'badge-loss'}`;
    }
  });
}

function initChart(container) {
  if (chart) {
    chart.remove();
    chart = null;
  }

  if (resizeObserver) {
    resizeObserver.disconnect();
  }

  const isDark = store.get('settings.theme') !== 'light';

  chart = createChart(container, {
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

  candleSeries = chart.addCandlestickSeries({
    upColor: '#10b981',
    downColor: '#ef4444',
    borderUpColor: '#10b981',
    borderDownColor: '#ef4444',
    wickUpColor: '#10b981',
    wickDownColor: '#ef4444',
  });

  // EMA overlays
  ema20Series = chart.addLineSeries({
    color: '#3b82f6',
    lineWidth: 1,
    lineStyle: 0,
    title: 'EMA 20',
  });

  ema50Series = chart.addLineSeries({
    color: '#f59e0b',
    lineWidth: 1,
    lineStyle: 0,
    title: 'EMA 50',
  });

  // Bollinger Bands
  bbUpperSeries = chart.addLineSeries({
    color: 'rgba(139, 92, 246, 0.4)',
    lineWidth: 1,
    lineStyle: 2,
    title: 'BB Upper',
  });

  bbLowerSeries = chart.addLineSeries({
    color: 'rgba(139, 92, 246, 0.4)',
    lineWidth: 1,
    lineStyle: 2,
    title: 'BB Lower',
  });

  // Resize observer
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      chart.applyOptions({ width, height });
    }
  });
  resizeObserver.observe(container);
}

async function loadChartData(pair, interval) {
  if (!chart || !candleSeries) return;

  try {
    const data = await fetchTimeSeries(pair, interval, 150);
    if (!data || data.length === 0) return;

    const candles = data.map(d => ({
      time: Math.floor(new Date(d.datetime).getTime() / 1000),
      open: parseFloat(d.open),
      high: parseFloat(d.high),
      low: parseFloat(d.low),
      close: parseFloat(d.close),
    }));

    // Deduplicate and sort by time
    const uniqueCandles = [];
    const seen = new Set();
    for (const c of candles) {
      if (!seen.has(c.time)) {
        seen.add(c.time);
        uniqueCandles.push(c);
      }
    }
    uniqueCandles.sort((a, b) => a.time - b.time);

    candleSeries.setData(uniqueCandles);

    // Calculate & plot indicators
    const closes = uniqueCandles.map(c => c.close);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const bb = calculateBollingerBands(closes);

    const toLineData = (values) =>
      values.map((v, i) => v !== null ? { time: uniqueCandles[i].time, value: v } : null)
        .filter(Boolean);

    ema20Series.setData(toLineData(ema20));
    ema50Series.setData(toLineData(ema50));
    bbUpperSeries.setData(toLineData(bb.upper));
    bbLowerSeries.setData(toLineData(bb.lower));

    chart.timeScale().fitContent();
  } catch (err) {
    console.error('Failed to load chart data:', err);
  }
}

export function destroyChart() {
  if (resizeObserver) resizeObserver.disconnect();
  if (chart) chart.remove();
  chart = null;
}
