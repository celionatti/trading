/* ============================================
   FOREX PULSE — Market Analysis Component
   ============================================ */

import store from '../services/store.js';
import { fetchTimeSeries } from '../services/api.js';
import { calculateRSI, calculateMACD, generateSignal } from '../services/indicators.js';
import { calculateDetailedSignal } from '../services/signalService.js';

let analysisInterval = null;

export function renderMarketAnalysis(container) {
  const pair = store.get('selectedPair');

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Market Analysis</span>
        <span class="badge badge-info">${pair}</span>
      </div>

      <!-- Signal Meter -->
      <div id="signal-section" style="margin-bottom:var(--space-4);">
        <div style="text-align:center;padding:var(--space-3);">
          <div class="animate-pulse" style="color:var(--text-tertiary);font-size:var(--text-sm);">Analyzing...</div>
        </div>
      </div>

      <!-- Indicators -->
      <div id="indicators-section">
        <div style="display:flex;flex-direction:column;gap:var(--space-2);">
          <div class="skeleton" style="height:24px;width:100%;"></div>
          <div class="skeleton" style="height:24px;width:80%;"></div>
          <div class="skeleton" style="height:24px;width:90%;"></div>
        </div>
      </div>

      <!-- Reasons -->
      <div id="reasons-section" style="margin-top:var(--space-3);"></div>

      <!-- Suggested Levels Container -->
      <div id="levels-section"></div>

      <!-- Data Source Disclosure -->
      <div id="analysis-disclaimer" style="margin-top:var(--space-3); padding-top:var(--space-2); border-top:1px dashed var(--border-primary); text-align:center;"></div>
    </div>
  `;

  const instanceId = `analysis-${Math.random().toString(36).substr(2, 5)}`;

  runAnalysis(container, pair);

  // Selected pair change
  store.subscribe('selectedPair', (newPair) => {
    const badge = container.querySelector('.card-header .badge');
    if (badge) badge.textContent = newPair;
    runAnalysis(container);
  }, 'analysis-pair');
  store.subscribe('ui.chartInterval', () => runAnalysis(container), 'analysis-interval');
  store.subscribe('settings.apiKey', () => runAnalysis(container), 'analysis-api-key');

  return () => {
    store.unsubscribe('analysis-pair');
    store.unsubscribe('analysis-interval');
    store.unsubscribe('analysis-api-key');
  };
}

async function runAnalysis(container) {
  const pair = store.get('selectedPair');
  const signalSection = container.querySelector('#signal-section');
  const indicatorsSection = container.querySelector('#indicators-section');
  const reasonsSection = container.querySelector('#reasons-section');
  const levelsSection = container.querySelector('#levels-section');
  const disclaimerSection = container.querySelector('#analysis-disclaimer');

  if (!signalSection) return;
  // Show loading state immediately
  signalSection.innerHTML = `
    <div style="text-align:center;padding:var(--space-3);">
      <div class="animate-pulse" style="color:var(--text-tertiary);font-size:var(--text-sm);">Analyzing ${pair || 'Market'}...</div>
    </div>
  `;
  indicatorsSection.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:var(--space-2);">
      <div class="skeleton" style="height:24px;width:100%;"></div>
      <div class="skeleton" style="height:24px;width:80%;"></div>
    </div>
  `;
  reasonsSection.innerHTML = '';
  if (levelsSection) levelsSection.innerHTML = '';
  if (disclaimerSection) disclaimerSection.innerHTML = '';

  try {
    const interval = store.get('ui.chartInterval') || '1h';
    const candles = await fetchTimeSeries(pair, interval, 100);

    if (!candles || candles.length < 30) {
      signalSection.innerHTML = `<div style="text-align:center;color:var(--text-tertiary);padding:var(--space-4);">Insufficient data for ${pair}</div>`;
      indicatorsSection.innerHTML = '';
      return;
    }

    const closes = candles.map(c => parseFloat(c.close));
    const signal = generateSignal(candles);
    const rsi = calculateRSI(closes);
    const macd = calculateMACD(closes);

    const latestRSI = rsi.filter(v => v !== null).pop() || 50;
    const latestMACD = macd.histogram.filter(v => v !== null);
    const macdVal = latestMACD[latestMACD.length - 1] || 0;

    // Signal display
    const signalColors = {
      strong_buy: { bg: 'var(--color-profit-bg)', color: 'var(--color-profit)', label: 'STRONG BUY', icon: '🚀' },
      buy: { bg: 'var(--color-profit-bg)', color: 'var(--color-profit)', label: 'BUY', icon: '📈' },
      neutral: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', label: 'NEUTRAL', icon: '➡️' },
      sell: { bg: 'var(--color-loss-bg)', color: 'var(--color-loss)', label: 'SELL', icon: '📉' },
      strong_sell: { bg: 'var(--color-loss-bg)', color: 'var(--color-loss)', label: 'STRONG SELL', icon: '🔻' },
    };

    const sc = signalColors[signal.signal];
    
    // Direct Verdict Mapping
    const verdictMap = {
      strong_buy: { text: "Action: Highly Recommended to BUY", sub: "Strong trend & momentum alignment." },
      buy: { text: "Action: Opportunity to BUY", sub: "Bullish signals emerging." },
      neutral: { text: "Action: AWAIT Clarity", sub: "No clear trend. Market is consolidating." },
      sell: { text: "Action: Opportunity to SELL", sub: "Bearish pressure detected." },
      strong_sell: { text: "Action: Highly Recommended to SELL", sub: "Dominant downward momentum." },
    };
    const vm = verdictMap[signal.signal];

    signalSection.innerHTML = `
      <div style="text-align:center;padding:var(--space-4);background:${sc.bg};border-radius:var(--radius-md);border:1px solid ${sc.color}33;">
        <div style="font-size:var(--text-md);font-weight:var(--font-extrabold);color:${sc.color};margin-bottom:2px;">${vm.text}</div>
        <div style="font-size:var(--text-xxs);color:var(--text-secondary);margin-bottom:var(--space-3);">${vm.sub}</div>
        
        <div style="display:flex;justify-content:center;align-items:center;gap:var(--space-4);margin-bottom:var(--space-2);">
          <div style="font-size:2rem;">${sc.icon}</div>
          <div style="text-align:left;">
            <div style="font-size:var(--text-xl);font-weight:900;color:${sc.color};line-height:1;">${sc.label}</div>
            <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:4px;">Confidence: ${signal.strength}%</div>
          </div>
        </div>

        <div class="progress-bar" style="height:6px;background:var(--bg-primary);">
          <div class="progress-fill ${signal.signal.includes('buy') ? 'profit' : signal.signal.includes('sell') ? 'loss' : ''}" style="width:${signal.strength}%;"></div>
        </div>
      </div>
    `;

    // Indicators
    indicatorsSection.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-2);">
        <!-- RSI -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-2);background:var(--bg-tertiary);border-radius:var(--radius-sm);">
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">RSI (14)</span>
          <div style="display:flex;align-items:center;gap:var(--space-2);">
            <div class="progress-bar" style="width:60px;">
              <div class="progress-fill ${latestRSI > 70 ? 'loss' : latestRSI < 30 ? 'profit' : ''}" style="width:${latestRSI}%;"></div>
            </div>
            <span class="mono ${latestRSI > 70 ? 'text-loss' : latestRSI < 30 ? 'text-profit' : ''}" style="font-size:var(--text-sm);font-weight:var(--font-bold);min-width:35px;text-align:right;">
              ${latestRSI.toFixed(1)}
            </span>
          </div>
        </div>

        <!-- MACD -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-2);background:var(--bg-tertiary);border-radius:var(--radius-sm);">
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">MACD</span>
          <span class="mono ${macdVal >= 0 ? 'text-profit' : 'text-loss'}" style="font-size:var(--text-sm);font-weight:var(--font-bold);">
            ${macdVal >= 0 ? '+' : ''}${macdVal.toFixed(5)}
          </span>
        </div>

        <!-- Current Price -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-2);background:var(--bg-tertiary);border-radius:var(--radius-sm);">
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">Price</span>
          <span class="mono" style="font-size:var(--text-sm);font-weight:var(--font-bold);">
            ${closes[closes.length - 1].toFixed(pair.includes('JPY') ? 3 : 5)}
          </span>
        </div>
      </div>
    `;

    // Reasons
    if (signal.reasons.length > 0) {
      reasonsSection.innerHTML = `
        <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:var(--space-1);">Analysis Signals:</div>
        ${signal.reasons.map(r => `
          <div style="font-size:var(--text-xs);color:var(--text-secondary);padding:2px 0;display:flex;align-items:center;gap:var(--space-1);">
            <span style="color:${r.includes('bullish') || r.includes('oversold') || r.includes('positive') ? 'var(--color-profit)' : r.includes('bearish') || r.includes('overbought') || r.includes('negative') ? 'var(--color-loss)' : 'var(--text-tertiary)'};">●</span>
            ${r}
          </div>
        `).join('')}
      `;
    }

    // Suggested Levels (Entry, SL, TP) - Definitive Buy/Sell Info
    const quotes = store.get('quotes') || {};
    const detailedSignal = calculateDetailedSignal(pair, candles, quotes[pair]);
    if (detailedSignal && levelsSection) {
      levelsSection.innerHTML = `
        <div style="margin-top:var(--space-4);padding:var(--space-3);background:var(--bg-tertiary);border-radius:var(--radius-md);border:1px solid var(--border-primary);">
          <div style="font-size:var(--text-xs);font-weight:var(--font-bold);color:var(--text-tertiary);margin-bottom:var(--space-2);text-transform:uppercase;letter-spacing:0.05em;">Suggested Levels</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-2);text-align:center;">
            <div>
              <div style="font-size:var(--text-xxs);color:var(--text-tertiary);">Entry</div>
              <div class="mono" style="font-size:var(--text-sm);font-weight:var(--font-bold);color:var(--text-primary);">${detailedSignal.entryPrice}</div>
            </div>
            <div>
              <div style="font-size:var(--text-xxs);color:var(--text-tertiary);">Stop Loss</div>
              <div class="mono" style="font-size:var(--text-sm);font-weight:var(--font-bold);color:var(--color-loss);">${detailedSignal.stopLoss}</div>
            </div>
            <div>
              <div style="font-size:var(--text-xxs);color:var(--text-tertiary);">Take Profit</div>
              <div class="mono" style="font-size:var(--text-sm);font-weight:var(--font-bold);color:var(--color-profit);">${detailedSignal.takeProfit}</div>
            </div>
          </div>
          <div style="margin-top:var(--space-2);text-align:center;font-size:var(--text-xxs);color:var(--text-tertiary);">
            Risk/Reward: <span class="mono" style="color:${parseFloat(detailedSignal.riskReward) >= 1.5 ? 'var(--color-profit)' : 'var(--color-loss)'}">${detailedSignal.riskReward}</span>
          </div>
        </div>
      `;
    }

    // Data Source Disclaimer
    if (disclaimerSection) {
      const isMock = candles.some(c => c._isMock);
      const hasKey = store.get('settings.apiKey');
      disclaimerSection.innerHTML = isMock 
        ? `<span style="font-size:var(--text-xxs);color:var(--color-warning);opacity:0.8;">⚠️ Using Simulated Demo Data ${hasKey ? '(API Error)' : '(No API Key)'}</span>`
        : `<span style="font-size:var(--text-xxs);color:var(--color-profit);opacity:0.8;">🛡️ Live Market Data (Twelve Data)</span>`;
    }
  } catch (err) {
    signalSection.innerHTML = `<div style="text-align:center;color:var(--color-loss);font-size:var(--text-sm);">Analysis failed</div>`;
  }
}
