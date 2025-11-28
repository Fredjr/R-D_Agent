'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Feature Flags Context for Erythos Restructuring
 * Enables gradual rollout of new features with zero downtime
 * 
 * Phase 0: Foundation
 * - All flags default to false
 * - Enable incrementally during deployment
 */

interface FeatureFlags {
  // Master Erythos flag - when true, enables all Erythos features
  enableErythos: boolean;
  // Individual feature flags (can be overridden even when enableErythos is true)
  enableNewHomePage: boolean;
  enableNewDiscoverPage: boolean;
  enableNewCollectionsPage: boolean;
  enableNewProjectWorkspace: boolean;
  enableNewLabPage: boolean;
  enableGlobalTriage: boolean;
  enableErythosTheme: boolean;
  enableWriteFeature: boolean;
}

interface FeatureFlagsContextType extends FeatureFlags {
  isLoading: boolean;
  refreshFlags: () => Promise<void>;
}

const defaultFlags: FeatureFlags = {
  // Master flag - set to true to enable all Erythos features at once
  enableErythos: true, // Default to true for Erythos-first experience
  enableNewHomePage: true,
  enableNewDiscoverPage: true,
  enableNewCollectionsPage: true,
  enableNewProjectWorkspace: true,
  enableNewLabPage: true,
  enableGlobalTriage: true,
  enableErythosTheme: true,
  enableWriteFeature: true,
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  ...defaultFlags,
  isLoading: true,
  refreshFlags: async () => {},
});

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      // Fetch feature flags from backend
      const response = await fetch('/api/feature-flags');
      
      if (response.ok) {
        const data = await response.json();
        // Master flag controls all features unless individually overridden
        const masterEnabled = data.enable_erythos ?? true;
        setFlags({
          enableErythos: masterEnabled,
          enableNewHomePage: data.enable_new_home_page ?? masterEnabled,
          enableNewDiscoverPage: data.enable_new_discover_page ?? masterEnabled,
          enableNewCollectionsPage: data.enable_new_collections_page ?? masterEnabled,
          enableNewProjectWorkspace: data.enable_new_project_workspace ?? masterEnabled,
          enableNewLabPage: data.enable_new_lab_page ?? masterEnabled,
          enableGlobalTriage: data.enable_global_triage ?? masterEnabled,
          enableErythosTheme: data.enable_erythos_theme ?? masterEnabled,
          enableWriteFeature: data.enable_write_feature ?? masterEnabled,
        });
      } else {
        // If endpoint doesn't exist yet, use defaults
        console.warn('Feature flags endpoint not available, using defaults');
        setFlags(defaultFlags);
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
      // Fallback to defaults on error
      setFlags(defaultFlags);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const refreshFlags = async () => {
    setIsLoading(true);
    await fetchFlags();
  };

  return (
    <FeatureFlagsContext.Provider
      value={{
        ...flags,
        isLoading,
        refreshFlags,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}

// Convenience hooks for specific features
export function useNewHomePage() {
  const { enableNewHomePage } = useFeatureFlags();
  return enableNewHomePage;
}

export function useNewDiscoverPage() {
  const { enableNewDiscoverPage } = useFeatureFlags();
  return enableNewDiscoverPage;
}

export function useNewCollectionsPage() {
  const { enableNewCollectionsPage } = useFeatureFlags();
  return enableNewCollectionsPage;
}

export function useNewProjectWorkspace() {
  const { enableNewProjectWorkspace } = useFeatureFlags();
  return enableNewProjectWorkspace;
}

export function useNewLabPage() {
  const { enableNewLabPage } = useFeatureFlags();
  return enableNewLabPage;
}

export function useGlobalTriage() {
  const { enableGlobalTriage } = useFeatureFlags();
  return enableGlobalTriage;
}

export function useErythosTheme() {
  const { enableErythosTheme } = useFeatureFlags();
  return enableErythosTheme;
}

export function useWriteFeature() {
  const { enableWriteFeature } = useFeatureFlags();
  return enableWriteFeature;
}

/**
 * Master Erythos flag - use this to check if Erythos features are enabled globally
 */
export function useErythos() {
  const { enableErythos } = useFeatureFlags();
  return enableErythos;
}
