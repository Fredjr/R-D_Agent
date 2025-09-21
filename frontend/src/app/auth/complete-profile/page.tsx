'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircleIcon, UserIcon, BuildingOfficeIcon, AcademicCapIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { validateObject, userProfileRules, formatValidationErrors } from '@/lib/validation';

const CATEGORY_ROLES = {
  Student: ['Undergraduate', 'Postgraduate', 'PhD Student'],
  Academic: ['Lecturer', 'Professor', 'Assistant Professor', 'Associate Professor', 'Librarian', 'Postdoc'],
  Industry: ['CEO', 'Team Leader', 'Research Scientist', 'Non-Profit Researcher', 'Consultant']
};

export default function CompleteProfile() {
  const router = useRouter();
  const { completeRegistration } = useAuth();
  const [formData, setFormData] = useState({
    firstName: 'Fred',
    lastName: 'Le',
    category: 'Academic',
    role: 'Researcher',
    institution: 'Research Institution',
    subjectArea: 'Medical Research',
    howHeardAboutUs: 'Direct',
    joinMailingList: false,
    password: 'qwerty1234',
    confirmPassword: 'qwerty1234'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string>('');
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // Check if user is authenticated - ALLOW INCOMPLETE USERS
  useEffect(() => {
    const savedUser = localStorage.getItem('rd_agent_user');
    if (!savedUser) {
      // No user data - redirect to auth
      router.push('/auth');
      return;
    }

    try {
      const userData = JSON.parse(savedUser);
      // REMOVED: Don't redirect if registration is incomplete - that's why they're here!
      // Allow incomplete users to access this page to complete their registration
      console.log('👤 User accessing complete-profile:', userData.email, 'Registration completed:', userData.registration_completed);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth');
    }
  }, [router]);

  // Update available roles when category changes
  useEffect(() => {
    if (formData.category && CATEGORY_ROLES[formData.category as keyof typeof CATEGORY_ROLES]) {
      setAvailableRoles(CATEGORY_ROLES[formData.category as keyof typeof CATEGORY_ROLES]);
      setFormData(prev => ({ ...prev, role: '' })); // Reset role when category changes
    } else {
      setAvailableRoles([]);
    }
  }, [formData.category]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors('');

    // Prepare data for validation (matching backend field names)
    const validationData = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      category: formData.category,
      role: formData.role,
      institution: formData.institution.trim(),
      subject_area: formData.subjectArea.trim(),
      how_heard_about_us: formData.howHeardAboutUs.trim()
    };

    // Validate form data
    const validation = validateObject(validationData, userProfileRules);

    if (!validation.isValid) {
      setValidationErrors(formatValidationErrors(validation.errors));
      return;
    }

    setIsLoading(true);

    try {
      await completeRegistration({
        ...validationData,
        join_mailing_list: formData.joinMailingList
      });
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Tell us about yourself to personalize your experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                <option value="Student">Student</option>
                <option value="Academic">Academic</option>
                <option value="Industry">Industry</option>
              </select>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!formData.category}
              >
                <option value="">Select role</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {!formData.category && (
                <p className="text-xs text-gray-500 mt-1">Please select a category first</p>
              )}
            </div>
          </div>

          {/* Institution */}
          <div>
            <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
              Institution *
            </label>
            <div className="relative">
              <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="institution"
                type="text"
                value={formData.institution}
                onChange={(e) => handleInputChange('institution', e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="University of Oxford, Google Research, etc."
                required
              />
            </div>
          </div>

          {/* Subject Area */}
          <div>
            <label htmlFor="subjectArea" className="block text-sm font-medium text-gray-700 mb-2">
              Subject Area of Focus *
            </label>
            <div className="relative">
              <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="subjectArea"
                type="text"
                value={formData.subjectArea}
                onChange={(e) => handleInputChange('subjectArea', e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Machine Learning, Biochemistry, Clinical Research, etc."
                required
              />
            </div>
          </div>

          {/* How did you hear about us */}
          <div>
            <label htmlFor="howHeardAboutUs" className="block text-sm font-medium text-gray-700 mb-2">
              How did you hear about us? *
            </label>
            <textarea
              id="howHeardAboutUs"
              value={formData.howHeardAboutUs}
              onChange={(e) => handleInputChange('howHeardAboutUs', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Social media, colleague recommendation, conference, etc."
              rows={3}
              required
            />
          </div>

          {/* Mailing List Checkbox */}
          <div className="flex items-start gap-3">
            <input
              id="joinMailingList"
              type="checkbox"
              checked={formData.joinMailingList}
              onChange={(e) => handleInputChange('joinMailingList', e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="joinMailingList" className="text-sm text-gray-700">
              Join our mailing list for updates about new features and research insights
            </label>
          </div>

          {/* Validation Errors */}
          {validationErrors && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm whitespace-pre-line">{validationErrors}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Completing Profile...
              </>
            ) : (
              <>
                <CheckIcon className="h-5 w-5" />
                Complete Registration
              </>
            )}
          </button>
        </form>

        {/* Required Fields Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">* Required fields</p>
        </div>
      </div>
    </div>
  );
}
