/* ============================================
   FOREX PULSE — Analytics Component
   ============================================ */

import store from '../services/store.js';
import { getTradeStats, TRADE_MODES } from '../services/tradeEngine.js';

export function renderAnalytics(container) {
  const stats = getTradeStats();
  const history = store.get('history') || [];
  const balance = store.get('balance');
  const initialBalance = 10000;
  const totalReturn = ((balance - initialBalance) / initialBalance * 100).toFixed(2);

  container.innerHTML = `
    <div class="analytics-grid">
      <!-- Summary Stats Row -->
      <div class="analytics-wide">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--space-3);">
          <div class="stat-widget">
            <span class="stat-label">Total Trades</span>
            <span class="stat-value">${stats.totalTrades}</span>
          </div>
          <div class="stat-widget">
            <span class="stat-label">Win Rate</span>
            <span class="stat-value ${parseFloat(stats.winRate) >= 50 ? 'text-profit' : 'text-loss'}">${stats.winRate}%</span>
          </div>
          <div class="stat-widget">
            <span class="stat-label">Total P&L</span>
            <span class="stat-value ${stats.totalPL >= 0 ? 'text-profit' : 'text-loss'}">${stats.totalPL >= 0 ? '+' : ''}$${stats.totalPL.toFixed(2)}</span>
          </div>
          <div class="stat-widget">
            <span class="stat-label">Profit Factor</span>
            <span class="stat-value ${stats.profitFactor >= 1.5 ? 'text-profit' : stats.profitFactor >= 1 ? 'text-warning' : 'text-loss'}">${stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}</span>
          </div>
          <div class="stat-widget">
            <span class="stat-label">Return</span>
            <span class="stat-value ${parseFloat(totalReturn) >= 0 ? 'text-profit' : 'text-loss'}">${totalReturn}%</span>
          </div>
        </div>
      </div>

      <!-- Win/Loss Card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Win / Loss</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);">
          <div style="display:flex;gap:var(--space-3);">
            <div style="flex:1;text-align:center;padding:var(--space-3);background:var(--color-profit-bg);border-radius:var(--radius-md);">
              <div style="font-size:var(--text-2xl);font-weight:var(--font-extrabold);color:var(--color-profit);">${stats.wins}</div>
              <div style="font-size:var(--text-xs);color:var(--text-tertiary);">Wins</div>
            </div>
            <div style="flex:1;text-align:center;padding:var(--space-3);background:var(--color-loss-bg);border-radius:var(--radius-md);">
              <div style="font-size:var(--text-2xl);font-weight:var(--font-extrabold);color:var(--color-loss);">${stats.losses}</div>
              <div style="font-size:var(--text-xs);color:var(--text-tertiary);">Losses</div>
            </div>
          </div>

          <!-- Win rate bar -->
          <div>
            <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:4px;">
              <span>Win Rate</span>
              <span class="mono">${stats.winRate}%</span>
            </div>
            <div style="height:8px;background:var(--color-loss-bg);border-radius:var(--radius-full);overflow:hidden;">
              <div style="height:100%;width:${stats.winRate}%;background:var(--color-profit);border-radius:var(--radius-full);transition:width 0.5s;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Average Trades Card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Trade Averages</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-2);">
          <div style="display:flex;justify-content:space-between;padding:var(--space-2);background:var(--bg-tertiary);border-radius:var(--radius-sm);">
            <span style="font-size:var(--text-sm);color:var(--text-secondary);">Avg Win</span>
            <span class="mono text-profit" style="font-weight:var(--font-bold);">+$${stats.avgWin.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:var(--space-2);background:var(--bg-tertiary);border-radius:var(--radius-sm);">
            <span style="font-size:var(--text-sm);color:var(--text-secondary);">Avg Loss</span>
            <span class="mono text-loss" style="font-weight:var(--font-bold);">$${stats.avgLoss.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:var(--space-2);background:var(--bg-tertiary);border-radius:var(--radius-sm);">
            <span style="font-size:var(--text-sm);color:var(--text-secondary);">Best Trade</span>
            <span class="mono text-profit" style="font-weight:var(--font-bold);">+$${stats.bestTrade.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:var(--space-2);background:var(--bg-tertiary);border-radius:var(--radius-sm);">
            <span style="font-size:var(--text-sm);color:var(--text-secondary);">Worst Trade</span>
            <span class="mono text-loss" style="font-weight:var(--font-bold);">$${stats.worstTrade.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:var(--space-2);background:var(--bg-tertiary);border-radius:var(--radius-sm);">
            <span style="font-size:var(--text-sm);color:var(--text-secondary);">Max Consec. Wins</span>
            <span class="mono" style="font-weight:var(--font-bold);">${stats.consecutiveWins}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:var(--space-2);background:var(--bg-tertiary);border-radius:var(--radius-sm);">
            <span style="font-size:var(--text-sm);color:var(--text-secondary);">Max Consec. Losses</span>
            <span class="mono" style="font-weight:var(--font-bold);">${stats.consecutiveLosses}</span>
          </div>
        </div>
      </div>

      <!-- Equity Curve (Text-based) -->
      <div class="analytics-wide">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Equity Curve</span>
            <span class="badge ${parseFloat(totalReturn) >= 0 ? 'badge-profit' : 'badge-loss'}">${totalReturn}%</span>
          </div>
          ${renderEquityCurve(history, initialBalance)}
        </div>
      </div>

      <!-- By Mode Breakdown -->
      <div class="analytics-wide">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Performance by Trade Mode</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-3);">
            ${Object.entries(TRADE_MODES).map(([key, cfg]) => {
              const modeTrades = history.filter(t => t.mode === key);
              const modeWins = modeTrades.filter(t => t.realizedPL > 0).length;
              const modePL = modeTrades.reduce((s, t) => s + t.realizedPL, 0);
              const modeWinRate = modeTrades.length > 0 ? (modeWins / modeTrades.length * 100).toFixed(1) : '0.0';

              return `
                <div style="padding:var(--space-3);background:var(--bg-tertiary);border-radius:var(--radius-md);border-left:3px solid ${cfg.color};">
                  <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);">
                    <span>${cfg.icon}</span>
                    <span style="font-weight:var(--font-semibold);font-size:var(--text-sm);">${cfg.label}</span>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-1);font-size:var(--text-xs);">
                    <div>
                      <div class="text-muted">Trades</div>
                      <div class="mono" style="font-weight:var(--font-bold);">${modeTrades.length}</div>
                    </div>
                    <div>
                      <div class="text-muted">Win Rate</div>
                      <div class="mono" style="font-weight:var(--font-bold);">${modeWinRate}%</div>
                    </div>
                    <div>
                      <div class="text-muted">P&L</div>
                      <div class="mono ${modePL >= 0 ? 'text-profit' : 'text-loss'}" style="font-weight:var(--font-bold);">${modePL >= 0 ? '+' : ''}$${modePL.toFixed(2)}</div>
                    </div>
                    <div>
                      <div class="text-muted">Wins</div>
                      <div class="mono" style="font-weight:var(--font-bold);">${modeWins}/${modeTrades.length}</div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEquityCurve(history, initialBalance) {
  if (history.length === 0) {
    return `
      <div class="empty-state" style="padding:var(--space-6);">
        <span class="empty-state-icon">📊</span>
        <span class="empty-state-text">Complete some trades to see your equity curve</span>
      </div>
    `;
  }

  // Build equity points
  const points = [initialBalance];
  let running = initialBalance;
  // Reverse because history is newest first
  const sorted = [...history].reverse();
  sorted.forEach(t => {
    running += t.realizedPL;
    points.push(running);
  });

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  // Render as SVG sparkline
  const width = 600;
  const height = 120;
  const padding = 10;

  const xStep = (width - padding * 2) / (points.length - 1 || 1);
  const pathPoints = points.map((v, i) => {
    const x = padding + i * xStep;
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = pathPoints.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(' ');
  const areaD = `${pathD} L${padding + (points.length - 1) * xStep},${height - padding} L${padding},${height - padding} Z`;

  const isProfit = points[points.length - 1] >= points[0];
  const lineColor = isProfit ? '#10b981' : '#ef4444';
  const fillColor = isProfit ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:${height}px;">
      <defs>
        <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${lineColor}" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="${lineColor}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#equityGrad)" />
      <path d="${pathD}" fill="none" stroke="${lineColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${pathPoints[pathPoints.length - 1].split(',')[0]}" cy="${pathPoints[pathPoints.length - 1].split(',')[1]}" r="4" fill="${lineColor}"/>
    </svg>
    <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--text-tertiary);margin-top:var(--space-1);">
      <span>$${min.toFixed(2)}</span>
      <span>$${max.toFixed(2)}</span>
    </div>
  `;
}
