import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Cart Store
 *
 * Each store (merchant) has its own separate cart.
 * Cart is keyed by storeSlug so customers can shop multiple stores.
 *
 * Persists to localStorage automatically.
 */

const useCartStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================
      // Structure: { 'store-slug': [items...] }
      carts: {},

      // UI state
      isDrawerOpen: false,

      // ============================================
      // ACTIONS
      // ============================================

      /**
       * Open/close the cart drawer
       */
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () =>
        set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      /**
       * Add an item to a specific store's cart
       */
      addItem: (storeSlug, product, quantity = 1) => {
        set((state) => {
          const storeCart = state.carts[storeSlug] || [];

          // Check if item already exists
          const existingIndex = storeCart.findIndex(
            (item) => item.productId === product._id
          );

          let newCart;
          if (existingIndex > -1) {
            // Update existing item quantity
            newCart = [...storeCart];
            newCart[existingIndex] = {
              ...newCart[existingIndex],
              quantity: newCart[existingIndex].quantity + quantity,
            };
          } else {
            // Add new item
            const primaryImage =
              product.images?.find((img) => img.isPrimary) ||
              product.images?.[0];

            newCart = [
              ...storeCart,
              {
                productId: product._id,
                title: product.title,
                slug: product.slug,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                image: primaryImage?.url || null,
                quantity,
                sku: product.sku || null,
                // For inventory checks
                trackInventory: product.trackInventory,
                inventoryQuantity: product.inventoryQuantity,
                allowBackorder: product.allowBackorder,
                addedAt: new Date().toISOString(),
              },
            ];
          }

          return {
            carts: {
              ...state.carts,
              [storeSlug]: newCart,
            },
          };
        });
      },

      /**
       * Update quantity of a specific item
       */
      updateQuantity: (storeSlug, productId, quantity) => {
        if (quantity <= 0) {
          return get().removeItem(storeSlug, productId);
        }

        set((state) => {
          const storeCart = state.carts[storeSlug] || [];
          const newCart = storeCart.map((item) =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          );

          return {
            carts: {
              ...state.carts,
              [storeSlug]: newCart,
            },
          };
        });
      },

      /**
       * Remove an item from cart
       */
      removeItem: (storeSlug, productId) => {
        set((state) => {
          const storeCart = state.carts[storeSlug] || [];
          const newCart = storeCart.filter(
            (item) => item.productId !== productId
          );

          return {
            carts: {
              ...state.carts,
              [storeSlug]: newCart,
            },
          };
        });
      },

      /**
       * Clear entire cart for a store
       */
      clearCart: (storeSlug) => {
        set((state) => {
          const newCarts = { ...state.carts };
          delete newCarts[storeSlug];
          return { carts: newCarts };
        });
      },

      // ============================================
      // SELECTORS (computed values)
      // ============================================

      /**
       * Get cart for a specific store
       */
      getCart: (storeSlug) => {
        return get().carts[storeSlug] || [];
      },

      /**
       * Get total item count for a store
       */
      getItemCount: (storeSlug) => {
        const cart = get().carts[storeSlug] || [];
        return cart.reduce((sum, item) => sum + item.quantity, 0);
      },

      /**
       * Get subtotal for a store's cart
       */
      getSubtotal: (storeSlug) => {
        const cart = get().carts[storeSlug] || [];
        return cart.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },

      /**
       * Get savings (compareAtPrice - price)
       */
      getSavings: (storeSlug) => {
        const cart = get().carts[storeSlug] || [];
        return cart.reduce((sum, item) => {
          if (item.compareAtPrice && item.compareAtPrice > item.price) {
            return sum + (item.compareAtPrice - item.price) * item.quantity;
          }
          return sum;
        }, 0);
      },
    }),
    {
      name: 'aurion-cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist carts, not UI state
      partialize: (state) => ({ carts: state.carts }),
    }
  )
);

export default useCartStore;