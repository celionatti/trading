/* ============================================
   FOREX PULSE — Trade Form Component
   ============================================ */

import store from '../services/store.js';
import { openTrade, TRADE_MODES } from '../services/tradeEngine.js';
import { getPipSize } from '../services/api.js';

export function renderTradeForm(container) {
  const pair = store.get('selectedPair');
  const settings = store.get('settings');
  const quotes = store.get('quotes') || {};
  const quote = quotes[pair];
  const mode = settings.tradeMode;
  const modeConfig = TRADE_MODES[mode];

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">New Order</span>
        <span class="badge badge-info">${modeConfig.icon} ${modeConfig.label}</span>
      </div>

      <!-- Pair Selector -->
      <div class="input-group" style="margin-bottom:var(--space-3);">
        <label class="input-label">Currency Pair</label>
        <select class="select" id="trade-pair">
          ${(store.get('watchlist') || []).map(p => `
            <option value="${p}" ${p === pair ? 'selected' : ''}>${p}</option>
          `).join('')}
        </select>
      </div>

      <!-- Live Price Display -->
      <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-3);">
        <div style="flex:1;padding:var(--space-2);background:var(--color-loss-bg);border-radius:var(--radius-md);text-align:center;border:1px solid var(--border-loss);">
          <div style="font-size:var(--text-xs);color:var(--color-loss);margin-bottom:2px;">BID</div>
          <div class="mono" style="font-size:var(--text-md);font-weight:var(--font-bold);color:var(--color-loss);" id="trade-bid">
            ${quote ? (quote.bid || quote.close) : '—'}
          </div>
        </div>
        <div style="flex:1;padding:var(--space-2);background:var(--color-profit-bg);border-radius:var(--radius-md);text-align:center;border:1px solid var(--border-profit);">
          <div style="font-size:var(--text-xs);color:var(--color-profit);margin-bottom:2px;">ASK</div>
          <div class="mono" style="font-size:var(--text-md);font-weight:var(--font-bold);color:var(--color-profit);" id="trade-ask">
            ${quote ? (quote.ask || quote.close) : '—'}
          </div>
        </div>
      </div>

      <!-- Trade Mode -->
      <div class="input-group" style="margin-bottom:var(--space-3);">
        <label class="input-label">Trade Mode</label>
        <div class="tabs" id="trade-mode-tabs">
          ${Object.entries(TRADE_MODES).map(([key, cfg]) => `
            <button class="tab${key === mode ? ' active' : ''}" data-mode="${key}" style="font-size:var(--text-xs);">
              ${cfg.icon} ${cfg.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Lot Size -->
      <div class="input-group" style="margin-bottom:var(--space-3);">
        <label class="input-label">Lot Size</label>
        <div style="display:flex;gap:var(--space-2);align-items:center;">
          <input type="number" class="input input-sm" id="trade-lot" value="${settings.defaultLotSize}" min="0.01" max="100" step="0.01" />
          <div style="display:flex;gap:var(--space-1);">
            <button class="btn btn-ghost btn-sm lot-preset" data-lot="0.01">0.01</button>
            <button class="btn btn-ghost btn-sm lot-preset" data-lot="0.1">0.1</button>
            <button class="btn btn-ghost btn-sm lot-preset" data-lot="1">1.0</button>
          </div>
        </div>
      </div>

      <!-- Stop Loss -->
      <div class="input-group" style="margin-bottom:var(--space-3);">
        <label class="input-label">Stop Loss (pips)</label>
        <input type="number" class="input input-sm" id="trade-sl" value="${modeConfig.defaultSL}" min="0" step="1" />
      </div>

      <!-- Take Profit -->
      <div class="input-group" style="margin-bottom:var(--space-3);">
        <label class="input-label">Take Profit (pips)</label>
        <input type="number" class="input input-sm" id="trade-tp" value="${modeConfig.defaultTP}" min="0" step="1" />
      </div>

      <!-- Risk Preview -->
      <div id="trade-risk-preview" style="padding:var(--space-2) var(--space-3);background:var(--bg-tertiary);border-radius:var(--radius-md);margin-bottom:var(--space-4);font-size:var(--text-xs);">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span class="text-muted">Risk</span>
          <span class="mono" id="risk-amount">—</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span class="text-muted">Reward</span>
          <span class="mono" id="reward-amount">—</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span class="text-muted">R:R Ratio</span>
          <span class="mono" id="rr-ratio">—</span>
        </div>
      </div>

      <!-- Execute Buttons -->
      <div style="display:flex;gap:var(--space-2);">
        <button class="btn btn-sell btn-lg" style="flex:1;" id="trade-sell-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          SELL
        </button>
        <button class="btn btn-buy btn-lg" style="flex:1;" id="trade-buy-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          BUY
        </button>
      </div>
    </div>
  `;

  // === Event Handlers ===

  // Pair change
  container.querySelector('#trade-pair')?.addEventListener('change', (e) => {
    store.set('selectedPair', e.target.value);
    renderTradeForm(container);
  });

  // Mode change
  container.querySelectorAll('#trade-mode-tabs .tab').forEach(el => {
    el.addEventListener('click', () => {
      const newMode = el.dataset.mode;
      store.set('settings.tradeMode', newMode);
      container.querySelectorAll('#trade-mode-tabs .tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');

      // Update SL/TP defaults
      const cfg = TRADE_MODES[newMode];
      container.querySelector('#trade-sl').value = cfg.defaultSL;
      container.querySelector('#trade-tp').value = cfg.defaultTP;
      updateRiskPreview(container);
    });
  });

  // Lot presets
  container.querySelectorAll('.lot-preset').forEach(el => {
    el.addEventListener('click', () => {
      container.querySelector('#trade-lot').value = el.dataset.lot;
      updateRiskPreview(container);
    });
  });

  // Update risk on input change
  ['trade-lot', 'trade-sl', 'trade-tp'].forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('input', () => updateRiskPreview(container));
  });

  // Buy button
  container.querySelector('#trade-buy-btn')?.addEventListener('click', () => executeTrade(container, 'buy'));

  // Sell button
  container.querySelector('#trade-sell-btn')?.addEventListener('click', () => executeTrade(container, 'sell'));

  // Subscribe to quote updates
  store.subscribe('quotes', () => {
    const q = store.get('quotes')?.[store.get('selectedPair')];
    if (!q) return;
    const bid = container.querySelector('#trade-bid');
    const ask = container.querySelector('#trade-ask');
    if (bid) bid.textContent = q.bid || q.close || '—';
    if (ask) ask.textContent = q.ask || q.close || '—';
  });

  updateRiskPreview(container);
}

