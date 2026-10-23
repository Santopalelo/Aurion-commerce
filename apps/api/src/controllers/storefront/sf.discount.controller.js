import Product from '../../models/catalog/Product.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { calculateTotals } from '../../services/pricing.service.js';
import {
  getApplicableDiscount,
  calculateDiscount,
} from '../../services/discount.service.js';

/**
 * @route   POST /api/v1/storefront/:storeSlug/discount/validate
 * @desc    Check a promo code and preview the new total
 * @access  Public
 *
 * Body:
 *   code: string
 *   items: [{ productId, quantity }]  (optional — needed for cart rules)
 *
 * This is a PREVIEW. It tells the customer what the code is worth so the
 * cart can show the new total before they pay. The amount that is actually
 * charged is recomputed in `createPaymentIntent`, from the verified cart —
 * a client cannot talk its way into a discount.
 */
export const validateDiscountCode = asyncHandler(async (req, res) => {
  const { store } = req;
  const { code, items = [] } = req.body;

  // ============================================
  // Rebuild the cart from the store's own products
  // ============================================
  let lineItems = [];
  let subtotal = 0;

  if (items.length > 0) {
    const productIds = items.map((item) => item.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      store: store._id,
      status: 'active',
    });

    for (const cartItem of items) {
      const product = products.find(
        (p) => p._id.toString() === cartItem.productId
      );
      if (!product) continue;

      const quantity = Number(cartItem.quantity);
      if (!quantity || quantity < 1) continue;

      const lineTotal = product.price * quantity;
      subtotal += lineTotal;

      lineItems.push({
        product: product._id,
        price: product.price,
        quantity,
      });
    }
  }

  // ============================================
  // Check the code
  //
  // With no code this is just a totals preview — the storefront calls it on
  // every cart change so the summary always shows what the server will
  // charge.
  // ============================================
  if (!code || !String(code).trim()) {
    const totals = calculateTotals({
      store,
      subtotal,
      requiresShipping: true,
      currency: store.currency || 'USD',
    });

    return res.status(200).json(
      ApiResponse.success('No discount applied', {
        discount: null,
        breakdown: {
          subtotal: totals.subtotal,
          discount: 0,
          shipping: totals.shippingCost,
          tax: totals.taxAmount,
          total: totals.total,
          currency: totals.currency,
        },
      })
    );
  }

  const discount = await getApplicableDiscount({
    store,
    code,
    subtotal,
    totalQuantity: lineItems.reduce((sum, item) => sum + item.quantity, 0),
  });

  const result = await calculateDiscount({
    discount,
    items: lineItems,
    subtotal,
  });

  const requiresShipping = true;
  const totals = calculateTotals({
    store,
    subtotal,
    discountAmount: result.amount,
    freeShipping: result.freeShipping,
    requiresShipping,
    currency: store.currency || 'USD',
  });

  return res.status(200).json(
    ApiResponse.success('Discount applied', {
      discount: {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        amountSaved: result.amount,
        title: discount.title || '',
        description: discount.description || '',
      },
      breakdown: {
        subtotal: totals.subtotal,
        discount: totals.discountAmount,
        shipping: totals.shippingCost,
        tax: totals.taxAmount,
        total: totals.total,
        currency: totals.currency,
      },
    })
  );
});
