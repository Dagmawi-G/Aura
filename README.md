# Aura Collection — Custom Merchandise & Order Management Platform

**Aura Collection** is a full-stack MERN application built for selling, customizing, and fulfilling personalized merchandise (such as custom mugs and drinkware). It consists of three interconnected modules:

- **`frontend/`** — Customer-facing storefront, interactive product & sticker customizer, cart editor, Ethiopian local payment checkout, and live order tracker.
- **`admin/`** — Store control panel for catalog & sticker inventory management, payment proof verification, Yango delivery dispatch, real-time Web Push order alerts, analytics, and store settings.
- **`backend/`** — Node.js + Express REST API backed by MongoDB, Cloudinary CDN media storage, Multer, and Web Push notifications.

---

## Features in Detail

### Customer Storefront (`frontend/`)

- **Interactive Catalog Carousel & Search**:
  - Real-time search bar across product titles and descriptions.
  - Responsive horizontal carousel displaying **1 item card at a time on mobile** (with a subtle peek of the next card) and **2 item cards on desktop**, with arrow controls and pagination dots.
- **Interactive Product Customization (`CustomizeModal`)**:
  - Live product preview with optional custom text/name lettering and font style selection.
  - **Mix & Fixed Sticker Selector**:
    - **Mix Stickers**: *"Multiple stickers allowed"* — customers can pick multiple stickers.
    - **Fixed Stickers**: *"Single stickers only"* — single selection mode.
    - 2-column vertically scrollable sticker grid with **Sold Out** badges and disabled selection when sticker stock reaches `0`.
    - Persistent **Selected Stickers (`count`)** summary box below the instruction note with quick remove and *Clear All* controls.
- **Cart & Order Item Editing (`Cart` & `CartItemDetails`)**:
  - Clean cart summary showing items, quantities, custom lettering, and delivery/pickup details.
  - Clicking any item in the cart opens its dedicated details/edit page (`/cart/item/:cartItemId`) so customers can review and update text, stickers, or quantity before checkout.
- **Delivery Location & Road Distance Pricing**:
  - Supports **Door Delivery** and **Store Pickup**.
  - Interactive **Leaflet + OpenStreetMap** map pin picker, Addis Ababa neighborhood/landmark search (`geocoding.js`), and GPS extraction.
  - Road-route distance calculation via **OSRM** (with Haversine straight-line fallback) paired with configurable distance-tiered delivery fees.
- **Checkout & Ethiopian Payment Workflows (`PlaceOrder`)**:
  - **Ethiopian Phone Validation**: Primary and optional Backup phone inputs strictly accept **9 digits after `0`, `251`, or `+251`** (e.g., `0911223344`, `251911223344`, `+251911223344`).
  - **Prepayment (ቀብድ) & Balance Breakdown**: Automatically computes per-item prepayment due upfront and remaining balance on delivery/pickup.
  - **Same-Day Urgent Order Option**: Adds the store's configurable urgent surcharge and displays a direct one-tap phone call prompt to notify the store immediately.
  - **Local Payment Methods & Proof Upload**: Displays active bank/mobile money accounts (Telebirr, CBE, Awash, Abyssinia, Dashen, Nib, Coop, Zemen, etc.) and requires uploading a transfer screenshot (`paymentProof`).
