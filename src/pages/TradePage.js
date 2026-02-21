/* ============================================
   FOREX PULSE — Trade Page
   ============================================ */

import { renderChart } from '../components/Chart.js';
import { renderTradeForm } from '../components/TradeForm.js';
import { renderMarketAnalysis } from '../components/MarketAnalysis.js';
import { renderPositions } from '../components/Positions.js';

export function renderTradePage(container) {
  container.innerHTML = `
    <div class="trade-layout">
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

  renderChart(container.querySelector('#trade-chart'));
  renderTradeForm(container.querySelector('#trade-form'));
  renderMarketAnalysis(container.querySelector('#trade-analysis'));
  renderPositions(container.querySelector('#trade-positions'), { compact: true });
}
