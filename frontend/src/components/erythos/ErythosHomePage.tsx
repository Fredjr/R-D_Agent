'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosSearchBar } from './ErythosSearchBar';
import { ErythosWorkflowCard } from './ErythosCard';
import { workflowMeta } from '@/utils/gradients';
import { ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface RecentActivity {
  id: string;
  type: 'project' | 'collection' | 'paper' | 'experiment';
  title: string;
  timestamp: string;
  icon: string;
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function ErythosHomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  // Quick search tags
  const quickSearchTags = [
    'immune checkpoint inhibitors',
    'CRISPR gene editing',
    'cancer immunotherapy',
    'machine learning diagnostics',
  ];

  // Fetch recent activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user?.email) return;
      
      try {
        // TODO: Implement actual API call for recent activity
        // For now, show placeholder
        setRecentActivity([]);
      } catch (error) {
        console.error('Failed to fetch recent activity:', error);
      } finally {
        setIsLoadingActivity(false);
      }
    };

    fetchRecentActivity();
  }, [user?.email]);

  // Handle search
  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/discover?q=${encodeURIComponent(query)}`);
    }
  };

  // Handle tag click
  const handleTagClick = (tag: string) => {
    router.push(`/discover?q=${encodeURIComponent(tag)}`);
  };

  // Handle workflow card click
  const handleWorkflowClick = (route: string) => {
    router.push(route);
  };

  const firstName = user?.first_name || user?.username || 'Researcher';

  return (
    <div className="min-h-screen bg-black">
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section - Simple greeting */}
        <section className="text-center mb-10 sm:mb-14 animate-erythos-fadeIn">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            Good {getTimeOfDay()}, {firstName}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">
            What would you like to explore today?
          </p>
        </section>

        {/* Centered Search Bar */}
        <section className="mb-8 sm:mb-10 animate-erythos-fadeIn" style={{ animationDelay: '0.1s' }}>
          <ErythosSearchBar
            placeholder="Search papers, protocols, or topics..."
            onSearch={handleSearch}
            size="lg"
            className="max-w-2xl mx-auto"
          />
        </section>

        {/* Quick Search Tags */}
        <section className="mb-12 sm:mb-16 animate-erythos-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <span className="text-sm text-gray-500">Try:</span>
            {quickSearchTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-3 py-1.5 bg-[#2C2C2E] text-gray-300 rounded-full text-sm 
                         hover:bg-[#3C3C3E] hover:text-white transition-all duration-200
                         border border-transparent hover:border-red-500/30"
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* 4 Workflow Cards - 2x2 Grid */}
        <section className="mb-12 sm:mb-16 animate-erythos-fadeIn" style={{ animationDelay: '0.3s' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {/* Discover Card */}
            <ErythosWorkflowCard
              icon={workflowMeta.discover.icon}
              title={workflowMeta.discover.title}
              description={workflowMeta.discover.description}
              gradient="red"
              onClick={() => handleWorkflowClick(workflowMeta.discover.route)}
            />
            
            {/* Organize Card */}
            <ErythosWorkflowCard
              icon={workflowMeta.organize.icon}
              title={workflowMeta.organize.title}
              description={workflowMeta.organize.description}
              gradient="orange"
              onClick={() => handleWorkflowClick(workflowMeta.organize.route)}
            />
            
            {/* Lab Card */}
            <ErythosWorkflowCard
              icon={workflowMeta.lab.icon}
              title={workflowMeta.lab.title}
              description={workflowMeta.lab.description}
              gradient="purple"
              onClick={() => handleWorkflowClick(workflowMeta.lab.route)}
            />
            
            {/* Write Card */}
            <ErythosWorkflowCard
              icon={workflowMeta.write.icon}
              title={workflowMeta.write.title}
              description={workflowMeta.write.description}
              gradient="yellow"
              onClick={() => handleWorkflowClick(workflowMeta.write.route)}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default ErythosHomePage;

