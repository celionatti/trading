/* ============================================
   FOREX PULSE — Economic Calendar Component
   ============================================ */

import { fetchEconomicCalendar } from '../services/api.js';

export async function renderEconomicCalendar(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Economic Calendar</span>
        <span class="badge badge-neutral">Today</span>
      </div>
      <div id="calendar-list" style="display:flex;flex-direction:column;gap:var(--space-2);max-height:400px;overflow-y:auto;">
        <div class="loading-state" style="padding:var(--space-4);text-align:center;color:var(--text-tertiary);">Loading events...</div>
      </div>
    </div>
  `;

  try {
    const events = await fetchEconomicCalendar();
    const list = container.querySelector('#calendar-list');
    
    if (!list) return; // Component was cleaned up while fetching
    
    if (!events || events.length === 0) {
      list.innerHTML = `<div style="padding:var(--space-4);text-align:center;color:var(--text-tertiary);">No major events today</div>`;
      return;
    }

    list.innerHTML = events.map(ev => `
      <div class="calendar-item" style="padding:var(--space-2);background:var(--bg-tertiary);border-radius:var(--radius-sm);display:flex;gap:var(--space-3);align-items:center;">
        <div style="font-family:var(--font-mono);font-size:var(--text-xs);width:45px;color:var(--text-secondary);">${ev.time}</div>
        <div style="font-weight:var(--font-bold);font-size:var(--text-xs);width:35px;text-align:center;color:var(--accent-primary);">${ev.country}</div>
        <div style="flex:1;">
          <div style="font-size:var(--text-sm);font-weight:var(--font-medium);">${ev.event}</div>
          <div style="display:flex;gap:var(--space-2);font-size:var(--text-xxs);color:var(--text-tertiary);margin-top:2px;">
            <span>Prev: ${ev.previous}</span>
            <span>Est: ${ev.estimate}</span>
          </div>
        </div>
        <div class="badge ${ev.impact === 'high' ? 'badge-loss' : ev.impact === 'medium' ? 'badge-warning' : 'badge-neutral'}" style="font-size:10px;padding:1px 6px;">
          ${ev.impact.toUpperCase()}
        </div>
      </div>
    `).join('');
  } catch (err) {
    const list = container.querySelector('#calendar-list');
    if (list) list.innerHTML = `<div style="color:var(--color-loss);text-align:center;padding:var(--space-4);">Failed to load calendar</div>`;
  }
}
