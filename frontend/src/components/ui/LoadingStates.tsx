/**
 * Reusable Loading State Components
 * Provides consistent loading UI across the application
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-600 border-t-purple-500 ${sizeClasses[size]} ${className}`} />
  );
}

interface LoadingCardProps {
  count?: number;
  className?: string;
}

export function LoadingCard({ count = 1, className = '' }: LoadingCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-800/50 rounded-lg p-4 border border-gray-700 animate-pulse ${className}`}
        >
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-3" />
          <div className="h-3 bg-gray-700 rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-700 rounded w-2/3" />
        </div>
      ))}
    </>
  );
}

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm">{message}</p>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({ isLoading, message, children }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center">
            <LoadingSpinner size="md" />
            {message && <p className="mt-2 text-sm text-gray-400">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

interface LoadingButtonProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export function LoadingButton({
  isLoading,
  loadingText = 'Loading...',
  children,
  className = '',
  disabled,
  onClick,
  type = 'button',
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`flex items-center justify-center gap-2 ${className} ${
        isLoading || disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-gray-500 mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-300 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-md">{description}</p>}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Error', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h3 className="text-lg font-medium text-red-400 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-4 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

