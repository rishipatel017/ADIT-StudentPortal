import React from 'react';
import { useRouter } from 'next/router';
import { Button } from './index';

interface ErrorPageProps {
  message?: string;
  code?: string | number;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ 
  message = "We're sorry, but the service is temporarily unavailable. Please try again later.", 
  code = "500" 
}) => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">{code}</h1>
          <p className="mt-2 text-base text-gray-500 uppercase tracking-wide font-semibold">Something went wrong</p>
        </div>
        
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            {message}
          </p>
          
          <div className="space-y-3">
            <Button 
              variant="primary" 
              className="w-full py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
            <Button 
              variant="secondary" 
              className="w-full py-3 text-lg font-medium"
              onClick={() => router.push('/')}
            >
              Go to Home
            </Button>
          </div>
        </div>
        
        <p className="mt-8 text-sm text-gray-400">
          If the problem persists, please contact the IT support team.
        </p>
      </div>
    </div>
  );
};

export default ErrorPage;
