import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - ADIT Campus ERP</title>
        <meta name="description" content="Privacy Policy for ADIT Campus ERP System" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
            
            <div className="prose prose-lg max-w-none text-gray-600">
              <p className="mb-4">Last updated: March 11, 2026</p>
              
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Information We Collect</h2>
              <p className="mb-4">ADIT Campus ERP collects and processes personal information for academic and administrative purposes.</p>
              
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>Academic record management</li>
                <li>Administrative communications</li>
                <li>System authentication and security</li>
                <li>Academic performance tracking</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Data Protection</h2>
              <p className="mb-4">We implement appropriate security measures to protect your personal information.</p>
              
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contact Us</h2>
              <p className="mb-4">For privacy-related questions, contact us at privacy@adit.edu</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
