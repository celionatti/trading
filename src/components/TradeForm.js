/* ============================================
   FOREX PULSE — Trade Form (Advanced)
   ============================================ */

import store from '../services/store.js';
import { executeOrder, calculateLotSize, calculatePipValue, ORDER_TYPES, TRADE_MODES } from '../services/tradeEngine.js';
import { getPipSize } from '../services/api.js';

export function renderTradeForm(container) {
  const pair = store.get('selectedPair');
  const settings = store.get('settings');
  const quotes = store.get('quotes') || {};
  const quote = quotes[pair];
  const mode = settings.tradeMode;
  const modeConfig = TRADE_MODES[mode];
  
  let orderType = ORDER_TYPES.MARKET;
  let useRiskPercent = false;
  const timeframe = store.get('ui.chartInterval') || '1h';

  container.innerHTML = `
    <div class="card">
      <div class="card-header" style="justify-content:space-between;">
        <span class="card-title">Order Entry</span>
        <div class="badge badge-info mono" id="form-timeframe" style="text-transform:uppercase;font-size:var(--text-xxs);">${timeframe}</div>
      </div>
      <div class="card-header" style="padding-top:0;margin-top:-var(--space-2);">
        <div class="tabs tabs-sm" id="order-type-tabs" style="width:100%;">
          <button class="tab active" data-type="market">Market</button>
          <button class="tab" data-type="limit">Limit</button>
          <button class="tab" data-type="stop">Stop</button>
        </div>
      </div>

      <!-- Pair & Price -->
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-3);align-items:center;">
        <span style="font-weight:var(--font-bold);">${pair}</span>
        <div class="mono" style="font-size:var(--text-sm);">
          <span id="form-bid" style="color:var(--color-loss);">${quote ? (quote.bid || quote.close) : '—'}</span>
          /
          <span id="form-ask" style="color:var(--color-profit);">${quote ? (quote.ask || quote.close) : '—'}</span>
        </div>
      </div>

      <!-- Target Price (Hidden for Market) -->
      <div class="input-group" id="target-price-group" style="display:none;margin-bottom:var(--space-3);">
        <label class="input-label">Target Price</label>
        <input type="number" class="input input-sm" id="trade-price" step="0.00001" placeholder="Enter target price" />
      </div>

      <!-- Lot Management -->
      <div class="input-group" style="margin-bottom:var(--space-3);">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <label class="input-label">Position Size</label>
          <label style="font-size:var(--text-xxs);display:flex;align-items:center;gap:4px;cursor:pointer;">
            <input type="checkbox" id="use-risk-percent" /> Use Risk %
          </label>
        </div>
        
        <div id="lot-input-wrapper">
          <div style="display:flex;gap:var(--space-2);">
            <input type="number" class="input input-sm" id="trade-lot" value="${settings.defaultLotSize}" step="0.01" style="flex:1;" />
            <div style="display:flex;gap:2px;">
              <button class="btn btn-ghost btn-sm lot-preset" data-lot="0.01">.01</button>
              <button class="btn btn-ghost btn-sm lot-preset" data-lot="0.1">.10</button>
              <button class="btn btn-ghost btn-sm lot-preset" data-lot="1">1.0</button>
            </div>
          </div>
        </div>

        <div id="risk-input-wrapper" style="display:none;">
          <div style="display:flex;gap:var(--space-2);align-items:center;">
            <input type="number" class="input input-sm" id="trade-risk-percent" value="${settings.riskPercent || 1}" step="0.1" style="flex:1;" />
            <span class="text-xs">%</span>
            <div class="badge badge-neutral mono" id="calculated-lots" style="min-width:60px;text-align:center;">— lots</div>
          </div>
        </div>
      </div>

      <!-- SL/TP -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-3);">
        <div class="input-group">
          <label class="input-label">Stop Loss (pips)</label>
          <input type="number" class="input input-sm" id="trade-sl" value="${modeConfig.defaultSL}" />
        </div>
        <div class="input-group">
          <label class="input-label">Take Profit (pips)</label>
          <input type="number" class="input input-sm" id="trade-tp" value="${modeConfig.defaultTP}" />
        </div>
      </div>

      <!-- Metadata -->
      <div class="input-group" style="margin-bottom:var(--space-4);">
        <label class="input-label">Notes & Tags</label>
        <textarea class="input input-sm" id="trade-notes" placeholder="Why are you taking this trade?" style="height:40px;resize:none;font-family:inherit;"></textarea>
        <input type="text" class="input input-sm" id="trade-tags" placeholder="tags (comma separated)" style="margin-top:4px;" />
      </div>

      <!-- Risk Preview -->
      <div id="risk-preview-box" style="padding:var(--space-2) var(--space-3);background:var(--bg-tertiary);border-radius:var(--radius-md);margin-bottom:var(--space-4);font-size:var(--text-xs);">
        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
          <span class="text-muted">Risk Amount</span>
          <span class="mono text-loss" id="risk-val">—</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
          <span class="text-muted">Reward Amount</span>
          <span class="mono text-profit" id="reward-val">—</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span class="text-muted">R:R Ratio</span>
          <span class="mono" id="ratio-val">—</span>
        </div>
      </div>

      <div style="display:flex;gap:var(--space-2);">
        <button class="btn btn-sell btn-lg" style="flex:1;" id="btn-sell">SELL</button>
        <button class="btn btn-buy btn-lg" style="flex:1;" id="btn-buy">BUY</button>
      </div>
    </div>
  `;

  // === Interactivity ===

  const priceGroup = container.querySelector('#target-price-group');
  const priceInput = container.querySelector('#trade-price');
  const lotLabel = container.querySelector('#calculated-lots');

  container.querySelectorAll('#order-type-tabs .tab').forEach(t => {
    t.addEventListener('click', () => {
      orderType = t.dataset.type;
      container.querySelectorAll('#order-type-tabs .tab').forEach(btn => btn.classList.remove('active'));
      t.classList.add('active');
      priceGroup.style.display = orderType === 'market' ? 'none' : 'flex';
      if (orderType !== 'market' && !priceInput.value && quote) {
        priceInput.value = quote.close || quote.bid;
      }
    });
  });

  const riskToggle = container.querySelector('#use-risk-percent');
  const lotWrapper = container.querySelector('#lot-input-wrapper');
  const riskWrapper = container.querySelector('#risk-input-wrapper');

  riskToggle.addEventListener('change', () => {
    useRiskPercent = riskToggle.checked;
    lotWrapper.style.display = useRiskPercent ? 'none' : 'block';
    riskWrapper.style.display = useRiskPercent ? 'block' : 'none';
    updateCalculations();
  });

  function updateCalculations() {
    const sl = parseFloat(container.querySelector('#trade-sl').value) || 0;
    const tp = parseFloat(container.querySelector('#trade-tp').value) || 0;
    const balance = store.get('balance');
    let lots = parseFloat(container.querySelector('#trade-lot').value) || 0.01;

    if (useRiskPercent) {
      const riskP = parseFloat(container.querySelector('#trade-risk-percent').value) || 1;
      const riskAmt = balance * (riskP / 100);
      lots = calculateLotSize(riskAmt, sl, pair);
      lotLabel.textContent = `${lots.toFixed(2)} unit${lots !== 1 ? 's' : ''}`;
    }

    const pipVal = calculatePipValue(pair, lots);
    const riskAmt = sl * pipVal;
    const rewardAmt = tp * pipVal;
    const ratio = sl > 0 ? (tp / sl).toFixed(2) : '∞';

    // Calculate actual prices for SL/TP feedback to user
    const pipSize = getPipSize(pair);
    const currentBid = quote ? (parseFloat(quote.bid) || parseFloat(quote.close)) : 0;
    const currentAsk = quote ? (parseFloat(quote.ask) || parseFloat(quote.close)) : 0;
    const decimals = pair.includes('JPY') ? 3 : 5;

    if (currentBid && currentAsk) {
      const buySL = (currentAsk - (sl * pipSize)).toFixed(decimals);
      const buyTP = (currentAsk + (tp * pipSize)).toFixed(decimals);
      const sellSL = (currentBid + (sl * pipSize)).toFixed(decimals);
      const sellTP = (currentBid - (tp * pipSize)).toFixed(decimals);

      container.querySelector('#trade-sl').parentElement.querySelector('.input-label').innerHTML = `
        Stop Loss <span class="text-xxs text-muted">(Buy: ${buySL} | Sell: ${sellSL})</span>
      `;
      container.querySelector('#trade-tp').parentElement.querySelector('.input-label').innerHTML = `
        Take Profit <span class="text-xxs text-muted">(Buy: ${buyTP} | Sell: ${sellTP})</span>
      `;
    }

    container.querySelector('#risk-val').textContent = `$${riskAmt.toFixed(2)}`;
    container.querySelector('#reward-val').textContent = `$${rewardAmt.toFixed(2)}`;
    container.querySelector('#ratio-val').textContent = `1:${ratio}`;
    
    return { lots, sl, tp, riskAmt };
  }

  ['trade-sl', 'trade-tp', 'trade-lot', 'trade-risk-percent'].forEach(id => {
    container.querySelector(`#${id}`).addEventListener('input', updateCalculations);
  });

  container.querySelectorAll('.lot-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelector('#trade-lot').value = btn.dataset.lot;
      updateCalculations();
    });
  });

  const execute = (direction) => {
    const { lots, sl, tp } = updateCalculations();
    const targetPrice = orderType === 'market' ? null : priceInput.value;
    const notes = container.querySelector('#trade-notes').value;
    const tags = container.querySelector('#trade-tags').value.split(',').map(t => t.trim()).filter(Boolean);

    try {
      executeOrder({
        pair, direction, lotSize: lots, stopLoss: sl, takeProfit: tp,
        type: orderType, price: targetPrice, mode, notes, tags
      });
    } catch (e) {
      alert(e.message);
    }
  };

  container.querySelector('#btn-buy').addEventListener('click', () => execute('buy'));
  container.querySelector('#btn-sell').addEventListener('click', () => execute('sell'));

  const instanceId = `tradeform-${Math.random().toString(36).substr(2, 5)}`;

  // Live price subscription
  store.subscribe('quotes', () => {
    const q = store.get('quotes')?.[pair];
    if (!q) return;
    const bidEl = container.querySelector('#form-bid');
    const askEl = container.querySelector('#form-ask');
    if (bidEl) bidEl.textContent = q.bid || q.close;
    if (askEl) askEl.textContent = q.ask || q.close;
  }, `${instanceId}-quotes`);

  // Timeframe subscription
  store.subscribe('ui.chartInterval', (tf) => {
    const tfEl = container.querySelector('#form-timeframe');
    if (tfEl) tfEl.textContent = tf;
  }, `${instanceId}-timeframe`);

  updateCalculations();

  return () => {
    store.unsubscribe(`${instanceId}-quotes`);
    store.unsubscribe(`${instanceId}-timeframe`);
  };
}
