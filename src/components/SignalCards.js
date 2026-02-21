/* ============================================
   FOREX PULSE — Signal Cards Component
   ============================================ */

import store from '../services/store.js';
import { openTrade, TRADE_MODES } from '../services/tradeEngine.js';

export function renderSignalCards(container, signals) {
  if (!signals || signals.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding:var(--space-8);text-align:center;">
        <div style="font-size:2rem;margin-bottom:var(--space-3);">🔍</div>
        <div style="font-size:var(--text-md);font-weight:var(--font-semibold);margin-bottom:var(--space-2);">No Trade Signals</div>
        <div style="font-size:var(--text-sm);color:var(--text-tertiary);">
          All pairs are currently showing neutral signals. Check back later or try a different timeframe.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="signal-grid">
      ${signals.map(sig => renderCard(sig)).join('')}
    </div>
  `;

  // Execute trade buttons
  container.querySelectorAll('.signal-execute-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      const sig = signals[idx];
      if (!sig) return;

      const mode = store.get('settings.tradeMode');
      try {
        openTrade({
          pair: sig.pair,
          direction: sig.direction,
          lotSize: store.get('settings.defaultLotSize') || 0.01,
          stopLoss: sig.slPips,
          takeProfit: sig.tpPips,
          mode,
        });
        btn.textContent = '✅ Executed';
        btn.disabled = true;
        btn.classList.add('executed');
      } catch (err) {
        btn.textContent = `❌ ${err.message}`;
        setTimeout(() => {
          btn.textContent = `⚡ Execute ${sig.direction.toUpperCase()}`;
        }, 2000);
      }
    });
  });

  const cleanup = bindSignalCardEvents(container, signals);

  return cleanup;
}

function renderCard(sig, index) {
  const isBuy = sig.direction === 'buy';
  const dirColor = isBuy ? 'var(--color-profit)' : 'var(--color-loss)';
  const dirBg = isBuy ? 'var(--color-profit-bg)' : 'var(--color-loss-bg)';
  const dirBorder = isBuy ? 'var(--border-profit)' : 'var(--border-loss)';
  const signalLabel = sig.signal.replace('_', ' ').toUpperCase();
  const dirIcon = isBuy ? '📈' : '📉';

  // RSI status
  const rsiStatus = sig.indicators.rsi > 70 ? 'Overbought' :
                     sig.indicators.rsi < 30 ? 'Oversold' : 'Normal';
  const rsiColor = sig.indicators.rsi > 70 ? 'var(--color-loss)' :
                    sig.indicators.rsi < 30 ? 'var(--color-profit)' : 'var(--text-secondary)';

  // MACD status
  const macdStatus = sig.indicators.macd > 0 ? 'Bullish' : 'Bearish';
  const macdColor = sig.indicators.macd > 0 ? 'var(--color-profit)' : 'var(--color-loss)';

  // EMA trend
  const emaColor = sig.indicators.emaTrend === 'bullish' ? 'var(--color-profit)' : 'var(--color-loss)';

  // Find the index in the parent context
  const idx = arguments.length > 1 ? index : 0;

  return `
    <div class="signal-card" style="border-left:3px solid ${dirColor};">
      <!-- Header -->
      <div class="signal-card-header">
        <div style="display:flex;align-items:center;gap:var(--space-2);">
          <span class="signal-card-pair" data-pair="${sig.pair}" style="font-size:var(--text-lg);font-weight:var(--font-extrabold);cursor:pointer;" title="Open in Trade view">
            ${sig.pair}
          </span>
          <span class="badge" style="background:${dirBg};color:${dirColor};border:1px solid ${dirBorder};font-weight:var(--font-bold);">
            ${dirIcon} ${sig.direction.toUpperCase()}
          </span>
        </div>
        <div style="text-align:right;">
          <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:2px;">${signalLabel}</div>
          <div class="signal-confidence">
            <div class="signal-confidence-bar">
              <div class="signal-confidence-fill" style="width:${sig.strength}%;background:${dirColor};"></div>
            </div>
            <span class="mono" style="font-size:var(--text-xs);color:${dirColor};font-weight:var(--font-bold);">${sig.strength}%</span>
          </div>
        </div>
      </div>

      <!-- Price Levels -->
      <div class="signal-prices">
        <div class="signal-price-item signal-price-entry">
          <span class="signal-price-label">Entry</span>
          <span class="signal-price-value mono">${sig.entryPrice}</span>
        </div>
        <div class="signal-price-item signal-price-sl">
          <span class="signal-price-label">Stop Loss</span>
          <span class="signal-price-value mono text-loss">${sig.stopLoss}</span>
          <span class="signal-price-pips mono">${sig.slPips} pips</span>
        </div>
        <div class="signal-price-item signal-price-tp">
          <span class="signal-price-label">Take Profit</span>
          <span class="signal-price-value mono text-profit">${sig.takeProfit}</span>
          <span class="signal-price-pips mono">${sig.tpPips} pips</span>
        </div>
      </div>

      <!-- Metrics Row -->
      <div class="signal-metrics">
        <div class="signal-metric">
          <span class="signal-metric-label">R:R</span>
          <span class="signal-metric-value mono ${parseFloat(sig.riskReward) >= 1.5 ? 'text-profit' : 'text-loss'}">${sig.riskReward}</span>
        </div>
        <div class="signal-metric">
          <span class="signal-metric-label">ATR</span>
          <span class="signal-metric-value mono">${sig.atr || '—'}</span>
        </div>
        <div class="signal-metric">
          <span class="signal-metric-label">TF</span>
          <span class="signal-metric-value mono">${sig.timeframe.toUpperCase()}</span>
        </div>
        <div class="signal-metric">
          <span class="signal-metric-label">Live</span>
          <span class="signal-metric-value mono" style="font-size:var(--text-xs);">
            <span id="sig-bid-${idx}" style="color:var(--color-loss);">${sig.currentBid}</span>
            /
            <span id="sig-ask-${idx}" style="color:var(--color-profit);">${sig.currentAsk}</span>
          </span>
        </div>
      </div>

      <!-- Indicator Dashboard -->
      <div class="signal-indicators">
        <div class="signal-indicator-row">
          <span class="signal-indicator-label">RSI (14)</span>
          <div style="display:flex;align-items:center;gap:var(--space-2);">
            <div class="progress-bar" style="width:50px;height:4px;">
              <div class="progress-fill" style="width:${sig.indicators.rsi}%;background:${rsiColor};"></div>
            </div>
            <span class="mono" style="font-size:var(--text-xs);color:${rsiColor};font-weight:var(--font-bold);">${sig.indicators.rsi.toFixed(1)}</span>
            <span style="font-size:var(--text-xs);color:${rsiColor};">${rsiStatus}</span>
          </div>
        </div>
        <div class="signal-indicator-row">
          <span class="signal-indicator-label">MACD</span>
          <div style="display:flex;align-items:center;gap:var(--space-2);">
            <span class="mono" style="font-size:var(--text-xs);color:${macdColor};font-weight:var(--font-bold);">${sig.indicators.macd.toFixed(5)}</span>
            <span style="font-size:var(--text-xs);color:${macdColor};">${macdStatus}</span>
          </div>
        </div>
        <div class="signal-indicator-row">
          <span class="signal-indicator-label">EMA 20/50</span>
          <span style="font-size:var(--text-xs);color:${emaColor};font-weight:var(--font-semibold);">
            ${sig.indicators.emaTrend === 'bullish' ? '↑ Bullish Cross' : '↓ Bearish Cross'}
          </span>
        </div>
      </div>

      <!-- Reasons -->
      <div class="signal-reasons">
        ${sig.reasons.map(r => {
          const rColor = r.includes('bullish') || r.includes('oversold') || r.includes('positive') || r.includes('above')
            ? 'var(--color-profit)'
            : r.includes('bearish') || r.includes('overbought') || r.includes('negative') || r.includes('below')
            ? 'var(--color-loss)'
            : 'var(--text-tertiary)';
          return `
            <div class="signal-reason">
              <span style="color:${rColor};">●</span>
              <span>${r}</span>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Execute Button -->
      <button class="signal-execute-btn ${isBuy ? 'buy' : 'sell'}" data-index="${idx}">
        ⚡ Execute ${sig.direction.toUpperCase()}
      </button>
    </div>
  `;
}

// Re-export for use with map index
export function renderSignalCardsIndexed(container, signals) {
  if (!signals || signals.length === 0) {
    renderSignalCards(container, signals);
    return;
  }

  container.innerHTML = `
    <div class="signal-grid">
      ${signals.map((sig, i) => renderCard(sig, i)).join('')}
    </div>
  `;

  const cleanup = bindSignalCardEvents(container, signals);
  return cleanup;
}

function bindSignalCardEvents(container, signals) {
  // Execute trade buttons
  container.querySelectorAll('.signal-execute-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      const sig = signals[idx];
      if (!sig) return;

      try {
        openTrade({
          pair: sig.pair,
          direction: sig.direction,
          lotSize: store.get('settings.defaultLotSize') || 0.01,
          stopLoss: sig.slPips,
          takeProfit: sig.tpPips,
          mode: store.get('settings.tradeMode'),
        });
        btn.textContent = '✅ Executed';
        btn.disabled = true;
        btn.classList.add('executed');
      } catch (err) {
        btn.textContent = `❌ ${err.message}`;
        setTimeout(() => {
          btn.textContent = `⚡ Execute ${sig.direction.toUpperCase()}`;
        }, 2000);
      }
    });
  });

  // Navigate to pair
  container.querySelectorAll('.signal-card-pair').forEach(el => {
    el.addEventListener('click', () => {
      store.set('selectedPair', el.dataset.pair);
      store.set('ui.currentPage', 'trade');
    });
  });

  const instanceId = `sigcards-${Math.random().toString(36).substr(2, 5)}`;

  // Live price updates
  store.subscribe('quotes', () => {
    const quotes = store.get('quotes') || {};
    signals.forEach((sig, i) => {
      const q = quotes[sig.pair];
      if (!q) return;
      const bidEl = container.querySelector(`#sig-bid-${i}`);
      const askEl = container.querySelector(`#sig-ask-${i}`);
      if (bidEl) bidEl.textContent = q.bid || q.close || '—';
      if (askEl) askEl.textContent = q.ask || q.close || '—';
    });
  }, `${instanceId}-quotes`);

  return () => {
    store.unsubscribe(`${instanceId}-quotes`);
  };
}
