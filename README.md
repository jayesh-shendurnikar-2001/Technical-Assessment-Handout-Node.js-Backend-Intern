# Adaptive E-Commerce Cart Engine

A production-ready Shopping Cart Engine microservice built with Node.js, Express, and MongoDB. This service handles multi-tenant cart isolation, dynamic promotional pricing, and hardened input validation.

## Features
- **Multi-Tenant Session Isolation**: Carts are scoped per user via RESTful API design.
- **Embedded Document Architecture**: Fast, atomic cart item modifications using MongoDB embedded arrays.
- **Tiered Promotional Engine**: Dynamic discounts based on cart value and cart category diversity.
- **Defensive Input Validation**: Strict Joi-based payload validation at the application layer.
- **Feature X - Hardened Production Stability**:
  - **Auto-Expiring Carts (TTL)**: Carts automatically expire after 7 days of inactivity using MongoDB TTL indexes to prevent unbounded database bloat.
  - **Rate Limiting**: Two-tiered rate limiting (general and write-heavy) to protect against abuse and cart-bombing.

## Tech Stack
- Node.js & Express.js
- MongoDB & Mongoose
- Joi (Validation)
- Winston & Morgan (Logging)
- express-rate-limit & Helmet (Security)

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or Atlas cluster)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to add your MongoDB connection string (e.g., `MONGODB_URI=mongodb://localhost:27017/cart-engine`).*

### Running the Service
- **Development Mode** (auto-restarts on changes):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```
The server will start on `http://localhost:3000`.

---

## 🏗 Schema Layouts

### 1. User
Represents a tenant.
- `_id`: ObjectId
- `name`: String
- `email`: String (Unique)

### 2. Cart (One active per User)
- `userId`: ObjectId (Ref: User)
- `items`: Array of embedded subdocuments
  - `productId`: String
  - `name`: String
  - `price`: Number
  - `quantity`: Number
  - `category`: String
- `status`: String (`active`, `checked_out`, `expired`)
- `expiresAt`: Date (TTL index)

### 3. Campaign
Represents active promotions.
- `name`: String
- `type`: String (`value_based` or `diversity_based`)
- `tiers`: Array of threshold/reward rules
- `isActive`: Boolean
- `validFrom` / `validTo`: Dates

*(See `DESIGN.md` for deep dive into architectural choices and schema rationale).*

---

## 🔐 Session Strategy & Tenant Isolation

This service avoids session cookies and JWTs intentionally, as authentication is typically handled by an API Gateway or separate Auth microservice.

**Strategy:**
- Isolation is achieved via **URL-scoped routing**: `/api/users/:userId/cart`
- Every cart operation explicitly requires a valid `userId`.
- The controller validates that the `userId` actually exists in the `User` collection before proceeding.
- The `Cart` schema enforces a compound unique index on `{ userId: 1, status: 1 }` (where status is 'active'), guaranteeing **only one active cart per user** at any time.

---

## 💰 Promotion Formulas & Stacking

The pricing engine (`PricingEngine` service) evaluates discounts dynamically at checkout time.

### Tiers
1. **Value-Based**: Triggered by the cart's `subtotal`. (e.g., spend ₹10,000 get 15% off).
2. **Diversity-Based**: Triggered by the number of unique `categories` in the cart. (e.g., buy from 5 different categories get an extra 5% off).

### The Math (Stacking & Caps)
1. The engine evaluates all active campaigns.
2. It finds the *highest qualifying tier* for value-based campaigns, and the *highest qualifying tier* for diversity-based campaigns.
3. It **stacks** them together (additive discount).
4. **Margin Protection (The Cap):** The total combined discount is hard-capped at **30%** of the cart subtotal. If the calculated discount exceeds this, it is proportionally scaled down to exactly 30%.

---

## 🌟 Feature X: Production-Ready Additions

To make this service truly production-ready, I added two critical infrastructure features:

### 1. Cart Expiration (MongoDB TTL)
**What:** Carts get an `expiresAt` field set to 7 days in the future. A MongoDB TTL index automatically deletes carts when the clock passes this date. Any modification to the cart resets the 7-day timer (Sliding Window).
**Why:** In e-commerce, millions of anonymous carts are created and abandoned. Without a cleanup mechanism, the database will suffer from unbounded growth, degrading performance and increasing costs. Doing this via MongoDB TTL offloads the work to the DB engine with zero application-level cron jobs.

### 2. Two-Tier Rate Limiting
**What:** Implemented `express-rate-limit`.
- General: 100 requests / 15 minutes.
- Write-Heavy (Cart Mutations): 30 requests / 15 minutes.
**Why:** Cart-bombing (botnets adding thousands of items to carts to lock up inventory or spike DB writes) is a massive issue in e-commerce. Limiting write operations at the IP/gateway level protects the MongoDB instance from connection starvation and write locks.

---

## 🛣 API Routes Specification

### Users
- `POST /api/users` - Create a user
- `GET /api/users/:userId` - Get user details

### Cart
- `GET /api/users/:userId/cart` - View active cart
- `DELETE /api/users/:userId/cart` - Clear entire cart
- `POST /api/users/:userId/cart/items` - Add/increment item
- `PUT /api/users/:userId/cart/items/:productId` - Update item quantity/details
- `DELETE /api/users/:userId/cart/items/:productId` - Remove specific item

### Checkout
- `GET /api/users/:userId/checkout` - Get calculated checkout summary with applied promotions

### Campaigns
- `POST /api/campaigns` - Create a new promotion campaign
- `GET /api/campaigns` - List all campaigns
