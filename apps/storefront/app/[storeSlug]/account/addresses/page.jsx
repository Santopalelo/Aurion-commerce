'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus, MapPin, Star, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { storefrontApi } from '../../../../lib/api';
import useCustomerAuthStore from '../../../../lib/customerAuth';

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia',
  'Nigeria', 'Kenya', 'South Africa', 'Ghana',
  'India', 'France', 'Germany',
];

export default function AddressesPage() {
  const params = useParams();
  const storeSlug = params.storeSlug;
  const token = useCustomerAuthStore((state) => state.getToken(storeSlug));

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    label: 'home',
    firstName: '',
    lastName: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: 'United States',
    zipCode: '',
    phone: '',
    isDefault: false,
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    if (!token) return;
    try {
      const data = await storefrontApi.getMyAddresses(storeSlug, token);
      setAddresses(data);
    } catch (error) {
      toast.error('Could not load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await storefrontApi.addAddress(storeSlug, token, form);
      setAddresses(updated);
      setShowForm(false);
      setForm({
        label: 'home', firstName: '', lastName: '', line1: '', line2: '',
        city: '', state: '', country: 'United States', zipCode: '', phone: '', isDefault: false,
      });
      toast.success('Address added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      const updated = await storefrontApi.deleteAddress(storeSlug, token, id);
      setAddresses(updated);
      toast.success('Address deleted');
    } catch (error) {
      toast.error('Could not delete');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const updated = await storefrontApi.setDefaultAddress(storeSlug, token, id);
      setAddresses(updated);
      toast.success('Default address updated');
    } catch (error) {
      toast.error('Could not update');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark">Addresses</h1>
          <p className="text-gray-600 mt-1">
            Manage your shipping addresses
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add address
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-dark">Add new address</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="First name"
                required
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Last name"
                required
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <input
              type="text"
              name="line1"
              value={form.line1}
              onChange={handleChange}
              placeholder="Street address"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            />

            <input
              type="text"
              name="line2"
              value={form.line2}
              onChange={handleChange}
              placeholder="Apartment, suite (optional)"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                required
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="State/Province"
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                name="zipCode"
                value={form.zipCode}
                onChange={handleChange}
                placeholder="ZIP/Postal code"
                required
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone (optional)"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
            />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isDefault"
                checked={form.isDefault}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-primary-600"
              />
              <span className="text-sm text-gray-700">
                Set as default address
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save address'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses list */}
      {addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">
            No addresses saved
          </h3>
          <p className="text-gray-600 mb-4">
            Add an address for faster checkout
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Add address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address._id}
              className="bg-white rounded-2xl border border-gray-200 p-5 relative"
            >
              {address.isDefault && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full">
                  <Star className="w-3 h-3 fill-current" />
                  Default
                </span>
              )}

              <p className="font-semibold text-dark mb-2 capitalize">
                {address.label}
              </p>
              <div className="text-sm text-gray-700 space-y-0.5">
                <p>{address.firstName} {address.lastName}</p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}
                  {address.state && `, ${address.state}`} {address.zipCode}
                </p>
                <p>{address.country}</p>
                {address.phone && <p className="pt-1">{address.phone}</p>}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address._id)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Set as default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(address._id)}
                  className="ml-auto text-red-600 hover:bg-red-50 rounded p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}