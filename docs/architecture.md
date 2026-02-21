# Technical Architecture

ForexPulse is a modern, reactive single-page application (SPA) built with Vanilla JavaScript and optimized for performance.

## 1. Core Technologies

- **Frontend**: Vanilla JS (ES6+), HTML5, CSS3.
- **Build Tool**: Vite.
- **State Management**: Custom Reactive Store (`store.js`) with an ID-based subscription model.
- **Live Data**: Polling-based API service with simulated live data generation for development.

## 2. Directory Structure

- `/src/components`: Reusable UI components (Header, Sidebar, Chart, etc.).
- `/src/pages`: Page-level components and routing logic.
- `/src/services`: Core logic services (Store, API, Trade Engine, Signal Generator).
- `/src/styles`: Modular CSS files organized by layout and component.

## 3. Data Flow

1. **API Service** fetches data and updates the **Store**.
2. **Components** subscribe to specific keys in the **Store** (e.g., `quotes` or `balance`).
3. When data changes, the **Store** notifies subscribers, triggering localized UI updates.

## 4. Stability & Performance

- **Cleanup Management**: The application uses a global `currentCleanup` orchestration in `main.js`. Every page transition triggers a cleanup of listeners and subscriptions to prevent memory leaks and "ghost" updates.
- **Batching**: Store updates are batched using `requestAnimationFrame` to ensure high-frequency price updates don't cause UI stuttering.

## 5. Extensibility

The terminal is designed to be modular. New indicators can be added to `indicators.js`, and new pages can be integrated by adding them to the router in `main.js`.
