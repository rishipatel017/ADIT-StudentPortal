import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Types
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

// Reusable components
const NavLink: React.FC<NavLinkProps> = ({ href, children, onClick, className = '' }) => (
  <Link 
    href={href} 
    className={`text-gray-700 hover:text-blue-600 transition-colors ${className}`}
    onClick={onClick}
  >
    {children}
  </Link>
);

const FeatureCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  features: string[];
  loginLink: string;
  loginText: string;
}> = ({ title, icon, iconBgColor, iconColor, features, loginLink, loginText }) => (
  <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
    <div className={`w-16 h-16 ${iconBgColor} rounded-full flex items-center justify-center mb-6`}>
      <div className={`w-8 h-8 ${iconColor}`}>{icon}</div>
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
    <ul className="space-y-3 text-gray-600">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center">
          <svg 
            className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
              clipRule="evenodd" 
            />
          </svg>
          {feature}
        </li>
      ))}
    </ul>
    <div className="mt-6">
      <Link 
        href={loginLink} 
        className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
      >
        {loginText}
        <svg 
          className="w-4 h-4 ml-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  </div>
);

export default function Home() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState('');

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const studentFeatures = [
    'View attendance and academic progress',
    'Submit assignments online',
    'Access study materials and notices',
    'Track exam results and performance'
  ];

  const facultyFeatures = [
    'Mark attendance effortlessly',
    'Create and grade assignments',
    'Post notices and announcements',
    'Manage academic records'
  ];

  const adminFeatures = [
    'Complete system oversight',
    'User management and permissions',
    'Academic structure management',
    'Reports and analytics'
  ];

  return (
    <>
      <Head>
        <title>ADIT Campus ERP - Institute of Technology</title>
        <meta name="description" content="ADIT Campus ERP System - Complete Academic Management Solution for Students, Faculty, and Administrators" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="ERP, education, campus management, student portal, faculty dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>

      {/* Navigation Header */}
      <nav className="bg-white shadow-lg sticky top-0 z-50" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-bold text-lg">ADIT</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ADIT Campus</h1>
                <p className="text-xs text-gray-600">Institute of Technology</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#about">About</NavLink>
              <NavLink href="#contact">Contact</NavLink>
              {user ? (
                <Link 
                  href="/dashboard" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Go to dashboard"
                >
                  Dashboard
                </Link>
              ) : (
                <Link 
                  href="/auth/login" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Login to your account"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200"
            role="menu"
            aria-label="Mobile navigation"
          >
            <div className="px-4 py-3 space-y-3">
              <NavLink href="#features" onClick={closeMobileMenu} className="block py-2">
                Features
              </NavLink>
              <NavLink href="#about" onClick={closeMobileMenu} className="block py-2">
                About
              </NavLink>
              <NavLink href="#contact" onClick={closeMobileMenu} className="block py-2">
                Contact
              </NavLink>
              {user ? (
                <Link 
                  href="/dashboard" 
                  className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
              ) : (
                <Link 
                  href="/auth/login" 
                  className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                  onClick={closeMobileMenu}
                  role="menuitem"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main id="main-content">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white" aria-labelledby="hero-heading">
          <div className="absolute inset-0 bg-black opacity-20" aria-hidden="true"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 id="hero-heading" className="text-4xl md:text-6xl font-bold mb-6">
                Welcome to ADIT Campus ERP
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                Complete Academic Management Solution for Modern Education
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link 
                    href="/dashboard" 
                    className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900"
                    aria-label="Go to your dashboard"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/auth/login" 
                      className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900"
                      aria-label="Get started with ADIT Campus ERP"
                    >
                      Get Started
                    </Link>
                    <Link 
                      href="#features" 
                      className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900"
                      aria-label="Learn more about features"
                    >
                      Learn More
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50" aria-labelledby="features-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Features for Every Role
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive tools designed for students, faculty, and administrators
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Student Features */}
              <FeatureCard
                title="Student Portal"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                features={studentFeatures}
                loginLink="/auth/login?role=student"
                loginText="Login as Student"
              />

              {/* Faculty Features */}
              <FeatureCard
                title="Faculty Dashboard"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
                features={facultyFeatures}
                loginLink="/auth/login?role=faculty"
                loginText="Login as Faculty"
              />

              {/* Admin Features */}
              <FeatureCard
                title="Admin Control"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
                features={adminFeatures}
                loginLink="/auth/login?role=admin"
                loginText="Login as Admin"
              />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-white" aria-labelledby="about-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 id="about-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  About ADIT Campus ERP
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  ADIT Campus ERP is a comprehensive academic management system designed to streamline 
                  educational operations and enhance the learning experience for students, faculty, and administrators.
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  Built with modern technology and best practices, our platform provides intuitive tools for 
                  attendance tracking, assignment management, academic reporting, and seamless communication 
                  across all levels of the educational institution.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                    <div className="text-gray-600">Active Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">50+</div>
                    <div className="text-gray-600">Faculty Members</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                      <p className="text-gray-600">Optimized performance for seamless user experience</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
                      <p className="text-gray-600">Enterprise-grade security for your data</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Fully Customizable</h3>
                      <p className="text-gray-600">Adaptable to your institution&apos;s unique needs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-gray-50" aria-labelledby="contact-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 id="contact-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Get In Touch
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Have questions? We&apos;re here to help you get started with ADIT Campus ERP
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Email Contact */}
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6" aria-hidden="true">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Email Support</h3>
                <p className="text-gray-600 mb-4">Get help via email</p>
                <a 
                  href="mailto:support@adit.edu" 
                  className="text-blue-600 font-semibold hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                  aria-label="Send email to support@adit.edu"
                >
                  support@adit.edu
                </a>
              </div>

              {/* Phone Contact */}
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6" aria-hidden="true">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Phone Support</h3>
                <p className="text-gray-600 mb-4">Mon-Fri 9AM-6PM</p>
                <a 
                  href="tel:+919876543210" 
                  className="text-blue-600 font-semibold hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                  aria-label="Call us at +91 98765 43210"
                >
                  +91 98765 43210
                </a>
              </div>

              {/* Location */}
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6" aria-hidden="true">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Campus Location</h3>
                <p className="text-gray-600 mb-4">Visit us anytime</p>
                <p className="text-blue-600 font-semibold">
                  ADIT Campus, Vallabh Vidyanagar
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center" aria-hidden="true">
                  <span className="text-blue-900 font-bold text-lg">ADIT</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">ADIT Campus</h2>
                  <p className="text-sm opacity-90">Institute of Technology</p>
                </div>
              </div>
              <p className="text-gray-400">
                Empowering education through innovative technology solutions.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded-md">Features</Link></li>
                <li><Link href="#about" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded-md">About Us</Link></li>
                <li><Link href="#contact" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded-md">Contact</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded-md">Login</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded-md">Help Center</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded-md">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded-md">Terms of Service</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded-md">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a 
                  href="#" 
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Follow us on Facebook"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Follow us on Twitter"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Connect with us on LinkedIn"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {currentYear} ADIT Campus ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}