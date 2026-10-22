/**
 * Migration: make `Order.payment.stripePaymentIntentId` UNIQUE
 *
 * Run once: node apps/api/scripts/migrateUniquePaymentIntent.js
 * Or with npm: npm run migrate:unique-payment-intent --workspace=apps/api
 *
 * WHY
 * ---
 * The Stripe webhook and the browser can both try to create the order for
 * the same payment. The application-level check ("does an order already
 * exist for this payment intent?") is not enough on its own: two requests
 * can pass that check at the same time.
 *
 * A UNIQUE index makes the database the final arbiter — the second insert
 * is rejected with a duplicate key error, and the checkout service then
 * returns the order the first caller created. One payment, one order.
 *
 * WHY IT IS A SEPARATE SCRIPT
 * ---------------------------
 * The collection already has a NON-unique index on the same field. MongoDB
 * refuses to replace an index with a different set of options
 * ("IndexOptionsConflict"), so the old one has to be dropped first.
 * Mongoose's automatic index sync cannot do that safely on its own.
 *
 * Safe to run more than once.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
};

const run = async () => {
  await connectDB();

  const collection = mongoose.connection.db.collection('orders');

  // ---------------------------------------------------------------
  // Step 1: Refuse to continue if duplicates exist
  // ---------------------------------------------------------------
  const duplicates = await collection
    .aggregate([
      { $match: { 'payment.stripePaymentIntentId': { $type: 'string' } } },
      { $group: { _id: '$payment.stripePaymentIntentId', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $limit: 20 },
    ])
    .toArray();

  if (duplicates.length > 0) {
    console.error(
      '❌ These payment intent ids are used by more than one order:'
    );
    duplicates.forEach((d) => console.error(`   ${d._id} (${d.count} orders)`));
    console.error(
      '\nResolve them by hand, then run this script again. Nothing was changed.'
    );
    await mongoose.connection.close();
    process.exit(1);
  }

  console.log('✅ No duplicate payment intent ids found');

  // ---------------------------------------------------------------
  // Step 2: Drop the old NON-unique index
  // ---------------------------------------------------------------
  const indexes = await collection.indexes();
  const oldIndex = indexes.find(
    (i) => i.key['payment.stripePaymentIntentId'] === 1 && !i.unique
  );

  if (oldIndex) {
    await collection.dropIndex(oldIndex.name);
    console.log(`✅ Dropped old index: ${oldIndex.name}`);
  } else {
    console.log('ℹ️  No old non-unique index to drop');
  }

  // ---------------------------------------------------------------
  // Step 3: Create the UNIQUE + SPARSE index
  // ---------------------------------------------------------------
  await collection.createIndex(
    { 'payment.stripePaymentIntentId': 1 },
    { unique: true, sparse: true, name: 'payment.stripePaymentIntentId_1' }
  );
  console.log('✅ Created unique index on payment.stripePaymentIntentId');

  // ---------------------------------------------------------------
  // Step 4: Verify
  // ---------------------------------------------------------------
  const after = await collection.indexes();
  const created = after.find(
    (i) => i.key['payment.stripePaymentIntentId'] === 1
  );
  console.log('✅ Index is now:', JSON.stringify(created));

  await mongoose.connection.close();
  console.log('\n🎉 Migration complete\n');
};

run().catch(async (error) => {
  console.error('❌ Migration failed:', error.message);
  await mongoose.connection.close();
  process.exit(1);
});