- **Live 4-Stage Order Tracker (`TrackOrder`)**:
  - Track orders by Reference ID (`AUR-XXXXXX`) or customer phone number (plus a quick chip for the customer's most recent order).
  - Visual 4-step progress tracker displaying **Ordered** → **Payment Verified** → **Completed** → **Cancelled**, with automatic 8-second live polling so admin updates appear in real time.

---

### Admin Control Panel (`admin/`)

- **Secure Admin Authentication & Session Handling**:
  - Protected dashboard backed by JWT authentication (`adminAuth` middleware) and admin account management endpoints (`/api/user/admin-login`, `/api/user/admin-create`, `/api/user/admin-list`).
- **Catalog & Ordering Management (`List` & `AddItemModal`)**:
  - Responsive horizontal catalog carousel matching the storefront layout.
  - Add, edit, and delete products, attach printable stickers, and reorder display priority (`#1 Trending`, *Move Up/Down*, *Make #1*).
  - **"+ Upload New Sticker"** action inside the item modal redirects straight to the Stickers page upload modal.
- **Global Sticker Library & Inventory (`Stickers`)**:
  - Dedicated **Upload New Sticker Modal** and active library grid filtered by **All**, **Mix**, and **Fixed**.
  - Tracks live stock quantities per sticker (automatically decremented when orders are placed) with one-click quick stock presets (`Set to 0 (OUT)`, `50`, `100`).
- **Order Management & Payment Verification (`Orders` & `OrderDetail`)**:
  - Priority-sorted filter tabs (**All**, **⚡ Urgent Orders**, **Normal Orders**, **Completed Orders**, **Cancelled Orders**) with due-date countdown & overdue indicators.
  - Full-screen payment proof screenshot viewer alongside prepayment/balance comparison.
  - Dedicated **`✅ Mark Payment Verified`** button right under the payment screenshot plus quick status controls for **`Ordered`**, **`Payment Verified`**, **`Completed`**, and **`Cancelled`**.
- **Interactive Delivery Route Map & Yango Dispatch (`DeliveryRouteModal` & `yango.js`)**:
  - Live Leaflet + OSRM driving route map between the Aura Store location and the customer's resolved GPS/address.
  - **"Open in Yango App"** deep-link button that automatically passes the store pickup coordinates (`start-lat`, `start-lon`) and customer destination coordinates (`end-lat`, `end-lon`) directly into Yango (`yango.go.link` smart link + `yango.com/en_int/order/` fallback) ready to request a ride/delivery.
- **Real-Time Web Push Notifications (`NotificationModal` & `sw.js`)**:
  - Subscribes admin phones/browsers via VAPID Web Push API to receive instant push notifications when new orders arrive (sending a dedicated urgent alert without duplicate popups for urgent orders), plus a built-in test push sender.
- **Business Analytics (`Analytics`)**:
  - Timeframe filters (*All Time*, *Today*, *This Week*, *This Month*) with breakdowns for total revenue, prepayments collected, remaining balances, items sold, top products, popular stickers, delivery vs pickup split, payment methods, and the 4-status order pipeline funnel.
- **Store & Payment Settings (`Settings`)**:
  - Interactive Leaflet map for setting store GPS coordinates & address, distance-based delivery pricing tiers (`<5km`, `5–10km`, `10–15km`, `>15km`), urgent fee, prepayment per item, store contact phone, currency, and bank/Telebirr account management.

---

### Backend & Infrastructure (`backend/`)

- **Cloudinary Media Storage (`config/cloudinary.js`)**:
  - Uploads product images, sticker graphics, and payment proof screenshots to Cloudinary CDN (`aura/items`, `aura/stickers`, `aura/receipts`) so uploaded media persists across container restarts and Render redeployments, with automatic cleanup on edit/delete and local `uploads/` fallback if credentials are unset.
- **Keep-Alive Worker (`utils/keepAlive.js`)**:
  - Periodically pings `/api/ping` every 10 minutes in hosted environments (such as Render) to reduce cold-start sleep delays.
- **MongoDB + Mongoose Models**:
  - Structured schemas for items, stickers (with stock tracking), orders, settings, push subscriptions, and users/admins.

---

## Tech Stack

- **Frontend & Admin**: React 18, Vite 5, React Router DOM 6, Axios, Leaflet (OpenStreetMap + OSRM), React Toastify
- **Backend**: Node.js, Express, MongoDB & Mongoose, Multer, Cloudinary, JSON Web Token (`jsonwebtoken`), `bcrypt`, `web-push`, `cors`, `dotenv`

---

## Run Locally

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Customer Frontend
cd ../frontend
npm install

# Admin Panel
cd ../admin
npm install
```

### 2. Configure Environment Variables

Create `backend/.env`:

```env
PORT=4000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SALT=10

# Cloudinary (recommended for persistent image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional Web Push VAPID keys
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@example.com
```

Optionally create `frontend/.env` and `admin/.env` if your backend is not on `http://localhost:4000`:

```env
VITE_BACKEND_URL=http://localhost:4000
```

### 3. Start the Applications

Run each in its own terminal:

```bash
# Terminal 1 — Backend API (port 4000)
cd backend
npm run dev

# Terminal 2 — Customer Storefront
cd frontend
npm run dev

# Terminal 3 — Admin Dashboard
cd admin
npm run dev
```

You can also create an initial admin user using `npm --prefix backend run create-admin` (or sign in with the seeded default admin on first boot).

---

## Key API Endpoints

| Group | Endpoints |
| :--- | :--- |
| **Health** | `GET /api/ping`, `GET /ping`, `GET /health` |
| **Catalog Items** | `GET /api/food/list`, `POST /api/food/add`, `POST /api/food/update`, `POST /api/food/reorder`, `POST /api/food/remove` |
| **Stickers** | `GET /api/sticker/list`, `POST /api/sticker/add`, `POST /api/sticker/update`, `POST /api/sticker/remove` |
| **Orders & Tracking** | `POST /api/order/submit`, `GET /api/order/list`, `POST /api/order/status`, `GET /api/order/track/:query` |
| **Push Notifications** | `GET /api/order/vapid-key`, `POST /api/order/subscribe-push`, `POST /api/order/test-push` |
| **Settings** | `GET /api/setting`, `POST /api/setting/update` |
| **Auth & Admins** | `POST /api/user/admin-login`, `GET /api/user/admin-list`, `POST /api/user/admin-create`, `DELETE /api/user/admin-delete/:id` |

---

## Deployment

- Built for deployment on **Render** (separate Web Service for `backend/` and Static Sites for `frontend/` and `admin/`, using `VITE_BACKEND_URL` and Cloudinary environment variables).
