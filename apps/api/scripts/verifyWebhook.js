/**
 * Verify the Stripe webhook end to end
 *
 * Run: npm run verify:webhook --workspace=apps/api
 *
 * WHAT IT DOES
 * ------------
 * The Stripe webhook cannot be tested with a normal HTTP client, because
 * Stripe signs the raw request body with a secret. This script:
 *
 *   1. Creates a THROWAWAY database (…-webhook-test) — your real data is
 *      never touched, and the test database is dropped at the end.
 *   2. Seeds a store and a product.
 *   3. Creates a real PaymentIntent through the Stripe TEST API.
 *   4. Builds the exact event payload Stripe would send, signs it with
 *      `stripe.webhooks.generateTestHeaderString`, and POSTs it to the
 *      webhook endpoint.
 *   5. Checks that the order, the payment record and the inventory
 *      deduction all happened — and that replaying the event does not
 *      create duplicates.
 *
 * It also checks the browser path (orders/create) and the failure path.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the real .env first, so we can copy the real values below
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ---------------------------------------------------------------
// Overrides BEFORE config/env.js is imported
// ---------------------------------------------------------------
const REAL_URI = process.env.MONGODB_URI;
const TEST_DB = 'Aurion-commerce-webhook-test';
process.env.MONGODB_URI = REAL_URI.replace(
  /\/([^/?]+)(\?|$)/,
  `/${TEST_DB}$2`
);
// A secret we control, so we can sign our own test payloads
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_for_local_verification';
process.env.NODE_ENV = 'test';

const { connectDB } = await import('../src/config/db.js');
const { env } = await import('../src/config/env.js');
const { default: mongoose } = await import('mongoose');
const { default: Stripe } = await import('stripe');
const { default: app } = await import('../src/app.js');
const { default: Store } = await import('../src/models/tenant/Store.model.js');
const { default: Product } = await import('../src/models/catalog/Product.model.js');
const { default: Order } = await import('../src/models/orders/Order.model.js');
const { default: Payment } = await import('../src/models/payments/Payment.model.js');
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
  name: 'Webhook Test Store',
  slug: 'webhook-test-store',
  email: 'test@example.com',
  owner: new mongoose.Types.ObjectId(),
  currency: 'USD',
  status: 'active',
});

const product = await Product.create({
  store: store._id,
  title: 'Test Widget',
  slug: 'test-widget',
  description: 'A widget used to test the checkout webhook',
  price: 20,
  status: 'active',
  trackInventory: true,
  allowBackorder: false,
  inventoryQuantity: 10,
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

// ------------------------------------------------------------
// Helper: send a signed Stripe webhook
// ------------------------------------------------------------
const sendWebhook = async (event, { tamper = false } = {}) => {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: env.STRIPE_WEBHOOK_SECRET,
  });
  const res = await fetch(`${base}/api/v1/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': tamper ? `${signature}tampered` : signature,
    },
    body: payload,
  });
  return { status: res.status, body: await res.json() };
};

// ============================================================
// TEST 1 — a tampered signature is rejected
// ============================================================
console.log('TEST 1 — signature verification');
{
  const res = await sendWebhook(
    { id: 'evt_fake', type: 'payment_intent.succeeded', data: { object: {} } },
    { tamper: true }
  );
  check('tampered signature -> 400', res.status === 400, `got ${res.status}`);
  check(
    'tampered signature -> INVALID_SIGNATURE',
    res.body?.error === 'INVALID_SIGNATURE',
    JSON.stringify(res.body)
  );
}

// ============================================================
// TEST 2 — create a payment intent (real Stripe test API)
// ============================================================
console.log('\nTEST 2 — create payment intent');
const intentRes = await fetch(
  `${base}/api/v1/storefront/${store.slug}/payment/create-intent`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: product._id.toString(), quantity: 2 }],
      customer: {
        email: 'Buyer@Example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        phone: '+15551234567',
      },
      shippingAddress: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        line1: '1 Analytical Engine Way',
        city: 'London',
        state: 'LDN',
        country: 'United Kingdom',
        zipCode: 'EC1A 1BB',
        phone: '+15551234567',
      },
      notes: 'Leave at the door',
    }),
  }
);
const intentBody = await intentRes.json();
check('create-intent -> 200', intentRes.status === 200, JSON.stringify(intentBody));
check('create-intent returns a client secret', !!intentBody?.data?.clientSecret);
const paymentIntentId = intentBody?.data?.paymentIntentId;
const checkoutSessionId = intentBody?.data?.checkoutSessionId;
console.log(`   paymentIntentId   = ${paymentIntentId}`);
console.log(`   checkoutSessionId = ${checkoutSessionId}`);

const session = await CheckoutSession.findById(checkoutSessionId);
check('CheckoutSession was created', !!session);
check(
  'session snapshot has the cart',
  session?.items?.length === 1 && session.items[0].quantity === 2
);
check('session snapshot has the address', session?.shippingAddress?.city === 'London');
check('session is linked to the payment intent', session?.paymentIntentId === paymentIntentId);
check(
  'PaymentIntent metadata points back at the session',
  (await stripe.paymentIntents.retrieve(paymentIntentId)).metadata
    .checkoutSessionId === checkoutSessionId
);

// ============================================================
// TEST 3 — the webhook creates the order
// ============================================================
// Pay for real (Stripe TEST mode, test card) so the PaymentIntent is
// genuinely "succeeded" — the same state a live payment would be in.
console.log('\nTEST 3 — webhook payment_intent.succeeded');
await stripe.paymentIntents.confirm(paymentIntentId, {
  payment_method_data: {
    type: 'card',
    card: { token: 'tok_visa' },
  },
  // The dashboard has redirect methods (Klarna, Affirm...) enabled, so Stripe
  // insists on a return_url even for a card payment.
  return_url: 'https://example.com/checkout/success',
});
const realPi = await stripe.paymentIntents.retrieve(paymentIntentId);
check('PaymentIntent really succeeded at Stripe', realPi.status === 'succeeded', realPi.status);

const succeededEvent = {
  id: 'evt_test_success_1',
  type: 'payment_intent.succeeded',
  data: { object: { ...realPi, status: 'succeeded' } },
};

{
  const res = await sendWebhook(succeededEvent);
  check('webhook -> 200', res.status === 200, JSON.stringify(res.body));
  check(
    'webhook -> echoes the event type',
    res.body?.data?.type === 'payment_intent.succeeded',
    JSON.stringify(res.body)
  );

  const orders = await Order.find({
    'payment.stripePaymentIntentId': paymentIntentId,
  });
  check('exactly ONE order was created', orders.length === 1, `got ${orders.length}`);
  const order = orders[0];
  check('order is confirmed', order?.status === 'confirmed', order?.status);
  check('order is paid', order?.paymentStatus === 'paid', order?.paymentStatus);
  check(
    'order has the cart line',
    order?.items?.length === 1 && order.items[0].quantity === 2
  );
  // 2 x 20 = 40 subtotal, + 5 shipping (under 50), + 8% tax (3.20) = 48.20
  check(
    'order total is 40 + 5 shipping + 3.20 tax',
    order?.pricing?.total === 48.2,
    String(order?.pricing?.total)
  );
  check('order keeps the customer note', order?.customerNote === 'Leave at the door');
  check(
    'order has an order number',
    /^AUR-\d{5}$/.test(order?.orderNumber || ''),
    order?.orderNumber
  );

  const payments = await Payment.find({ 'stripe.paymentIntentId': paymentIntentId });
  check('a Payment record was created', payments.length === 1, `got ${payments.length}`);
  check('payment is succeeded', payments[0]?.status === 'succeeded');
  check('payment amount matches', payments[0]?.amount === 48.2, String(payments[0]?.amount));

  const updated = await Product.findById(product._id);
  check(
    'inventory was deducted (10 -> 8)',
    updated.inventoryQuantity === 8,
    String(updated.inventoryQuantity)
  );

  const customer = await mongoose.connection.db
    .collection('customers')
    .findOne({ email: 'buyer@example.com' });
  check('a customer record was created', !!customer);
  check(
    'customer stats updated',
    customer?.stats?.totalSpent === 48.2,
    String(customer?.stats?.totalSpent)
  );
}

// ============================================================
// TEST 4 — replaying the webhook does NOT duplicate anything
// ============================================================
console.log('\nTEST 4 — webhook replay (Stripe retries)');
{
  await sendWebhook(succeededEvent);
  await sendWebhook({ ...succeededEvent, id: 'evt_test_success_2' });

  const orders = await Order.find({
    'payment.stripePaymentIntentId': paymentIntentId,
  });
  check('still exactly ONE order', orders.length === 1, `got ${orders.length}`);
  const payments = await Payment.find({ 'stripe.paymentIntentId': paymentIntentId });
  check('still exactly ONE payment', payments.length === 1, `got ${payments.length}`);
  const updated = await Product.findById(product._id);
  check(
    'inventory deducted only once (8)',
    updated.inventoryQuantity === 8,
    String(updated.inventoryQuantity)
  );
  const customer = await mongoose.connection.db
    .collection('customers')
    .findOne({ email: 'buyer@example.com' });
  check(
    'customer counted once',
    customer?.stats?.totalOrders === 1,
    String(customer?.stats?.totalOrders)
  );
}

// ============================================================
// TEST 5 — the browser path returns the SAME order
// ============================================================
console.log('\nTEST 5 — browser calls orders/create after the webhook');
{
  const res = await fetch(`${base}/api/v1/storefront/${store.slug}/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentIntentId,
      items: [{ productId: product._id.toString(), quantity: 2 }],
      customer: { email: 'buyer@example.com' },
      shippingAddress: { line1: '1 Analytical Engine Way' },
      notes: 'Leave at the door',
    }),
  });
  const body = await res.json();
  check('orders/create -> 201', res.status === 201, JSON.stringify(body));
  const orders = await Order.find({
    'payment.stripePaymentIntentId': paymentIntentId,
  });
  check('still exactly ONE order', orders.length === 1, `got ${orders.length}`);
  check(
    'the browser got the order the webhook created',
    body?.data?.order?._id === orders[0]._id.toString()
  );
  const updated = await Product.findById(product._id);
  check(
    'inventory still deducted only once (8)',
    updated.inventoryQuantity === 8,
    String(updated.inventoryQuantity)
  );
}

// ============================================================
// TEST 6 — payment failure is recorded
// ============================================================
console.log('\nTEST 6 — payment_intent.payment_failed');
{
  const failRes = await fetch(
    `${base}/api/v1/storefront/${store.slug}/payment/create-intent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: product._id.toString(), quantity: 1 }],
        customer: {
          email: 'fail@example.com',
          firstName: 'Alan',
          lastName: 'Turing',
        },
        shippingAddress: {
          firstName: 'Alan',
          lastName: 'Turing',
          line1: '2 Computing Lane',
          city: 'Manchester',
          country: 'United Kingdom',
          zipCode: 'M1 1AA',
        },
      }),
    }
  );
  const failBody = await failRes.json();
  const failPi = await stripe.paymentIntents.retrieve(failBody.data.paymentIntentId);

  const res = await sendWebhook({
    id: 'evt_test_failed',
    type: 'payment_intent.payment_failed',
    data: {
      object: {
        ...failPi,
        status: 'requires_payment_method',
        last_payment_error: {
          code: 'card_declined',
          message: 'Your card was declined.',
        },
      },
    },
  });
  check('failed webhook -> 200', res.status === 200);
  const failedSession = await CheckoutSession.findById(failBody.data.checkoutSessionId);
  check('session marked failed', failedSession.status === 'failed', failedSession.status);
  check(
    'failure reason stored',
    failedSession.failure?.code === 'card_declined',
    JSON.stringify(failedSession.failure)
  );
  const failedOrders = await Order.find({
    'payment.stripePaymentIntentId': failBody.data.paymentIntentId,
  });
  check(
    'no order was created for a failed payment',
    failedOrders.length === 0,
    `got ${failedOrders.length}`
  );
}

// ============================================================
// TEST 7 — a payment for a different store is rejected
// ============================================================
console.log('\nTEST 7 — cross-store payment is rejected');
{
  const otherStore = await Store.create({
    name: 'Other Store',
    slug: 'other-store',
    email: 'other@example.com',
    owner: new mongoose.Types.ObjectId(),
    currency: 'USD',
    status: 'active',
  });
  const res = await fetch(
    `${base}/api/v1/storefront/${otherStore.slug}/orders/create`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId }),
    }
  );
  const body = await res.json();
  check('cross-store order -> 403', res.status === 403, `got ${res.status}`);
  check('cross-store order -> STORE_MISMATCH', body?.error === 'STORE_MISMATCH');
}

// ============================================================
// TEST 8 — an unknown event type is acknowledged, not retried
// ============================================================
console.log('\nTEST 8 — unknown event type');
{
  const res = await sendWebhook({
    id: 'evt_test_other',
    type: 'customer.created',
    data: { object: { id: 'cus_123' } },
  });
  check('unknown event -> 200', res.status === 200, `got ${res.status}`);
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
