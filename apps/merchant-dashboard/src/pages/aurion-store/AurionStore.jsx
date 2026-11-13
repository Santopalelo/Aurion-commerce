import { useState, useEffect } from 'react';
import { Check, ExternalLink, Download, Star, Palette, Zap, Shield, LayoutDashboard, Box, Sparkles } from 'lucide-react';

const themes = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean, modern, and conversion-focused. The safe choice for any store.',
    preview: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
    tags: ['Best for beginners', 'High conversion', 'Mobile optimized'],
    features: [
      'Responsive design',
      'Product quick view',
      'Sticky add to cart',
      'Trust badges',
      'Newsletter popup',
    ],
    rating: 4.9,
    installs: '12,000+',
    price: 'Free',
    isInstalled: true,
    isActive: true,
    category: 'general',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Distraction-free shopping experience. Let your products speak for themselves.',
    preview: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    tags: ['Fashion & lifestyle', 'High-end brands', 'Fast loading'],
    features: [
      'Full-width hero sections',
      'Minimal navigation',
      'Image-first product pages',
      'Subtle animations',
      'Dark mode support',
    ],
    rating: 4.8,
    installs: '3,400+',
    price: 'Free',
    isInstalled: false,
    isActive: false,
    category: 'fashion',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'High-impact design for stores that want to stand out. Big, beautiful, and bold.',
    preview: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop',
    tags: ['Electronics & gadgets', 'Flash sales', 'Visual storytelling'],
    features: [
      'Large hero carousel',
      'Countdown timers',
      'Video backgrounds',
      'Mega menu support',
      'Bundle displays',
    ],
    rating: 4.7,
    installs: '2,100+',
    price: 'Free',
    isInstalled: false,
    isActive: false,
    category: 'electronics',
  },
];

