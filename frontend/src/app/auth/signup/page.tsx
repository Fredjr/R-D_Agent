'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { validateObject, emailRules, passwordRules, formatValidationErrors, getPasswordStrength } from '@/lib/validation';
import { Button, Input, PasswordInput, ErrorAlert, ValidationErrorAlert } from '@/components/ui';

export default function SignUp() {
  const router = useRouter();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors('');

    // Validate form data
    const validation = validateObject(
      { email: email.trim(), password },
      [...emailRules, ...passwordRules]
    );

    if (!validation.isValid) {
      setValidationErrors(formatValidationErrors(validation.errors));
      return;
    }

    setIsLoading(true);

    try {
      await signup(email.trim(), password);
      router.push('/auth/complete-profile');
    } catch (error: any) {
      setError(error.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate password strength for display
  const passwordStrength = getPasswordStrength(password);
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return 'bg-red-500';
    if (passwordStrength < 60) return 'bg-yellow-500';
    if (passwordStrength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 30) return 'Weak';
    if (passwordStrength < 60) return 'Fair';
    if (passwordStrength < 80) return 'Good';
    return 'Strong';
  };

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join the R&D Agent community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email Address"
              placeholder="your.email@company.com"
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
              required
              size="lg"
            />
          </div>

          {/* Password Field */}
          <div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Password"
              placeholder="Create a secure password"
              leftIcon={<LockClosedIcon className="h-5 w-5" />}
              required
              size="lg"
              showToggle={true}
            />

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">Password strength:</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength < 30 ? 'text-red-600' :
                    passwordStrength < 60 ? 'text-yellow-600' :
                    passwordStrength < 80 ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{ width: `${passwordStrength}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use uppercase, lowercase, numbers, and special characters
                </p>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors && (
            <ValidationErrorAlert errors={validationErrors} />
          )}

          {/* Error Message */}
          {error && (
            <ErrorAlert title="">{error}</ErrorAlert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim()}
            loading={isLoading}
            loadingText="Creating Account..."
            size="lg"
            className="w-full"
          >
            Create Account
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </Link>
          </p>
          <Link
            href="/auth"
            className="text-sm text-gray-500 hover:text-gray-700 block"
          >
            ← Back
          </Link>
        </div>
      </div>
    </div>
  );
}
