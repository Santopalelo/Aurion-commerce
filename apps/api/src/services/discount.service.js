import Discount from '../models/marketing/Discount.model.js';
import Order from '../models/orders/Order.model.js';
import Product from '../models/catalog/Product.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Discount service
 *
 * The `Discount` model, its CRUD API, its permissions, its validator and the
 * merchant dashboard UI all existed from day one. What did NOT exist was
 * anything that actually *applied* a discount at checkout — the checkout
 * controller never imported the model, so a merchant's "20% OFF" code did
 * nothing at all, silently.
 *
 * This module is the missing half: it decides whether a code may be used,
 * what it is worth, and it is the only place that answers that question.
 *
 * SECURITY NOTE
 * -------------
 * A discount is never trusted from the client. The client may *suggest* a
 * code; the server looks it up, re-checks every condition against the real
 * cart, and recomputes the amount. The client's number is discarded.
 */

/**
 * Round to 2 decimals.
 *
 * @param {number} value
 * @returns {number}
 */
const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * The product id of a line item.
 *
 * The cart has two shapes: the checkout controller calls its line items
 * `productId`, the CheckoutSession snapshot calls them `product`. Both are
 * line items, so both are accepted here.
 *
 * @param {object} item
 * @returns {string}
 */
const productIdOf = (item) => {
  const id = item?.product ?? item?.productId;
  return id ? id.toString() : '';
};

/**
 * The line items a discount applies to, given its `conditions.appliesTo`.
 *
 * @param {object} discount
 * @param {Array} items - The verified line items
 * @param {object} productIndex - Map of productId → product document
 * @returns {Array} The subset of items the discount applies to
 */
const selectEligibleItems = (discount, items, productIndex) => {
  const { appliesTo } = discount.conditions;

  if (!appliesTo || appliesTo === 'all_products') return items;

  if (appliesTo === 'specific_products') {
    const allowed = new Set(
      (discount.conditions.products || []).map((id) => id.toString())
    );
    return items.filter((item) => allowed.has(productIdOf(item)));
  }

  if (appliesTo === 'specific_categories') {
    const allowed = new Set(
      (discount.conditions.categories || []).map((id) => id.toString())
    );
    return items.filter((item) => {
      const product = productIndex.get(productIdOf(item));
      const categoryIds = product?.category
        ? [].concat(product.category).map((c) => c.toString())
        : [];
      return categoryIds.some((id) => allowed.has(id));
    });
  }

  if (appliesTo === 'specific_collections') {
    const allowed = new Set(
      (discount.conditions.collections || []).map((id) => id.toString())
    );
    return items.filter((item) => {
      const product = productIndex.get(productIdOf(item));
      const collectionIds = product?.collections
        ? [].concat(product.collections).map((c) => c.toString())
        : [];
      return collectionIds.some((id) => allowed.has(id));
    });
  }

  return items;
};

/**
 * How many times has this customer used this discount?
 *
 * @param {string|ObjectId} discountId
 * @param {string|ObjectId} customerId
 * @returns {Promise<number>}
 */
const countCustomerUsage = async (discountId, customerId) => {
  if (!customerId) return 0;
  return Order.countDocuments({
    'discount.discountId': discountId,
    customer: customerId,
  });
};

/**
 * Has this customer ever ordered from this store?
 *
 * @param {string|ObjectId} storeId
 * @param {string|ObjectId} customerId
 * @returns {Promise<boolean>}
 */
const isFirstTimeCustomer = async (storeId, customerId) => {
  if (!customerId) return true;
  const count = await Order.countDocuments({
    store: storeId,
    customer: customerId,
  });
  return count === 0;
};

/**
 * Look up a discount by code and check that it may be used right now.
 *
 * Every rejection is an `ApiError` with a stable code, so the storefront can
 * tell the customer what went wrong.
 *
 * @param {object} options
 * @param {object} options.store
 * @param {string} options.code
 * @param {number} options.subtotal
 * @param {number} [options.totalQuantity]
 * @param {string|ObjectId} [options.customerId]
 * @returns {Promise<object>} The Discount document
 * @throws {ApiError} 400 when the code cannot be used
 */
