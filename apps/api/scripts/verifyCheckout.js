/**
 * Verify the checkout maths
 *
 * Run: npm run verify:checkout --workspace=apps/api
 *
 * WHAT IT CHECKS
 * --------------
 *   BUG-003  concurrent orders get unique, gapless order numbers
 *   BUG-004  a discount code is actually applied at checkout
 *   BUG-006  shipping and tax come from the store's settings, not a constant
 *   BUG-041  the last item cannot be sold twice, and an oversell is flagged
 *
 * It runs against a THROWAWAY database (…-checkout-test) and drops it at
 * the end. It uses the real Stripe TEST API, so a genuine PaymentIntent is
 * created and confirmed for every checkout it tests.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ---------------------------------------------------------------
// Overrides BEFORE config/env.js is imported
// ---------------------------------------------------------------
const REAL_URI = process.env.MONGODB_URI;
const TEST_DB = 'Aurion-commerce-checkout-test';
process.env.MONGODB_URI = REAL_URI.replace(
  /\/([^/?]+)(\?|$)/,
  `/${TEST_DB}$2`
);
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_for_local_verification';
process.env.NODE_ENV = 'test';
// This script makes a dozen checkout calls in a few seconds, which would
// trip the production rate limiter.
process.env.RATE_LIMIT_PAYMENT_MAX = '1000';
process.env.RATE_LIMIT_STOREFRONT_MAX = '1000';

const { connectDB } = await import('../src/config/db.js');
const { env } = await import('../src/config/env.js');
const { default: mongoose } = await import('mongoose');
const { default: Stripe } = await import('stripe');
const { default: app } = await import('../src/app.js');
const { default: Store } = await import('../src/models/tenant/Store.model.js');
const { default: Product } = await import('../src/models/catalog/Product.model.js');
const { default: Order } = await import('../src/models/orders/Order.model.js');
const { default: Discount } = await import('../src/models/marketing/Discount.model.js');
const { default: CheckoutSession } = await import(
  '../src/models/checkout/CheckoutSession.model.js'
);

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

let passed = 0;
let failed = 0;
const check = (label, cond, extra = '') => {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label} ${extra}`);
  }
};

// ============================================================
await connectDB();
console.log(`\n🧪 Test database: ${mongoose.connection.name}\n`);

await mongoose.connection.db.dropDatabase();

// ------------------------------------------------------------
// Seed a store and a product
// ------------------------------------------------------------
const store = await Store.create({
  name: 'Checkout Test Store',
  slug: 'checkout-test-store',
  email: 'test@example.com',
  owner: new mongoose.Types.ObjectId(),
  currency: 'USD',
  status: 'active',
  tax: { rate: 0.08, inclusive: false, label: 'Tax' },
  shipping: { freeShippingThreshold: 50, flatRate: 5, freeOverThreshold: true },
});

const product = await Product.create({
  store: store._id,
  title: 'Test Widget',
  slug: 'test-widget',
  description: 'A widget used to test the checkout maths',
  price: 20,
  status: 'active',
  trackInventory: true,
  allowBackorder: false,
  inventoryQuantity: 100,
  images: [
    {
      url: 'https://example.com/widget.png',
      publicId: 'widget',
      isPrimary: true,
    },
  ],
});

console.log('🌱 Seeded store + product');

// ------------------------------------------------------------
// Start the API
// ------------------------------------------------------------
const server = app.listen(0);
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;
console.log(`🚀 API listening on ${base}\n`);

const CUSTOMER = {
  email: 'buyer@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '+15551234567',
};

const ADDRESS = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  line1: '1 Analytical Engine Way',
  city: 'London',
  state: 'LDN',
  country: 'United Kingdom',
  zipCode: 'EC1A 1BB',
  phone: '+15551234567',
};

const createIntent = async (body) => {
  const res = await fetch(
    `${base}/api/v1/storefront/${store.slug}/payment/create-intent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  return { status: res.status, body: await res.json() };
};

const payAndFinalize = async (paymentIntentId) => {
  await stripe.paymentIntents.confirm(paymentIntentId, {
    payment_method_data: {
      type: 'card',
      card: { token: 'tok_visa' },
    },
    return_url: 'https://example.com/checkout/success',
  });

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  const res = await fetch(
    `${base}/api/v1/storefront/${store.slug}/orders/create`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId }),
    }
  );

  return { pi, status: res.status, body: await res.json() };
};

// ============================================================
// TEST 1 — BUG-003: concurrent orders get unique order numbers
// ============================================================
console.log('TEST 1 — concurrent order numbers (BUG-003)');
{
  const CONCURRENCY = 25;

  const created = await Promise.all(
    Array.from({ length: CONCURRENCY }, () =>
      Order.create({
        store: store._id,
        customerSnapshot: {
          firstName: 'Race',
          lastName: 'Condition',
          email: 'race@example.com',
        },
        items: [
          {
            product: product._id,
            title: product.title,
            price: 20,
            quantity: 1,
            totalPrice: 20,
          },
        ],
        pricing: { subtotal: 20, total: 20, currency: 'USD' },
        shippingAddress: {
          firstName: 'Race',
          lastName: 'Condition',
          line1: '1 Race Way',
          city: 'London',
          country: 'United Kingdom',
          zipCode: 'EC1A 1BB',
        },
        status: 'confirmed',
      })
    )
  );

  const numbers = created.map((order) => order.orderNumber);

  check(
    `all ${CONCURRENCY} orders were created`,
    created.length === CONCURRENCY,
    `got ${created.length}`
  );
  check(
    'every order number is unique',
    new Set(numbers).size === CONCURRENCY,
    `${new Set(numbers).size} unique of ${CONCURRENCY}`
  );
  check(
    'every order number has the AUR-00000 shape',
    numbers.every((n) => /^AUR-\d{5}$/.test(n)),
    numbers.join(', ')
  );

  const sequences = numbers
    .map((n) => Number(n.split('-')[1]))
    .sort((a, b) => a - b);
  const contiguous = sequences.every(
    (value, index) => index === 0 || value === sequences[index - 1] + 1
  );
  check('the numbers are contiguous (no gaps from a race)', contiguous, sequences.join(', '));

  // A second store must start its own sequence at 1.
  const otherStore = await Store.create({
    name: 'Second Store',
    slug: 'second-store',
    email: 'second@example.com',
    owner: new mongoose.Types.ObjectId(),
    currency: 'USD',
    status: 'active',
  });

  const otherOrder = await Order.create({
    store: otherStore._id,
    customerSnapshot: {
      firstName: 'Other',
      lastName: 'Store',
      email: 'other@example.com',
    },
    items: [
      {
        product: product._id,
        title: product.title,
        price: 20,
        quantity: 1,
        totalPrice: 20,
      },
    ],
    pricing: { subtotal: 20, total: 20, currency: 'USD' },
    shippingAddress: {
      firstName: 'Other',
      lastName: 'Store',
      line1: '1 Other Way',
      city: 'London',
      country: 'United Kingdom',
      zipCode: 'EC1A 1BB',
    },
    status: 'confirmed',
  });

  check(
    "a different store starts its own sequence at AUR-00001",
    otherOrder.orderNumber === 'AUR-00001',
    otherOrder.orderNumber
  );
}

// ============================================================
// TEST 2 — BUG-006: tax and shipping come from the store settings
// ============================================================
console.log('\nTEST 2 — per-store tax and shipping (BUG-006)');
{
  // 40 subtotal, store says 10 flat shipping and 16% tax
  store.shipping = { freeShippingThreshold: 1000, flatRate: 10, freeOverThreshold: true };
  store.tax = { rate: 0.16, inclusive: false, label: 'VAT' };
  await store.save();

  const res = await createIntent({
    items: [{ productId: product._id.toString(), quantity: 2 }],
    customer: CUSTOMER,
    shippingAddress: ADDRESS,
  });

  check('create-intent -> 200', res.status === 200, JSON.stringify(res.body));

  const breakdown = res.body?.data?.breakdown;
  check('subtotal is 40', breakdown?.subtotal === 40, String(breakdown?.subtotal));
  check('shipping is the store\'s flat rate (10)', breakdown?.shipping === 10, String(breakdown?.shipping));
  check('tax is 16% of 40 (6.40)', breakdown?.tax === 6.4, String(breakdown?.tax));
  check('total is 40 + 10 + 6.40 (56.40)', breakdown?.total === 56.4, String(breakdown?.total));

  // The Stripe amount must match the breakdown exactly
  const pi = await stripe.paymentIntents.retrieve(res.body?.data?.paymentIntentId);
  check('the Stripe amount matches the breakdown', pi.amount === 5640, String(pi.amount));

  // A store with no tax at all
  store.tax = { rate: 0, inclusive: false, label: 'Tax' };
  store.shipping = { freeShippingThreshold: 50, flatRate: 5, freeOverThreshold: true };
  await store.save();

  const res2 = await createIntent({
    items: [{ productId: product._id.toString(), quantity: 2 }],
    customer: CUSTOMER,
    shippingAddress: ADDRESS,
  });
  check(
    'a store with 0% tax is charged no tax',
    res2.body?.data?.breakdown?.tax === 0,
    String(res2.body?.data?.breakdown?.tax)
  );
  check(
    'and the free-shipping threshold now applies (40 < 50 -> 5)',
    res2.body?.data?.breakdown?.shipping === 5,
    String(res2.body?.data?.breakdown?.shipping)
  );

  // Back to the defaults for the rest of the run
  store.tax = { rate: 0.08, inclusive: false, label: 'Tax' };
  await store.save();
}

// ============================================================
// TEST 3 — BUG-004: a discount code is applied
// ============================================================
console.log('\nTEST 3 — discount codes (BUG-004)');
{
  // 20% off, only on orders over $50
  const percentage = await Discount.create({
    store: store._id,
    code: 'SAVE20',
    title: '20% off',
    type: 'percentage',
    value: 20,
    conditions: { minimumOrderAmount: 50 },
    isActive: true,
  });

  // The cart is 40 — below the $50 minimum
  const tooSmall = await createIntent({
    items: [{ productId: product._id.toString(), quantity: 2 }],
    customer: CUSTOMER,
    shippingAddress: ADDRESS,
    discountCode: 'SAVE20',
  });
  check(
    'a code above the minimum order is refused',
    tooSmall.status === 400,
    `got ${tooSmall.status}`
  );
  check(
    'and the refusal names the reason',
    tooSmall.body?.error === 'DISCOUNT_MINIMUM_ORDER',
    JSON.stringify(tooSmall.body)
  );

  // The cart is 60 — over the minimum
  const applied = await createIntent({
    items: [{ productId: product._id.toString(), quantity: 3 }],
    customer: CUSTOMER,
    shippingAddress: ADDRESS,
    discountCode: 'SAVE20',
  });
  check('create-intent with a valid code -> 200', applied.status === 200, JSON.stringify(applied.body));

  const b = applied.body?.data?.breakdown;
  check('subtotal is 60', b?.subtotal === 60, String(b?.subtotal));
  check('the discount is 20% of 60 (12)', b?.discount === 12, String(b?.discount));
  // 60 - 12 = 48, under the $50 free-shipping threshold -> 5 shipping
  check('shipping is 5', b?.shipping === 5, String(b?.shipping));
  check('tax is 8% of 48 (3.84)', b?.tax === 3.84, String(b?.tax));
  check('total is 48 + 5 + 3.84 (56.84)', b?.total === 56.84, String(b?.total));
  check(
    'the response names the discount',
    applied.body?.data?.discount?.code === 'SAVE20',
    JSON.stringify(applied.body?.data?.discount)
  );

  const session = await CheckoutSession.findById(applied.body?.data?.checkoutSessionId);
  check('the session records the discount', session?.discount?.code === 'SAVE20');
  check('the session records the amount saved', session?.discount?.amountSaved === 12);
  check(
    'the session pricing carries the discount',
    session?.pricing?.discountAmount === 12,
    String(session?.pricing?.discountAmount)
  );

  // Now pay it and check the order
  const { body: orderBody } = await payAndFinalize(applied.body?.data?.paymentIntentId);
  check('the order was created', orderBody?.success === true, JSON.stringify(orderBody));

  const order = await Order.findOne({
    'payment.stripePaymentIntentId': applied.body?.data?.paymentIntentId,
  });
  check('the order keeps the discount code', order?.discount?.code === 'SAVE20', order?.discount?.code);
  check(
    'the order keeps the amount saved',
    order?.discount?.amountSaved === 12,
    String(order?.discount?.amountSaved)
  );
  check(
    'the order pricing keeps the discount',
    order?.pricing?.discountAmount === 12,
    String(order?.pricing?.discountAmount)
  );
  check('the order total is 56.84', order?.pricing?.total === 56.84, String(order?.pricing?.total));

  const usedDiscount = await Discount.findById(percentage._id);
  check(
    'the discount usage count went up',
    usedDiscount.usageCount === 1,
    String(usedDiscount.usageCount)
  );

  // An unknown code
  const unknown = await createIntent({
    items: [{ productId: product._id.toString(), quantity: 3 }],
    customer: CUSTOMER,
    shippingAddress: ADDRESS,
    discountCode: 'NOPE',
  });
  check('an unknown code is refused', unknown.status === 400, `got ${unknown.status}`);
  check(
    'and says so',
    unknown.body?.error === 'DISCOUNT_NOT_FOUND',
    JSON.stringify(unknown.body)
  );

  // An expired code
  await Discount.create({
    store: store._id,
    code: 'OLD',
    type: 'percentage',
    value: 50,
    isActive: true,
    startsAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  });
  const expired = await createIntent({
    items: [{ productId: product._id.toString(), quantity: 3 }],
    customer: CUSTOMER,
    shippingAddress: ADDRESS,
    discountCode: 'OLD',
  });
  check('an expired code is refused', expired.status === 400, `got ${expired.status}`);
  check(
    'and says so',
    expired.body?.error === 'DISCOUNT_EXPIRED',
    JSON.stringify(expired.body)
  );

  // A fixed-amount code
  await Discount.create({
    store: store._id,
    code: 'TENOFF',
    type: 'fixed_amount',
    value: 10,
    isActive: true,
  });
  const fixed = await createIntent({
    items: [{ productId: product._id.toString(), quantity: 3 }],
    customer: CUSTOMER,
    shippingAddress: ADDRESS,
    discountCode: 'TENOFF',
  });
  check(
    'a fixed-amount code takes exactly its value off',
    fixed.body?.data?.breakdown?.discount === 10,
    String(fixed.body?.data?.breakdown?.discount)
  );

  // A free-shipping code
  await Discount.create({
    store: store._id,
    code: 'FREESHIP',
    type: 'free_shipping',
    isActive: true,
  });
  const freeShip = await createIntent({
    items: [{ productId: product._id.toString(), quantity: 3 }],
    customer: CUSTOMER,
    shippingAddress: ADDRESS,
    discountCode: 'FREESHIP',
  });
  check(
    'a free-shipping code zeroes the shipping',
    freeShip.body?.data?.breakdown?.shipping === 0,
    String(freeShip.body?.data?.breakdown?.shipping)
  );
  check(
    'and leaves the subtotal alone',
    freeShip.body?.data?.breakdown?.subtotal === 60,
    String(freeShip.body?.data?.breakdown?.subtotal)
  );

  // A buy-2-get-1 code on 3 units
  await Discount.create({
    store: store._id,
    code: 'BUY2GET1',
    type: 'buy_x_get_y',
    value: 0,
    buyXGetY: { buyQuantity: 2, getQuantity: 1, getDiscountType: 'free' },
    isActive: true,
  });
  const buyGet = await createIntent({
    items: [{ productId: product._id.toString(), quantity: 3 }],
    customer: CUSTOMER,
    shippingAddress: ADDRESS,
    discountCode: 'BUY2GET1',
  });
  check(
    'a buy-2-get-1 code makes the third unit free (20 off)',
    buyGet.body?.data?.breakdown?.discount === 20,
    JSON.stringify(buyGet.body)
  );

  // A code from ANOTHER store must not work here
  const otherStore = await Store.findOne({ slug: 'second-store' });
  await Discount.create({
    store: otherStore._id,
    code: 'OTHERSTORE',
    type: 'percentage',
    value: 90,
    isActive: true,
  });
  const crossStore = await createIntent({
    items: [{ productId: product._id.toString(), quantity: 3 }],
    customer: CUSTOMER,
    shippingAddress: ADDRESS,
    discountCode: 'OTHERSTORE',
  });
  check(
    "another store's code is refused",
    crossStore.status === 400,
    `got ${crossStore.status}`
  );

  // The preview endpoint
  const preview = await fetch(
    `${base}/api/v1/storefront/${store.slug}/discount/validate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'SAVE20',
        items: [{ productId: product._id.toString(), quantity: 3 }],
      }),
    }
  );
  const previewBody = await preview.json();
  check('the preview endpoint -> 200', preview.status === 200, JSON.stringify(previewBody));
  check(
    'the preview shows the same discount',
    previewBody?.data?.breakdown?.discount === 12,
    JSON.stringify(previewBody?.data?.breakdown)
  );
  check(
    'the preview total matches create-intent',
    previewBody?.data?.breakdown?.total === 56.84,
    String(previewBody?.data?.breakdown?.total)
  );
}

// ============================================================
// TEST 4 — BUG-041: the last item cannot be sold twice
// ============================================================
console.log('\nTEST 4 — the last item cannot be sold twice (BUG-041)');
{
  // One left in stock
  const scarce = await Product.create({
    store: store._id,
    title: 'Scarce Widget',
    slug: 'scarce-widget',
    description: 'Only one of these',
    price: 20,
    status: 'active',
    trackInventory: true,
    allowBackorder: false,
    inventoryQuantity: 1,
    images: [
      {
        url: 'https://example.com/scarce.png',
        publicId: 'scarce',
        isPrimary: true,
      },
    ],
  });

  // Two customers each check out while the stock is still 1. Both pass the
  // inventory check, because it is a read and both read the same value.
  const first = await createIntent({
    items: [{ productId: scarce._id.toString(), quantity: 1 }],
    customer: { ...CUSTOMER, email: 'first@example.com' },
    shippingAddress: ADDRESS,
  });
  const second = await createIntent({
    items: [{ productId: scarce._id.toString(), quantity: 1 }],
    customer: { ...CUSTOMER, email: 'second@example.com' },
    shippingAddress: ADDRESS,
  });

  check('both carts were accepted', first.status === 200 && second.status === 200);

  const firstResult = await payAndFinalize(first.body?.data?.paymentIntentId);
  const secondResult = await payAndFinalize(second.body?.data?.paymentIntentId);

  check('both payments were taken', firstResult.status === 201 && secondResult.status === 201);

  const after = await Product.findById(scarce._id);
  check('the stock is 0, not negative', after.inventoryQuantity === 0, String(after.inventoryQuantity));
  check('exactly one unit was sold', after.totalSold === 1, String(after.totalSold));

  const orders = await Order.find({
    'items.product': scarce._id,
  });
  check('both orders exist (the money was taken)', orders.length === 2, `got ${orders.length}`);

  const onHold = orders.filter((o) => o.status === 'on_hold');
  check('exactly one order is on hold', onHold.length === 1, `got ${onHold.length}`);
  check(
    'the oversold order says why',
    (onHold[0]?.merchantNotes?.[0]?.note || '').includes('Oversold'),
    JSON.stringify(onHold[0]?.merchantNotes)
  );
  check(
    'the oversold item is marked partial',
    onHold[0]?.items?.[0]?.fulfillmentStatus === 'partial',
    onHold[0]?.items?.[0]?.fulfillmentStatus
  );
  check(
    'the other order is confirmed',
    orders.filter((o) => o.status === 'confirmed').length === 1,
    orders.map((o) => o.status).join(', ')
  );
}

// ------------------------------------------------------------
// Cleanup
// ------------------------------------------------------------
console.log('\n🧹 Dropping the test database');
await mongoose.connection.db.dropDatabase();
server.close();
await mongoose.connection.close();

console.log(`\n${'='.repeat(46)}`);
console.log(`  PASSED: ${passed}   FAILED: ${failed}`);
console.log('='.repeat(46) + '\n');
process.exit(failed > 0 ? 1 : 0);
