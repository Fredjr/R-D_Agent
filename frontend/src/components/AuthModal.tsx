'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { XMarkIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Button, Input, ErrorAlert } from '@/components/ui';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login } = useAuth(); // Keep using login for quick access - it's marked as legacy but functional
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use legacy login for quick access - creates temporary session
      await login!(email.trim(), username.trim() || undefined);
      onClose();
      setEmail('');
      setUsername('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Welcome to R&D Agent</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email Address"
              placeholder="your.email@company.com"
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
              size="lg"
            />
          </div>

          <div className="mb-6">
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              label="Display Name (Optional)"
              placeholder="Dr. Anya Sharma"
              leftIcon={<UserIcon className="h-5 w-5" />}
              size="lg"
            />
          </div>

          {error && (
            <div className="mb-4">
              <ErrorAlert title="">{error}</ErrorAlert>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !email.trim()}
            loading={isLoading}
            loadingText="Signing In..."
            size="lg"
            className="w-full"
          >
            Sign In / Sign Up
          </Button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Your research data will be saved and accessible across all your devices.</p>
        </div>
      </div>
    </div>
  );
}