const ThemeCard = ({ theme, onInstall, onActivate, onPreview, activeTheme }) => {
  const isInstalled = theme.isInstalled;
  const isActive = theme.isActive;

  return (
    <div className="card relative overflow-hidden group">
      {/* Theme Preview */}
      <div className="aspect-video relative overflow-hidden">
        <img
          src={theme.preview}
          alt={theme.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quick Actions on Hover */}
        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
          {!isInstalled && (
            <button
              onClick={() => onInstall(theme.id)}
              className="btn-primary flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Install
            </button>
          )}
          {isInstalled && !isActive && (
            <button
              onClick={() => onActivate(theme.id)}
              className="btn-secondary flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Activate
            </button>
          )}
          <button
            onClick={() => onPreview(theme.id)}
            className="btn-ghost-white flex-1"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        {/* Active Badge */}
        {isActive && (
          <div className="absolute top-4 right-4">
            <span className="bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" />
              Active
            </span>
          </div>
        )}
      </div>

      {/* Theme Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-dark">{theme.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">{theme.rating}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {theme.tags.map((tag, i) => (
            <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {theme.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">{theme.installs} installs</span>
          <span className={`text-sm font-medium ${theme.price === 'Free' ? 'text-green-600' : 'text-primary-600'}`}>
            {theme.price}
          </span>
        </div>
      </div>
    </div>
  );
};

const AurionStore = () => {
  const [activeTab, setActiveTab] = useState('themes');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleInstall = (themeId) => {
    // In production, this would call an API to install the theme
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      theme.isInstalled = true;
      // Force re-render
      setSelectedTheme(theme);
      setTimeout(() => setSelectedTheme(null), 100);
    }
  };

  const handleActivate = (themeId) => {
    themes.forEach(t => t.isActive = t.id === themeId);
    setSelectedTheme(themes.find(t => t.id === themeId));
    setTimeout(() => setSelectedTheme(null), 100);
  };

  const handlePreview = (themeId) => {
    const theme = themes.find(t => t.id === themeId);
    setSelectedTheme(theme);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setSelectedTheme(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-600" />
            Aurion Store
          </h1>
          <p className="text-gray-600 mt-1">Discover themes and plugins to customize your store</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <ExternalLink className="w-4 h-4 mr-2" />
            Browse Marketplace
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'themes'}
          onClick={() => setActiveTab('themes')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'themes'
              ? 'bg-white text-dark shadow-sm'
              : 'text-gray-600 hover:text-dark'
          }`}
        >
          <Palette className="w-4 h-4 inline mr-2" /> Themes
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'plugins'}
          onClick={() => setActiveTab('plugins')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'plugins'
              ? 'bg-white text-dark shadow-sm'
              : 'text-gray-600 hover:text-dark'
          }`}
        >
          <Box className="w-4 h-4 inline mr-2" /> Plugins
        </button>
      </div>

      {/* Themes Tab */}
      {activeTab === 'themes' && (
        <div className="space-y-8">
          {/* Active Theme Banner */}
          <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
            <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white shadow-lg flex items-center justify-center">
                  <LayoutDashboard className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark">Currently Active: Default Theme</h3>
                  <p className="text-sm text-gray-600 mt-1">Your store is using the Default theme. Customize it in Settings or switch to another theme below.</p>
                </div>
              </div>
              <button className="btn-secondary whitespace-nowrap">
                <Palette className="w-4 h-4 mr-2" />
                Customize Theme
              </button>
            </div>
          </div>

          {/* Available Themes */}
          <div>
            <h2 className="text-lg font-semibold text-dark mb-4">Available Themes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  onInstall={handleInstall}
                  onActivate={handleActivate}
                  onPreview={handlePreview}
                  activeTheme={themes.find(t => t.isActive)}
                />
              ))}
            </div>
          </div>

          {/* Coming Soon: Plugins Section */}
          <div className="card text-center py-12">
            <Shield className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-dark mb-2">Plugins Coming Soon</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              We're building a plugin marketplace for payments, shipping, marketing, and more. 
              Stay tuned for integrations with your favorite tools.
            </p>
            <button className="btn-primary">
              <Zap className="w-4 h-4 mr-2" />
              Notify Me
            </button>
          </div>
        </div>
      )}

      {/* Plugins Tab */}
      {activeTab === 'plugins' && (
        <div className="card text-center py-16">
          <Box className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-dark mb-2">Plugin Marketplace</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            Extend your store with plugins for payments, shipping, marketing, analytics, and more. 
            The plugin marketplace is under development.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            {[
              { name: 'Payments', icon: '💳', items: ['Stripe', 'PayPal', 'Apple Pay'] },
              { name: 'Shipping', icon: '📦', items: ['FedEx', 'UPS', 'DHL'] },
              { name: 'Marketing', icon: '📧', items: ['Klaviyo', 'Mailchimp', 'SMS'] },
            ].map((cat, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">{cat.icon}</div>
                <h4 className="font-medium text-dark">{cat.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{cat.items.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Theme Preview Modal */}
      {previewOpen && selectedTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={closePreview}>
          <div className="absolute inset-0 bg-black/50" onClick={closePreview} />
          <div className="relative bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark">{selectedTheme.name} Preview</h3>
              <button onClick={closePreview} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-60px)]">
              <img
                src={selectedTheme.preview}
                alt={selectedTheme.name}
                className="w-full rounded-lg shadow-lg mb-6"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-dark mb-3">Features</h4>
                  <ul className="space-y-2">
                    {selectedTheme.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-dark mb-3">Best For</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTheme.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 text-sm bg-primary-50 text-primary-700 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                {!selectedTheme.isInstalled && (
                  <button onClick={() => { handleInstall(selectedTheme.id); closePreview(); }} className="btn-primary flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Install Theme
                  </button>
                )}
                {selectedTheme.isInstalled && !selectedTheme.isActive && (
                  <button onClick={() => { handleActivate(selectedTheme.id); closePreview(); }} className="btn-primary flex-1">
                    <Check className="w-4 h-4 mr-2" />
                    Activate Theme
                  </button>
                )}
                {selectedTheme.isActive && (
                  <button className="btn-primary flex-1" disabled>
                    <Check className="w-4 h-4 mr-2" />
                    Currently Active
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AurionStore;