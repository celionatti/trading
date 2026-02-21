/* ============================================
   FOREX PULSE — Analytics Page
   ============================================ */

import { renderAnalytics } from '../components/Analytics.js';

export function renderAnalyticsPage(container) {
  container.innerHTML = `
    <div style="padding-bottom:var(--space-4);">
      <h1 style="font-size:var(--text-xl);font-weight:var(--font-bold);margin-bottom:var(--space-1);">Performance Analytics</h1>
      <p style="font-size:var(--text-sm);color:var(--text-tertiary);">Track your trading performance and identify patterns.</p>
    </div>
    <div id="analytics-content"></div>
  `;

  renderAnalytics(container.querySelector('#analytics-content'));
}
