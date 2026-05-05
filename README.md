# AirBNB Host Kit

AirBNB Host Kit is a short-term rental operations dashboard for Airbnb hosts, villa owners, co-hosts, diaspora property owners, and property managers worldwide.

**Track bookings, revenue, expenses, cleaning turnovers, supplies, maintenance, guest follow-ups, owner reports, and tax reserves — in one organized system.**

---

## What's Inside

| Page | Purpose |
|---|---|
| 📊 Host Dashboard | Revenue, profit, occupancy, alerts, and upcoming activity |
| 📅 Booking Calendar | All reservations — Airbnb, direct, WhatsApp, Instagram |
| 👥 Guest CRM | Guest history, follow-ups, and repeat booking tracking |
| 🧹 Cleaning Schedule | Turnovers, cleaner assignment, linen, damage checks |
| 🔧 Maintenance Tracker | Repairs by priority, vendor, cost, and status |
| 📦 Supplies Inventory | Consumables with automatic low-stock alerts |
| 💰 Revenue & Profit | Expenses ledger + net profit breakdown |
| 💬 Direct Leads | WhatsApp, Instagram, referral lead pipeline |
| 📝 Owner Report | Monthly summary for property owners |
| 🧾 Tax Reserve | Tax planning tracker + accountant checklist |
| ✅ SOP Checklists | 9 step-by-step operating procedure checklists |
| 💬 Message Templates | 17 copy-ready guest & owner message templates |
| ⚙️ Settings | Properties, fees, cleaners, vendors |

---

## Quick Start (Local Development)

### Requirements
- Node.js 18 or higher
- npm 9 or higher

### Steps

```bash
# 1. Extract the zip file
unzip airbnb-host-kit.zip
cd airbnb-host-kit

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

---

## Deploy to Vercel (Free — Recommended)

### Option A: Vercel CLI (fastest)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Inside the project folder
npm run build
vercel

# Follow the prompts:
# - Set up a new project? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - What's your project name? jamaica-airbnb-kit
# - In which directory is your code? ./
# - Override build settings? No
```

Your app will be live at `https://your-project-name.vercel.app` in under 60 seconds.

### Option B: Vercel Dashboard (no CLI needed)

