# Personal Crypto Position Monitor

Personal cryptocurrency position-monitoring cockpit. Tells you what your crypto positions are worth right now, how they are performing against your entry price, and alerts you when a predefined condition requires your attention.

## Core Features
- **Strict User Selection**: Only the coins you explicitly choose appear on your monitor.
- **Hero Side-by-Side Invariant**: Entry Price ↔ live Current Price side by side with real-time Difference and ROI.
- **Device-Based Identity**: Instant access with zero registration friction (`where: { userId: deviceId }`).
- **Currencies Supported**: EUR (€), USD ($), GBP (£), Nigerian Naira (₦), and Ghanaian Cedis (GH₵).
- **Smart Alerts Engine**: Crossing boundary detection for Profit Targets, Protection Drops, and Break-Even alerts.
- **Headless Server Monitoring**: Automated price evaluation and alert event generation via `/api/monitor`.
- **Installable PWA**: Standalone app experience on mobile with custom application icon.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Initialize the database schema:
```bash
npx prisma db push
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.
