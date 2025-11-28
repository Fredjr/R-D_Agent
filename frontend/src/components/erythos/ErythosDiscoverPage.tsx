'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosTabs } from './ErythosTabs';
import { ErythosSmartInboxTab, ErythosExploreTab, ErythosAllPapersTab } from './discover';

type DiscoverTab = 'inbox' | 'explore' | 'all-papers';

interface UnreadStats {
  inbox: number;
}

export function ErythosDiscoverPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get initial tab from URL or default to inbox
  const initialTab = (searchParams?.get('tab') as DiscoverTab) || 'inbox';
  const [activeTab, setActiveTab] = useState<DiscoverTab>(initialTab);
  const [unreadStats, setUnreadStats] = useState<UnreadStats>({ inbox: 0 });

  // Fetch unread counts for badge
  useEffect(() => {
    const fetchUnreadStats = async () => {
      if (!user?.email) return;
      try {
        const response = await fetch('/api/proxy/triage/stats', {
          headers: { 'User-ID': user.email }
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadStats({ inbox: data.unread || 0 });
        }
      } catch (error) {
        console.error('Error fetching unread stats:', error);
      }
    };
    
    fetchUnreadStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadStats, 30000);
    return () => clearInterval(interval);
  }, [user?.email]);

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    const newTab = tabId as DiscoverTab;
    setActiveTab(newTab);
    router.push(`/discover?tab=${newTab}`, { scroll: false });
  };

  // Sync tab with URL changes
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab') as DiscoverTab;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const tabs = [
    { 
      id: 'inbox', 
      label: 'Smart Inbox', 
      icon: '📥',
      badge: unreadStats.inbox > 0 ? unreadStats.inbox : undefined
    },
    { 
      id: 'explore', 
      label: 'Explore', 
      icon: '🔬'
    },
    { 
      id: 'all-papers', 
      label: 'All Papers', 
      icon: '📄'
    },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Page Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white mb-2">🔍 Discover</h1>
          <p className="text-gray-400">
            Explore papers, triage with AI, and test your hypotheses
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-[#121212] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErythosTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant="underline"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'inbox' && <ErythosSmartInboxTab />}
        {activeTab === 'explore' && <ErythosExploreTab />}
        {activeTab === 'all-papers' && <ErythosAllPapersTab />}
      </div>
    </div>
  );
}

