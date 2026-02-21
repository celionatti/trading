/* ============================================
   FOREX PULSE — Trade Page
   ============================================ */

import { renderChart } from '../components/Chart.js';
import { renderTradeForm } from '../components/TradeForm.js';
import { renderMarketAnalysis } from '../components/MarketAnalysis.js';
import { renderPositions } from '../components/Positions.js';
import store from '../services/store.js';

export function renderTradePage(container) {
  const isCollapsed = store.get('ui.tradeSideCollapsed') || false;

  container.innerHTML = `
    <div class="trade-layout ${isCollapsed ? 'side-collapsed' : ''}">
      <!-- Toggle Button -->
      <button id="trade-side-toggle" class="btn btn-icon btn-ghost" style="position:fixed; bottom:var(--space-6); right:var(--space-6); z-index:var(--z-modal); border-radius:50%; box-shadow:var(--shadow-lg); background:var(--bg-secondary);">
        ${isCollapsed ? '◀' : '▶'}
      </button>

      <div class="trade-chart-area">
        <div id="trade-chart" style="flex:1;min-height:400px;"></div>
        <div id="trade-positions"></div>
      </div>
      <div class="trade-panel">
        <div id="trade-form"></div>
        <div id="trade-analysis"></div>
      </div>
    </div>
  `;

  const cleanups = [];
  cleanups.push(renderChart(container.querySelector('#trade-chart')));
  cleanups.push(renderTradeForm(container.querySelector('#trade-form')));
  cleanups.push(renderMarketAnalysis(container.querySelector('#trade-analysis')));
  cleanups.push(renderPositions(container.querySelector('#trade-positions'), { compact: true }));

  // Side Toggle Handler
  const toggleBtn = container.querySelector('#trade-side-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = store.get('ui.tradeSideCollapsed') || false;
      store.set('ui.tradeSideCollapsed', !current);
      const grid = container.querySelector('.trade-layout');
      if (grid) {
        const nowCollapsed = !current;
        grid.classList.toggle('side-collapsed', nowCollapsed);
        toggleBtn.innerHTML = nowCollapsed ? '◀' : '▶';
        window.dispatchEvent(new Event('resize'));
      }
    });
  }

  return () => {
    cleanups.forEach(c => c && c());
  };
}
