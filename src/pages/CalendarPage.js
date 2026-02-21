/* ============================================
   FOREX PULSE — Calendar Page
   ============================================ */

import { renderEconomicCalendar } from '../components/EconomicCalendar.js';

export function renderCalendarPage(container) {
  container.innerHTML = `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Market Events</h1>
      </div>
      <div id="calendar-view" style="margin-top:var(--space-4);"></div>
    </div>
  `;

  renderEconomicCalendar(container.querySelector('#calendar-view'));

  return () => {
    // Calendar is currently static fetch, but we return a cleanup for consistency
  };
}
