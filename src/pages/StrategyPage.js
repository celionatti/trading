/* ============================================
   FOREX PULSE — Strategy & Decision Support
   ============================================ */

export function renderStrategyPage(container) {
  container.innerHTML = `
    <div class="page-container" style="max-width:900px;margin:0 auto;">
      <div class="page-header">
        <h1 class="page-title">Decision Support & Strategy</h1>
        <p class="text-tertiary">How to use ForexPulse to gain an edge in live trading.</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr;gap:var(--space-6);margin-top:var(--space-6);">
        
        <!-- Section 1: Price Discovery -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">1. Price & Liquidity Verification</span>
          </div>
          <div style="display:flex;gap:var(--space-6);align-items:flex-start;">
            <div style="font-size:2.5rem;">🔍</div>
            <div>
              <p style="margin-bottom:var(--space-3);line-height:var(--leading-relaxed);">
                When trading on retail platforms, brokers often widen spreads or delay prices. Use <strong>ForexPulse Live Data</strong> as your "Source of Truth".
              </p>
              <ul style="padding-left:var(--space-5);display:flex;flex-direction:column;gap:var(--space-2);">
                <li>Compare bid/ask prices to ensure your broker isn't overcharging on spreads.</li>
                <li>Verify fast market movements to detect if a broker is "hunting stops" with artificial spikes.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Section 2: Mathematical Risk Control -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">2. Mathematical Risk Control</span>
          </div>
          <div style="display:flex;gap:var(--space-6);align-items:flex-start;">
            <div style="font-size:2.5rem;">📐</div>
            <div>
              <p style="margin-bottom:var(--space-3);line-height:var(--leading-relaxed);">
                Most traders lose because they guess their position size. Use our <strong>Advanced Risk Calculator</strong> before every trade.
              </p>
              <ul style="padding-left:var(--space-5);display:flex;flex-direction:column;gap:var(--space-2);">
                <li>Calculate exact lot sizes based on 1% or 2% risk.</li>
                <li>Never place a live trade without knowing your exact "Dollar at Risk".</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Section 3: Signal Confirmation -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">3. Signal & Trend Confirmation</span>
          </div>
          <div style="display:flex;gap:var(--space-6);align-items:flex-start;">
            <div style="font-size:2.5rem;">🎯</div>
            <div>
              <p style="margin-bottom:var(--space-3);line-height:var(--leading-relaxed);">
                Use our <strong>Trade Suggestions</strong> to filter out low-probability entries.
              </p>
              <ul style="padding-left:var(--space-5);display:flex;flex-direction:column;gap:var(--space-2);">
                <li>Only take trades on your live platform that align with <strong>Strong Buy/Sell</strong> ratings here.</li>
                <li>Use the Multi-Chart view to see if a trend is consistent across multiple timeframes (M15, H1, H4).</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Section 4: Market Session Timing -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">4. Market Session Timing</span>
          </div>
          <div style="display:flex;gap:var(--space-6);align-items:flex-start;">
            <div style="font-size:2.5rem;">🕒</div>
            <div>
              <p style="margin-bottom:var(--space-3);line-height:var(--leading-relaxed);">
                Trading during low-liquidity gaps (e.g., between NY close and Sydney open) is risky.
              </p>
              <ul style="padding-left:var(--space-5);display:flex;flex-direction:column;gap:var(--space-2);">
                <li>Use the <strong>Market Sessions</strong> tracker to time your entries during "Overlaps" (e.g., London/New York overlap) for maximum volatility.</li>
                <li>Avoid high-impact news events shown in our <strong>Economic Calendar</strong> unless you are a specialized news trader.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}