export const getApplicableDiscount = async ({
  store,
  code,
  subtotal,
  totalQuantity = 0,
  customerId = null,
}) => {
  if (!code || !String(code).trim()) {
    throw new ApiError(400, 'Enter a discount code', 'DISCOUNT_CODE_REQUIRED');
  }

  const discount = await Discount.findOne({
    store: store._id,
    code: String(code).trim().toUpperCase(),
  });

  if (!discount) {
    throw new ApiError(400, 'That discount code is not valid', 'DISCOUNT_NOT_FOUND');
  }

  if (!discount.isActive) {
    throw new ApiError(400, 'That discount is no longer active', 'DISCOUNT_INACTIVE');
  }

  const now = new Date();
  if (discount.startsAt && discount.startsAt > now) {
    throw new ApiError(400, 'That discount is not active yet', 'DISCOUNT_NOT_STARTED');
  }
  if (discount.expiresAt && discount.expiresAt < now) {
    throw new ApiError(400, 'That discount has expired', 'DISCOUNT_EXPIRED');
  }

  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    throw new ApiError(400, 'That discount has reached its usage limit', 'DISCOUNT_MAXED_OUT');
  }

  const { minimumOrderAmount, minimumQuantity, customerEligibility } =
    discount.conditions;

  if (minimumOrderAmount && subtotal < minimumOrderAmount) {
    throw new ApiError(
      400,
      `This discount requires a minimum order of ${minimumOrderAmount}`,
      'DISCOUNT_MINIMUM_ORDER'
    );
  }

  if (minimumQuantity && totalQuantity < minimumQuantity) {
    throw new ApiError(
      400,
      `This discount requires at least ${minimumQuantity} item${minimumQuantity > 1 ? 's' : ''}`,
      'DISCOUNT_MINIMUM_QUANTITY'
    );
  }

  if (customerEligibility === 'specific_customers') {
    const eligible = (discount.conditions.eligibleCustomers || []).map((id) =>
      id.toString()
    );
    if (!customerId || !eligible.includes(customerId.toString())) {
      throw new ApiError(
        400,
        'This discount is not available for your account',
        'DISCOUNT_NOT_ELIGIBLE'
      );
    }
  }

  if (customerEligibility === 'first_time_only') {
    const firstTime = await isFirstTimeCustomer(store._id, customerId);
    if (!firstTime) {
      throw new ApiError(
        400,
        'This discount is only available on your first order',
        'DISCOUNT_FIRST_ORDER_ONLY'
      );
    }
  }

  if (discount.usageLimitPerCustomer && customerId) {
    const used = await countCustomerUsage(discount._id, customerId);
    if (used >= discount.usageLimitPerCustomer) {
      throw new ApiError(
        400,
        'You have already used this discount',
        'DISCOUNT_ALREADY_USED'
      );
    }
  }

  return discount;
};

/**
 * Work out what a discount is worth.
 *
 * Returns the amount saved and whether the discount also removes shipping.
 * A `free_shipping` discount saves 0 on the subtotal and zeroes the shipping
 * instead — the caller applies that.
 *
 * @param {object} options
 * @param {object} options.discount
 * @param {Array} options.items - The verified line items
 * @param {number} options.subtotal
 * @param {object} [options.productIndex] - Map of productId → product doc
 * @returns {Promise<{ amount: number, freeShipping: boolean, eligibleSubtotal: number }>}
 */
export const calculateDiscount = async ({ discount, items, subtotal, productIndex }) => {
  const index =
    productIndex ||
    new Map(
      (
        await Product.find({
          _id: { $in: items.map(productIdOf).filter(Boolean) },
        })
      ).map((product) => [product._id.toString(), product])
    );

  const eligible = selectEligibleItems(discount, items, index);

  const eligibleSubtotal = round(
    eligible.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  if (discount.type === 'free_shipping') {
    return { amount: 0, freeShipping: true, eligibleSubtotal };
  }

  if (discount.type === 'percentage') {
    const amount = round((eligibleSubtotal * discount.value) / 100);
    return {
      amount: Math.min(amount, eligibleSubtotal),
      freeShipping: false,
      eligibleSubtotal,
    };
  }

  if (discount.type === 'fixed_amount') {
    const amount = round(discount.value);
    return {
      amount: Math.min(amount, eligibleSubtotal),
      freeShipping: false,
      eligibleSubtotal,
    };
  }

  if (discount.type === 'buy_x_get_y') {
    const { buyQuantity = 2, getQuantity = 1 } = discount.buyXGetY || {};
    const {
      getDiscountType = 'free',
      getDiscountValue = 100,
    } = discount.buyXGetY || {};

    // Group the eligible items by product so "buy 2 get 1" is counted per
    // product, not across the whole cart.
    const byProduct = new Map();
    for (const item of eligible) {
      const key = productIdOf(item);
      const current = byProduct.get(key) || { price: item.price, quantity: 0 };
      current.quantity += item.quantity;
      byProduct.set(key, current);
    }

    let amount = 0;

    for (const { price, quantity } of byProduct.values()) {
      // Every (buy + get) units earns one "get" group.
      const groups = Math.floor(quantity / (buyQuantity + getQuantity));
      if (groups < 1) continue;

      const freeUnits = groups * getQuantity;

      if (getDiscountType === 'free') {
        amount += price * freeUnits;
      } else if (getDiscountType === 'percentage') {
        amount += round((price * freeUnits * getDiscountValue) / 100);
      } else if (getDiscountType === 'fixed_amount') {
        amount += round(getDiscountValue * freeUnits);
      }
    }

    const capped = Math.min(round(amount), eligibleSubtotal);
    return { amount: capped, freeShipping: false, eligibleSubtotal };
  }

  return { amount: 0, freeShipping: false, eligibleSubtotal };
};

/**
 * Record that a discount was used.
 *
 * Called once the order exists, so a failed payment never burns a use.
 *
 * @param {string|ObjectId} discountId
 * @returns {Promise<void>}
 */
export const recordDiscountUsage = async (discountId) => {
  if (!discountId) return;
  await Discount.updateOne({ _id: discountId }, { $inc: { usageCount: 1 } });
};
