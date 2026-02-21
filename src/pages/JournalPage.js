/* ============================================
   FOREX PULSE — Trade Journal & Historical Analysis
   ============================================ */

import store from '../services/store.js';

export function renderTradeJournal(container) {
  const history = store.get('history') || [];
  const tags = Array.from(new Set(history.flatMap(h => h.tags || [])));
  
  container.innerHTML = `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Performance Journal</h1>
        <div class="page-actions">
           <div class="input-group-row">
            <span class="text-xs text-muted">Filter by Tag:</span>
            <select class="select select-sm" id="journal-filter">
              <option value="all">All trades</option>
              ${tags.map(t => `<option value="${t}">#${t}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="journal-stats" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:var(--space-4);margin-bottom:var(--space-6);">
        <!-- Stats filled dynamically -->
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        <table class="table" id="journal-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Pair</th>
              <th>Type</th>
              <th>Logic/Notes</th>
              <th>P&L</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="journal-list">
            <!-- Items filled dynamically -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  const filterSelect = container.querySelector('#journal-filter');
  const journalList = container.querySelector('#journal-list');
  const statsGrid = container.querySelector('.journal-stats');

  function updateView() {
    const filter = filterSelect.value;
    const filtered = filter === 'all' ? history : history.filter(h => h.tags && h.tags.includes(filter));

    // Calculate Stats
    const total = filtered.length;
    const wins = filtered.filter(f => f.realizedPL > 0).length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
    const totalProfit = filtered.reduce((s, f) => s + f.realizedPL, 0);

    statsGrid.innerHTML = `
      <div class="stat-widget" style="border-left:3px solid var(--accent-primary);">
        <span class="stat-label">Total Trades</span>
        <span class="stat-value">${total}</span>
      </div>
      <div class="stat-widget" style="border-left:3px solid var(--color-profit);">
        <span class="stat-label">Win Rate</span>
        <span class="stat-value">${winRate}%</span>
      </div>
      <div class="stat-widget" style="border-left:3px solid ${totalProfit >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'};">
        <span class="stat-label">Net Return</span>
        <span class="stat-value ${totalProfit >= 0 ? 'text-profit' : 'text-loss'}">${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}</span>
      </div>
    `;

    // Render Table
    if (filtered.length === 0) {
      journalList.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:var(--space-10);color:var(--text-tertiary);">No trades found for this filter</td></tr>`;
      return;
    }

    journalList.innerHTML = filtered.map(t => `
      <tr>
        <td class="text-xs text-muted">${new Date(t.closeTime).toLocaleDateString()} ${new Date(t.closeTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
        <td><span class="font-bold">${t.pair}</span></td>
        <td><span class="badge ${t.direction === 'buy' ? 'badge-profit' : 'badge-loss'}">${t.direction.toUpperCase()}</span></td>
        <td>
          <div style="font-size:var(--text-xs);font-weight:var(--font-semibold);">${t.notes || 'No notes'}</div>
          <div style="margin-top:2px;">${(t.tags || []).map(tag => `<span style="font-size:9px;background:var(--bg-tertiary);padding:1px 4px;border-radius:2px;margin-right:2px;color:var(--text-secondary);">#${tag}</span>`).join('')}</div>
        </td>
        <td class="mono font-bold ${t.realizedPL >= 0 ? 'text-profit' : 'text-loss'}">
          ${t.realizedPL >= 0 ? '+' : ''}$${t.realizedPL.toFixed(2)}
        </td>
        <td><span class="text-xs ${t.closeReason === 'manual' ? 'text-muted' : 'text-warning'}">${t.closeReason.toUpperCase()}</span></td>
      </tr>
    `).join('');
  }

  const onFilterChange = () => updateView();
  filterSelect.addEventListener('change', onFilterChange);
  updateView();

  return () => {
    filterSelect.removeEventListener('change', onFilterChange);
  };
}
