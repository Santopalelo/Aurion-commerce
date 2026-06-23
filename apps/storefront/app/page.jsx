import { Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Aurion Commerce — Build Your Online Store',
  description: 'The all-in-one commerce platform for modern entrepreneurs.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
      <div className="max-w-5xl mx-auto px-4 py-20">
        {/* Hero */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Powered by Aurion Commerce
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-dark mb-6 leading-tight">
            Build your dream store
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              with Aurion
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            The all-in-one commerce platform trusted by entrepreneurs worldwide.
            Sell anywhere, manage everything, grow without limits.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <a
              href="https://aurion-commerce-merchant-das.vercel.app/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Start your free trial
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="https://aurion-commerce-merchant-das.vercel.app/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-dark rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Merchant log in
            </a>
          </div>

          {/* Demo store link */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm">
            <ShoppingBag className="w-4 h-4 text-primary-600" />
            <span className="text-gray-600">Try a demo store:</span>
            <Link
              href="/johns-sneakers"
              className="text-primary-600 font-medium hover:underline"
            >
              /johns-sneakers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}