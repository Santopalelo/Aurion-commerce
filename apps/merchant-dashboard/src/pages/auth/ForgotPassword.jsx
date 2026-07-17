import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { authService } from '../../services/auth.service';
import { getErrorMessage } from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setEmailSent(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-soft px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" className="justify-center" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {!emailSent ? (
            <>
              <div className="mb-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
                <h1 className="text-2xl font-bold text-dark">
                  Forgot password?
                </h1>
                <p className="text-gray-600 mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                />

                <Button type="submit" fullWidth size="lg" loading={isLoading}>
                  Send reset link
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Log in
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-dark mb-2">
                Check your email
              </h2>
              <p className="text-gray-600 mb-6">
                If an account exists with <strong className="text-dark">{email}</strong>,
                we've sent a password reset link.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                The link will expire in 1 hour. Check your spam folder if you don't see it.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;