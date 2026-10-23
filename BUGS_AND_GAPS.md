# Aurion Commerce — Bug & Gap Tracker

> **Purpose:** A single, organized, actionable register of every known **bug**, **missing feature**, and **infrastructure gap** in the Aurion Commerce codebase. Paired with [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) — that file explains *what the project is*; this file explains *what's wrong with it and what's missing*.
>
> **Last updated:** 2026-10-22
> **Companion doc:** [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md)
> **Rule:** when you fix something here, **also update `PROJECT_CONTEXT.md`** (see [§11 Maintenance Workflow](#11-maintenance-workflow)). Never leave the two docs disagreeing.

---

## Table of Contents

1. [How to Use This File](#1-how-to-use-this-file)
2. [Summary Dashboard](#2-summary-dashboard)
3. [Critical Bugs](#3-critical-bugs)
4. [High Severity Bugs](#4-high-severity-bugs)
5. [Medium Severity Bugs](#5-medium-severity-bugs)
6. [Low Severity / Code Smell](#6-low-severity--code-smell)
7. [Missing Features](#7-missing-features)
8. [Infrastructure & Tooling Gaps](#8-infrastructure--tooling-gaps)
9. [Empty Directory & Placeholder Registry](#9-empty-directory--placeholder-registry)
10. [Model ↔ API Mismatch Matrix](#10-model--api-mismatch-matrix)
11. [Maintenance Workflow](#11-maintenance-workflow)
12. [Fix Log](#12-fix-log)

---

## 1. How to Use This File

### ID scheme
| Prefix | Meaning | Section |
|---|---|---|
| `BUG-0xx` | Something is **broken or wrong** | §3–§6 |
| `GAP-0xx` | Something is **not built yet** | §7 |
| `INF-0xx` | **Tooling / infrastructure** is missing | §8 |
| `PLC-0xx` | An **empty directory or placeholder** | §9 |

Never renumber an ID. If an item is abandoned, mark it `Status: ❌ Won't fix` and leave the ID in place so the history stays readable.

### Status values
| Status | Meaning |
|---|---|
| `🔴 Open` | Not started |
| `🟡 In progress` | Someone is on it (note the branch/PR) |
| `🟢 Fixed` | Done — **must** be logged in [§12 Fix Log](#12-fix-log) and reflected in `PROJECT_CONTEXT.md` |
| `🔵 Verified` | Confirmed as a false positive / not an issue — note why |
| `❌ Won't fix` | Deliberately dropped — note why |

### Severity definitions
| Severity | Definition |
|---|---|
| **Critical** | Data loss, money loss, security hole, or the product literally cannot do its core job. Blocks launch. |
| **High** | A primary user-facing flow is degraded or wrong, or a security-adjacent weakness exists. |
| **Medium** | A secondary flow is broken, or a correctness issue with a workaround. |
| **Low** | Code smell, inconsistency, dead code, or a maintainability risk. No user impact today. |

### Legend used in every entry
```
Location      → file paths and line numbers (click-through in most editors)
Impact        → what breaks, and for whom
Root cause    → why it happens
Fix           → what to change (this is the acceptance criteria)
Verify        → how to prove it's fixed
```

---

## 2. Summary Dashboard

| Severity | Open | In progress | Fixed | Total |
|---|---|---|---|---|
| Critical | 1 | 0 | 5 | 6 |
| High | 10 | 1 | 2 | 13 |
| Medium | 14 | 0 | 0 | 14 |
| Low | 6 | 0 | 3 | 9 |
| **Bugs subtotal** | **31** | **1** | **10** | **42** |
| Missing features (GAP) | 85 | 0 | 0 | 85 |
| Infrastructure (INF) | 20 | 0 | 0 | 20 |
| Placeholders (PLC) | 19 | 0 | 0 | 19 |
| **GRAND TOTAL** | **155** | **1** | **10** | **166** |

### ID ranges
| Type | Range | Count |
|---|---|---|
| `BUG-001` … `BUG-006` | Critical | 6 |
| `BUG-007` … `BUG-019` | High | 13 |
| `BUG-020` … `BUG-032` | Medium | 13 |
| `BUG-041` | Medium (added later) | 1 |
| `BUG-033` … `BUG-040` | Low | 8 |
| `BUG-042` | Low (added later) | 1 |
| `GAP-001` … `GAP-032` | API endpoints & services | 32 |
| `GAP-033` … `GAP-051` | Storefront pages & components | 19 |
| `GAP-052` … `GAP-070` | Merchant dashboard | 19 |
| `GAP-071` … `GAP-079` | Platform admin panel | 9 |
| `GAP-080` … `GAP-085` | Cross-cutting product features | 6 |
| `INF-001` … `INF-020` | Infrastructure & tooling | 20 |
| `PLC-001` … `PLC-019` | Empty directories & placeholders | 19 |

### The five that actually matter
If you only do five things, do these:

1. **`BUG-001` — No Stripe webhook.** A customer who pays and closes the tab is never charged-and-recorded correctly. Money leaks. — ✅ **fixed 2026-10-19**
2. **`BUG-002` — `sameSite: 'strict'` refresh cookie breaks cross-domain token refresh.** The merchant dashboard logs users out every 15 minutes in production. — ✅ **fixed 2026-10-22**
3. **`BUG-003` — Order-number generation races.** Two concurrent orders get the same number; one is rejected with a 500 *after the customer paid*. — ✅ **fixed 2026-10-22**
4. **`BUG-004` — Discounts are never applied at checkout.** The feature is 100% built except for the 20 lines that would wire it up. — ✅ **fixed 2026-10-22**
5. **`BUG-005` — Storefront category pages are empty directories.** Customer-facing 404 for `/{store}/categories`.

### Bug index (one line each)
| ID | Title | Sev | Area | Status |
|---|---|---|---|---|
| BUG-001 | No Stripe webhook handler | 🔴 Critical | API / Payments | 🟢 Fixed |
| BUG-002 | `sameSite:'strict'` cookie breaks cross-domain refresh | 🔴 Critical | API / Auth | 🟢 Fixed |
| BUG-003 | Order-number generation races | 🔴 Critical | API / Orders | 🟢 Fixed |
| BUG-004 | Discounts never applied at checkout | 🔴 Critical | API / Payments | 🟢 Fixed |
| BUG-005 | Storefront category pages are empty dirs | 🔴 Critical | Storefront | 🔴 Open |
| BUG-006 | Shipping & tax hardcoded in two files | 🔴 Critical | API / Payments | 🟢 Fixed |
| BUG-007 | Dashboard Overview shows hardcoded zeros | 🟠 High | Dashboard | 🟢 Fixed |
| BUG-008 | `err.keyValue[0]` unguarded in error handler | 🟠 High | API / Core | 🟢 Fixed |
| BUG-009 | `verifyPayment` divides by 100 unconditionally | 🟠 High | API / Payments | 🟢 Fixed |
| BUG-010 | Order prefix hardcoded to `AUR-` | 🟠 High | API / Orders | 🟢 Fixed |
| BUG-011 | `buy_x_get_y` discounts cannot be created | 🟠 High | API / Discounts | 🔴 Open |
| BUG-012 | Discount validator silently strips model fields | 🟠 High | API / Discounts | 🔴 Open |
| BUG-013 | Debug route `/stores/test-middleware` in prod | 🟠 High | API / Core | 🟢 Fixed |
| BUG-014 | Stripe API version pinned to `2024-06-20` | 🟠 High | API / Payments | 🔴 Open |
| BUG-015 | `/analytics` and `/aurion-store` are inline stubs | 🟠 High | Dashboard | 🔴 Open |
| BUG-016 | Second store per user is blocked | 🟠 High | API / Stores | 🔴 Open |
| BUG-017 | `updateMyStore` has no permission check | 🟠 High | API / Stores | 🔴 Open |
| BUG-018 | `generateUniqueSlug` check-then-act race | 🟠 High | API / Utils | 🔴 Open |
| BUG-019 | Refresh token never rotated / not revoked on reset | 🟠 High | API / Auth | 🟡 In progress |
| BUG-020 | Storefront rate limiters stack unintentionally | 🟡 Medium | API / Core | 🟢 Fixed |
| BUG-021 | `populate('activeTheme')` refs a non-existent model | 🟡 Medium | API / Stores | 🟢 Fixed |
| BUG-022 | `updateDiscount` mass-assigns `req.body` | 🟡 Medium | API / Discounts | 🟢 Fixed |
| BUG-023 | `Inventory` model is never used | 🟡 Medium | API / Inventory | 🔴 Open |
| BUG-024 | `InventoryLog.inventory` stores a product id | 🟡 Medium | API / Inventory | 🔴 Open |
| BUG-025 | Subscription `limits` are never enforced | 🟡 Medium | API / Platform | 🔴 Open |
| BUG-026 | Customer JWTs signed with the merchant secret | 🟡 Medium | API / Auth | 🟢 Fixed |
| BUG-027 | Response envelope unwrapped inconsistently | 🟡 Medium | API / Core | 🔴 Open |
| BUG-028 | `optionalTenantMiddleware` swallows all errors | 🟡 Medium | API / Core | 🟢 Fixed |
| BUG-029 | Dashboard never sends `X-Store-Id` | 🟡 Medium | Dashboard | 🔴 Open |
| BUG-030 | `setup`-status stores are publicly reachable | 🟡 Medium | Storefront | 🔴 Open |
| BUG-031 | `/health` does not check the database | 🟡 Medium | API / Core | 🔴 Open |
| BUG-032 | No request IDs, no prod logging | 🟡 Medium | API / Core | 🔴 Open |
| BUG-033 | `next/image` never used — no image optimization | 🔵 Low | Storefront | 🔴 Open |
| BUG-034 | `CORS` allows every `*.vercel.app` origin | 🔵 Low | API / Core | 🔴 Open |
| BUG-035 | `refreshToken` cookie options duplicated in `logout` | 🔵 Low | API / Auth | 🟢 Fixed |
| BUG-036 | `createStore` error message says "on this plan" | 🔵 Low | API / Stores | 🔴 Open |
| BUG-037 | `checkSlugAvailability` reserved list is hardcoded | 🔵 Low | API / Stores | 🔴 Open |
| BUG-038 | `api/src/events`, `jobs`, `templates` are empty | 🔵 Low | API / Core | 🔴 Open |
| BUG-039 | `algoliasearch`, `bull`, `ioredis`, `socket.io` unused deps | 🔵 Low | API / Deps | 🔴 Open |
| BUG-040 | `passwordChangedAt` not checked on refresh | 🔵 Low | API / Auth | 🟢 Fixed |
| BUG-041 | Stock never re-checked when the order is created | 🟡 Medium | API / Inventory | 🟢 Fixed |
| BUG-042 | A malformed URL env var silently breaks the allow-lists | 🔵 Low | API / Core | 🟢 Fixed |

---

## 3. Critical Bugs

### BUG-001 — No Stripe webhook handler
| | |
|---|---|
| **Severity** | 🔴 Critical |
| **Area** | API / Payments |
| **Status** | 🟢 **Fixed** — 2026-10-19 |
| **Location** | `apps/api/src/routes/webhooks/stripe.webhook.routes.js` (new)<br>`apps/api/src/controllers/webhooks/stripe.webhook.controller.js` (new)<br>`apps/api/src/services/checkout.service.js` (new)<br>`apps/api/src/models/checkout/CheckoutSession.model.js` (new)<br>`apps/api/src/controllers/payments/stripe.controller.js` — `createPaymentIntent`<br>`apps/api/src/controllers/storefront/sf.order.controller.js` — `createOrder`<br>`apps/api/src/app.js` — webhook mounted before `express.json()` |

**Impact**
The *only* thing that creates an order is the browser calling `POST /api/v1/storefront/:storeSlug/orders/create` after `stripe.confirmPayment()` succeeds. If the customer:
- closes the tab / loses connection right after paying,
- uses a browser that blocks the follow-up call,
- or pays with an async method (bank transfer, `payment_method_types` deferred),

…then the money is taken and **no order exists**. The merchant never sees the sale. There is no reconciliation path because no webhook ever arrives.

**Root cause**
The order-creation flow was designed around a synchronous client callback. `sf.order.controller.js:57` does re-verify with `stripe.paymentIntents.retrieve()`, which is good, but verification is *pulled*, never *pushed*.

A webhook alone could not have fixed it: Stripe knows the payment, but not the cart. The cart, the customer and the address only ever existed in the customer's browser — `createPaymentIntent` computed a total and threw that data away. So the fix needed **both** halves: keep a server-side copy of the checkout, and let Stripe push the event.

**What was done**
1. **`CheckoutSession` model** (new) — the server-side copy of the cart. Created by `createPaymentIntent` with the server-verified line items, customer, addresses and pricing. `paymentIntentId` is indexed **unique + sparse**, and a TTL index deletes abandoned sessions after 24 hours.
2. **`checkout.service.js`** (new) — the single implementation of "turn a paid checkout into an Order + Payment and deduct stock". Both the browser endpoint and the webhook call it, so the two can never drift.
3. **Webhook route** (new) — `POST /api/v1/webhooks/stripe`, mounted in `app.js` **before** `express.json()` and using `express.raw()`, because Stripe signs the exact bytes it sent and a parsed body can never be verified.
4. **Webhook controller** (new) — verifies the signature with `stripe.webhooks.constructEvent()`; handles `payment_intent.succeeded`, `payment_intent.processing`, `payment_intent.payment_failed`, `payment_intent.canceled` and `charge.refunded`. Unknown event types are acknowledged with a 200 so Stripe stops retrying them. If `STRIPE_WEBHOOK_SECRET` is missing the endpoint **fails closed with a 503** rather than trusting unverified data.
5. **`createPaymentIntent`** now snapshots the checkout and puts `metadata.checkoutSessionId` on the PaymentIntent, so the webhook can find the cart.
6. **`createOrder`** is now a thin wrapper around the service. It ignores the client-supplied items/customer for pricing and uses the server-side snapshot instead — a client can no longer tamper with prices or totals. It still accepts `notes` and `billingAddress` and merges them in.
7. **Idempotency** — `OrderSchema.index({ 'payment.stripePaymentIntentId': 1 }, { unique: true, sparse: true })`. The database is the final arbiter: if the browser and the webhook race, the second insert is rejected with a duplicate key error and the service returns the order the first one created. One payment, one order.
8. **Currency correctness** — the money math moved to `apps/api/src/utils/currency.js` (`toStripeAmount` / `fromStripeAmount`), which handles zero-decimal currencies. The service also verifies that the amount Stripe took matches the snapshot total (`PAYMENT_AMOUNT_MISMATCH`).
9. **Migration** — `apps/api/scripts/migrateUniquePaymentIntent.js` drops the old non-unique index and creates the unique one (MongoDB refuses to change an index's options in place). Run with `npm run migrate:unique-payment-intent --workspace=apps/api`. **Already run on the production database.**

**Verify**
- `npm run verify:webhook --workspace=apps/api` — a self-contained end-to-end test (throwaway database, real Stripe test API, signed payloads). **40/40 checks pass**, covering: tampered signature rejected, checkout snapshot created, webhook creates order + payment + customer + deducts stock, webhook replay creates no duplicates, the browser path returns the same order, failed payment creates no order, cross-store payment rejected, unknown event acknowledged.
- `stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe` → complete a real checkout → the webhook arrives and creates the order.
- Block the network tab after the Stripe confirm → the webhook still creates the order.

**Setup still required**
`STRIPE_WEBHOOK_SECRET` is currently **empty** in the root `.env`, so the endpoint returns 503 until it is set. Get it from the Stripe Dashboard (Developers → Webhooks → Add endpoint → `https://<api>/api/v1/webhooks/stripe`, events `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.processing`, `charge.refunded`) or run `stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe` locally.

**Follow-up**
- Order confirmation email is still missing — the webhook is now the right place to send it (see `GAP-032`).
- `Payment.paymentNumber` is still generated with a count-based race, exactly like the order number (`BUG-003`).

---

### BUG-002 — `sameSite:'strict'` refresh cookie breaks cross-domain token refresh
| | |
|---|---|
| **Severity** | 🔴 Critical |
| **Area** | API / Auth |
| **Status** | 🟢 **Fixed** — 2026-10-22 |
| **Location** | `apps/api/src/utils/generateToken.js` — `refreshTokenCookieOptions`<br>`apps/api/src/middleware/csrf.middleware.js` (new) — `requireTrustedOrigin`<br>`apps/api/src/config/origins.js` (new) — trusted origin lists<br>`apps/api/src/routes/v1/auth.routes.js` — guard on `/login`, `/refresh-token`, `/logout`<br>`apps/api/src/controllers/auth/auth.controller.js` — `refreshToken`, `logout`<br>`apps/api/src/app.js` — CORS now reads the shared origin config<br>`apps/admin-panel/src/services/api.js` — added the missing refresh interceptor |

**Impact**
In production the API is on `aurion-commerce-2.onrender.com` and the dashboards are on `*.vercel.app`. These are **different sites** for cookie purposes. A `SameSite=Strict` cookie is never sent on a cross-site subresource request, so:

> The browser never sends the `refreshToken` cookie to `POST /api/v1/auth/refresh-token`.

The endpoint returns `401 NO_REFRESH_TOKEN`, the Axios interceptor treats it as a failed refresh, clears the token and hard-redirects to `/login` (`services/api.js:89-90`). **Every merchant gets logged out ~15 minutes after logging in, in production only.** Development is unaffected (same-origin on `localhost`, and `lax` in dev), which is exactly why this survived.

`lax` would not fix it either — `lax` only allows the cookie on top-level navigations, not on `fetch`/XHR. Only `SameSite=None` works, and that requires `Secure` (HTTPS).

**Root cause**
`sameSite: 'strict'` was chosen for CSRF protection without accounting for the API and the frontends living on different domains.

**What was done**
1. **The cookie** — `sameSite: env.isProduction ? 'none' : 'lax'`, with `secure: env.isProduction`. Development keeps `lax` because `SameSite=None` without `Secure` is rejected outright by the browser, and `localhost:5173` → `localhost:5000` is same-site anyway (a site is the registrable domain; the port is irrelevant).
2. **CSRF protection** — `SameSite=None` removes the browser's built-in CSRF shield for this cookie, so `middleware/csrf.middleware.js` was added. It checks the `Origin` header (which a web page cannot forge) against a strict allow-list, falling back to `Referer`, and allows requests with neither header (a non-browser client has no cookie to abuse). It is applied to `/auth/login` (blocks *login CSRF*), `/auth/refresh-token` and `/auth/logout`.
3. **Two origin lists, on purpose** — `config/origins.js` now owns them:
   - `isCorsOriginAllowed` — trusted origins **plus** any `*.vercel.app` preview deployment, so preview builds keep working.
   - `isTrustedOrigin` — the explicit list only. A preview deployment is **not** trusted with the cookie, which is the whole point of having a separate list. `app.js` and the CSRF guard both read from this module, so they cannot drift.
4. **`PRODUCTION_ADMIN_URL` added** — the admin panel's origin was not in any allow-list at all, and the admin panel had no refresh flow, so admins were logged out every 15 minutes too. It now has the same refresh interceptor as the dashboard, and its origin is configurable.
5. **`clearRefreshTokenCookieOptions`** — see **BUG-035**. `res.clearCookie()` only removes a cookie whose attributes match, and it overrides `expires` with `maxAge` when `maxAge` is present — so the clear options are now derived from the set options (minus `maxAge`) and can never drift.
6. **`passwordChangedAt` checked on refresh** — see **BUG-040**.

**Verify**
- `npm run verify:auth-cookie --workspace=apps/api` — **41/41 checks pass** in production mode.
- `$env:VERIFY_MODE="development"; npm run verify:auth-cookie --workspace=apps/api` — **41/41 checks pass** in development mode (asserts `SameSite=Lax`, no `Secure`). > npm 10 swallows `--mode=development` as its own config flag, so the env var is the reliable way to pick the mode.
- The script proves: the cookie is `SameSite=None; Secure` in production; a cross-site refresh **with** the cookie works; an untrusted origin is refused; a `*.vercel.app` preview is refused **by the CSRF guard** (CORS allows it — this is the case the guard exists for); a refresh with no cookie is refused; a refresh token issued before a password change is refused; logout really clears the cookie with matching attributes.
- Log in on the deployed dashboard, wait 16 minutes, click around — you must stay logged in.
- Inspect the `Set-Cookie` header in DevTools → `SameSite=None; Secure`.

**Action required**
Set these in the root `.env` and on Render — they are the CSRF allow-list, and an empty value means that app simply cannot use the refresh cookie:
```
PRODUCTION_DASHBOARD_URL=https://aurion-commerce-merchant-dashboard.vercel.app   ← already set
PRODUCTION_STOREFRONT_URL=<the deployed storefront URL>
PRODUCTION_ADMIN_URL=<the deployed admin panel URL>
```
> ⚠️ Write each value as a **single URL**. A stray `&&` inside the value makes it
> match no origin at all, with no warning — see **BUG-042**.

---

### BUG-003 — Order-number generation races
| | |
|---|---|
| **Severity** | 🔴 Critical |
| **Area** | API / Orders |
| **Status** | 🟢 **Fixed** — 2026-10-22 |

**Impact**
```js
const count = await mongoose.model('Order').countDocuments({ store: this.store });
this.orderNumber = `AUR-${String(count + 1).padStart(5, '0')}`;
```
Two orders created in the same moment for the same store compute the same number. The unique index `OrderSchema.index({ store: 1, orderNumber: 1 }, { unique: true })` then rejects the second write — the customer gets a 500 **after their payment already succeeded**. Under flash-sale traffic this happens regularly.

**Root cause**
Count-then-increment is not atomic.

**Fix**
Use an atomic counter collection:
```js
// new model: src/models/orders/OrderCounter.model.js
const OrderCounterSchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, unique: true },
  seq: { type: Number, default: 0 },
});
```
```js
OrderSchema.pre('validate', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const counter = await OrderCounter.findOneAndUpdate(
      { store: this.store },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.orderNumber = `AUR-${String(counter.seq).padStart(5, '0')}`;
    // …push the initial statusHistory entry
  }
  next();
});
```
Also keep a retry-on-`11000` safety net, and fix **BUG-010** at the same time (derive the prefix from the store).

**Verify**
Fire 20 concurrent `POST /orders/create` for the same store → 20 distinct, contiguous order numbers, zero 500s.

---

### BUG-004 — Discounts are never applied at checkout
| | |
|---|---|
| **Severity** | 🔴 Critical |
| **Area** | API / Payments |
| **Status** | 🟢 **Fixed** — 2026-10-22 |
| **Location** | `apps/api/src/controllers/payments/stripe.controller.js` (now uses `calculateTotals` + the discount service)<br>`apps/api/src/services/pricing.service.js` (new)<br>`apps/api/src/services/discount.service.js` (new)<br>`apps/api/src/controllers/storefront/sf.discount.controller.js` (new)<br>`apps/api/src/models/checkout/CheckoutSession.model.js` (discount field)<br>`apps/api/src/models/orders/Order.model.js` (discount field)<br>`apps/storefront/app/[storeSlug]/checkout/page.jsx` (promo code input) |

**Impact**
The `Discount` model, its full CRUD API, its permissions, its validators and the entire merchant UI (`DiscountList.jsx`, 381 lines) all work. But no customer can ever use a discount code:
- The checkout has no "promo code" input at all.
- `pricing.discountAmount` is hardcoded to `0` in `sf.order.controller.js:228`.
- The `Order.discount` block (`{code, discountId, type, value, amountSaved}`) is never populated.
- `Discount.usageCount` is never incremented.
- `Discount.usageLimit` / `usageLimitPerCustomer` are never enforced.

A merchant who creates a "20% OFF" discount and shares it gets nothing — and has no way to know. **This is a feature that is 90% built and 100% non-functional, which is worse than not having it.**

**Root cause**
The discount system was built top-down (model → API → UI) and the checkout was never wired to it.

**Fix**
1. Add a `code` field to the create-intent request body and a promo-code input to `apps/storefront/app/[storeSlug]/checkout/page.jsx`.
2. In `stripe.controller.js`, before computing totals: find the discount by `{ store, code, isActive: true }`, validate `startsAt`/`expiresAt`, `usageLimit`, `usageLimitPerCustomer`, and `conditions.minimumOrderAmount` / `minimumQuantity` / `appliesTo`.
3. Compute `discountAmount` and subtract it from the subtotal **before** tax (decide and document the tax-after-discount policy).
4. Put `discountCode` / `discountAmount` into the Stripe PaymentIntent `metadata` so the webhook (BUG-001) can rebuild the same total.
5. In `sf.order.controller.js`, populate `Order.discount` and set `pricing.discountAmount`.
6. Increment `usageCount` inside the same Mongo transaction that creates the order.
7. Extract the discount-resolution logic into `src/services/discount.service.js` so both the intent and order paths use **one** implementation — otherwise they can compute different totals.

**Verify**
- Create a 20% discount, apply it at checkout, confirm the Stripe amount, the order's `pricing.discountAmount`, and the `Order.discount` block all agree.
- Set `usageLimit: 1` → second redemption fails with a clear error.
- Apply a discount to a subtotal below `minimumOrderAmount` → rejected.

---

### BUG-005 — Storefront category pages are empty directories
| | |
|---|---|
| **Severity** | 🔴 Critical |
| **Area** | Storefront |
| **Status** | 🔴 Open |
| **Location** | `apps/storefront/app/[storeSlug]/categories/` — **empty** (no `page.jsx`)<br>`apps/storefront/app/[storeSlug]/categories/[slug]/` — **empty** |

**Impact**
The API fully supports categories:
- `GET /api/v1/storefront/:storeSlug/categories` → `getStorefrontCategories`
- `GET /api/v1/storefront/:storeSlug/categories/:categorySlug` → `getStorefrontCategory`
- `apps/storefront/lib/api.js:46-56` already has `getCategories` and `getCategory` client methods.
- The merchant dashboard manages categories fully (`CategoryList.jsx`, 439 lines).

But no storefront page consumes them. A customer navigating to `/{store}/categories` gets a Next.js 404, and the nav bar doesn't even link to it.

**Root cause**
The store pages were scaffolded, then the category pages were planned and never written.

**Fix**
- `app/[storeSlug]/categories/page.jsx` — grid of categories with images, linking to the category detail page. Add a "Categories" link to `apps/storefront/components/layout/Navbar.jsx` (desktop nav at line 63-68, mobile menu at line 115-130).
- `app/[storeSlug]/categories/[slug]/page.jsx` — product listing filtered by category, reusing the pattern from `app/[storeSlug]/products/page.jsx:23-35`.
- **Or**, if categories are being deferred: `git rm` the empty directories and remove `getCategories`/`getCategory` from `lib/api.js` so the codebase stops advertising a feature it doesn't have. **Pick one — do not leave it half-done.**

**Verify**
`/{store}/categories` lists the store's categories; clicking one lists its products; the nav links there.

---

### BUG-006 — Shipping & tax hardcoded in two files
| | |
|---|---|
| **Severity** | 🔴 Critical |
| **Area** | API / Payments |
| **Status** | 🟢 **Fixed** — 2026-10-22 |
| **Location** | `apps/api/src/models/tenant/Store.model.js` (new `tax` + `shipping` settings)<br>`apps/api/src/services/pricing.service.js` (new)<br>`apps/api/src/controllers/payments/stripe.controller.js` (now uses `calculateTotals`)<br>`apps/merchant-dashboard/src/pages/settings/GeneralSettings.jsx` (new UI) |

**Impact**
Both files contain, verbatim:
```js
const shippingCost = subtotal >= 50 ? 0 : 5;
const taxAmount = subtotal * 0.08;
```
Two problems:
1. **Duplication** — the numbers must stay in sync. If someone changes the tax rate in one file and not the other, the amount **charged** and the amount **recorded** diverge. The order says the customer paid X; the ledger says Y. Silent financial corruption.
2. **Not configurable** — a store in Kenya (16% VAT) or Germany (19% + €1.99 shipping under €50) cannot charge correctly. The `Store` model has `currency` and `currencySymbol` but no tax or shipping fields. Every store on the platform is taxed as if it were in a US state with 8% sales tax.

**Root cause**
Shipping and tax were hardcoded as MVP constants and never extracted.

**Fix**
1. Add to the `Store` model:
   ```js
   tax: { rate: { type: Number, default: 0 }, inclusive: { type: Boolean, default: false }, label: { type: String } },
   shipping: {
     freeShippingThreshold: { type: Number, default: 50 },
     flatRate: { type: Number, default: 5 },
     freeShipping: { type: Boolean, default: true },
   },
   ```
2. Create `apps/api/src/services/pricing.service.js`:
   ```js
   export const calculateTotals = ({ store, subtotal, discountAmount = 0, shippingMethod = 'standard' }) => { … };
   ```
   returning `{ subtotal, discountAmount, shippingCost, taxAmount, total }`.
3. **Replace both copies** with a call to `calculateTotals`.
4. Add a per-store shipping-rate model later (`ShippingRate`) once multiple methods/zones are needed.
5. Expose the settings in `apps/merchant-dashboard/src/pages/settings/GeneralSettings.jsx` (already 345 lines and already wired to `storeService.updateMyStore`).

**Verify**
Set a store's tax to 16% and flat shipping to 100 KES. Complete a checkout → the Stripe amount, the order's `pricing`, and the success page all agree. Change the rate in one place only and confirm the other follows.

---

## 4. High Severity Bugs

### BUG-007 — Dashboard Overview shows hardcoded zeros
| | |
|---|---|
| **Severity** | 🟠 High |
| **Area** | Merchant Dashboard |
| **Status** | 🟢 **Fixed** — 2026-10-22 |

**Impact**
The merchant dashboard home page — the first thing every merchant sees after login — renders:
```
Total Revenue   $0.00    +0%
Total Orders    0        +0%
New Customers   0        +0%
Products        0
```
plus two hardcoded empty-state panels. **No API call is made at all.** A merchant with 500 orders and $20k in revenue sees an empty dashboard. This is the single most damaging credibility bug in the product.

**Root cause**
The page was built as a static mockup and never wired to the API. Every *other* dashboard page is data-backed — verified via `useProducts`, `useCategories`, `useOrders`, `storeService`, `discountService`, `customerService`.

**Fix**
The data already exists:
- `GET /api/v1/orders/stats/overview?period=30d` → `apps/api/src/controllers/merchant/order.controller.js:420`
- `useOrders.js:36` already exposes `getStats(period)`

Wire the page to `useOrders().getStats()` and derive:
- **Total Revenue** → stats.revenue
- **Total Orders** → stats.totalOrders
- **New Customers** → `customerService.getAll()` (or add a `stats` endpoint)
- **Products** → `useProducts().getAll()` length
- **Recent Orders** → `useOrders().getAll({ limit: 5 })`
- **Top Products** → `useProducts()` sorted by `totalSold`

**Verify**
Log in to a store that has data. All six panels show real numbers that match `/api/v1/orders`.

---

### BUG-008 — `err.keyValue[0]` unguarded in the error handler
| | |
|---|---|
| **Severity** | 🟠 High |
| **Area** | API / Core |
| **Status** | 🔴 Open |
| **Location** | `apps/api/src/app.js:173-182` |

**Impact**
```js
if (err.code === 11000) {
  const field = Object.keys(err.keyValue)[0];
```
If a duplicate-key error arrives with an empty or missing `keyValue`, `Object.keys(...)` throws a `TypeError` **inside the error handler**. Express then cannot serialise a response — the client gets a hung connection / raw stack, and the original error message is lost. Hard to reproduce, hard to debug.

**Root cause**
The `11000` branch assumes `err.keyValue` always exists and is non-empty.

**Fix**
```js
if (err.code === 11000) {
  const fields = Object.keys(err.keyValue || {});
  const field = fields[0] || 'field';
  return res.status(409).json(
    ApiResponse.error(`${field} already exists`, 'DUPLICATE_KEY',
      { field, value: err.keyValue?.[field] })
  );
}
```

**Verify**
Trigger a duplicate-key error and confirm a clean 409 JSON body every time.

---

### BUG-009 — `verifyPayment` divides by 100 unconditionally
| | |
|---|---|
| **Severity** | 🟠 High |
| **Area** | API / Payments |
| **Status** | 🟢 **Fixed** — 2026-10-19 |
| **Location** | `apps/api/src/controllers/payments/stripe.controller.js` — `verifyPayment`<br>`apps/api/src/utils/currency.js` (new) — shared `toStripeAmount` / `fromStripeAmount` |

**Impact**
```js
amount: paymentIntent.amount / 100, // Convert back from cents
```
This is correct for USD/EUR/GBP but **wrong for zero-decimal currencies** (JPY, KRW, VND, BIF, CLP, …) where Stripe's amount is already in major units. The same file gets this right on the create path via `toStripeAmount()` (lines 12-22) — so the two halves of the same file disagree.

**Root cause**
The currency-aware helper was written for the create path and not reused on the verify path.

**What was done**
`apps/api/src/utils/currency.js` now owns the single `ZERO_DECIMAL_CURRENCIES` list and exports both `toStripeAmount()` and `fromStripeAmount()`. `verifyPayment` uses `fromStripeAmount(paymentIntent.amount, paymentIntent.currency)`, `createPaymentIntent` uses `toStripeAmount()`, and the webhook uses `fromStripeAmount()` when recording a refund. The duplicate helper that lived inside `stripe.controller.js` was deleted.

**Verify**
Create a JPY store, create an intent, verify it — the returned amount matches the charged amount exactly.

---

### BUG-010 — Order prefix hardcoded to `AUR-`
| | |
|---|---|
| **Severity** | 🟠 High |
| **Area** | API / Orders |
| **Status** | 🔴 Open |
| **Location** | `apps/api/src/models/orders/Order.model.js:371` |

**Impact**
Every store's orders are numbered `AUR-00001`, `AUR-00002`, … — even for a store called "Acme Electronics". The number is a platform brand artefact, not a merchant one. Merchants who resell their order numbers to customers see a competitor's name on their own invoices.

**Root cause**
The prefix was hardcoded before multi-tenancy made it a per-store value.

**Fix**
- Add `orderPrefix` to the `Store` model, defaulting to a 3-letter derivation of the store slug (e.g. `ACM` for `acme-electronics`), with a uniqueness check inside the store.
- In the `pre('validate')` hook, fetch the store and use `store.orderPrefix`.
- Combine with **BUG-003** so the whole thing is one atomic counter operation.
- Backfill existing orders (they keep `AUR-`).

**Verify**
Create a store named "Acme Electronics" → its first order is `ACM-00001`; another store's first order is `XYZ-00001`.

---

### BUG-011 — `buy_x_get_y` discounts cannot be created
| | |
|---|---|
| **Severity** | 🟠 High |
| **Area** | API / Discounts |
| **Status** | 🔴 Open |
| **Location** | Model allows it: `apps/api/src/models/marketing/Discount.model.js:62`<br>Validator rejects it: `apps/api/src/validators/discount.validator.js:8, 30-33` |

**Impact**
The `Discount.type` enum is `['percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y']` and the model has a full `buyXGetY{buyQuantity, getQuantity, getDiscountType, getDiscountValue}` config block (lines 81-90). But the Joi validator only allows the first three. A merchant selecting "Buy X Get Y" in the UI gets a `400 VALIDATION_ERROR` with no explanation.

**Root cause**
The validator was written before the `buy_x_get_y` type was added to the model.

**Fix**
- Extend `createDiscountSchema` and `updateDiscountSchema` with `'buy_x_get_y'` and a `buyXGetY` sub-schema.
- Add a conditional: `value` is required unless type is `free_shipping` **or** `buy_x_get_y` (for `buy_x_get_y` the value comes from `buyXGetY.getDiscountValue`).
- Ensure the dashboard `DiscountList.jsx` form can actually express the Buy-X-Get-Y fields.
- Then implement the calculation in the checkout (see **BUG-004**).

**Verify**
Create a "Buy 2 Get 1 Free" discount via the API and the dashboard UI; it saves and appears in the list.

---

### BUG-012 — Discount validator silently strips model fields
| | |
|---|---|
| **Severity** | 🟠 High |
| **Area** | API / Discounts |
| **Status** | 🔴 Open |
| **Location** | `apps/api/src/validators/discount.validator.js:3-40` vs `apps/api/src/models/marketing/Discount.model.js` |

**Impact**
The `validate` middleware uses `stripUnknown: true` (`apps/api/src/middleware/validate.middleware.js:14`). Any field present in the model but absent from the Joi schema is **silently dropped from the request** — no error, no warning. Fields affected:

| Model field | In validator? |
|---|---|
| `buyXGetY{}` | ❌ no |
| `conditions.appliesTo` | ❌ no |
| `conditions.products[]` | ❌ no |
| `conditions.categories[]` | ❌ no |
| `conditions.collections[]` | ❌ no |
| `conditions.customerEligibility` | ❌ no |
| `conditions.eligibleCustomers[]` | ❌ no |
| `canCombineWithProductDiscounts` | ❌ no |
| `canCombineWithShippingDiscounts` | ❌ no |

So a merchant who configures "applies to specific products" in the UI has that setting **silently discarded** on save. They look at the discount list, it says "all products", and the behaviour is wrong. Silent data loss is worse than a visible error.

**Root cause**
Schema drift: the model grew faster than the validator, and `stripUnknown` hides the gap.

**Fix**
1. Add every model field to the Joi schemas (or explicitly `.unknown(false)` with a conscious decision per field).
2. **Belt and braces:** change the `validate` middleware to reject unknown keys with a clear error instead of stripping them, OR add a dev-only guard that compares validator keys against model paths. A silent strip is the worst possible default.
3. Add a note to the contributor guide: *"if you add a field to a Mongoose model, add it to the matching Joi validator in the same commit."*

**Verify**
Create a discount with `conditions.appliesTo = 'specific_categories'` → it round-trips through `GET /api/v1/discounts` unchanged.

---

### BUG-013 — Debug route `/stores/test-middleware` in production
| | |
|---|---|
| **Severity** | 🟠 High |
| **Area** | API / Core |
| **Status** | 🔴 Open |
| **Location** | `apps/api/src/routes/v1/store.routes.js:43-71` |

**Impact**
A live endpoint that dumps the resolved user, store, role name and **permission count** for the authenticated caller. It is not a privilege escalation on its own, but it:
- confirms to an attacker which internal middleware resolved, and
- is dead weight in production.

The source even says *"Remove this in production, just for testing"*.

**Fix**
Delete lines 43-71 of `store.routes.js`.

**Verify**
`GET /api/v1/stores/test-middleware` returns 404.

---

### BUG-014 — Stripe API version pinned to `2024-06-20`
| | |
|---|---|
| **Severity** | 🟠 High |
| **Area** | API / Payments |
| **Status** | 🔴 Open |
| **Location** | `apps/api/src/config/stripe.js:16` — `apiVersion: '2024-06-20'` |

**Impact**
Stripe **retires API versions**. When `2024-06-20` is retired, Stripe returns errors for requests pinned to it. The symptom is sudden and total: every checkout fails at once, in production, with a Stripe error that mentions the API version. Nothing in the codebase or in CI would have warned you.

The installed SDK is `stripe@^14.25.0` (2024-era). By late 2026 it is also well behind current.

**Root cause**
The API version was pinned at first use and never revisited.

**Fix**
1. Check Stripe's current API version and the `stripe@14` supported range.
2. Upgrade `stripe` to a current major in `apps/api/package.json`.
3. Update `apiVersion` to a currently supported version.
4. Read the Stripe upgrade notes for breaking changes (the 2024-06-20 → 2025-xx changes affect `payment_intent` fields and `automatic_payment_methods` behaviour).
5. Re-run a full test-mode checkout after the bump.

**Verify**
`npm run create:admin` still works, the API boots, and a test-mode checkout completes end to end against the new API version.

---

### BUG-015 — `/analytics` and `/aurion-store` are inline stubs
| | |
|---|---|
| **Severity** | 🟠 High |
| **Area** | Merchant Dashboard |
| **Status** | 🔴 Open |
| **Location** | `apps/merchant-dashboard/src/router/index.jsx:58-77` |

**Impact**
Two of the nine sidebar entries land on a page that says *"Coming soon!"*. `Recharts` is installed and `src/components/charts/` is **an empty directory** — so the charting library is paid for but unused. Merchants paying for a "platform" see two dead ends on the first screen.

**Fix**
- **`/analytics`** — build it in `src/pages/analytics/` using the empty `src/components/charts/` slot. The data source is `GET /api/v1/orders/stats/overview?period=30d` (`order.controller.js:420`) plus `GET /api/v1/admin/analytics/revenue` for the platform. Recharts is already a dependency.
- **`/aurion-store`** — the themes & plugins marketplace. This is a product decision: either build a minimal version (list the 3 planned themes in `apps/storefront/themes/`: `default`, `minimal`, `bold`) or **remove the nav entry** until it exists. Shipping a nav item to an empty page is worse than not having it.

**Verify**
Both routes render real content; the charts draw with real API data.

---

### BUG-016 — Second store per user is blocked
| | |
|---|---|
| **Severity** | 🟠 High |
| **Area** | API / Stores |
| **Status** | 🔴 Open |
| **Location** | `apps/api/src/controllers/merchant/store.controller.js:23-31` |

**Impact**
```js
const existingStore = await Store.findOne({ owner: userId });
if (existingStore) throw new ApiError(409, 'You already have a store. You can only own one store on this plan.', 'STORE_EXISTS');
```
But the **entire data model is built for many stores per user**:
- `User.storeAccess[]` is an array of `{store, role, status}` memberships
- `tenant.middleware.js:47-55` falls back to "first active store" — implying multiple
- `tenant.middleware.js:42` supports the `X-Store-Id` header for switching
- `Role` is unique **per store** (`RoleSchema.index({ store: 1, slug: 1 }, { unique: true })`)
- `Store.owner` is a single field, so a user can *own* only one, but can *access* many

So the agency case (one freelancer running 12 client shops) is architecturally supported and operationally blocked. The `Subscription` model has a `limits.staff` field, implying team plans, but a user can't even have two stores.

**Root cause**
A one-store-per-plan restriction was written into the controller without the plan/limits system to back it up.

**Fix**
1. Decide the product rule: does "one store" mean *one **owned** store* (owner role) with unlimited *staff* stores, or truly one store total?
2. If the former: allow multiple `storeAccess` memberships, and add an `Owner`/`Member` distinction on `Store` (e.g. `Store.members[]` or a `StoreOwner` relation) so `Store.owner` no longer caps the user at one.
3. Enforce the cap from `Subscription.limits` (`stores: 1` for free) rather than a hardcoded 409.
4. Add a store switcher in the dashboard (see **BUG-029**).

**Verify**
A user can create a second store (on a plan that allows it), and can switch between them from the dashboard.

---

### BUG-017 — `updateMyStore` has no permission check
| | |
|---|---|
| **Severity** | 🟠 High |
| **Area** | API / Stores |
| **Status** | 🔴 Open |
| **Location** | `apps/api/src/routes/v1/store.routes.js:37`<br>`apps/api/src/controllers/merchant/store.controller.js:192-223` |

**Impact**
```js
router.put('/my-store', authMiddleware, validate(updateStoreSchema), updateMyStore);
```
No `tenantMiddleware`, no `requirePermission('store:manage')`. The `store:manage` permission **exists** in `utils/permissions.js:60` and is granted to `owner` only — but nothing enforces it here. The controller filters by `owner: userId`, so today it is accidentally safe — but:
- a **staff** member of a store (who is not the owner) cannot update the store at all, and
- the moment `Store.owner` is relaxed for the agency case (**BUG-016**), this becomes a real privilege bug.

The JSDoc on the controller even says *"Private (owner only)"* — a promise the route does not keep.

**Fix**
```js
router.put(
  '/my-store',
  authMiddleware,
  tenantMiddleware,
  requirePermission('store:manage'),
  validate(updateStoreSchema),
  updateMyStore
);
```
And change the controller to use `req.store` (already resolved by `tenantMiddleware`) instead of re-querying by `owner`.

**Verify**
A `staff` user gets `403 INSUFFICIENT_PERMISSIONS`; an `owner` gets `200`.

---

### BUG-018 — `generateUniqueSlug` check-then-act race
| | |
|---|---|
| **Severity** | 🟠 High |
| **Area** | API / Utils |
| **Status** | 🔴 Open |
| **Location** | `apps/api/src/utils/slugify.js:42-51` |

**Impact**
```js
while (true) {
  const existing = await Model.findOne(query);
  if (!existing) return slug;      // ← check
  slug = `${baseSlug}-${counter}`;
}
```
The caller then creates a document with that slug. Between the check and the insert, another request can pick the same slug. `Store.slug` is `unique: true` platform-wide, so the loser gets a raw `11000` → 500 "slug already exists" instead of a friendly "try again".

Reproducible by creating two stores named "Acme" at the same time, or by any concurrent import.

**Root cause**
Classic TOCTOU. `generateUniqueSlug` is called **before** the transaction opens (`store.controller.js:36` vs `:41`).

**Fix**
1. Move the slug generation **inside** the transaction, and/or
2. Catch the duplicate-key error and retry with the next suffix (up to N attempts):
   ```js
   for (let attempt = 0; attempt < 5; attempt++) {
     const slug = await generateUniqueSlug(name, Store, 'slug');
     try { /* create */ break; }
     catch (e) { if (e.code !== 11000) throw e; }
   }
   ```
3. Best: use a dedicated `SlugCounter`/`UniqueSlug` collection with a unique index and `findOneAndUpdate` upsert.

**Verify**
Fire 10 concurrent store creations with the same name → all 10 succeed with distinct slugs.

---

### BUG-019 — Refresh token never rotated, never revoked on password reset
| | |
|---|---|
| **Severity** | 🟠 High |
| **Area** | API / Auth |
| **Status** | 🟡 **In progress** — 2026-10-22: item 2 was split out as **BUG-040** and is now fixed; **rotation (item 1) is still open** |
| **Location** | `apps/api/src/controllers/auth/auth.controller.js:133-171` (refresh)<br>`239+` (password reset) |

**Impact**
Two related weaknesses:
1. **No rotation.** `POST /auth/refresh-token` issues a new *access* token but the *refresh* token is never replaced. A stolen refresh token therefore stays valid for the full 7 days and can be used repeatedly, undetectably. ← **still open**
2. **No revocation on password change.** `authMiddleware` correctly checks `passwordChangedAt` and rejects old access tokens (`auth.middleware.js:96-109`). But `refreshToken` does **not** perform that check. So after a user resets their password (the exact moment you'd expect old sessions to die), an attacker holding a stolen refresh token can still mint fresh access tokens indefinitely. ← **✅ fixed 2026-10-22 (see BUG-040)**

**Root cause**
The two code paths enforce different rules; the refresh path was never given the password-change check.

**What was done (2026-10-22)**
Item 1 of the original fix is complete: `refreshToken` now applies the same `passwordChangedAt` guard as `auth.middleware.js`, so a refresh token issued before a password change is rejected with `401 PASSWORD_CHANGED`. Verified by `npm run verify:auth-cookie --workspace=apps/api`.

**What is still open**
1. Rotate the refresh token on every refresh: issue a new one, set it in the cookie, and (optionally) keep a `refreshTokenId` on the user so the old one can be revoked. A token *version* counter on the `User` model is the cheapest way to make rotation actually revoke the previous token.
2. On password reset, also clear the `refreshToken` cookie server-side (the guard in item 2 above covers the token, but the browser still holds it).
3. Add a "sign out all devices" capability on the `User` model.

**Verify**
- ~~Reset a password, then call `POST /auth/refresh-token` with the *old* refresh cookie → `401`.~~ ✅ covered by `npm run verify:auth-cookie --workspace=apps/api`.
- Call `POST /auth/refresh-token` twice → the second call uses a **different** cookie value. ← still to do.

---

## 5. Medium Severity Bugs

| ID | Title | Location | Impact | Root cause | Fix | Verify |
|---|---|---|---|---|---|---|
| **BUG-020** | Storefront rate limiters stack unintentionally | `app.js:114-117` + `routes/storefront/sf.routes.js:19-32` | `sf.routes.js` calls `router.use(storefrontLimiter)` at the top of the router, so **every** storefront request (payment, order, customer) also passes the 120/min counter *in addition to* its own stricter limiter. Logins and checkouts eat the shared budget. | The global limiter was scoped to the whole router instead of the read-only endpoints. | Move the 120/min limiter to a `router.use('/\:storeSlug/products', ...)`-style mount, or apply it per-route. Keep the 10/min and 20/min limits on payment/order. | Hammer `GET /:slug` 130×/min → 429. Hammer `POST /:slug/payment/create-intent` 11×/min → 429 at 10. |
| **BUG-021** | `populate('activeTheme')` refs a non-existent model | `controllers/merchant/store.controller.js:166`; `models/tenant/Store.model.js:162-165` | `Store.activeTheme` is `ref: 'Theme'` but **no `Theme` model exists**. Verified against Mongoose 8: it does **not** throw (the field is always `null`, so Mongoose resolves it to `null` silently), but the populate is dead code and the theme system does not exist. `models/store/` is an empty directory. | Theme engine was planned but never built; the `activeTheme` field was added to the schema anyway. | Either create `apps/api/src/models/store/Theme.model.js` (see **GAP-041**) or remove `activeTheme` from `Store` and the `.populate()` call. | `GET /api/v1/stores/my-store` returns `activeTheme: null` without warnings. |
| **BUG-022** | `updateDiscount` mass-assigns `req.body` | `controllers/merchant/discount.controller.js:106-110` | `Object.keys(req.body).forEach(k => discount[k] = req.body[k])` copies **every** key onto the document. Today it is safe only because Joi's `stripUnknown: true` removes `store`/`createdBy`. If that flag is ever relaxed, a client can **reassign a discount to another tenant's store**. | Mass assignment instead of an explicit allow-list. | Replace with an explicit allow-list of updatable fields (the same set as `updateDiscountSchema`). | `PUT /api/v1/discounts/:id` with `{store: '<other store>'}` → the discount's store is unchanged. |
| **BUG-023** | `Inventory` model is never used | `models/inventory/Inventory.model.js` (128 lines, fully written); no controller imports it | The model defines `quantity/reserved/incoming/location/lowStockThreshold` but **no `Inventory` document is ever created**. Stock lives on `Product.inventoryQuantity` instead, so there is no multi-location stock, no reservation, and no incoming stock. | The product-centric inventory design was chosen; the location-centric model was left behind. | Either delete the model, or implement it: create an `Inventory` doc per product, move `Product.inventoryQuantity` to a computed/virtual field, and make order placement decrement `Inventory` instead. | Every product with `trackInventory` has a corresponding `Inventory` document. |
| **BUG-024** | `InventoryLog.inventory` stores a product id | `controllers/storefront/sf.order.controller.js:314-326` | `inventory: product._id` — the comment says *"Using product ID since we don't have separate inventory docs"*. The field is typed `ref: 'Inventory'`, so a populate would return `null` for every log. | Same root cause as **BUG-023**. | Fixed automatically by **BUG-023**. | `InventoryLog.find().populate('inventory')` returns the inventory doc, not `null`. |
| **BUG-025** | Subscription `limits` are never enforced | `controllers/merchant/store.controller.js:105-116` sets `limits: { products: 10, staff: 1, storageMB: 500, ... }` | Nothing reads `Subscription.limits`. A free-plan merchant can create 10,000 products. The trial also never expires — `trialEndsAt` is set but no job checks it. | Limits were stored for a future billing enforcement layer that was never built. | Add a `checkLimit(store, 'products')` helper called in the product/category/staff create paths. Add a cron (`src/jobs/`) to expire trials and mark stores `suspended`. | A free-plan merchant is blocked at the 11th product with a clear upgrade message. |
| **BUG-026** | Customer JWTs signed with the merchant secret | `middleware/customerAuth.middleware.js:34`; `controllers/storefront/sf.customer.controller.js:20` | Customer tokens use `env.JWT_ACCESS_SECRET` — the same key as merchant access tokens. Separation relies solely on the `type: 'customer'` claim. A signing-key leak affects both audiences at once. | One secret for the whole API. | Add `JWT_CUSTOMER_SECRET` (or at minimum a different key for customer tokens) and update `customerAuth.middleware.js` + `generateCustomerToken`. | A customer token is rejected by `authMiddleware` and vice versa, using different secrets. |
| **BUG-027** | Response envelope unwrapped inconsistently | `apps/storefront/lib/api.js` — `getProducts` returns `data`, `getStore` returns `data.data` | The client mixes `data.data`, `data`, and `data.data.customer` depending on the method. `getMyOrders` returns the full envelope (array at `.data`, pagination at `.meta`) while `getMyOrders` callers must know which. Fragile and easy to break. | No single convention for the client wrapper. | Standardise: every method returns the unwrapped `data` payload, with pagination exposed as a separate named return. Fix `getProducts`, `getOrder`, `getMyOrders`. | Every method in `storefrontApi` returns the same shape. |
| **BUG-028** | `optionalTenantMiddleware` swallows all errors | `middleware/tenant.middleware.js:168-171` | A bare `catch (error) { /* Silently fail */ }` hides DB errors, cast errors and anything else. A request that should have 500s silently continues with no store context, which can produce confusing downstream failures. | Over-broad error suppression. | Log the error at `warn` level with the request id; only suppress the "no store" case explicitly. | A deliberately broken query logs a warning instead of vanishing. |
| **BUG-029** | Dashboard never sends `X-Store-Id` | `apps/merchant-dashboard/src/services/api.js:20-29` | The tenant middleware supports store switching via the `X-Store-Id` header (`tenant.middleware.js:42`), but the client never sends it. Combined with **BUG-016** and `generateAuthTokens(userId)` being called with no `storeId` (`auth.controller.js:43`, `:108`), the JWT's `storeId` is always `null` and the middleware's Priority-1 branch is **dead code**. | The multi-store UI was never built. | Build the store switcher, and send `X-Store-Id` from the Axios request interceptor based on the currently selected store. | Switching stores in the UI changes which store's products/orders are returned. |
| **BUG-030** | `setup`-status stores are publicly reachable | `middleware/storefront.middleware.js:47-48` | The comment says *"We allow 'setup' status so merchants can preview their store"* — but there is no preview token. **Anyone** who guesses the slug can browse a half-configured store. | Preview was designed as "public but unfinished" rather than "public with a secret". | Add a preview token: a signed query param or a `store.isPreview` flag requiring a token in `storefrontTenant`. Or restrict `setup` stores to the owner + platform admins. | A `setup` store returns 404/403 without a valid preview token. |
| **BUG-031** | `/health` does not check the database | `apps/api/src/app.js:93-101` | Returns `success: true` with uptime even when MongoDB is unreachable. Render's health check and any uptime monitor will report a healthy service that cannot serve a single request. | The health route was written as a liveness check only. | Add a readiness route (`/health/ready`) that pings MongoDB (`admin().ping()`) and returns 503 when it fails. Point the Render health check at it. | Stop MongoDB → `/health/ready` returns 503. |
| **BUG-032** | No request IDs, no production logging | `apps/api/src/app.js:71-73` — `morgan` only in development | In production there is no request log, no request id, and no way to correlate a customer report with a server event. Errors are `console.error`'d with no context. | Dev-only logging. | Add `morgan` (or `pino`) in production, generate a `req.id` (crypto.randomUUID) and echo it in the `X-Request-Id` header and in every log line and error response. | Grep the logs for a request id and find that customer's whole request chain. |
| **BUG-041** | Stock is never re-checked when the order is created | `services/checkout.service.js` — `deductInventory`; `controllers/payments/stripe.controller.js` — `createPaymentIntent` (the only place stock is checked) | Stock is verified **once**, when the payment intent is created. Between then and the order actually existing there is a window of minutes (and with the webhook it can be longer). `deductInventory` then does `Math.max(0, quantityBefore - quantity)` — so the second buyer of the last item gets it anyway and stock silently goes to 0. The order is created as `confirmed`/`paid` with no signal that it was oversold. Found while fixing **BUG-001**. | The stock check was never repeated at the point of sale. | Re-check stock inside `finalizeCheckout`, before the order is written. If it is short, create the order with `status: 'on_hold'` (the schema already has that state for "fraud, inventory, etc"), add a `statusHistory` note, and flag it for the merchant. | Two customers buy the last item → the second order lands `on_hold`, not `confirmed`. |

---

## 6. Low Severity / Code Smell

| ID | Title | Location | Detail | Suggested action |
|---|---|---|---|---|
| **BUG-033** | `next/image` never used | `apps/storefront/components/product/ProductCard.jsx`, `ProductGallery.jsx`, `CartItem.jsx` | Every product image is a plain `<img>` pointing at Cloudinary. No resizing, lazy loading or format negotiation — even though `next.config.js` already whitelists `res.cloudinary.com` in `images.remotePatterns`. | Switch to `next/image` with a Cloudinary loader. Easy, mechanical, real performance win. |
| **BUG-034** | CORS allows every `*.vercel.app` origin | `apps/api/src/app.js` → `config/origins.js` → `isCorsOriginAllowed` | Any Vercel deployment on any account can call the API with credentials. Convenient for previews, but it means a stranger's Vercel app can hit your API with a user's cookies. | Restrict to an explicit preview-domain list, or require the `X-Store-Slug`/known-origin check for credentialed requests. |
| **BUG-035** | `refreshToken` cookie options duplicated | `controllers/auth/auth.controller.js:179-184` vs `utils/generateToken.js:111-117` | `logout` re-declares the cookie attributes instead of reusing `refreshTokenCookieOptions`. If the options change (as they will for **BUG-002**), `clearCookie` will silently fail to clear the cookie and the user stays logged in. | **Fixed 2026-10-22** — `clearRefreshTokenCookieOptions` is derived from the set options (minus `maxAge`, which would make `clearCookie` re-set the cookie instead of deleting it). `logout` now uses it. |
| **BUG-036** | `createStore` error message says "on this plan" | `controllers/merchant/store.controller.js:27` | *"You can only own one store on this plan."* — there is no plan logic behind it. Misleading message. | Reword once **BUG-016** is resolved. |
| **BUG-037** | `checkSlugAvailability` reserved list is hardcoded | `controllers/merchant/store.controller.js:249` | `['admin','api','www','mail','app','aurion','shop','store','help','support']` lives in the controller, not in config. The slug is only checked at the API level — the storefront route `/{storeSlug}` would still 404 for a reserved word. | Move to a config constant; apply the same list in `storefrontTenant`. |
| **BUG-038** | `events/`, `jobs/`, `templates/` are empty | `apps/api/src/events/`, `src/jobs/`, `src/templates/` | Three planned directories with no files. They read as "work in progress" but nothing references them. | Populate them (see **GAP-030**, **GAP-031**, **GAP-032**) or delete them. |
| **BUG-039** | Four dependencies are installed but never imported | `apps/api/package.json` — `algoliasearch`, `bull`, `ioredis`, `socket.io` | Verified: **0 imports** of any of them anywhere in `apps/api/src`. `bull` + `ioredis` were clearly the intended job-queue stack, `algoliasearch` the intended search engine, `socket.io` the intended realtime layer. | Either use them (see **GAP-031**, **GAP-048**) or remove them to cut install size and CVE surface. |
| **BUG-040** | `passwordChangedAt` not checked on refresh | `controllers/auth/auth.controller.js:159-170` | See **BUG-019** item 2. Listed separately because the fix is a 6-line guard. | **Fixed 2026-10-22** — the refresh path now applies the same `passwordChangedAt` guard as `auth.middleware.js`. |
| **BUG-042** | A malformed URL env var silently breaks the allow-lists | `config/env.js`; `config/origins.js` | The root `.env` had `CLIENT_URL=http://localhost:5173 && http://localhost:3000` — a shell-style `&&` inside a dotenv value. dotenv does not interpret it, so the variable's value was the literal string `http://localhost:5173 && http://localhost:3000`, which matches **no** origin. Nothing warns about it: the CORS/CSRF allow-list just quietly stops containing the dashboard, and the symptom is a 403 "Origin not allowed" with no obvious cause. Found while fixing **BUG-002**; the local `.env` was corrected, but nothing stops it happening again. | The env values are used as raw strings with no validation. | **Fixed 2026-10-22** — `config/origins.js` now parses every origin env var: it splits on `,` (and repairs `&&` / `\|\|` / `\|` / `;`), drops anything that is not an absolute http(s) URL, and prints a loud warning naming the variable and the offending value. A comma-separated list is now a supported way to declare several origins. | `npm run verify:auth-cookie --workspace=apps/api` → **41/41**, including 6 new checks that a malformed value is split, reported and dropped, and that a well-formed list produces no warning. |

---

## 7. Missing Features

> Status is `❌ Not built` for all of these — except the ones marked **Done**, which have been built since. Split a row into multiple rows as you start, and add a `Notes` column with what exists today.

### 7.1 API — missing endpoints & services

| ID | Feature | Priority | Notes / what exists today |
|---|---|---|---|
| GAP-001 | **Stripe webhook endpoint** | 🟢 Done | **Built 2026-10-19** — see **BUG-001**. `POST /api/v1/webhooks/stripe` with signature verification, handling `payment_intent.succeeded` / `.processing` / `.payment_failed` / `.canceled` and `charge.refunded`. |
| GAP-002 | **Refund API** | 🔴 P0 | `Order.payment.refundedAmount` and `paymentStatus: 'refunded'` exist in the model; no endpoint, no Stripe refund call. |
| GAP-003 | **Discount resolution service** | 🔴 P0 | See **BUG-004**. The `Discount` model and CRUD exist; the checkout does not use them. |
| GAP-004 | **Pricing service (shipping + tax)** | 🔴 P0 | See **BUG-006**. |
| GAP-005 | **Employee invite & management API** | 🟠 P1 | RBAC (roles, permissions, `User.storeAccess[]`) is fully built, but there is no endpoint to invite a user, assign a role, or remove access. The `employees:invite` / `employees:manage` / `employees:delete` permissions are defined but unreachable. |
| GAP-006 | **Customer write API (merchant-side)** | 🟠 P1 | Only `GET /customers` and `GET /customers/:id` exist. No update/delete, no customer detail page in the dashboard, no customer notes/tags. |
| GAP-007 | **Analytics endpoints** | 🟠 P1 | `models/analytics/` is empty. Only `GET /admin/analytics/revenue` exists. Missing: product performance, customer cohorts, traffic, conversion funnel, top customers. |
| GAP-008 | **Outgoing webhook / event system** | 🟠 P1 | `src/events/` is empty. Missing: `order.created`, `order.paid`, `customer.created` events, merchant-configurable webhook URLs, signing, delivery log, retries. |
| GAP-009 | **Background job infrastructure** | 🟠 P1 | `src/jobs/` is empty. `bull` + `ioredis` are installed but unused. Missing: email queue, abandoned-cart recovery, low-stock alerts, trial expiry, nightly analytics rollup, image processing. |
| GAP-010 | **Shipping rate / zone configuration** | 🟠 P1 | No model, no endpoints. Everything is one hardcoded flat rate. Needed for multi-region merchants. |
| GAP-011 | **Order export (CSV)** | 🟡 P2 | Common merchant need for accounting. No endpoint, no dashboard button. |
| GAP-012 | **Product bulk import/export (CSV)** | 🟡 P2 | No endpoints. Needed for catalogue migration into the platform. |
| GAP-013 | **Product review endpoints** | 🟡 P2 | `Product.rating{average,count}` exists but nothing writes to it. No review model, no endpoints, no moderation. |
| GAP-014 | **Wishlist endpoints** | 🟡 P2 | No model, no endpoints, no storefront UI. |
| GAP-015 | **Collection CRUD endpoints** | 🟡 P2 | The `Collection` model (141 lines, with automated rules) is complete but has **no API and no UI** — it is entirely unreachable. |
| GAP-016 | **Custom domain verification** | 🟡 P2 | `Store.domain.customDomain` + `customDomainVerified` exist. No DNS check, no TLS provisioning, no UI. |
| GAP-017 | **Subscription / plan management API** | 🟡 P2 | The `Subscription` model is complete but there is no billing integration, no checkout, no portal, no webhook handler for Stripe Billing. |
| GAP-018 | **Abandoned cart capture** | 🟡 P2 | No model, no job, no emails. |
| GAP-019 | **OpenAPI / Swagger documentation** | 🟡 P2 | The API has 60+ endpoints and no machine-readable spec. |
| GAP-020 | **Rate limiting on merchant routes** | 🟡 P2 | Only the storefront is rate limited. `/api/v1/*` merchant endpoints have no limit — login, register, forgot-password and reset-password are all unthrottled. **This is a credential-stuffing target.** |
| GAP-021 | **Store search endpoints (Algolia)** | 🟡 P2 | `algoliasearch` installed, never used. Missing: index sync on product create/update/delete, search with facets, typo tolerance. |
| GAP-022 | **Realtime order updates (socket.io)** | 🔵 P3 | `socket.io` installed, never used. The dashboard order list only updates on refetch. |
| GAP-023 | **Email verification flow** | 🔵 P3 | `User.isEmailVerified`, `emailVerificationToken`, `emailVerificationExpires` all exist. No endpoint, no email, no enforcement. |
| GAP-024 | **Audit log endpoints** | 🔵 P3 | `Order.statusHistory[]` records order-level changes, but there is no platform-wide audit log for admin actions (suspend, role change, store status). |
| GAP-025 | **Contact / support endpoints** | 🔵 P3 | `Store.contact` and `Store.policies` exist. No contact form, no ticket model. |
| GAP-026 | **Return / refund request flow** | 🔵 P3 | `Store.policies.refund` is a free-text field. No RMA model, no customer-facing return request, no approval flow. |
| GAP-027 | **Gift cards & store credit** | 🔵 P3 | Common merchant need. Nothing modelled. |
| GAP-028 | **Recurring / subscription products** | 🔵 P3 | `Product` has no recurring-purchase fields (interval, period count). Stripe supports it; the platform does not. |
| GAP-029 | **Digital product delivery** | 🔵 P3 | `Product.isPhysical` exists and `Order.items[].requiresShipping` exists, but there is no file delivery, licence key, or download link. |
| GAP-030 | **Event bus / internal event layer** | 🔵 P3 | `src/events/` is empty. See **GAP-008**. |
| GAP-031 | **Job queue workers** | 🔵 P3 | `src/jobs/` is empty. See **GAP-009**. |
| GAP-032 | **Templated email system** | 🔵 P3 | `src/templates/` is empty. HTML is inline in `email.service.js`. Needed for order confirmation, shipping update, review request, low stock. |

### 7.2 Storefront — missing pages & components

| ID | Feature | Priority | Notes / what exists today |
|---|---|---|---|
| GAP-033 | **Category browsing pages** | 🔴 P0 | See **BUG-005**. Directories exist, are empty. |
| GAP-034 | **Product variant picker** | 🟠 P1 | The model is complete (`Product.hasVariants/options[]/variants[]`, `ProductVariant` 137 lines). The storefront is simple-product only. `AddToCartButton` has no variant support and `lib/cart.js` has no `variantId` field. |
| GAP-035 | **Promo code input at checkout** | 🔴 P0 | See **BUG-004**. |
| GAP-036 | **Product reviews & ratings UI** | 🟡 P2 | `Product.rating` exists. No stars, no review list, no write form. |
| GAP-037 | **Wishlist / favourites** | 🟡 P2 | Nothing. |
| GAP-038 | **Collections pages** | 🟡 P2 | `Collection` model exists, no UI. |
| GAP-039 | **Standalone order tracking page** | 🟡 P2 | The `?email=` lookup works; no page where a customer enters an order number + email without a session. |
| GAP-040 | **Checkout address autofill from saved addresses** | 🟡 P2 | Saved addresses exist (`/customers/me/addresses`) but the checkout form does not read them. |
| GAP-041 | **Theme engine** | 🟡 P2 | `Store.themeSettings` (Mixed) and `Store.activeTheme` exist; `apps/storefront/themes/` has three empty dirs (`default`, `minimal`, `bold`). No theme rendering, no theme switching, no `Theme` model. |
| GAP-042 | **Multi-currency display** | 🔵 P3 | `Store.currency` is used for pricing. No conversion, no currency switcher, no multi-currency prices. |
| GAP-043 | **Customer order cancellation** | 🔵 P3 | Orders can only be cancelled by the merchant. |
| GAP-044 | **Related / "you may also like"** | 🔵 P3 | No recommendations engine or manual related-products field. |
| GAP-045 | **Recently viewed** | 🔵 P3 | Nothing. |
| GAP-046 | **SEO files** | 🟡 P2 | No `sitemap.xml`, no `robots.txt`, no per-store dynamic sitemap. |
| GAP-047 | **Newsletter signup** | 🔵 P3 | `Customer.acceptsMarketing` exists but there is no signup form, no audience, no send. |
| GAP-048 | **Search UX upgrade** | 🟡 P2 | `search/page.jsx` works via `GET /products?search=`. No typo tolerance, no facets, no ranking, no highlighting, no recent searches. |
| GAP-049 | **Accessibility pass** | 🟡 P2 | No ARIA review, no focus management in the cart drawer or modals, no keyboard nav review, no contrast audit. |
| GAP-050 | **Storefront error/empty states** | 🔵 P3 | Some exist; no consistent 404/500 boundary, no `error.jsx` or `not-found.jsx` per store route. |
| GAP-051 | **Abandoned-cart recovery UI/flow** | 🔵 P3 | No backend (see **GAP-018**). |

### 7.3 Merchant Dashboard — missing pages & features

| ID | Feature | Priority | Notes / what exists today |
|---|---|---|---|
| GAP-052 | **Dashboard Overview wired to real data** | 🔴 P0 | See **BUG-007**. `Overview.jsx` is entirely static. |
| GAP-053 | **`/analytics` page** | 🟠 P1 | See **BUG-015**. Inline "Coming soon!" stub. `components/charts/` is empty; Recharts installed. |
| GAP-054 | **`/aurion-store` (themes & plugins marketplace)** | 🟠 P1 | See **BUG-015**. Inline stub. |
| GAP-055 | **`/inventory` page** | 🟠 P1 | `pages/inventory/` is an **empty directory**. `Inventory` + `InventoryLog` models exist (see **BUG-023**). No stock adjustment UI, no movement ledger view, no low-stock alerts. |
| GAP-056 | **`/employees` page** | 🟠 P1 | `pages/employees/` is an **empty directory**. No invite, no role assignment, no member list, no permissions editor. The whole RBAC system is invisible to users until this exists. |
| GAP-057 | **Refund UI** | 🟠 P1 | No button on `OrderDetail.jsx`. See **GAP-002**. |
| GAP-058 | **Store switcher** | 🟠 P1 | See **BUG-029**. |
| GAP-059 | **Notification centre** | 🟡 P2 | The `Topbar` bell is a static icon with a hardcoded red dot. No notifications model, no API, no unread state. |
| GAP-060 | **Functional topbar search** | 🟡 P2 | `Topbar.jsx:50-55` — an `<input>` with no handler. |
| GAP-061 | **Customer detail page** | 🟡 P2 | `CustomerList.jsx` exists (196 lines) but there is no `/customers/:id` route. `customerService.getById` exists and is unused. |
| GAP-062 | **Bulk product actions** | 🟡 P2 | Select-many → bulk price/status/category/delete. `productService` has no bulk methods. |
| GAP-063 | **Order export (CSV)** | 🟡 P2 | See **GAP-011**. |
| GAP-064 | **Product import/export (CSV)** | 🟡 P2 | See **GAP-012**. |
| GAP-065 | **Shipping & tax settings UI** | 🟠 P1 | `GeneralSettings.jsx` (345 lines) has no shipping or tax fields. Needed by **BUG-006**. |
| GAP-066 | **Custom domain management UI** | 🟡 P2 | `Store.domain` fields exist; no UI to set or verify a domain. |
| GAP-067 | **Subscription / plan & billing UI** | 🟡 P2 | `GET /stores/my-store` already returns the `subscription` object; nothing displays it. |
| GAP-068 | **Payouts view** | 🔵 P3 | No Stripe Connect integration, no payout list, no balance. |
| GAP-069 | **Role & permission editor** | 🔵 P3 | `Role` supports custom roles (`isSystem: false`) but there is no UI to create them. |
| GAP-070 | **Store preview / unpublished-state view** | 🔵 P3 | No way for a merchant to preview their storefront before publishing. |

### 7.4 Platform Admin Panel — missing features

| ID | Feature | Priority | Notes / what exists today |
|---|---|---|---|
| GAP-071 | **Plan / subscription management UI** | 🟡 P2 | The `Subscription` model is complete; the admin panel cannot view or change a merchant's plan. |
| GAP-072 | **Merchant approval workflow** | 🟡 P2 | New stores go straight to `status: 'setup'`. No "pending approval" state, no approve/reject. |
| GAP-073 | **Store impersonation ("view as merchant")** | 🔵 P3 | The admin panel can read a store but cannot act inside it. |
| GAP-074 | **Platform-wide audit log viewer** | 🔵 P3 | See **GAP-024**. Admin actions are not recorded. |
| GAP-075 | **Admin user management** | 🟡 P2 | `POST /admin/create-admin` exists, but there is no list of admins, no role editing, no deactivation. |
| GAP-076 | **Platform settings** | 🔵 P3 | No global config (feature flags, platform fee %, default currency, maintenance mode). |
| GAP-077 | **Platform-wide notification broadcast** | 🔵 P3 | Nothing. |
| GAP-078 | **Support ticket system** | 🔵 P3 | See **GAP-025**. |
| GAP-079 | **Custom domain verification in admin** | 🔵 P3 | See **GAP-016**. |

### 7.5 Cross-cutting product features

| ID | Feature | Priority | Notes |
|---|---|---|---|
| GAP-080 | **Multi-store / agency support** | 🟠 P1 | See **BUG-016** and **BUG-029**. The model supports it; the product blocks it. |
| GAP-081 | **i18n** | 🔵 P3 | `Store.language` and `User.preferences.language` exist. No translation files, no locale routing, no translation function. |
| GAP-082 | **POS / manual channel** | 🔵 P3 | `Order.channel` enum includes `'pos'`, `'manual'`, `'marketplace'`, but there is no POS UI and no API to create such orders. |
| GAP-083 | **Product options UI (color/size matrix)** | 🟠 P1 | `Product.options[]` + `variants[]` exist; the merchant `ProductForm.jsx` (581 lines) — needs verification on whether it can author variants. |
| GAP-084 | **B2B / wholesale pricing** | 🔵 P3 | `Store.business.type` includes `'wholesale'` but there is no tiered price list model. |
| GAP-085 | **Marketplace / multi-vendor cart** | 🔵 P3 | `Order.channel` includes `'marketplace'`; no implementation. |

---

## 8. Infrastructure & Tooling Gaps

| ID | Gap | Severity | Detail | Fix |
|---|---|---|---|---|
| INF-001 | **No test suite** | 🟠 High | Zero test files in the entire repo. No `vitest`/`jest`/`supertest` installed. Nothing prevents a regression in the money path. | Add Vitest + Supertest. First suites: auth/refresh, tenant isolation, RBAC denial, order-creation transaction, price recalculation. |
| INF-002 | **No CI/CD** | 🟠 High | `.github/` is empty. No workflow, no PR checks, no branch protection. | `.github/workflows/ci.yml`: install → build → lint → test. Add a Render/Vercel deploy hook. |
| INF-003 | **No ESLint config for the API** | 🟡 Medium | `apps/api` has no `.eslintrc*` and no `eslint` dependency, but `package.json` declares `"lint": "eslint src/"`. The script cannot work. | Add `eslint` + `eslint.config.js` (flat config) for `apps/api`. |
| INF-004 | **No ESLint config for merchant-dashboard** | 🟡 Medium | Same problem: `"lint": "eslint src/"` with no config and no `eslint` dependency. | Same. |
| INF-005 | **No README** | 🟡 Medium | The repo had no markdown at all before `PROJECT_CONTEXT.md`. GitHub shows no description. | Write a README: what it is, screenshots, quick start, links to `PROJECT_CONTEXT.md` and `BUGS_AND_GAPS.md`. |
| INF-006 | **`packages/*` are empty** | 🟡 Medium | `packages/shared/constants`, `packages/shared/utils`, `packages/ui/src` are in the workspace globs but contain nothing. `packages/ui` has no `package.json`, so it is not even a real workspace. | Either populate them (shared constants, shared UI) or remove them from the root `workspaces` array. |
| INF-007 | **No Docker setup** | 🟡 Medium | No Dockerfile, no docker-compose. Local dev needs a local MongoDB; CI will need one too. | `docker-compose.yml` with MongoDB + Redis for local dev and CI. |
| INF-008 | **No seed / demo-data script** | 🟠 High | Only `createFirstAdmin.js` exists. A new contributor cannot see the app with data; a reviewer cannot verify the UI. | `apps/api/scripts/seedDemo.js`: 1 store, 3 categories, 20 products, 5 customers, 10 orders across statuses, 2 discounts, 1 admin. |
| INF-009 | **No `.env.example` for 3 of 4 apps** | 🟡 Medium | Only the root and `apps/api` have one. The storefront uses `NEXT_PUBLIC_*`, the two Vite apps use `VITE_*`. The `.env.local` files are correctly gitignored, so a new contributor has nothing to copy. | Add `apps/storefront/.env.example`, `apps/admin-panel/.env.example`, `apps/merchant-dashboard/.env.example`. |
| INF-010 | **No error tracking** | 🟡 Medium | Only `console.error`. A production error is invisible until a customer reports it. | Sentry (or equivalent) on the API and the three frontends. |
| INF-011 | **No structured logging** | 🟡 Medium | `console.log`/`console.error` with unstructured messages. | `pino` with JSON output, request ids, redaction of `password`/`token`/`authorization`. |
| INF-012 | **No metrics / observability** | 🔵 Low | No request rate, latency, error rate, or business metrics. | Prometheus counters + a `/metrics` endpoint; or a hosted APM. |
| INF-013 | **No dependency audit / update policy** | 🔵 Low | `stripe@14` is behind; `mongoose@8` may be behind. `npm audit` is not run anywhere. | Dependabot + a scheduled `npm audit` job. |
| INF-014 | **No monitoring / alerting** | 🔵 Low | Render restarts on failure (`restartPolicyMaxRetries: 10`) but nothing alerts a human. | Uptime check on `/health/ready` + an error-rate alert. |
| INF-015 | **No backup / restore runbook** | 🔵 Low | MongoDB Atlas is presumed to have snapshots; nobody has written down how to restore. | Document it in `docs/RUNBOOK.md`. |
| INF-016 | **No API contract tests** | 🟡 Medium | The storefront, dashboard and admin panel all depend on the API's response envelope, but nothing pins it. | Snapshot/contract tests for `ApiResponse` shape across the main endpoints. |
| INF-017 | **No performance budget** | 🔵 Low | No target for API latency or page load. | Set budgets; add Lighthouse CI for the storefront. |
| INF-018 | **No feature flags** | 🔵 Low | No way to ship a half-finished feature safely. | Simple `Store`/`Subscription` feature-flag fields + a `flags` util. |
| INF-019 | **No deployment runbook** | 🔵 Low | The Render/Vercel configuration is scattered across `railway.json`, two `vercel.json` files and `.env.local` files. | `docs/DEPLOY.md` — env vars per platform, build commands, migration steps, rollback. |
| INF-020 | **No code ownership / review rules** | 🔵 Low | Single maintainer, so not urgent, but it blocks outside contributors. | `CODEOWNERS` + a short contribution guide. |

---

## 9. Empty Directory & Placeholder Registry

> Every directory below exists but contains **no files**. They are either intentional placeholders for planned work or leftovers. Each should be **filled or deleted** — a half-planned codebase is a maintenance tax.

| ID | Path | Intended purpose | Linked items | Action |
|---|---|---|---|---|
| PLC-001 | `apps/api/src/events/` | Internal event bus | GAP-008, GAP-030 | Fill or delete |
| PLC-002 | `apps/api/src/jobs/` | Bull job processors | GAP-009, GAP-031 | Fill or delete |
| PLC-003 | `apps/api/src/templates/` | Email templates | GAP-032 | Fill or delete |
| PLC-004 | `apps/api/src/models/analytics/` | Analytics models | GAP-007 | Fill or delete |
| PLC-005 | `apps/api/src/models/store/` | `Theme` model | GAP-041, BUG-021 | Fill or delete |
| PLC-006 | `apps/storefront/app/[storeSlug]/categories/` | Category listing page | GAP-033, BUG-005 | **Fill (P0)** |
| PLC-007 | `apps/storefront/app/[storeSlug]/categories/[slug]/` | Category detail page | GAP-033, BUG-005 | **Fill (P0)** |
| PLC-008 | `apps/storefront/hooks/` | Shared storefront hooks | — | Fill or delete |
| PLC-009 | `apps/storefront/themes/default/` | Default store theme | GAP-041 | Fill or delete |
| PLC-010 | `apps/storefront/themes/minimal/` | Minimal store theme | GAP-041 | Fill or delete |
| PLC-011 | `apps/storefront/themes/bold/` | Bold store theme | GAP-041 | Fill or delete |
| PLC-012 | `apps/merchant-dashboard/src/pages/analytics/` | Analytics page | GAP-053, BUG-015 | **Fill (P1)** |
| PLC-013 | `apps/merchant-dashboard/src/pages/inventory/` | Inventory page | GAP-055 | **Fill (P1)** |
| PLC-014 | `apps/merchant-dashboard/src/pages/employees/` | Employee management | GAP-056 | **Fill (P1)** |
| PLC-015 | `apps/merchant-dashboard/src/components/charts/` | Recharts wrappers | GAP-053 | **Fill (P1)** |
| PLC-016 | `packages/shared/constants/` | Shared constants | INF-006 | Fill or delete |
| PLC-017 | `packages/shared/utils/` | Shared utils | INF-006 | Fill or delete |
| PLC-018 | `packages/ui/src/` | Shared UI components | INF-006 | Fill or delete |
| PLC-019 | `docs/`, `scripts/`, `.github/` | Docs, helper scripts, CI | INF-002, INF-005 | **Fill (P1)** — see §8 |

---

## 10. Model ↔ API Mismatch Matrix

> A quick reference for "the model supports it but the API does not". These are the highest-leverage gaps because the hard part (the schema) is already done.

| Model | Has | API exposes | Missing |
|---|---|---|---|
| `Collection` | Full schema, automated rules, `sortBy` | **Nothing** — no routes, no service | GAP-015 |
| `Inventory` | Locations, `reserved`, `incoming`, low-stock alerts | Nothing — never created | GAP-055, BUG-023 |
| `InventoryLog` | Movement ledger with references | Written on checkout only | GAP-055 |
| `Subscription` | Plan, limits, usage, Stripe refs, trial dates | Created on store signup; never read | GAP-017, GAP-067, GAP-071, BUG-025 |
| `ProductVariant` | Full variant schema with options | Never created, never read | GAP-034, GAP-083 |
| `Discount` | `buyXGetY`, `conditions.*`, `canCombineWith*` | CRUD only; validator strips most fields | GAP-003, BUG-011, BUG-012 |
| `Store.themeSettings` | `Mixed` | Never used | GAP-041 |
| `Store.activeTheme` | `ref: 'Theme'` | Populated against a model that does not exist | BUG-021, GAP-041 |
| `User.emailVerification*` | Token + expiry | No endpoint, no email | GAP-023 |
| `Payment.refund{}` / `failure{}` | Full sub-documents | Never written | GAP-002 |
| `Order.discount{}` | Code, type, value, `amountSaved` | Never written | GAP-003, BUG-004 |
| `Order.items[].fulfillmentStatus` | Per-item fulfillment | Only order-level fulfillment is written | GAP-057 |

---

## 11. Maintenance Workflow

### 11.1 When you fix a bug or build a missing feature

Work through **all four** steps. Skipping step 4 is how docs drift out of sync.

```
┌──────────────────────────────────────────────────────────────────────┐
│  1. FIX THE CODE                                                    │
│     └─ Make the change. Match the existing style (see PROJECT_CONTEXT │
│        §18.1 ground rules). Run `npm run build`.                     │
├──────────────────────────────────────────────────────────────────────┤
│  2. UPDATE THIS FILE  (BUGS_AND_GAPS.md)                            │
│     └─ Change the row's Status:  🔴 Open  →  🟢 Fixed               │
│     └─ Fill in the "Fixed on" line: date + commit hash + PR link    │
│     └─ Add an entry to the Fix Log (§12)                            │
│     └─ If it revealed a NEW problem, add a new ID and log it        │
├──────────────────────────────────────────────────────────────────────┤
│  3. UPDATE PROJECT_CONTEXT.md                                        │
│     └─ Remove the item from the relevant §14 / §15 list             │
│     └─ Update any "what exists" description the fix changed         │
│        (e.g. "checkout never applies discounts" → now it does)      │
│     └─ If the fix changed a fact stated in §6-§13, update that too  │
│     └─ If a new endpoint was added, add it to Appendix A             │
│     └─ If a new permission was added, add it to Appendix B           │
│     └─ Update the "Last updated" date at the top                    │
├──────────────────────────────────────────────────────────────────────┤
│  4. CHECK THE SUMMARY COUNTS                                        │
│     └─ Recount the Summary Dashboard (§2)                           │
│     └─ Update the Bug index table                                   │
│     └─ Update the "The five that actually matter" list if the       │
│        top-5 has changed                                            │
└──────────────────────────────────────────────────────────────────────┘
```

### 11.2 Rules for this file

1. **Never delete an ID.** Set `Status: ❌ Won't fix` and add a one-line reason.
2. **Never renumber.** New items get the next free number.
3. **Every fix needs a Fix Log entry** (§12) with the date, the commit, and what actually changed.
4. **If a fix is partial**, split the item: mark the original `🟡 In progress` and add the remainder as a new ID. Do not close something that is not fully closed.
5. **If you find a new bug while fixing another**, log it immediately with a fresh ID — do not fold it into the fix.
6. **If a fix invalidates another row** (e.g. fixing BUG-023 automatically fixes BUG-024), mark the dependent row as `🟢 Fixed` and note "resolved by BUG-023" in its Fix Log entry.

### 11.3 When to add a new ID

| Situation | Action |
|---|---|
| You found a bug | Add a `BUG-0xx` row with the standard fields |
| You found a missing feature | Add a `GAP-0xx` row |
| You found a tooling gap | Add an `INF-0xx` row |
| You created a new empty directory | Add a `PLC-0xx` row |
| A model field has no API | Add a row to the §10 matrix |

### 11.4 The "verify" step is not optional

Every bug has a `Verify` line. **Do the verification before closing the item.** A bug marked fixed without verification is worse than an open bug, because it stops people from looking at it.

---

## 12. Fix Log

> Newest first. Every time a `BUG-`, `GAP-`, `INF-` or `PLC-` item is closed, add a row here **and** update `PROJECT_CONTEXT.md`.

| Date | ID | Summary | Commit / PR | Verified by |
|---|---|---|---|---|
| 2026-10-22 | BUG-007 | Merchant dashboard Overview KPIs now read from `GET /orders/stats/overview` instead of hardcoded zeros | _(uncommitted)_ | `npm run build --workspace=apps/merchant-dashboard` passes; KPIs reflect real revenue/orders/items/avg order value |
| 2026-10-22 | BUG-003 | Order numbers now come from an atomic counter collection (`OrderCounter`) instead of `countDocuments` — no more duplicate numbers under concurrency | _(uncommitted)_ | 25 concurrent orders → 25 unique, contiguous numbers; a second store starts at AUR-00001 |
| 2026-10-22 | BUG-006 | Shipping and tax are now per-store settings applied through one shared `pricing.service.js` — the hardcoded `subtotal >= 50 ? 0 : 5` / `subtotal * 0.08` is gone | _(uncommitted)_ | `verify:checkout` → 52/52 (16% VAT + 10 flat shipping produce 56.40; 0% tax produces 0 tax) |
| 2026-10-22 | BUG-004 | Discounts are now actually applied at checkout — `discount.service.js` validates the code and computes the amount, `pricing.service.js` folds it into the total, the code is previewed via `POST /storefront/:slug/discount/validate`, and the result is recorded on the order and the usage count | _(uncommitted)_ | `verify:checkout` → 52/52 (percentage, fixed-amount, free-shipping, buy-2-get-1, minimum order, expired, cross-store, usage count) |
| 2026-10-22 | BUG-041 | Inventory is now deducted with a conditional atomic update — an oversell no longer clamps to zero; the order is held (`on_hold`) with a merchant note and the short item marked partial | _(uncommitted)_ | `verify:checkout` → 52/52 (last unit sold twice → second order on hold, stock ends at 0, totalSold 1) |
| 2026-10-22 | BUG-035 | Logout now clears the refresh cookie with options derived from the set options | `f65a972` | Same script — asserts the clear header keeps `SameSite`/`Secure`/`Path` and expires in the past |
| 2026-10-22 | BUG-040 | The refresh path now rejects tokens issued before a password change | `f65a972` | Same script — refresh after a password change → `401 PASSWORD_CHANGED` |
| 2026-10-22 | BUG-042 | *New finding, fixed the same day* — a malformed URL env var silently broke the allow-lists (the root `.env` had `CLIENT_URL=… && …`) | _(uncommitted)_ | `config/origins.js` now parses, validates and reports every origin env var. `npm run verify:auth-cookie --workspace=apps/api` → **41/41** (6 new checks) |
| 2026-10-19 | BUG-001 | Added the Stripe webhook — `POST /api/v1/webhooks/stripe` with signature verification, a server-side `CheckoutSession` snapshot, and a shared `checkout.service.js` that both the browser and the webhook use | `f65a972` | `npm run verify:webhook --workspace=apps/api` → **40/40 checks pass** (signed payloads, replay, cross-store, failure path) |
| 2026-10-19 | BUG-009 | Moved the Stripe amount conversion into `utils/currency.js`; `verifyPayment` no longer divides by 100 for zero-decimal currencies | `f65a972` | Same script — `fromStripeAmount()` is now used by `verifyPayment` and the refund handler |
| 2026-10-19 | BUG-041 | *New finding* — stock is never re-checked when the order is created, so the last item can be sold twice | `f65a972` | Logged during the BUG-001 work; still open |

### Log entry template
```
| 2026-XX-XX | BUG-000 | One-line description of what changed | `abc1234` (PR #12) | How you verified it |
```

### Suggested log conventions
- Keep the summary to **one line** — what changed, not why.
- The commit hash is what lets a future reader find the diff.
- The "Verified by" column should say **how**, e.g. *"20 concurrent orders → 20 unique numbers"*, not just *"manual test"*.

---

*This tracker is a living document. If you find something wrong in it, fix it — and add an entry to the Fix Log saying you did.*
