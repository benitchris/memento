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
3. Apply the database schema and stored procedures in order:
   - `supabase/migrations/001_initial_schema.sql` — schema, RLS and booking functions.
   - `supabase/migrations/002_onboarding_column.sql` — adds `profiles.onboarding_complete`.
   - `supabase/migrations/003_profile_role_guard.sql` — blocks self-promotion to admin.
   - `supabase/migrations/004_property_photo_storage.sql` — creates the `property-images`
     storage bucket and owner-only upload policies used by the host photo workflow.
   - `supabase/migrations/005_listing_publications.sql` — shares administrator review
     decisions for the bundled showcase listings across every account and device.
   - `supabase/migrations/006_booking_ledger.sql` — creates `booking_ledger`, the shared
     investor ledger that records platform bookings, WhatsApp requests and phone enquiries
     across every device.
4. Seed authentic Rwandan destinations and amenities:
   - Run `supabase/seed.sql` in the **Supabase SQL Editor**.
5. Grant the first administrator manually in the SQL Editor:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'you@example.com';
   ```

---

## 5. Authentication, Onboarding & Roles

Memento uses one account for travelling and hosting.

- **Sign-in:** Google, Apple and email/password through Supabase Auth. OAuth returns to
  `/auth/callback`, which creates the profile when needed and preserves the intended
  destination with a validated `next` parameter.
- **New users:** after their first sign-in they choose a display name and primary role
  (Traveller or Host). This is stored on `profiles` and the modal never appears again.
- **Hosts:** submitting a listing upgrades the account to the Host role, which unlocks the
  Host Dashboard. Travellers can still book and keep favourites.
- **Administrators:** the Admin Portal is checked server-side on every request against
  `profiles.role`. It is never unlocked by a client-side toggle, and migration 003 prevents
  users from promoting themselves to admin.
- **Protected pages:** `/dashboard`, `/host` and `/become-a-host` require a session when
  Supabase is configured and return visitors to the page they originally requested.

There are no demo persona shortcuts in production. In local preview without Supabase
credentials, the interface falls back to the bundled demonstration data.

### Shared marketplace data

Listings submitted through **Become a Host** are written to Supabase (`properties`, `units`
and `property_images`) with the status `under_review`. Travellers on any device see a
listing as soon as an administrator approves it; open pages refresh when the tab regains
focus and at most once a minute.

The `[DEMO]` showcase stays bundled with the app. Its review decisions, including the
pending Huye homestay, are published through `listing_publications` (migration 005) so an
approval made in the admin portal is visible to travellers too.

### Booking ledger and availability calendars

Every reservation is also written to `booking_ledger` (migration 006) from the moment it is
requested, giving administrators an investor-ready record of activity from day one.

- **Platform bookings** (`channel = platform`) record the guest, unit, stay dates, guest
  count, gross value and Memento service fee.
- **WhatsApp and phone requests** from a property page are logged as `inquiry` rows with
  `channel = whatsapp` or `call`, the host's number and the quoted direct stay value
  (platform fee excluded). The reference is generated per channel — `MMT-WA-…`,
  `MMT-CALL-…` — so enquiries are easy to trace.
- **Statuses:** `inquiry → pending → confirmed → completed` (plus `rejected`/`cancelled`).
  Hosts confirm or decline from the Host Dashboard → Availability & Calendar tab, and the
  decision is mirrored to every device.
- **Admin portal → Booking Ledger** shows confirmed GMV, booked-night commission, booked
  nights and direct-enquiry conversion, with search, status/channel filters, CSV export and
  a month calendar of booked dates.
- **Host Dashboard → Availability & Calendar** shows the same calendar scoped to the host's
  listings, plus the upcoming request cards and guest contact shortcuts.
- Confirmed direct enquiries block availability exactly like platform bookings, so hosts
  cannot be double-booked.

Until migration 006 is applied in the Supabase SQL Editor, ledger rows fall back to the
local store and the dashboards show a setup hint; no data is lost on the current device.

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
│   ├── navbar.tsx              # Auth-aware navigation, notifications & profile menu
│   ├── auth-guard.tsx          # Session guard for account-only routes
│   ├── footer.tsx              # Footer with Rwanda regions & legal notices
│   ├── logo.tsx                # Original Memento brand emblem & typography
│   ├── property-card.tsx       # Listing card with multi-unit badges & favourites
│   ├── unit-selector.tsx       # Universal bookable unit selector with hierarchy warning
│   ├── booking-widget.tsx      # Real-time pricing, availability & WhatsApp/call requests
│   ├── booking-ledger-view.tsx # Admin investor ledger with filters, CSV & calendar
│   ├── stay-calendar.tsx       # Month occupancy calendar for booked dates
│   ├── host-calendar-panel.tsx # Host availability calendar & request actions
│   ├── category-bar.tsx        # Scrollable categories with icons
│   └── search-widget.tsx       # Hero search bar with Rwandan autocomplete
├── lib/
│   ├── types/                  # Complete TypeScript data model interfaces
│   ├── utils/format.ts         # RWF & USD currency, dates, booking references
│   ├── data/mock-data.ts       # Realistic demonstration data for Rwanda
│   ├── data/mock-store.ts      # Reactive client store with overlap checking
│   ├── data/booking-ledger.ts  # Shared ledger persistence & enquiry recording
│   └── supabase/               # Supabase browser & SSR server clients
├── supabase/
│   ├── migrations/001_initial_schema.sql # Complete PostgreSQL schema, RLS & functions
│   ├── migrations/002_onboarding_column.sql # First-run onboarding flag
│   ├── migrations/003_profile_role_guard.sql # Prevents self-promotion to admin
│   ├── migrations/004_property_photo_storage.sql # Property photo bucket & policies
│   ├── migrations/005_listing_publications.sql # Shared decisions for showcase listings
│   ├── migrations/006_booking_ledger.sql # Shared booking & enquiry ledger
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

