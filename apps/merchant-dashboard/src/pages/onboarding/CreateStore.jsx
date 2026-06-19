import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Logo from '../../components/ui/Logo';
import api, { getErrorMessage } from '../../services/api';

const createStoreSchema = z.object({
  name: z.string().min(2, 'Store name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  currency: z.string().length(3).default('USD'),
});

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];

const CreateStore = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createStoreSchema),
    defaultValues: { currency: 'USD' },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await api.post('/stores', data);
      toast.success('Store created successfully! 🎉');
      navigate('/dashboard');
    } catch (error) {
      // Special case: User already has a store
      if (error.response?.data?.error === 'STORE_EXISTS') {
        toast.error('You already have a store');
        navigate('/dashboard');
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-10 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white mb-4">
              <Store className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">
              Let's create your store
            </h1>
            <p className="text-gray-600">
              You can customize everything later. Let's start with the basics.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Store name"
              placeholder="e.g. John's Sneakers"
              error={errors.name?.message}
              helpText="This will be the name your customers see"
              {...register('name')}
            />

            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Tell customers what makes your store special..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-danger mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">
                Currency
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                {...register('currency')}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                You can change this later in settings
              </p>
            </div>

            {/* Plan info */}
            <div className="rounded-lg bg-primary-50 border border-primary-100 p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary-900">
                  You're starting on the Free plan
                </p>
                <p className="text-xs text-primary-700 mt-1">
                  14-day free trial of all premium features. Upgrade anytime.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isLoading}
            >
              Create my store
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? <a href="#" className="text-primary-600 hover:underline">Contact support</a>
        </p>
      </div>
    </div>
  );
};

export default CreateStore;