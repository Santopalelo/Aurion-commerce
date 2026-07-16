import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Store, Mail, Phone, Globe, MapPin, Instagram,
  Facebook, Twitter, Loader2, Save, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { storeService } from '../../services/store.service';
import { getErrorMessage } from '../../services/api';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
];

const Section = ({ title, description, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <div className="mb-5 pb-5 border-b border-gray-100">
      <h3 className="font-bold text-dark">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      )}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const GeneralSettings = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-store'],
    queryFn: storeService.getMyStore,
  });

  const [form, setForm] = useState({
    name: '',
    description: '',
    currency: 'USD',
    contact: {
      email: '',
      phone: '',
      address: {
        line1: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      },
    },
    social: {
      instagram: '',
      facebook: '',
      twitter: '',
    },
    policies: {
      refund: '',
      shipping: '',
      terms: '',
      privacy: '',
    },
  });

  useEffect(() => {
    if (data?.store) {
      const s = data.store;
      setForm({
        name: s.name || '',
        description: s.description || '',
        currency: s.currency || 'USD',
        contact: {
          email: s.contact?.email || '',
          phone: s.contact?.phone || '',
          address: {
            line1: s.contact?.address?.line1 || '',
            city: s.contact?.address?.city || '',
            state: s.contact?.address?.state || '',
            country: s.contact?.address?.country || '',
            zipCode: s.contact?.address?.zipCode || '',
          },
        },
        social: {
          instagram: s.social?.instagram || '',
          facebook: s.social?.facebook || '',
          twitter: s.social?.twitter || '',
        },
        policies: {
          refund: s.policies?.refund || '',
          shipping: s.policies?.shipping || '',
          terms: s.policies?.terms || '',
          privacy: s.policies?.privacy || '',
        },
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload) => storeService.updateMyStore(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-store'] });
      toast.success('Settings saved!');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const store = data?.store;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 sticky top-0 z-20 bg-gray-soft py-3 -mt-6 -mx-6 px-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-dark">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your store information</p>
        </div>
        <Button type="submit" loading={updateMutation.isPending}>
          <Save className="w-4 h-4" />
          Save changes
        </Button>
      </div>

      {/* Store URL info */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary-900">Your store URL</p>
          <a
            href={`https://aurion-commerce-storefront.vercel.app/${store?.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-700 hover:underline break-all"
          >
            aurion-commerce-storefront.vercel.app/{store?.slug}
          </a>
        </div>
      </div>

      {/* Store Info */}
      <Section title="Store information" description="Basic details about your store">
        <Input
          label="Store name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Your store name"
        />

        <div>
          <label className="block text-sm font-medium text-dark mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Tell customers what makes your store special..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark mb-1.5">
            Currency
          </label>
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="input"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact information" description="How customers can reach you">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            icon={Mail}
            value={form.contact.email}
            onChange={(e) =>
              setForm({ ...form, contact: { ...form.contact, email: e.target.value } })
            }
            placeholder="contact@yourstore.com"
          />
          <Input
            label="Phone"
            icon={Phone}
            value={form.contact.phone}
            onChange={(e) =>
              setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })
            }
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-dark mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Business address
          </p>
          <div className="space-y-3">
            <Input
              label="Street address"
              value={form.contact.address.line1}
              onChange={(e) =>
                setForm({
                  ...form,
                  contact: {
                    ...form.contact,
                    address: { ...form.contact.address, line1: e.target.value },
                  },
                })
              }
              placeholder="123 Main St"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City"
                value={form.contact.address.city}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contact: {
                      ...form.contact,
                      address: { ...form.contact.address, city: e.target.value },
                    },
                  })
                }
              />
              <Input
                label="State"
                value={form.contact.address.state}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contact: {
                      ...form.contact,
                      address: { ...form.contact.address, state: e.target.value },
                    },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Country"
                value={form.contact.address.country}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contact: {
                      ...form.contact,
                      address: { ...form.contact.address, country: e.target.value },
                    },
                  })
                }
              />
              <Input
                label="ZIP code"
                value={form.contact.address.zipCode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contact: {
                      ...form.contact,
                      address: { ...form.contact.address, zipCode: e.target.value },
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Social */}
      <Section title="Social media" description="Link your social accounts">
        <Input
          label="Instagram username"
          icon={Instagram}
          value={form.social.instagram}
          onChange={(e) => setForm({ ...form, social: { ...form.social, instagram: e.target.value } })}
          placeholder="@yourhandle"
        />
        <Input
          label="Facebook page"
          icon={Facebook}
          value={form.social.facebook}
          onChange={(e) => setForm({ ...form, social: { ...form.social, facebook: e.target.value } })}
          placeholder="yourbusiness"
        />
        <Input
          label="Twitter/X handle"
          icon={Twitter}
          value={form.social.twitter}
          onChange={(e) => setForm({ ...form, social: { ...form.social, twitter: e.target.value } })}
          placeholder="@yourhandle"
        />
      </Section>

      {/* Policies */}
      <Section title="Store policies" description="These will be shown on your storefront">
        <div>
          <label className="block text-sm font-medium text-dark mb-1.5">
            Refund policy
          </label>
          <textarea
            rows={3}
            value={form.policies.refund}
            onChange={(e) =>
              setForm({ ...form, policies: { ...form.policies, refund: e.target.value } })
            }
            placeholder="e.g. 30-day money-back guarantee..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark mb-1.5">
            Shipping policy
          </label>
          <textarea
            rows={3}
            value={form.policies.shipping}
            onChange={(e) =>
              setForm({ ...form, policies: { ...form.policies, shipping: e.target.value } })
            }
            placeholder="e.g. Free shipping on orders over $50..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
          />
        </div>
      </Section>
    </form>
  );
};

export default GeneralSettings;