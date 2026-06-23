import { notFound } from 'next/navigation';
import { storefrontApi } from '../../lib/api';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export async function generateMetadata({ params }) {
  try {
    const { store } = await storefrontApi.getStore(params.storeSlug);
    return {
      title: store.seo?.metaTitle || store.name,
      description: store.seo?.metaDescription || store.description || `Welcome to ${store.name}`,
    };
  } catch {
    return { title: 'Store Not Found' };
  }
}

export default async function StoreLayout({ children, params }) {
  let storeData;

  try {
    storeData = await storefrontApi.getStore(params.storeSlug);
  } catch (error) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar store={storeData.store} />
      <main className="flex-1">{children}</main>
      <Footer store={storeData.store} />
    </div>
  );
}