import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const isCheckingRef = useRef(false);
  const allowedRolesKey = allowedRoles.join(',');

  useEffect(() => {
    const checkAuth = () => {
      if (isCheckingRef.current) return;
      // If still loading initial auth state, wait
      if (isLoading) return;

      // If no user or token, redirect to login
      if (!user || !token) {
        router.push('/auth/login');
        return;
      }

      // If specific roles are required, check user role
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        const rolePath = user.role.toLowerCase();
        router.push(`/dashboard/${rolePath}`);
        return;
      }
    };

    isCheckingRef.current = true;
    checkAuth();
    isCheckingRef.current = false;
  }, [isLoading, token, user?.role, allowedRolesKey, router]);

  // Show loading spinner while checking auth
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to access this page.</p>
          <button
            onClick={() => {
              const rolePath = user.role.toLowerCase();
              router.push(`/dashboard/${rolePath}`);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Your Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
