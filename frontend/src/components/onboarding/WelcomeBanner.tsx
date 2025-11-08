'use client';

import { useState } from 'react';
import { XMarkIcon, SparklesIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface WelcomeBannerProps {
  userName: string;
  tourRequested: boolean;
  onStartTour: () => void;
  onDismiss: () => void;
}

export function WelcomeBanner({ userName, tourRequested, onStartTour, onDismiss }: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
    // Save to localStorage to not show again
    localStorage.setItem('welcome_banner_dismissed', 'true');
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-lg shadow-lg mb-6 relative animate-fade-in">
      {/* Close Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
        aria-label="Dismiss welcome banner"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>

      {/* Content */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
          <SparklesIcon className="w-7 h-7" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">
            🎉 Welcome to R&D Agent, {userName}!
          </h3>
          <p className="text-blue-100 mb-4">
            {tourRequested 
              ? "You're all set! Here's a quick overview of what you can do:"
              : "Your account is ready! Here's what you can do:"}
          </p>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-white bg-opacity-10 rounded-lg p-3 hover:bg-opacity-20 transition-all">
              <div className="font-semibold mb-1">📚 Discover Papers</div>
              <div className="text-sm text-blue-100">AI-powered recommendations tailored to your interests</div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-3 hover:bg-opacity-20 transition-all">
              <div className="font-semibold mb-1">🔍 Research Hub</div>
              <div className="text-sm text-blue-100">Search PubMed with advanced MeSH filters</div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-3 hover:bg-opacity-20 transition-all">
              <div className="font-semibold mb-1">📁 Create Project</div>
              <div className="text-sm text-blue-100">Organize your research and generate reports</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {tourRequested && (
              <Button
                onClick={onStartTour}
                variant="default"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Start Quick Tour
              </Button>
            )}
            <Button
              onClick={() => window.location.href = '/project/new'}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 font-semibold"
            >
              <RocketLaunchIcon className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="text-white hover:bg-white hover:bg-opacity-10"
            >
              I'll Explore on My Own
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

