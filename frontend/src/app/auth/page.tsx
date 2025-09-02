'use client'

import Image from "next/image";
import Link from "next/link";
import { UserIcon, AcademicCapIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function AuthLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <Image
            src="/next.svg"
            alt="R&D Agent logo"
            width={120}
            height={24}
            priority
            className="mx-auto mb-4 dark:invert"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to R&D Agent</h1>
          <p className="text-gray-600">AI-Powered Research Analysis Platform</p>
        </div>

        {/* Features */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <AcademicCapIcon className="h-5 w-5 text-blue-600" />
            <span>Comprehensive literature reviews</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
            <span>Team collaboration tools</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <UserIcon className="h-5 w-5 text-blue-600" />
            <span>Personalized research workspace</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/auth/signup"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center block"
          >
            Create Account
          </Link>
          
          <Link
            href="/auth/signin"
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center block"
          >
            Sign In
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
