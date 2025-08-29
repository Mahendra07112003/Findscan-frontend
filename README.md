FindScan – Bollinger Bands (KLineCharts)

Goal: Production-ready Bollinger Bands indicator using KLineCharts only, with TradingView-like Inputs/Style settings.

Getting Started

1) Install deps

```bash
npm install
```

2) Run dev server

```bash
npm run dev
```

Open http://localhost:3000. Use “Add Indicator/Remove Indicator” and “Settings” to interact.

Tech

- Next.js 15 + React 19 + TypeScript + Tailwind v4
- KLineCharts version: `^` latest installed (see package.json)

Data

- Demo OHLCV at `public/data/ohlcv.json` (app auto-extends to 200+ candles if short)

Indicator Formulas

- Basis (middle): SMA(close, length)
- StdDev: population standard deviation of last `length` closes
- Upper: Basis + (StdDev multiplier × StdDev)
- Lower: Basis − (StdDev multiplier × StdDev)
- Offset: basis/upper/lower shifted by `offset` bars (positive shifts forward)

UI/UX

- Settings modal with Inputs and Style tabs
- Style supports visibility/color/width/style per line and background fill opacity
- Crosshair tooltip shows Basis/Upper/Lower for hovered candle

Structure

- `components/Chart.tsx`: initializes KLineCharts, registers custom indicator, draws lines & fill
- `components/BollingerSettings.tsx`: settings UI
- `lib/indicators/bollinger.ts`: pure math to compute bands
- `lib/types.ts`: shared types and defaults

Screenshots/GIF

- Add two screenshots or a short GIF here capturing the chart with settings open (placeholder).

Notes

- Only KLineCharts is used for charting. SMA supported for the basis as required.
