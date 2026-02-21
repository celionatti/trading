/* ============================================
   FOREX PULSE — Settings Page
   ============================================ */

import store from '../services/store.js';
import { setApiKey, getApiKey } from '../services/api.js';
import { TRADE_MODES, showToast } from '../services/tradeEngine.js';

export function renderSettingsPage(container) {
  const settings = store.get('settings');
  const apiKey = getApiKey();

  container.innerHTML = `
    <div style="padding-bottom:var(--space-4);">
      <h1 style="font-size:var(--text-xl);font-weight:var(--font-bold);margin-bottom:var(--space-1);">Settings</h1>
      <p style="font-size:var(--text-sm);color:var(--text-tertiary);">Configure your trading environment.</p>
    </div>

    <div class="settings-layout">
      <!-- API Configuration -->
      <div class="settings-section">
        <h2 class="settings-section-title">🔑 API Configuration</h2>
        <div class="input-group" style="margin-bottom:var(--space-3);">
          <label class="input-label">Twelve Data API Key</label>
          <input type="password" class="input" id="settings-api-key" value="${apiKey}" placeholder="Enter your API key..." />
          <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:var(--space-1);">
            Get a free API key at <a href="https://twelvedata.com" target="_blank" style="color:var(--accent-primary);">twelvedata.com</a> (800 requests/day)
          </p>
        </div>
        <button class="btn btn-primary" id="save-api-key">Save API Key</button>
      </div>

      <!-- Trade Defaults -->
      <div class="settings-section">
        <h2 class="settings-section-title">⚙️ Trade Defaults</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
          <div class="input-group">
            <label class="input-label">Default Lot Size</label>
            <input type="number" class="input" id="settings-lot-size" value="${settings.defaultLotSize}" min="0.01" max="100" step="0.01" />
          </div>
          <div class="input-group">
            <label class="input-label">Default Stop Loss (pips)</label>
            <input type="number" class="input" id="settings-sl" value="${settings.defaultStopLoss}" min="0" step="1" />
          </div>
          <div class="input-group">
            <label class="input-label">Default Take Profit (pips)</label>
            <input type="number" class="input" id="settings-tp" value="${settings.defaultTakeProfit}" min="0" step="1" />
          </div>
          <div class="input-group">
            <label class="input-label">Risk Per Trade (%)</label>
            <input type="number" class="input" id="settings-risk" value="${settings.riskPercent}" min="0.5" max="10" step="0.5" />
          </div>
          <div class="input-group">
            <label class="input-label">Leverage</label>
            <select class="select" id="settings-leverage">
              ${[10, 25, 50, 100, 200, 500].map(lev =>
                `<option value="${lev}" ${settings.leverage === lev ? 'selected' : ''}>1:${lev}</option>`
              ).join('')}
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Default Trade Mode</label>
            <select class="select" id="settings-mode">
              ${Object.entries(TRADE_MODES).map(([key, cfg]) =>
                `<option value="${key}" ${settings.tradeMode === key ? 'selected' : ''}>${cfg.icon} ${cfg.label}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div style="margin-top:var(--space-4);">
          <button class="btn btn-primary" id="save-trade-defaults">Save Trade Defaults</button>
        </div>
      </div>

      <!-- Appearance -->
      <div class="settings-section">
        <h2 class="settings-section-title">🎨 Appearance</h2>
        <div class="input-group">
          <label class="input-label">Theme</label>
          <div class="tabs" style="max-width:200px;">
            <button class="tab ${settings.theme === 'dark' ? 'active' : ''}" data-theme="dark">🌙 Dark</button>
            <button class="tab ${settings.theme === 'light' ? 'active' : ''}" data-theme="light">☀️ Light</button>
          </div>
        </div>
      </div>

      <!-- Account -->
      <div class="settings-section">
        <h2 class="settings-section-title">🏦 Account</h2>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-3);background:var(--bg-tertiary);border-radius:var(--radius-md);margin-bottom:var(--space-3);">
          <div>
            <div style="font-weight:var(--font-semibold);">Current Balance</div>
            <div class="mono text-profit" style="font-size:var(--text-xl);font-weight:var(--font-bold);">$${store.get('balance').toFixed(2)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:var(--text-xs);color:var(--text-tertiary);">Total Trades</div>
            <div class="mono" style="font-weight:var(--font-bold);">${(store.get('history') || []).length}</div>
          </div>
        </div>
        <div style="display:flex;gap:var(--space-2);">
          <button class="btn btn-ghost" id="reset-account" style="color:var(--color-loss);">🔄 Reset Account</button>
        </div>
      </div>

      <!-- About -->
      <div class="settings-section">
        <h2 class="settings-section-title">ℹ️ About</h2>
        <div style="font-size:var(--text-sm);color:var(--text-secondary);">
          <p><strong>ForexPulse v1.0</strong></p>
          <p style="margin-top:var(--space-2);">A simulated forex trading terminal for learning and strategy testing. Uses real-time market data from Twelve Data API.</p>
          <p style="margin-top:var(--space-2);color:var(--color-warning);font-size:var(--text-xs);">⚠️ This is a simulated trading environment. No real money is at risk.</p>
        </div>
      </div>
    </div>
  `;

  // === Event Handlers ===

  // Save API key
  container.querySelector('#save-api-key')?.addEventListener('click', () => {
    const key = container.querySelector('#settings-api-key').value.trim();
    setApiKey(key);
    store.set('settings.apiKey', key);
    showToast('API key saved!', 'success');
  });

  // Save trade defaults
  container.querySelector('#save-trade-defaults')?.addEventListener('click', () => {
    store.set('settings.defaultLotSize', parseFloat(container.querySelector('#settings-lot-size').value));
    store.set('settings.defaultStopLoss', parseFloat(container.querySelector('#settings-sl').value));
    store.set('settings.defaultTakeProfit', parseFloat(container.querySelector('#settings-tp').value));
    store.set('settings.riskPercent', parseFloat(container.querySelector('#settings-risk').value));
    store.set('settings.leverage', parseInt(container.querySelector('#settings-leverage').value));
    store.set('settings.tradeMode', container.querySelector('#settings-mode').value);
    showToast('Trade defaults saved!', 'success');
  });

  // Theme tabs
  container.querySelectorAll('[data-theme]').forEach(el => {
    el.addEventListener('click', () => {
      const theme = el.dataset.theme;
      store.set('settings.theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      container.querySelectorAll('[data-theme]').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      showToast(`Theme changed to ${theme}`, 'info');
    });
  });

  // Reset account
  container.querySelector('#reset-account')?.addEventListener('click', () => {
    if (confirm('Reset account? This will clear all trades and reset balance to $10,000.')) {
      store.reset();
      showToast('Account reset!', 'warning');
      renderSettingsPage(container);
    }
  });
}
