/**
 * Wraps async route handlers to catch errors automatically
 *
 * Without this:
 *   router.get('/', async (req, res) => {
 *     try {
 *       // logic
 *     } catch (err) {
 *       next(err);  // We'd have to do this in EVERY route
 *     }
 *   });
 *
 * With this:
 *   router.get('/', asyncHandler(async (req, res) => {
 *     // logic — errors caught automatically
 *   }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;