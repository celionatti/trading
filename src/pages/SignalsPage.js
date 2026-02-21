/* ============================================
   FOREX PULSE — Signals Page
   ============================================ */

import { renderSignalCardsIndexed } from '../components/SignalCards.js';
import { generateTradeSignals } from '../services/signalGenerator.js';
import store from '../services/store.js';

export function renderSignalsPage(container) {
  const timeframe = store.get('ui.chartInterval') || '1h';

  container.innerHTML = `
    <div class="page-container">
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:var(--space-4);">
          <h1 class="page-title">Trade Suggestions</h1>
          <div id="signals-count-badge" class="badge badge-info">Scanning...</div>
        </div>
        <div class="page-actions" style="display:flex;gap:var(--space-2);">
          <div class="input-group-row">
            <span class="text-xs text-muted">Timeframe:</span>
            <select class="select select-sm" id="signals-timeframe">
              <option value="15min" ${timeframe === '15min' ? 'selected' : ''}>15M</option>
              <option value="1h" ${timeframe === '1h' ? 'selected' : ''}>1H</option>
              <option value="4h" ${timeframe === '4h' ? 'selected' : ''}>4H</option>
              <option value="1day" ${timeframe === '1day' ? 'selected' : ''}>1D</option>
            </select>
          </div>
          <button class="btn btn-ghost btn-sm" id="refresh-signals">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div id="signals-container" style="margin-top:var(--space-4);">
        <div class="loading-state" style="padding:var(--space-10);text-align:center;">
          <div class="animate-pulse" style="font-size:var(--text-lg);color:var(--text-tertiary);">
            Analyzing market data for watchlist pairs...
          </div>
        </div>
      </div>
    </div>
  `;

  const signalsContainer = container.querySelector('#signals-container');
  const countBadge = container.querySelector('#signals-count-badge');
  const tfSelect = container.querySelector('#signals-timeframe');
  const refreshBtn = container.querySelector('#refresh-signals');

  let cardsCleanup = null;

  async function updateSignals() {
    if (!signalsContainer) return; // Cleanup check
    
    // Cleanup previous cards
    if (cardsCleanup) cardsCleanup();
    cardsCleanup = null;

    signalsContainer.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:var(--space-4);">
        <div class="skeleton" style="height:300px;"></div>
        <div class="skeleton" style="height:300px;"></div>
        <div class="skeleton" style="height:300px;"></div>
      </div>
    `;
    
    const selectedTF = tfSelect.value;
    const signals = await generateTradeSignals(selectedTF);
    
    if (countBadge) {
      countBadge.textContent = `${signals.length} Signals`;
      countBadge.className = signals.length > 0 ? 'badge badge-profit' : 'badge badge-neutral';
    }
    
    cardsCleanup = renderSignalCardsIndexed(signalsContainer, signals);
  }

  const onTFChange = () => {
    store.set('ui.chartInterval', tfSelect.value);
    updateSignals();
  };

  const onRefresh = () => updateSignals();

  tfSelect.addEventListener('change', onTFChange);
  refreshBtn.addEventListener('click', onRefresh);

  // Initial load
  updateSignals();

  return () => {
    if (cardsCleanup) cardsCleanup();
    tfSelect.removeEventListener('change', onTFChange);
    refreshBtn.removeEventListener('click', onRefresh);
  };
}
