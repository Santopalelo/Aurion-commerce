import Product from '../../models/catalog/Product.model.js';
import Category from '../../models/catalog/Category.model.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * @route   GET /api/v1/storefront/:storeSlug
 * @desc    Get public store information
 * @access  Public
 */
export const getStoreInfo = asyncHandler(async (req, res) => {
  const { store } = req;

  // Build PUBLIC-SAFE response (only fields customers should see)
  const publicStore = {
    _id: store._id,
    name: store.name,
    slug: store.slug,
    description: store.description,
    logo: store.logo,
    favicon: store.favicon,
    banner: store.banner,
    currency: store.currency,
    currencySymbol: store.currencySymbol,
    language: store.language,
    timezone: store.timezone,

    // Public contact info
    contact: {
      email: store.contact?.email,
      phone: store.contact?.phone,
      address: store.contact?.address,
    },

    // Theme info for storefront styling
    activeTheme: store.activeTheme,
    themeSettings: store.themeSettings,

    // SEO
    seo: store.seo,

    // Social media links
    social: store.social,

    // Public policies
    policies: store.policies,

    // Storefront URL
    storefrontUrl: store.storefrontUrl,
  };

  // Get some quick stats for the homepage
  const [productCount, categoryCount, featuredProducts] = await Promise.all([
    Product.countDocuments({
      store: store._id,
      status: 'active',
    }),
    Category.countDocuments({
      store: store._id,
      isActive: true,
    }),
    Product.find({
      store: store._id,
      status: 'active',
      isFeatured: true,
    })
      .select('title slug price compareAtPrice images')
      .limit(8)
      .lean(),
  ]);

  return res.status(200).json(
    ApiResponse.success('Store info retrieved', {
      store: publicStore,
      stats: {
        productCount,
        categoryCount,
      },
      featuredProducts,
    })
  );
});