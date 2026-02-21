/* ============================================
   FOREX PULSE — Market Sessions Component
   ============================================ */

import store from '../services/store.js';

/**
 * Global Forex Session Hours (UTC)
 * Sydney: 22:00 - 07:00
 * Tokyo: 00:00 - 09:00
 * London: 08:00 - 17:00
 * New York: 13:00 - 22:00
 */
const SESSIONS = [
  { id: 'sydney', name: 'Sydney', start: 22, end: 7, color: '#3b82f6' },
  { id: 'tokyo', name: 'Tokyo', start: 0, end: 9, color: '#ef4444' },
  { id: 'london', name: 'London', start: 8, end: 17, color: '#f59e0b' },
  { id: 'new-york', name: 'New York', start: 13, end: 22, color: '#10b981' },
];

export function renderMarketSessions(container) {
  const update = () => {
    const isCollapsed = store.get('ui.marketSessionsCollapsed') || false;
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();

    const activeSessions = SESSIONS.filter(s => {
      if (s.start < s.end) {
        return utcHour >= s.start && utcHour < s.end;
      } else {
        return utcHour >= s.start || utcHour < s.end;
      }
    });

    container.innerHTML = `
      <div class="market-sessions-widget ${isCollapsed ? 'collapsed' : ''}">
        <div class="sidebar-section-title" id="sessions-toggle" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;user-select:none;">
          <div style="display:flex;align-items:center;gap:var(--space-2);">
            <span class="collapse-icon" style="transition:transform var(--transition-base); transform: ${isCollapsed ? 'rotate(-90deg)' : 'rotate(0)'};">▼</span>
            Current Markets
          </div>
          <span class="badge badge-neutral" style="font-size:9px;">UTC ${utcHour.toString().padStart(2, '0')}:${utcMin.toString().padStart(2, '0')}</span>
        </div>
        <div class="sessions-list-wrapper" style="overflow:hidden; transition: max-height var(--transition-base), opacity var(--transition-base); max-height: ${isCollapsed ? '0' : '500px'}; opacity: ${isCollapsed ? '0' : '1'};">
          <div class="sessions-list" style="padding:0 var(--space-3);display:flex;flex-direction:column;gap:var(--space-2);padding-bottom:var(--space-4);">
            ${SESSIONS.map(s => {
              const isActive = activeSessions.includes(s);
              let timeTo;
              
              if (isActive) {
                const endHour = s.end;
                let diff = endHour - utcHour;
                if (diff <= 0) diff += 24;
                timeTo = `Closes in ${diff}h`;
              } else {
                const startHour = s.start;
                let diff = startHour - utcHour;
                if (diff <= 0) diff += 24;
                timeTo = `Opens in ${diff}h`;
              }

              return `
                <div class="session-item ${isActive ? 'active' : ''}" style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2);background:var(--bg-tertiary);border-radius:var(--radius-md);border-left:3px solid ${isActive ? s.color : 'transparent'};">
                  <div class="session-status" style="width:8px;height:8px;border-radius:50%;background:${isActive ? s.color : 'var(--text-muted)'}; box-shadow: ${isActive ? `0 0 8px ${s.color}` : 'none'};"></div>
                  <div style="flex:1;">
                    <div style="font-size:var(--text-xs);font-weight:var(--font-bold);color:${isActive ? 'var(--text-primary)' : 'var(--text-tertiary)'};">${s.name}</div>
                    <div style="font-size:10px;color:var(--text-tertiary);">${timeTo}</div>
                  </div>
                  ${isActive ? `<span class="badge badge-profit" style="font-size:8px;padding:1px 4px;">ACTIVE</span>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // Toggle handler
    container.querySelector('#sessions-toggle')?.addEventListener('click', () => {
      const current = store.get('ui.marketSessionsCollapsed') || false;
      store.set('ui.marketSessionsCollapsed', !current);
      update();
    });
  };

  update();
  const interval = setInterval(update, 60000);

  return () => clearInterval(interval);
}