function updateRiskPreview(container) {
  const pair = store.get('selectedPair');
  const lot = parseFloat(container.querySelector('#trade-lot')?.value || 0.01);
  const sl = parseFloat(container.querySelector('#trade-sl')?.value || 0);
  const tp = parseFloat(container.querySelector('#trade-tp')?.value || 0);

  const pipSize = getPipSize(pair);
  const pipValue = lot * 100000 * pipSize;

  // For USD pairs approximate
  const riskAmount = sl * pipValue;
  const rewardAmount = tp * pipValue;
  const rrRatio = sl > 0 ? (tp / sl).toFixed(2) : '∞';

  const riskEl = container.querySelector('#risk-amount');
  const rewardEl = container.querySelector('#reward-amount');
  const rrEl = container.querySelector('#rr-ratio');

  if (riskEl) riskEl.textContent = `$${riskAmount.toFixed(2)}`;
  if (rewardEl) rewardEl.textContent = `$${rewardAmount.toFixed(2)}`;
  if (rrEl) {
    rrEl.textContent = `1:${rrRatio}`;
    rrEl.className = `mono ${parseFloat(rrRatio) >= 2 ? 'text-profit' : parseFloat(rrRatio) >= 1 ? 'text-warning' : 'text-loss'}`;
  }
}

function executeTrade(container, direction) {
  const pair = container.querySelector('#trade-pair')?.value || store.get('selectedPair');
  const lotSize = parseFloat(container.querySelector('#trade-lot')?.value || 0.01);
  const stopLoss = parseFloat(container.querySelector('#trade-sl')?.value || 0);
  const takeProfit = parseFloat(container.querySelector('#trade-tp')?.value || 0);
  const mode = store.get('settings.tradeMode');

  try {
    openTrade({
      pair,
      direction,
      lotSize,
      stopLoss: stopLoss || null,
      takeProfit: takeProfit || null,
      mode,
    });
  } catch (err) {
    alert(err.message);
  }
}
