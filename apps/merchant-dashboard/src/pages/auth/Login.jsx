import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowRight } from 'lucide-react';
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
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

// ============================================
// LOGIN PAGE
// ============================================
const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // ============================================
  // HANDLE LOGIN
  // ============================================
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { user, accessToken } = await authService.login(
        data.email,
        data.password
      );

      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.firstName}!`);

      // Redirect based on whether user has a store
      if (user.storeAccess && user.storeAccess.length > 0) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding/create-store');
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ============================================ */}
      {/* LEFT SIDE — Login Form */}
      {/* ============================================ */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-20">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="mb-10">
            <Logo size="lg" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark mb-2">
              Welcome back
            </h1>
            <p className="text-gray-600">
              Log in to manage your store
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={Lock}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isLoading}
            >
              Log in
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          {/* Sign up link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* ============================================ */}
      {/* RIGHT SIDE — Hero / Branding */}
      {/* ============================================ */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Build your dream store with Aurion
          </h2>
          <p className="text-lg text-white/80 mb-10">
            The all-in-one commerce platform trusted by entrepreneurs worldwide.
            Sell anywhere, manage everything, grow without limits.
          </p>

          {/* Features list */}
          <div className="space-y-4">
            {[
              'Unlimited products and categories',
              'Built-in payment processing',
              'Beautiful customizable themes',
              'Powerful analytics dashboard',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;