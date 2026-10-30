# Memento — Rwanda's Universal Accommodation Booking Marketplace

Memento is a modern, production-grade universal accommodation marketplace designed for Rwanda. From a private spare bedroom in Kigali to a 100-room volcano hotel in Musanze or a beachfront lodge on Lake Kivu, Memento provides a single, unified booking platform.

---

## 1. Technology Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React
- **Backend & Database:** Supabase, PostgreSQL, Row-Level Security (RLS), Stored Procedures & Transactions
- **Session Management:** Supabase SSR with secure cookie sessions
- **Deployment:** GitHub → Vercel → Supabase

---

## 2. Universal Property Architecture (Section 4)

Memento does **not** create separate silos for hotels, apartments, and spare rooms. It implements the unified hierarchy:

```
PROPERTY  ───►  BOOKABLE UNITS  ───►  AVAILABILITY ENGINE  ───►  BOOKINGS
```

### Hierarchy Overlap Guarantee (Database-Level)
- When an **Entire Property** is reserved, all individual rooms within that property are atomically blocked.
- When any **Individual Room** is reserved, the entire-property option becomes unavailable for those dates.
- Implemented atomically in PostgreSQL via `fn_check_unit_availability` and transactional `fn_create_booking`.

### Examples Included in Demo Data:
- **Example A (Individual Host):** `Hillview Villa & Suites Nyarutarama` (Kigali)
  - Unit 1: Private Bedroom — Jacaranda Room (Shared bath, 30,000 RWF/night)
  - Unit 2: Private Suite — Volcano Suite (Ensuite bath, 50,000 RWF/night)
  - Unit 3: Entire 4-Bedroom Nyarutarama Villa (`is_entire_property: true`, 175,000 RWF/night)
- **Example B (Hotel):** `Virunga Foothills Hotel & Suites` (Musanze)
  - Unit 1: Standard Mountain Room (80,000 RWF/night, inventory: 8 rooms)
  - Unit 2: Deluxe Volcano View Suite (120,000 RWF/night, inventory: 5 rooms)
  - Unit 3: Family Chalet Suite (195,000 RWF/night, inventory: 3 suites)
- **Example C (Lakeside Lodge):** `Lake Kivu Waterside Cottages & Resort` (Rubavu)
  - Unit 1: Standard Beach Cottage (75,000 RWF/night, inventory: 4 cottages)
  - Unit 2: Family Waterfront Bungalow (140,000 RWF/night, inventory: 2 bungalows)

---

## 3. Quick Start & Local Development

### Prerequisites
- Node.js 18+ (tested with Node 22)
- npm

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd memento

# Install dependencies (already installed)
npm install

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Supabase Setup & Migrations

When connecting your Supabase project:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Populate `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase Dashboard.
3. Apply the database schema and stored procedures:
   - Run the contents of `supabase/migrations/001_initial_schema.sql` in the **Supabase SQL Editor**.
4. Seed authentic Rwandan destinations and amenities:
   - Run `supabase/seed.sql` in the **Supabase SQL Editor**.

---

## 5. Instant Persona Switcher (For Testing & Review)

Memento includes an instant persona switcher pill in the navigation bar:
- **Traveller Persona (`David Karemera`):** Search, compare, select bookable units, submit bookings, view booking vouchers, and submit verified reviews.
- **Host Persona (`Jean-Paul Mugabo`):** Host dashboard, approve or decline incoming booking requests, manage properties and units, review earnings.
- **Admin Persona (`Diane Uwimana`):** Marketplace control center, approve/reject pending host listings, feature or suspend accommodations, configure platform commission rates (default 8%).

---

## 6. Project Directory Structure

```
├── app/
│   ├── layout.tsx              # Root layout with MementoProvider, Navbar & Footer
│   ├── page.tsx                # Beautiful homepage with Hero, Categories & Discovery
│   ├── search/                 # Search & filters with Rwandan autocomplete
│   ├── properties/[id]/        # Property detail & universal bookable unit selector
│   ├── bookings/[id]/          # Printable booking confirmation voucher & reference
│   ├── become-a-host/          # Multi-step host registration & unit creator wizard
│   ├── host/                   # Dedicated host operations dashboard
│   ├── dashboard/              # Traveller dashboard & eligible guest review modal
│   ├── admin/                  # Regulatory marketplace admin portal
│   ├── auth/                   # Login & registration interfaces
│   ├── destinations/           # Rwandan destination guide
│   ├── how-it-works/           # Explanation of the universal booking engine
│   ├── sitemap.ts              # Dynamic SEO sitemap
│   └── robots.ts               # Search engine crawler policies
├── components/
│   ├── navbar.tsx              # Navigation bar with role switcher & notifications
│   ├── footer.tsx              # Footer with Rwanda regions & legal notices
│   ├── logo.tsx                # Original Memento brand emblem & typography
│   ├── property-card.tsx       # Listing card with multi-unit badges & favourites
│   ├── unit-selector.tsx       # Universal bookable unit selector with hierarchy warning
│   ├── booking-widget.tsx      # Real-time pricing & availability reservation widget
│   ├── category-bar.tsx        # Scrollable categories with icons
│   └── search-widget.tsx       # Hero search bar with Rwandan autocomplete
├── lib/
│   ├── types/                  # Complete TypeScript data model interfaces
│   ├── utils/format.ts         # RWF & USD currency, dates, booking references
│   ├── data/mock-data.ts       # Realistic demonstration data for Rwanda
│   ├── data/mock-store.ts      # Reactive client store with overlap checking
│   └── supabase/               # Supabase browser & SSR server clients
├── supabase/
│   ├── migrations/001_initial_schema.sql # Complete PostgreSQL schema, RLS & functions
│   └── seed.sql                # Rwandan destinations & amenities seed
└── public/
    └── images/                 # High-resolution accommodation photography
```

---

## 7. Build & Production Verification

Verify the application builds cleanly for production:
```bash
npm run typecheck
npm run build
```
Both commands pass with 0 errors and 0 warnings.
