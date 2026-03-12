import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Docs() {
  return (
    <>
      <Head>
        <title>Documentation - ADIT Campus ERP</title>
        <meta name="description" content="Documentation for ADIT Campus ERP System" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
            <p className="text-xl text-gray-600">Complete guide to using ADIT Campus ERP</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">👨‍🎓 Student Guide</h2>
              <ul className="space-y-2 text-gray-600 mb-4">
                <li>• Login and Dashboard Navigation</li>
                <li>• Viewing Assignments and Deadlines</li>
                <li>• Checking Grades and Attendance</li>
                <li>• Submitting Assignments</li>
              </ul>
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                View Student Guide →
              </Link>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">👨‍🏫 Faculty Guide</h2>
              <ul className="space-y-2 text-gray-600 mb-4">
                <li>• Managing Classes and Students</li>
                <li>• Creating and Grading Assignments</li>
                <li>• Taking Attendance</li>
                <li>• Posting Notices</li>
              </ul>
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                View Faculty Guide →
              </Link>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">👨‍💼 Admin Guide</h2>
              <ul className="space-y-2 text-gray-600 mb-4">
                <li>• User Management</li>
                <li>• System Configuration</li>
                <li>• Academic Structure Setup</li>
                <li>• Reports and Analytics</li>
              </ul>
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                View Admin Guide →
              </Link>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🔧 Technical Guide</h2>
              <ul className="space-y-2 text-gray-600 mb-4">
                <li>• System Requirements</li>
                <li>• Browser Compatibility</li>
                <li>• Troubleshooting Common Issues</li>
                <li>• Security Best Practices</li>
              </ul>
              <a href="#technical" className="text-blue-600 hover:text-blue-700 font-medium">
                View Technical Guide →
              </a>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-8">
            <h2 id="technical" className="text-2xl font-bold text-gray-900 mb-6">Technical Documentation</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">System Requirements</h3>
                <ul className="list-disc pl-6 text-gray-600">
                  <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                  <li>Internet connection (minimum 1 Mbps)</li>
                  <li>Screen resolution: 1024x768 or higher</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Supported Browsers</h3>
                <ul className="list-disc pl-6 text-gray-600">
                  <li>Chrome 90+</li>
                  <li>Firefox 88+</li>
                  <li>Safari 14+</li>
                  <li>Edge 90+</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Common Issues & Solutions</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Login Issues</h4>
                    <p className="text-gray-600">Clear browser cache and cookies, or contact IT support.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Slow Performance</h4>
                    <p className="text-gray-600">Check internet connection and close unnecessary browser tabs.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Additional Help?</h3>
            <p className="text-blue-800 mb-4">Contact our support team for personalized assistance</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="mailto:support@adit.edu" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Email Support
              </a>
              <Link href="/help" className="bg-white text-blue-600 px-4 py-2 rounded border border-blue-600 hover:bg-blue-50 transition-colors">
                Help Center
              </Link>
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
