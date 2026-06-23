import Link from 'next/link';
import { Sparkles, Instagram, Facebook, Twitter } from 'lucide-react';

export default function Footer({ store }) {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Store info */}
          <div className="col-span-2">
            <h3 className="font-bold text-dark mb-3">{store.name}</h3>
            {store.description && (
              <p className="text-sm text-gray-600 max-w-md">
                {store.description}
              </p>
            )}
            {/* Social */}
            {(store.social?.instagram || store.social?.facebook || store.social?.twitter) && (
              <div className="flex gap-2 mt-4">
                {store.social?.instagram && (
                  <a
                    href={`https://instagram.com/${store.social.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center"
                  >
                    <Instagram className="w-4 h-4 text-gray-700" />
                  </a>
                )}
                {store.social?.facebook && (
                  <a
                    href={`https://facebook.com/${store.social.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center"
                  >
                    <Facebook className="w-4 h-4 text-gray-700" />
                  </a>
                )}
                {store.social?.twitter && (
                  <a
                    href={`https://twitter.com/${store.social.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center"
                  >
                    <Twitter className="w-4 h-4 text-gray-700" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold text-dark mb-3">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href={`/${store.slug}`} className="hover:text-primary-600">Home</Link></li>
              <li><Link href={`/${store.slug}/products`} className="hover:text-primary-600">All Products</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-semibold text-dark mb-3">Info</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {store.contact?.email && (
                <li>
                  <a href={`mailto:${store.contact.email}`} className="hover:text-primary-600">
                    Contact us
                  </a>
                </li>
              )}
              <li><a href="#" className="hover:text-primary-600">Shipping</a></li>
              <li><a href="#" className="hover:text-primary-600">Returns</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} {store.name}. All rights reserved.
          </p>
          <a
            href="https://aurioncommerce.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Aurion Commerce
          </a>
        </div>
      </div>
    </footer>
  );
}