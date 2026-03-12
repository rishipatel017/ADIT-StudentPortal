import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Help() {
  return (
    <>
      <Head>
        <title>Help Center - ADIT Campus ERP</title>
        <meta name="description" content="Help and Support for ADIT Campus ERP System" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
            <p className="text-xl text-gray-600">Find answers to common questions and get support</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">👨‍🎓</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Support</h3>
              <p className="text-gray-600 mb-4">Help with assignments, grades, and academic records</p>
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Get Help →
              </Link>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">👨‍🏫</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Faculty Support</h3>
              <p className="text-gray-600 mb-4">Assistance with teaching tools and class management</p>
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Get Help →
              </Link>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">👨‍💼</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Support</h3>
              <p className="text-gray-600 mb-4">System administration and user management</p>
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Get Help →
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I reset my password?</h3>
                <p className="text-gray-600">Contact the IT support team at support@adit.edu for password reset assistance.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Where can I access my grades?</h3>
                <p className="text-gray-600">Log in to your dashboard and navigate to the &quot;Marks&quot; section to view your academic performance.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I submit assignments?</h3>
                <p className="text-gray-600">Go to the &quot;Assignments&quot; tab in your dashboard to view and submit pending assignments.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
            <p className="text-gray-600 mb-6">Our support team is here to assist you</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@adit.edu" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Email Support
              </a>
              <a 
                href="tel:+919876543210" 
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Call Support
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
