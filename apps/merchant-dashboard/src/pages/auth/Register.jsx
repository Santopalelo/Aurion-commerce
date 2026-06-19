import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Logo from '../../components/ui/Logo';
import useAuthStore from '../../store/useAuthStore';
import { authService } from '../../services/auth.service';
import { getErrorMessage } from '../../services/api';

// ============================================
// VALIDATION SCHEMA
// ============================================
const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

const Register = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  // Password strength indicators
  const passwordChecks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
  ];

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { user, accessToken } = await authService.register(data);
      setAuth(user, accessToken);
      toast.success(`Welcome to Aurion, ${user.firstName}!`);
      navigate('/onboarding/create-store');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE — Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Start selling in minutes, not weeks
          </h2>
          <p className="text-lg text-white/80 mb-10">
            Join thousands of merchants growing their business with Aurion.
            No credit card required. 14-day free trial.
          </p>

          <div className="space-y-4">
            {[
              'Free to start, scale as you grow',
              'No coding or design skills needed',
              'Secure payments worldwide',
              'World-class customer support',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-20">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8">
            <Logo size="lg" />
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-dark mb-2">
              Create your account
            </h1>
            <p className="text-gray-600">
              Get started with your free Aurion store
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                placeholder="John"
                icon={User}
                error={errors.firstName?.message}
                {...register('firstName')}
              />

              <Input
                label="Last name"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+1 (555) 123-4567"
              icon={Phone}
              error={errors.phone?.message}
              {...register('phone')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Create a strong password"
              icon={Lock}
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Password strength indicators */}
            {password && (
              <div className="grid grid-cols-2 gap-1.5">
                {passwordChecks.map((check) => (
                  <div
                    key={check.label}
                    className={`flex items-center gap-1.5 text-xs ${
                      check.valid ? 'text-success' : 'text-gray-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{check.label}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500">
              By signing up, you agree to our{' '}
              <a href="#" className="text-primary-600 hover:underline">Terms</a>{' '}
              and{' '}
              <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
            </p>

            <Button type="submit" fullWidth size="lg" loading={isLoading}>
              Create account
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;