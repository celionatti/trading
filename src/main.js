/* ============================================
   FOREX PULSE — Main Entry Point
   ============================================ */

// Styles
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';

// Components
import { renderSidebar } from './components/Sidebar.js';
import { renderHeader } from './components/Header.js';

// Pages
import { renderDashboard } from './pages/Dashboard.js';
import { renderTradePage } from './pages/TradePage.js';
import { renderPositionsPage } from './pages/PositionsPage.js';
import { renderAnalyticsPage } from './pages/AnalyticsPage.js';
import { renderSettingsPage } from './pages/SettingsPage.js';

// Services
import store from './services/store.js';
import { startPriceUpdates, onPriceUpdate } from './services/api.js';
import { updatePositionPrices } from './services/tradeEngine.js';

// === Page Router ===
const PAGES = {
  dashboard: renderDashboard,
  trade: renderTradePage,
  positions: renderPositionsPage,
  analytics: renderAnalyticsPage,
  settings: renderSettingsPage,
};

let currentCleanup = null;

function navigateTo(page) {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // Cleanup previous page
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  // Clear and render new page
  mainContent.innerHTML = '';
  const pageRenderer = PAGES[page] || PAGES.dashboard;
  pageRenderer(mainContent);

  // Animate in
  mainContent.style.animation = 'none';
  mainContent.offsetHeight; // trigger reflow
  mainContent.style.animation = 'fadeIn 200ms ease-out';
}

// === Initialize App ===
function init() {
  // Apply saved theme
  const theme = store.get('settings.theme');
  document.documentElement.setAttribute('data-theme', theme);

  // Render shell components
  const sidebar = document.getElementById('sidebar');
  const header = document.getElementById('header');

  renderSidebar(sidebar);
  renderHeader(header);

  // Navigate to saved page
  const currentPage = store.get('ui.currentPage') || 'dashboard';
  navigateTo(currentPage);

  // Listen for page changes
  store.subscribe('ui.currentPage', (page) => {
    navigateTo(page);
  });

  // Start live price updates
  const watchlist = store.get('watchlist') || [];
  startPriceUpdates(watchlist, 4000);

  // Update positions when prices change
  onPriceUpdate((quotes) => {
    store.set('quotes', quotes);
    updatePositionPrices(quotes);
  });

  console.log('%c📈 ForexPulse v1.0', 'color: #3b82f6; font-size: 20px; font-weight: bold;');
  console.log('%cLive Forex Trading Terminal', 'color: #94a3b8; font-size: 12px;');
}

// Boot
document.addEventListener('DOMContentLoaded', init);
