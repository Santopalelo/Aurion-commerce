'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { storefrontApi } from '../../../lib/api';
import ProductCard from '../../../components/product/ProductCard';

export default function SearchPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeSlug = params.storeSlug;
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  // Load store info (only once)
  useEffect(() => {
    storefrontApi
      .getStore(storeSlug)
      .then((data) => setStore(data.store))
      .catch(() => {});
  }, [storeSlug]);

  // Perform initial search from URL param
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced live search (as you type)
  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setTotal(0);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await storefrontApi.getProducts(storeSlug, {
        search: searchQuery,
        limit: 50,
      });
      setProducts(response.data || []);
      setTotal(response.meta?.total || 0);

      // Update URL without navigation
      const newUrl = `/${storeSlug}/search?q=${encodeURIComponent(searchQuery)}`;
      window.history.replaceState({}, '', newUrl);
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    setProducts([]);
    setTotal(0);
    setHasSearched(false);
    window.history.replaceState({}, '', `/${storeSlug}/search`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-dark mb-6">
          Search products
        </h1>

        {/* Search Bar with Button */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products..."
              autoFocus
              className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 bg-white text-dark focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-base"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Search</span>
              </>
            )}
          </button>
        </form>

        {/* Live search indicator */}
        {loading && query && (
          <p className="text-sm text-gray-500 mt-3 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Searching...
          </p>
        )}

        {/* Result count */}
        {!loading && hasSearched && query && (
          <p className="text-gray-600 mt-3">
            {total === 0 ? (
              <>No results found for <span className="font-semibold text-dark">"{query}"</span></>
            ) : (
              <>Found <span className="font-semibold text-dark">{total}</span> {total === 1 ? 'result' : 'results'} for <span className="font-semibold text-dark">"{query}"</span></>
            )}
          </p>
        )}
      </div>

      {/* Results */}
      {!hasSearched && !query ? (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark mb-2">
            Start typing to search
          </h3>
          <p className="text-gray-500 mb-6">
            Or browse our full catalog
          </p>
          <Link
            href={`/${storeSlug}/products`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Browse all products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : loading && products.length === 0 ? (
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Searching...</p>
        </div>
      ) : products.length === 0 && hasSearched ? (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-dark mb-2">
            No results found
          </h3>
          <p className="text-gray-500 mb-6">
            Try different keywords or browse all products
          </p>
          <Link
            href={`/${storeSlug}/products`}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              storeSlug={storeSlug}
              currencySymbol={store?.currencySymbol || '$'}
            />
          ))}
        </div>
      )}
    </div>
  );
}