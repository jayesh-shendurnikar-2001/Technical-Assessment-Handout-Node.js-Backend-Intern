# Architecture & Design Decisions

This document outlines the engineering rationale behind the structural and architectural choices made for the Adaptive E-Commerce Cart Engine.

## 1. Directory Structure (Separation of Concerns)

The application follows a strict layered architecture:
`Routes` -> `Middlewares` -> `Controllers` -> `Services` -> `Models`

**Rationale:**
- **Controllers** are kept intentionally "skinny." They only handle HTTP concerns (extracting params/body, calling services, formatting responses, catching errors).
- **Services** house the core business logic (e.g., `cartService.js`, `pricingEngine.js`). This makes the business logic highly testable without mocking HTTP request/response objects, and allows it to be called from other sources (e.g., a background job or CLI tool).
- **Validators** are separated from controllers. We use a Joi middleware factory (`validate.js`) to intercept bad data before it ever reaches the controller, ensuring controllers only deal with sanitized, safe data.

## 2. Database Schema Modeling

### Embedded vs. Referenced Cart Items
The `Cart` schema uses an array of embedded subdocuments for `items`, rather than a separate `CartItem` collection with `ObjectId` references.

**Why?**
1. **Atomic Updates:** MongoDB guarantees atomicity at the document level. By embedding items, we can use operators like `$push` and `$set` to update the cart in a single atomic database operation.
2. **Read Performance:** Fetching a cart requires exactly 1 query. No `$lookup` (joins) are needed.
3. **Data Lifecycle:** Cart items have no meaning outside the context of their parent cart. When a cart expires, its items should expire too. Embedding makes this automatic.
4. **Size Limits:** A MongoDB document has a 16MB limit. A single cart item subdocument is ~200 bytes. A user would need to add ~80,000 unique items to their cart to hit this limit, which is practically impossible in e-commerce.

### Decimal Mathematics & Prices
In a real-world financial system, floating-point math issues (e.g., `0.1 + 0.2 = 0.30000000000000004`) can cause checkout mismatches.
- **Design Choice:** In this system, we rely on Joi's `.precision(2)` to sanitize incoming floats, and we cap calculations in the `PricingEngine`.
- **Trade-off:** For a true enterprise system, I would store all prices in the smallest currency unit (e.g., *paise* or *cents* as Integers) and only convert to decimals at the presentation layer. For the scope of this assignment, I utilized standard JS Numbers but added validation constraints.

## 3. Validation Strategy

Validation happens at two levels (Defense in Depth):

1. **Application Layer (Joi):**
   - Intercepts requests early.
   - Provides clean, human-readable error arrays detailing exactly which fields failed and why.
   - Strips unknown fields from the payload (`stripUnknown: true`) to prevent NoSQL injection or mass-assignment attacks.

2. **Database Layer (Mongoose):**
   - Acts as the final source of truth.
   - Enforces unique constraints (e.g., unique email, unique active cart per user).
   - Prevents bad data from entering the database even if it bypasses the application layer (e.g., via a manual script).

## 4. Handling Ambiguity: Promotions

The prompt requested a tiered promotional system scaling on cart value or diversity.

**Ambiguity 1: Do campaigns stack?**
*Assumption:* Yes, but with restrictions to protect margins. A user shouldn't get 50% off by combining 5 campaigns.
*Implementation:* The system stacks the best value-based tier with the best diversity-based tier, but applies a hard **30% max discount cap**.

**Ambiguity 2: What happens if an item's price changes after it's in the cart?**
*Assumption:* E-commerce carts are usually "snapshots". But to protect the business, the ingestion endpoint updates the item's price and details if an identical `productId` is added again. In a full system, the `PricingEngine` would do a real-time lookup against a Product microservice.

## 5. Architectural Trade-offs

1. **No External Product Validation:**
   The `POST /cart/items` endpoint accepts arbitrary `price` and `name` strings from the client.
   *Trade-off:* In a real microservice ecosystem, the Cart service should only accept `productId` and `quantity`, and query a Product Service/Database to determine the authoritative price. I allowed the client to dictate the price here to keep the assignment self-contained without mocking a massive product catalog.

2. **No Authentication/JWTs:**
   *Trade-off:* Relies entirely on the client passing a valid `userId` in the URL. This assumes the service sits behind an API Gateway that handles auth and injects the `userId` into the request, which is standard for internal microservices.

3. **Soft Deletes vs TTL:**
   The prompt suggested soft deletes as an option.
   *Trade-off:* For Carts, I chose TTL expiration over soft deletes. Abandoned carts represent massive data bloat. Hard-deleting them automatically via MongoDB TTL saves space and compute, whereas soft deletes require cron jobs and manual purges. (Users, on the other hand, should always be soft-deleted).
