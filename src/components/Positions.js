/* ============================================
   FOREX PULSE — Positions Component
   ============================================ */

import store from '../services/store.js';
import { closeTrade, modifyTrade, TRADE_MODES } from '../services/tradeEngine.js';

export function renderPositions(container, options = {}) {
  const positions = store.get('positions') || [];
  const compact = options.compact || false;

  if (positions.length === 0) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Open Positions</span>
          <span class="badge badge-neutral">0</span>
        </div>
        <div class="empty-state" style="padding:var(--space-8);">
          <span class="empty-state-icon">📭</span>
          <span class="empty-state-text">No open positions</span>
        </div>
      </div>
    `;
    return;
  }

  const totalPL = positions.reduce((s, p) => s + p.unrealizedPL, 0);

  container.innerHTML = `
    <div class="card" style="overflow:hidden;">
      <div class="card-header">
        <span class="card-title">Open Positions</span>
        <div style="display:flex;align-items:center;gap:var(--space-3);">
          <span class="badge badge-info">${positions.length}</span>
          <span class="mono ${totalPL >= 0 ? 'text-profit' : 'text-loss'}" style="font-size:var(--text-sm);font-weight:var(--font-bold);">
            ${totalPL >= 0 ? '+' : ''}$${totalPL.toFixed(2)}
          </span>
        </div>
      </div>

      <div class="table-container" style="max-height:${compact ? '250px' : '500px'};overflow-y:auto;">
        <table class="table">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Type</th>
              <th>Lot</th>
              <th>Entry</th>
              <th>Current</th>
              <th>P&L</th>
              <th>Pips</th>
              ${!compact ? '<th>SL/TP</th><th>Mode</th>' : ''}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${positions.map(pos => {
              const plClass = pos.unrealizedPL >= 0 ? 'text-profit' : 'text-loss';
              const modeConfig = TRADE_MODES[pos.mode] || TRADE_MODES.day;
              const progressPercent = getProgressPercent(pos);

              return `
                <tr data-trade-id="${pos.id}">
                  <td><strong>${pos.pair}</strong></td>
                  <td>
                    <span class="badge ${pos.direction === 'buy' ? 'badge-profit' : 'badge-loss'}">
                      ${pos.direction.toUpperCase()}
                    </span>
                  </td>
                  <td class="mono">${pos.lotSize}</td>
                  <td class="mono">${pos.entryPrice}</td>
                  <td class="mono">${pos.currentPrice}</td>
                  <td class="mono ${plClass}" style="font-weight:var(--font-bold);">
                    ${pos.unrealizedPL >= 0 ? '+' : ''}$${pos.unrealizedPL.toFixed(2)}
                  </td>
                  <td class="mono ${plClass}">${pos.pips >= 0 ? '+' : ''}${pos.pips.toFixed(1)}</td>
                  ${!compact ? `
                    <td>
                      <div style="font-size:var(--text-xs);">
                        <span class="text-loss">SL: ${pos.stopLoss || '—'}</span><br>
                        <span class="text-profit">TP: ${pos.takeProfit || '—'}</span>
                      </div>
                      <div class="progress-bar" style="margin-top:4px;width:80px;">
                        <div class="progress-fill ${pos.unrealizedPL >= 0 ? 'profit' : 'loss'}" style="width:${progressPercent}%;"></div>
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-neutral" style="color:${modeConfig.color};">
                        ${modeConfig.icon} ${modeConfig.label}
                      </span>
                    </td>
                  ` : ''}
                  <td>
                    <div style="display:flex;gap:var(--space-1);">
                      ${!compact ? `<button class="btn btn-ghost btn-sm modify-btn" data-id="${pos.id}" title="Modify SL/TP">✏️</button>` : ''}
                      <button class="btn btn-sell btn-sm close-btn" data-id="${pos.id}" title="Close Position">✕</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Close button handlers
  container.querySelectorAll('.close-btn').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      if (confirm('Close this position?')) {
        closeTrade(id, 'manual');
        renderPositions(container, options);
      }
    });
  });

  // Modify button handlers
  container.querySelectorAll('.modify-btn').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const pos = positions.find(p => p.id === id);
      if (!pos) return;

      const newSL = prompt('New Stop Loss (pips):', pos.stopLossPips || 0);
      const newTP = prompt('New Take Profit (pips):', pos.takeProfitPips || 0);

      if (newSL !== null || newTP !== null) {
        modifyTrade(id, {
          stopLoss: newSL !== null ? parseFloat(newSL) : undefined,
          takeProfit: newTP !== null ? parseFloat(newTP) : undefined,
        });
        renderPositions(container, options);
      }
    });
  });

  // Subscribe to updates
  store.subscribe('positions', () => renderPositions(container, options));
}

function getProgressPercent(pos) {
  if (!pos.stopLoss && !pos.takeProfit) return 50;

  const entry = parseFloat(pos.entryPrice);
  const current = parseFloat(pos.currentPrice);
  const sl = pos.stopLoss ? parseFloat(pos.stopLoss) : null;
  const tp = pos.takeProfit ? parseFloat(pos.takeProfit) : null;

  if (sl && tp) {
    const totalRange = Math.abs(tp - sl);
    const progress = pos.direction === 'buy'
      ? (current - sl) / totalRange
      : (sl - current) / totalRange;
    return Math.max(0, Math.min(100, progress * 100));
  }

  return 50;
}

// === Trade History Component ===
export function renderTradeHistory(container) {
  const history = store.get('history') || [];

  if (history.length === 0) {
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Trade History</span>
        </div>
        <div class="empty-state" style="padding:var(--space-8);">
          <span class="empty-state-icon">📜</span>
          <span class="empty-state-text">No closed trades yet</span>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card" style="overflow:hidden;">
      <div class="card-header">
        <span class="card-title">Trade History</span>
        <span class="badge badge-neutral">${history.length} trades</span>
      </div>
      <div class="table-container" style="max-height:400px;overflow-y:auto;">
        <table class="table">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Type</th>
              <th>Lot</th>
              <th>Entry</th>
              <th>Close</th>
              <th>P&L</th>
              <th>Reason</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            ${history.slice(0, 50).map(trade => `
              <tr>
                <td><strong>${trade.pair}</strong></td>
                <td>
                  <span class="badge ${trade.direction === 'buy' ? 'badge-profit' : 'badge-loss'}">
                    ${trade.direction.toUpperCase()}
                  </span>
                </td>
                <td class="mono">${trade.lotSize}</td>
                <td class="mono">${trade.entryPrice}</td>
                <td class="mono">${trade.closePrice}</td>
                <td class="mono ${trade.realizedPL >= 0 ? 'text-profit' : 'text-loss'}" style="font-weight:var(--font-bold);">
                  ${trade.realizedPL >= 0 ? '+' : ''}$${trade.realizedPL.toFixed(2)}
                </td>
                <td>
                  <span class="badge ${trade.closeReason === 'take-profit' ? 'badge-profit' : trade.closeReason === 'stop-loss' ? 'badge-loss' : 'badge-neutral'}">
                    ${trade.closeReason || 'manual'}
                  </span>
                </td>
                <td style="font-size:var(--text-xs);color:var(--text-tertiary);">
                  ${new Date(trade.closeTime).toLocaleString()}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