1. Go to [vercel.com](https://vercel.com) and sign in (free account)
2. Click **Add New Project**
3. Upload the project folder or connect a GitHub repo
4. Framework: **Vite** (auto-detected)
5. Build command: `npm run build`
6. Output directory: `dist`
7. Click **Deploy**

### Option C: GitHub + Vercel (auto-deploys on every push)

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit — AirBNB Host Kit"
git remote add origin https://github.com/yourusername/airbnb-host-kit.git
git push -u origin main
```

Then connect the GitHub repo in the Vercel dashboard — every push auto-deploys.

---

## Deploy to Netlify (Alternative)

```bash
# Build the project
npm run build

# Drag the dist/ folder into netlify.com/drop
# or use Netlify CLI:
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## Build for Production

```bash
npm run build
```

Output is in the `dist/` folder. Upload this folder to any static hosting provider:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages
- Firebase Hosting

---

## Project Structure

```
airbnb-host-kit/
├── index.html                  # App entry point
├── package.json                # Dependencies
├── vite.config.js              # Vite config
├── vercel.json                 # Vercel SPA rewrite rules
├── README.md                   # This file
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Root component + routing
    ├── styles.css              # All global styles
    ├── data/
    │   └── sampleData.js       # Sample properties, bookings, guests, etc.
    ├── utils/
    │   └── helpers.js          # Utility functions (calculations, formatting)
    ├── context/
    │   └── AppContext.jsx      # Global state + localStorage persistence
    ├── components/
    │   ├── Sidebar.jsx         # Navigation sidebar
    │   ├── TopBar.jsx          # Property + month filters
    │   └── index.jsx           # Shared UI components (Modal, Chip, MetricCard...)
    └── pages/
        ├── Dashboard.jsx
        ├── Bookings.jsx
        ├── GuestsCleaningMaintenance.jsx   # Guests, Cleaning, Maintenance
        ├── SuppliesRevenuLeads.jsx         # Supplies, Revenue, Leads
        └── OwnerReportTaxSOPsMessagesSettings.jsx  # Owner Report, Tax, SOPs, Messages, Settings
```

---

## Key Features

### Dashboard Calculations
- **Gross Revenue** = Sum of all non-cancelled booking totals in selected month
- **Net Profit** = Gross Revenue − Platform Fees − Cleaning − Utilities − Maintenance − Supplies − Management Fee − Tax Reserve − Other
- **Occupancy Rate** = Booked nights ÷ (Days in month × active properties)
- **Avg Nightly Rate** = Room revenue ÷ booked nights (excludes cleaning fee)
- **Tax Reserve** = Gross Revenue × Tax Reserve % (planning only — see disclaimer)

### Low-Stock Alerts
Trigger automatically when `current_quantity ≤ reorder_level`

### Property Health Score
- Starts at 100
- −10 per urgent maintenance issue
- −5 per low-stock item
- −5 per overdue cleaning task

---

## Data Storage

All data is saved to **localStorage** in the browser. No backend, no database, no login required.

> ⚠️ **Important:** localStorage is browser-specific. Data saved in Chrome on one device will not appear on another device or browser. For shared access across devices, a future version with cloud sync would be needed.

To reset to sample data: go to **Settings → Reset All Data**.

---

## Customising for Your Property

1. Go to **⚙️ Settings**
2. Update your property name, parish, bedrooms, and rates
3. Set your currency (JMD, USD, GBP, CAD, EUR)
4. Adjust platform fee %, management fee %, and tax reserve %
5. Add your cleaner names and vendor contacts
6. Go to **📅 Bookings** and add your current reservations
7. Return to **📊 Dashboard** — your numbers update automatically

---

## Tax Planning Disclaimer

> ⚠️ The Tax Reserve Tracker is **for planning and organisation only**. It is **not** legal, accounting, or tax advice. Tax rules may change and obligations vary by host, property, platform, and business structure. Use this for VAT, GCT, sales tax, occupancy tax, or other tax planning categories based on your market, and confirm your requirements with a qualified professional.

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM rendering |
| lucide-react | ^0.383.0 | Icons |
| vite | ^5.4.1 | Build tool |
| @vitejs/plugin-react | ^4.3.1 | React plugin for Vite |

No backend. No database. No API keys. No login system.

---

## Troubleshooting

### `npm install` fails
Make sure Node.js 18+ is installed:
```bash
node --version   # Should be v18 or higher
npm --version    # Should be v9 or higher
```

### Blank page after deploy
Check that `vercel.json` is present — it contains the SPA rewrite rule that sends all routes to `index.html`.

### Data disappeared
localStorage can be cleared by browser settings or private/incognito mode. Always back up important data using the CSV export buttons on each page.

### Fonts not loading
The app uses Google Fonts (Fraunces + Manrope). Make sure the deployed site has internet access. Fonts load from `fonts.googleapis.com`.

---

## Support

This is a digital product. For setup help, open `00_READ_ME_FIRST.md` or refer to the `07_BEGINNER_ONBOARDING_AND_SAMPLE_DATA.md` guide included in the build pack.

---

## Licence

This product is for the buyer's personal or business use only. Resale or redistribution of the source code is not permitted without the creator's written permission.

---

*Built for Airbnb hosts, villa owners, co-hosts, diaspora property owners, and property managers worldwide.*  
*Run your rental operations like a real business.*

## SaaS Launch Readiness Notes

### Test account pattern
Create approved users in Supabase Auth using these emails (no hardcoded frontend credentials):
- admin@test.hostkit.local
- host@test.hostkit.local
- manager@test.hostkit.local
- owner@test.hostkit.local
- cleaner@test.hostkit.local
- maintenance@test.hostkit.local

After signup, use Admin User Approvals to set each role and approve status.

### Email approval environment variables
The approval flow works without email, but to send approval emails configure:
- `RESEND_API_KEY` (or provider API key used by your edge function)
- `APPROVAL_FROM_EMAIL`
- `APPROVAL_REPLY_TO_EMAIL` (optional)
- `APP_BASE_URL` (optional, for deep links)

If these are not configured, user approval still succeeds and should show a non-blocking warning.

### Demo seed data
A test-only seed starter is provided at:
- `supabase/seed/launch_readiness_demo.sql`

Run it only in non-production projects. It creates core demo properties keyed to `@test.hostkit.local` users.
