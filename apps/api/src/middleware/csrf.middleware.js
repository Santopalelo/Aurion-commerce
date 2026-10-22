import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { isTrustedOrigin } from '../config/origins.js';

/**
 * CSRF Guard — Origin check for cookie-authenticated routes
 *
 * WHY THIS EXISTS
 * ---------------
 * The API (`*.onrender.com`) and the dashboards (`*.vercel.app`) are
 * different sites, so the refresh cookie has to be `SameSite=None; Secure`
 * (see `utils/generateToken.js`) for the browser to send it at all.
 *
 * `SameSite=None` means the browser no longer protects the cookie against
 * cross-site requests, so we have to do it ourselves.
 *
 * HOW IT WORKS
 * ------------
 * The browser sends an `Origin` header on every cross-origin request, and a
 * web page CANNOT forge it. So if the `Origin` is not one of ours, the
 * request did not come from our app and we refuse it.
 *
 * `Referer` is checked as a fallback for the rare case where `Origin` is
 * missing. If neither header is present the caller is not a browser
 * (curl, a server-to-server call, a mobile app) and there is no cookie
 * involved, so the request is allowed through.
 *
 * This is applied only to the routes that read or write the refresh cookie.
 * Routes authenticated by the `Authorization` header are not vulnerable —
 * a malicious page cannot set a header on someone else's request.
 */
export const requireTrustedOrigin = asyncHandler(async (req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    if (!isTrustedOrigin(origin)) {
      throw new ApiError(
        403,
        'Request origin is not allowed',
        'UNTRUSTED_ORIGIN'
      );
    }
    return next();
  }

  // No Origin — fall back to the Referer
  const referer = req.headers.referer;

  if (referer) {
    let refererOrigin;

    try {
      refererOrigin = new URL(referer).origin;
    } catch {
      throw new ApiError(
        403,
        'Request origin is not allowed',
        'UNTRUSTED_ORIGIN'
      );
    }

    if (!isTrustedOrigin(refererOrigin)) {
      throw new ApiError(
        403,
        'Request origin is not allowed',
        'UNTRUSTED_ORIGIN'
      );
    }
  }

  // No Origin and no Referer -> not a browser request, nothing to forge
  next();
});

export default requireTrustedOrigin;
