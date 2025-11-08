'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircleIcon, UserIcon, BuildingOfficeIcon, AcademicCapIcon, CheckIcon, SparklesIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { validateObject, userProfileRules, formatValidationErrors } from '@/lib/validation';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { Step2ResearchInterests } from '@/components/onboarding/Step2ResearchInterests';
import { inferInterestsFromProfile } from '@/lib/interest-inference';

const CATEGORY_ROLES = {
  Student: ['Undergraduate', 'Postgraduate', 'PhD Student'],
  Academic: ['Lecturer', 'Professor', 'Assistant Professor', 'Associate Professor', 'Librarian', 'Postdoc'],
  Industry: ['CEO', 'Team Leader', 'Research Scientist', 'Non-Profit Researcher', 'Consultant']
};

export default function CompleteProfile() {
  const router = useRouter();
  const { completeRegistration } = useAuth();

  // Multi-step wizard state - SIMPLIFIED TO 3 STEPS
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Personal Information
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    category: '',
    role: '',
    institution: '',
    subjectArea: '',
    howHeardAboutUs: '',
    joinMailingList: false
  });

  // Step 2: Research Interests (OPTIONAL)
  const [researchInterests, setResearchInterests] = useState({
    topics: [] as string[],
    keywords: [] as string[],
    careerStage: ''
  });

  // Step 3: Completion state
  const [wantsTour, setWantsTour] = useState<boolean | null>(null);

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

  // Step navigation handlers
  const handleStep1Next = () => {
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

    // Move to step 2
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    // Step 2 is now OPTIONAL - no validation required
    setError(null);
    setCurrentStep(3);
  };

  const handleStep2Skip = () => {
    // Instead of empty interests, infer from Step 1 profile data
    setError(null);

    // Infer interests from subject area and role
    const inferred = inferInterestsFromProfile(
      formData.subjectArea,
      formData.role
    );

    console.log('🧠 Inferred interests from profile:', inferred);

    setResearchInterests({
      topics: inferred.topics,
      keywords: inferred.keywords,
      careerStage: inferred.careerStage
    });

    setCurrentStep(3);
  };

  const handleCompleteOnboarding = async (takeTour: boolean) => {
    setIsLoading(true);
    setError(null);
    setWantsTour(takeTour);

    try {
      // Prepare data for backend
      const validationData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        category: formData.category,
        role: formData.role,
        institution: formData.institution.trim(),
        subject_area: formData.subjectArea.trim(),
        how_heard_about_us: formData.howHeardAboutUs.trim()
      };

      // Complete registration with preferences
      await completeRegistration({
        ...validationData,
        join_mailing_list: formData.joinMailingList,
        preferences: {
          research_interests: researchInterests,
          wants_product_tour: takeTour,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_version: '2.0' // Track new simplified onboarding
        }
      });

      // Redirect based on user choice
      if (takeTour) {
        // Redirect to dashboard with welcome banner and tour requested flag
        router.push('/dashboard?welcome=true&tour_requested=true');
      } else {
        // Redirect to dashboard with welcome banner
        router.push('/dashboard?welcome=true');
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setError(null);
    setValidationErrors('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Step definitions for indicator - SIMPLIFIED TO 3 STEPS
  const steps = [
    { number: 1, label: 'Profile', description: 'Basic info' },
    { number: 2, label: 'Interests', description: 'Research areas (optional)' },
    { number: 3, label: 'Complete', description: 'Get started!' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg p-8">
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

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} steps={steps} />

        {/* Error Messages */}
        {validationErrors && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm whitespace-pre-line">{validationErrors}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); handleStep1Next(); }} className="space-y-6">
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

          {/* Navigation Buttons */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Continue →
            </button>
          </div>

          {/* Required Fields Note */}
          <div className="text-center">
            <p className="text-xs text-gray-500">* Required fields</p>
          </div>
        </form>
        )}

        {/* Step 2: Research Interests (OPTIONAL) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Step2ResearchInterests
              data={researchInterests}
              onChange={setResearchInterests}
              onNext={handleStep2Next}
              onBack={handleBack}
            />

            {/* Skip Button */}
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleStep2Skip}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium underline"
              >
                Skip this step - I'll add my interests later
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Completion Screen */}
        {currentStep === 3 && (
          <div className="space-y-8 py-8">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-12 h-12 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-gray-900">
                🎉 Your Account is Ready!
              </h2>
              <p className="text-lg text-gray-600">
                Welcome to R&D Agent, {formData.firstName}!
              </p>
              <p className="text-gray-500 max-w-2xl mx-auto">
                You're all set to start exploring research papers, organizing your work, and discovering insights.
              </p>
            </div>

            {/* Tour Options */}
            <div className="max-w-3xl mx-auto space-y-4">
              <h3 className="text-center text-lg font-semibold text-gray-900 mb-6">
                Would you like a quick tour?
              </h3>

              {/* Option 1: Take Tour */}
              <button
                onClick={() => handleCompleteOnboarding(true)}
                disabled={isLoading}
                className="w-full p-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <SparklesIcon className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-semibold">Yes, show me around!</div>
                      <div className="text-sm text-blue-100">
                        5-minute interactive tour of key features
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl">→</div>
                </div>
              </button>

              {/* Option 2: Skip Tour */}
              <button
                onClick={() => handleCompleteOnboarding(false)}
                disabled={isLoading}
                className="w-full p-6 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <RocketLaunchIcon className="w-7 h-7 text-gray-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-semibold">No thanks, let me explore</div>
                      <div className="text-sm text-gray-500">
                        Jump straight to your dashboard
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl">→</div>
                </div>
              </button>

              {/* Help Text */}
              <p className="text-center text-sm text-gray-500 pt-4">
                Don't worry - you can always access the tour later from Settings
              </p>
            </div>

            {/* Back Button */}
            <div className="flex justify-center pt-6">
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium disabled:opacity-50"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-700 font-medium">Completing your profile...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
