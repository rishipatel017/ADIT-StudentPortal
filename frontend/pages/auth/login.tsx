import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'STUDENT',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle role query parameter
  useEffect(() => {
    if (router.query.role) {
      const roleParam = router.query.role as string;
      const roleMap: { [key: string]: string } = {
        'admin': 'ADMIN',
        'faculty': 'FACULTY', 
        'student': 'STUDENT'
      };
      
      if (roleMap[roleParam]) {
        setFormData(prev => ({ ...prev, role: roleMap[roleParam] }));
      }
    }
  }, [router.query]);

  const quickCredentials = [
    {
      role: 'ADMIN',
      email: 'admin@itcollege.edu',
      password: 'admin123',
      label: '👨‍💼 Administrator',
      description: 'Full system access and user management',
      features: ['User Management', 'System Settings', 'Reports & Analytics', 'Academic Structure']
    },
    {
      role: 'FACULTY',
      email: 'hod@itcollege.edu',
      password: 'faculty123',
      label: '👨‍🏫 Faculty Member',
      description: 'Academic management and teaching tools',
      features: ['Attendance Tracking', 'Assignment Management', 'Grade Students', 'Post Notices']
    },
    {
      role: 'STUDENT',
      email: 'rahul@itcollege.edu',
      password: 'student123',
      label: '👨‍🎓 Student',
      description: 'Academic portal and learning resources',
      features: ['View Attendance', 'Submit Assignments', 'Check Results', 'Access Materials']
    }
  ];

  const handleQuickLogin = (credential: typeof quickCredentials[0]) => {
    setFormData({
      email: credential.email,
      password: credential.password,
      role: credential.role,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password, formData.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - ADIT Campus ERP</title>
        <meta name="description" content="ADIT Campus ERP Login Portal" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        
        {/* ADIT Logo and Branding */}
        <div className="absolute top-8 left-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-900 font-bold text-xl">ADIT</span>
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold">ADIT Campus</h1>
              <p className="text-sm opacity-90">Institute of Technology</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-6xl w-full mx-auto">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="md:flex">
              {/* Left Panel - Login Form */}
              <div className="md:w-1/2 p-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
                  <p className="mt-2 text-gray-600">Sign in to access your ADIT Campus portal</p>
                </div>
                
                {error && (
                  <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-red-800">Sign in failed</h3>
                        <p className="mt-1 text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                      Login As
                    </label>
                    <select
                      id="role"
                      name="role"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="STUDENT">👨‍🎓 Student</option>
                      <option value="FACULTY">👨‍🏫 Faculty</option>
                      <option value="ADMIN">👨‍💼 Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V4a8 8 0 018 8v4z"></path>
                          </svg>
                          Signing in...
                        </div>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-600">Need help?</span>
                    <Link href="/contact" className="font-medium text-blue-600 hover:text-blue-500 ml-1">
                      Contact IT Support
                    </Link>
                  </div>
                  <div className="text-sm">
                    <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
                      ← Back to Home
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Panel - Quick Credentials */}
              <div className="md:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">Quick Access</h3>
                  <p className="mt-2 text-gray-600">Use demo credentials to explore the system</p>
                </div>

                <div className="space-y-4">
                  {quickCredentials.map((credential, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => handleQuickLogin(credential)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-1">{credential.label}</h4>
                          <p className="text-sm text-gray-600 mb-3">{credential.description}</p>
                          <div className="space-y-1">
                            <div className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              📧 {credential.email}
                            </div>
                            <div className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">
                              🔑 {credential.password}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1">
                          {credential.features.map((feature, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
                  <h4 className="font-bold text-lg mb-3">🚀 Quick Start Guide</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 text-xs font-bold">1</span>
                      <span>Click any role card above to auto-fill credentials</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 text-xs font-bold">2</span>
                      <span>Review the pre-filled login information</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 text-xs font-bold">3</span>
                      <span>Click &quot;Sign In&quot; to access your dashboard</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 text-xs font-bold">4</span>
                      <span>Explore role-specific features and tools</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-xs opacity-90">
                      💡 <strong>Tip:</strong> These are demo credentials. In production, each user will have unique login details.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>© 2026 ADIT Campus. All rights reserved.</div>
                <div className="flex items-center space-x-4">
                  <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
                  <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
                  <Link href="/help" className="hover:text-gray-900">Help Center</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
