# Trading & Risk Management Guide

This guide explains how to use the execution engine and risk management tools within ForexPulse.

## 1. Taking a Live Trade

To open a position:

1. Navigate to the **Trade** page or use the Trade Form on the **Dashboard**.
2. Select your **Currency Pair** (e.g., EUR/USD).
3. Choose **Market** execution.
4. Click **Buy** or **Sell**.

### Market Execution vs. Pending Orders

- **Market**: Executes immediately at the current "Best Available" price.
- **Limit**: Executes only when the price reaches a _better_ level than current (buy lower, sell higher).
- **Stop**: Executes only when the price breaks through a _specific_ level (buy higher, sell lower).

## 2. Using the Precision Risk Calculator

The Risk Calculator is the most important tool in the terminal.

1. In the Trade Form, toggle **"Use Risk %"**.
2. Enter your desired **Risk Amount** (e.g., 1.0% of your account).
3. Set your **Stop Loss (SL)** in pips.
4. The system will **automatically calculate the Lot Size** required.

_Why this matters:_ It ensures you never lose more than your defined threshold, regardless of how many pips the market moves against you.

## 3. Managing Open Positions

All active trades can be found on the **Positions** page.

- **Unrealized P&L**: Shows your floating profit or loss in real-time.
- **Closing**: Click the "Close" button to exit a trade at the current market price.
- **Modifying**: You can update your SL and TP targets for open positions to lock in profits or mitigate risk.

## 4. Pending Order Monitoring

The **Pending Orders** section allows you to track orders that haven't been filled yet.

- The system checks these orders on every price tick.
- Once the market hits your target price, the order is automatically converted into an open position.
- You can cancel any pending order before it is filled without any penalty.
