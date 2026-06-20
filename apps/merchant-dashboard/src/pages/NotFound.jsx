import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Sparkles } from 'lucide-react';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo size="lg" />
      </div>

      <div className="text-center max-w-md animate-fade-in">
        {/* Big 404 with sparkle */}
        <div className="relative inline-block mb-6">
          <h1 className="text-9xl font-bold bg-gradient-to-br from-primary-500 to-primary-700 bg-clip-text text-transparent">
            404
          </h1>
          <Sparkles className="absolute -top-2 -right-6 w-8 h-8 text-secondary animate-pulse" />
        </div>

        <h2 className="text-2xl font-bold text-dark mb-3">
          Page not found
        </h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4" />
            Go back
          </Button>
          <Link to="/dashboard">
            <Button>
              <Home className="w-4 h-4" />
              Go to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;