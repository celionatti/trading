/* ============================================
   FOREX PULSE — Positions Page
   ============================================ */

import { renderPositions, renderTradeHistory } from '../components/Positions.js';

export function renderPositionsPage(container) {
  container.innerHTML = `
    <div class="positions-layout">
      <div id="open-positions"></div>
      <div id="trade-history"></div>
    </div>
  `;

  const cleanup = renderPositions(container.querySelector('#open-positions'));
  renderTradeHistory(container.querySelector('#trade-history'));

  return () => {
    if (cleanup) cleanup();
  };
}
