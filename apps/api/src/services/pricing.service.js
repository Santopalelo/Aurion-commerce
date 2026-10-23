/**
 * Pricing service
 *
 * ONE place that turns a cart into a total.
 *
 * WHY A SERVICE
 * -------------
 * The shipping and tax rules used to be hardcoded inline in the checkout
 * controller:
 *
 *     const shippingCost = subtotal >= 50 ? 0 : 5;
 *     const taxAmount = subtotal * 0.08;
 *
 * and the same two lines were duplicated in a second controller. That is two
 * ways for the amount *charged* and the amount *recorded* to drift apart —
 * silent financial corruption, and impossible to change per store.
 *
 * Everything that touches money now goes through `calculateTotals`:
 *
 *   1. `createPaymentIntent` — the amount Stripe charges
 *   2. `checkout.service.finalizeCheckout` — the amount stored on the order
 *   3. the storefront's cart preview — what the customer is shown
 *
 * They all read the same store settings, so they cannot disagree.
 *
 * ROUNDING
 * --------
 * Every intermediate value is rounded to 2 decimals. Money is rounded to the
 * cent at every step, otherwise `8% of 19.99` gives 1.5992 and the total
 * ends up a fraction of a cent off from what Stripe charges.
 */

/**
 * Round to 2 decimals, avoiding the float artefacts of `toFixed` returning
 * a string.
 *
 * @param {number} value
 * @returns {number}
 */
const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * The store's shipping rules, with safe defaults for stores that predate
 * the settings.
 *
 * @param {object} store
 * @returns {{ flatRate: number, freeShippingThreshold: number, freeOverThreshold: boolean }}
 */
export const getShippingSettings = (store) => {
  const shipping = store?.shipping || {};
  return {
    flatRate: Number.isFinite(shipping.flatRate) ? shipping.flatRate : 5,
    freeShippingThreshold: Number.isFinite(shipping.freeShippingThreshold)
      ? shipping.freeShippingThreshold
      : 50,
    freeOverThreshold: shipping.freeOverThreshold !== false,
  };
};

/**
 * The store's tax rules, with safe defaults for stores that predate the
 * settings.
 *
 * @param {object} store
 * @returns {{ rate: number, inclusive: boolean, label: string }}
 */
export const getTaxSettings = (store) => {
  const tax = store?.tax || {};
  return {
    rate: Number.isFinite(tax.rate) ? tax.rate : 0.08,
    inclusive: Boolean(tax.inclusive),
    label: tax.label || 'Tax',
  };
};

/**
 * Calculate shipping for a subtotal.
 *
 * @param {object} options
 * @param {object} options.store
 * @param {number} options.subtotal
 * @param {boolean} [options.requiresShipping] - false for a cart of only
 *   digital goods, which never pays shipping.
 * @returns {number}
 */
export const calculateShipping = ({ store, subtotal, requiresShipping = true }) => {
  if (!requiresShipping) return 0;

  const { flatRate, freeShippingThreshold, freeOverThreshold } =
    getShippingSettings(store);

  if (freeOverThreshold && freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
    return 0;
  }

  return round(flatRate);
};

/**
 * Calculate tax for a taxable amount.
 *
 * @param {object} options
 * @param {object} options.store
 * @param {number} options.amount - The amount the tax applies to
 * @returns {number}
 */
export const calculateTax = ({ store, amount }) => {
  const { rate, inclusive } = getTaxSettings(store);

  if (!rate) return 0;
  if (inclusive) return 0; // already inside the price

  return round(amount * rate);
};

/**
 * Turn a cart into a full price breakdown.
 *
 * The order of operations is deliberate:
 *
 *   subtotal
 *     → discount      (a percentage applies to the subtotal)
 *     → shipping      (free-shipping thresholds compare against the
 *                      DISCOUNTED subtotal, which is what the customer
 *                      actually pays)
 *     → tax           (applies to the discounted subtotal, not to shipping)
 *     → total
 *
 * @param {object} options
 * @param {object} options.store - The store, for its tax/shipping settings
 * @param {number} options.subtotal - Sum of the line items
 * @param {number} [options.discountAmount] - Already-calculated discount
 * @param {boolean} [options.freeShipping] - Force the shipping to zero
 *   (a `free_shipping` discount)
 * @param {boolean} [options.requiresShipping] - false for digital-only carts
 * @param {string} [options.currency]
 * @returns {{ subtotal: number, discountAmount: number, shippingCost: number, taxAmount: number, total: number, currency: string, requiresShipping: boolean }}
 */
export const calculateTotals = ({
  store,
  subtotal,
  discountAmount = 0,
  freeShipping = false,
  requiresShipping = true,
  currency,
}) => {
  const base = round(Math.max(0, Number(subtotal) || 0));
  const discount = round(Math.max(0, Number(discountAmount) || 0));

  // The discount can never exceed the subtotal.
  const cappedDiscount = Math.min(discount, base);
  const discountedSubtotal = round(base - cappedDiscount);

  const shippingCost = freeShipping
    ? 0
    : calculateShipping({
        store,
        subtotal: discountedSubtotal,
        requiresShipping,
      });

  const taxAmount = calculateTax({ store, amount: discountedSubtotal });

  const total = round(discountedSubtotal + shippingCost + taxAmount);

  return {
    subtotal: base,
    discountAmount: cappedDiscount,
    shippingCost,
    taxAmount,
    total,
    currency: currency || store?.currency || 'USD',
    requiresShipping,
  };
};
