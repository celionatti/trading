/* ============================================
   FOREX PULSE — Multi-Chart Layout
   ============================================ */

import { renderChart } from '../components/Chart.js';
import store from '../services/store.js';

export function renderMultiChartPage(container) {
  const watchlist = store.get('watchlist') || ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD'];
  const charts = watchlist.slice(0, 4); // Grid of 4
  
  container.innerHTML = `
    <div class="page-container" style="max-height:100vh;display:flex;flex-direction:column;">
      <div class="page-header" style="flex:0;">
        <h1 class="page-title">Multi-Chart Analysis</h1>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm" id="sync-charts">
            🔗 Sync Timeframes
          </button>
        </div>
      </div>

      <div class="multi-chart-grid" style="flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:var(--space-2);min-height:0;">
        <div id="chart-slot-0" class="chart-slot" style="position:relative;border:1px solid var(--border-primary);border-radius:var(--radius-md);overflow:hidden;"></div>
        <div id="chart-slot-1" class="chart-slot" style="position:relative;border:1px solid var(--border-primary);border-radius:var(--radius-md);overflow:hidden;"></div>
        <div id="chart-slot-2" class="chart-slot" style="position:relative;border:1px solid var(--border-primary);border-radius:var(--radius-md);overflow:hidden;"></div>
        <div id="chart-slot-3" class="chart-slot" style="position:relative;border:1px solid var(--border-primary);border-radius:var(--radius-md);overflow:hidden;"></div>
      </div>
    </div>
  `;

  const cleanups = [];
  let isCleaningUp = false;

  function renderAllCharts() {
    // Clear previous chart cleanups before re-rendering
    cleanups.forEach(c => c());
    cleanups.length = 0;

    charts.forEach((pair, idx) => {
      const slot = container.querySelector(`#chart-slot-${idx}`);
      if (!slot) return;
      slot.innerHTML = ''; // Clear slot
      const cleanup = renderChart(slot, { pair });
      if (cleanup) cleanups.push(cleanup);

      const label = document.createElement('div');
      label.style.cssText = 'position:absolute;top:10px;left:10px;z-index:10;background:var(--bg-card);padding:2px 8px;border-radius:4px;font-weight:bold;font-size:12px;opacity:0.8;';
      label.textContent = pair;
      slot.appendChild(label);
    });
  }

  const syncBtn = container.querySelector('#sync-charts');
  const doCleanup = () => {
    if (isCleaningUp) return;
    isCleaningUp = true;
    cleanups.forEach(c => c());
    cleanups.length = 0;
    syncBtn.removeEventListener('click', onSync);
  };

  const onSync = () => {
    renderAllCharts();
  };
  syncBtn.addEventListener('click', onSync);

  // Initial render
  renderAllCharts();

  return doCleanup;
}
