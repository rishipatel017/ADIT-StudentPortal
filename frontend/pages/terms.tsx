import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service - ADIT Campus ERP</title>
        <meta name="description" content="Terms of Service for ADIT Campus ERP System" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
            
            <div className="prose prose-lg max-w-none text-gray-600">
              <p className="mb-4">Last updated: March 11, 2026</p>
              
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Acceptance of Terms</h2>
              <p className="mb-4">By using ADIT Campus ERP, you agree to these terms and conditions.</p>
              
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">User Responsibilities</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>Maintain confidentiality of login credentials</li>
                <li>Use the system for legitimate academic purposes</li>
                <li>Respect privacy and data of other users</li>
                <li>Report any security issues immediately</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">System Usage</h2>
              <p className="mb-4">The system is provided for academic and administrative purposes only.</p>
              
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contact Information</h2>
              <p className="mb-4">For questions about these terms, contact us at legal@adit.edu</p>
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
