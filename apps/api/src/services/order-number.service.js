import OrderCounter from '../models/platform/OrderCounter.model.js';

/**
 * Order number service
 *
 * Hands out the next order number for a store.
 *
 * WHY A COUNTER COLLECTION
 * ------------------------
 * Order numbers must be unique per store, and the unique index
 * `{ store, orderNumber }` enforces that. Generating the *next* number by
 * counting the store's orders looks equivalent but is not:
 *
 *     const count = await Order.countDocuments({ store });
 *     const orderNumber = `AUR-${String(count + 1).padStart(5, '0')}`;
 *
 * Two orders created in the same millisecond both read `count = 41` and both
 * compute `AUR-00042`. One of them is rejected by the index — a 500 *after*
 * the customer has already paid, and a gap in the sequence.
 *
 * `findOneAndUpdate({ $inc: { sequence: 1 } })` is atomic at the document
 * level, so every caller gets a different number. The index stays as a last
 * line of defence.
 *
 * The upsert has one race of its own: two first-time orders for a brand new
 * store can both try to insert the counter document, and the unique index on
 * `{ store: 1 }` rejects the loser with a duplicate key error. We catch that
 * and retry the increment *without* `upsert`, which then finds the document
 * the winner just created.
 */

/**
 * Get the next order sequence number for a store.
 *
 * @param {mongoose.Types.ObjectId|string} storeId
 * @returns {Promise<number>} The next number to use (1 for the first order)
 */
export const nextOrderSequence = async (storeId) => {
  try {
    const counter = await OrderCounter.findOneAndUpdate(
      { store: storeId },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return counter.sequence;
  } catch (error) {
    // Another request inserted the counter document first (duplicate key).
    // Retry without upsert — the document now exists.
    if (error.code === 11000) {
      const counter = await OrderCounter.findOneAndUpdate(
        { store: storeId },
        { $inc: { sequence: 1 } },
        { new: true }
      );
      if (counter) return counter.sequence;
    }
    throw error;
  }
};

/**
 * Build the order number for a store from a sequence number.
 *
 * @param {number} sequence
 * @param {string} [prefix] - Defaults to "AUR"
 * @returns {string} e.g. "AUR-00042"
 */
export const formatOrderNumber = (sequence, prefix = 'AUR') =>
  `${prefix}-${String(sequence).padStart(5, '0')}`;
