'use client';

import React, { useState, useEffect } from 'react';
import { SpotifyCleanSection } from './SpotifyCleanSection';
import { ClockIcon, FireIcon, SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Paper {
  pmid: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  citation_count: number;
  relevance_score?: number;
  reason: string;
  category: string;
  spotify_style?: {
    cover_color?: string;
    subtitle?: string;
    play_count?: number;
    trend_indicator?: string;
    discovery_badge?: string;
    opportunity_badge?: string;
  };

  // 🧠 Phase 2A.2: Semantic Analysis Fields
  semantic_analysis?: {
    methodology?: 'experimental' | 'theoretical' | 'computational' | 'review' | 'meta_analysis' | 'case_study' | 'survey';
    complexity_score?: number; // 0.0-1.0 scale
    novelty_type?: 'breakthrough' | 'incremental' | 'replication' | 'review';
    research_domains?: string[]; // ['machine_learning', 'biology', 'chemistry', etc.]
    technical_terms?: string[];
    confidence_scores?: {
      methodology: number;
      complexity: number;
      novelty: number;
    };
    analysis_metadata?: {
      analysis_time_seconds?: number;
      service_initialized?: boolean;
      embedding_dimensions?: number;
    };
  };
}

interface RecommendationSection {
  title: string;
  description: string;
  papers: Paper[];
  updated: string;
  refresh_reason?: string;
  icon: React.ComponentType<any>;
  color: string;
  category: string;
}

interface EnhancedHomePageProps {
  recommendations?: {
    papers_for_you?: Paper[];
    trending_in_field?: Paper[];
    cross_pollination?: Paper[];
    citation_opportunities?: Paper[];
  };
  onPlay?: (paper: Paper) => void;
  onSave?: (paper: Paper) => void;
  onShare?: (paper: Paper) => void;
  onClick?: (paper: Paper) => void;
  onSeeAll?: (category: string) => void;
  userName?: string;
  isLoading?: boolean;
}

// Demo data removed - now using real recommendations only


export const EnhancedHomePage: React.FC<EnhancedHomePageProps> = ({
  recommendations,
  onPlay,
  onSave,
  onShare,
  onClick,
  onSeeAll,
  userName,
  isLoading
}) => {
  // Set default values
  const displayName = userName || 'Researcher';
  const loading = isLoading || false;
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 🧪 TESTING LOGS: HomePage initialization
    console.log('🚨 TESTING: If you see this, console logging is working!');
    console.log('🏠 [HomePage] Component initialized');
    console.log(`📊 [HomePage] Sections count: ${sections.length}`);
    console.log(`👤 [HomePage] User: ${displayName}`);
    console.log(`⏰ [HomePage] Current time: ${currentTime.toLocaleTimeString()}`);

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getPersonalizedGreeting = (): string => {
    const hour = currentTime.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return `Good ${timeOfDay}, ${displayName}`;
  };

  const getContextualMessage = (): string => {
    const hour = currentTime.getHours();
    if (hour < 9) return "Start your day with the latest research discoveries";
    if (hour < 12) return "Dive deep into your research interests";
    if (hour < 17) return "Explore trending topics in your field";
    return "Wind down with some light reading";
  };

  // Quick access items (recently viewed, bookmarked, etc.)
  const quickAccessItems = [
    { icon: ClockIcon, label: 'Recently Viewed', count: 12, color: 'bg-blue-500' },
    { icon: FireIcon, label: 'Trending Now', count: 8, color: 'bg-red-500' },
    { icon: SparklesIcon, label: 'New Discoveries', count: 15, color: 'bg-purple-500' },
    { icon: UserGroupIcon, label: 'Collaborations', count: 3, color: 'bg-green-500' }
  ];

  // Transform recommendations into sections
  const sections: RecommendationSection[] = [];

  if (recommendations?.papers_for_you?.length) {
    sections.push({
      title: "Made for You",
      description: "Your personalized mix of research papers",
      papers: recommendations.papers_for_you,
      updated: `Updated ${new Date().toLocaleDateString()}`,
      refresh_reason: "Based on your reading history and research interests",
      icon: SparklesIcon,
      color: "#1db954",
      category: "papers_for_you"
    });
  }

  if (recommendations?.trending_in_field?.length) {
    sections.push({
      title: "Trending in Your Field",
      description: "Hot topics gaining attention in your research area",
      papers: recommendations.trending_in_field,
      updated: `Updated ${new Date().toLocaleDateString()}`,
      refresh_reason: "Based on recent activity in your research domain",
      icon: FireIcon,
      color: "#ff6b35",
      category: "trending_in_field"
    });
  }

  if (recommendations?.cross_pollination?.length) {
    sections.push({
      title: "Cross-Pollination",
      description: "Interdisciplinary discoveries and new perspectives",
      papers: recommendations.cross_pollination,
      updated: `Updated ${new Date().toLocaleDateString()}`,
      refresh_reason: "Exploring connections across research domains",
      icon: ClockIcon,
      color: "#8b5cf6",
      category: "cross_pollination"
    });
  }

  if (recommendations?.citation_opportunities?.length) {
    sections.push({
      title: "Citation Opportunities",
      description: "Papers that could benefit from your expertise",
      papers: recommendations.citation_opportunities,
      updated: `Updated ${new Date().toLocaleDateString()}`,
      refresh_reason: "Based on your publication history and expertise",
      icon: UserGroupIcon,
      color: "#f59e0b",
      category: "citation_opportunities"
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] to-[#000000] text-white">
      {/* Enhanced Header with Personalized Greeting */}
      <div className="pt-8 pb-6 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Time-based greeting */}
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {getPersonalizedGreeting()}
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            {getContextualMessage()}
          </p>

          {/* Quick Access Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {quickAccessItems.map((item, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-[#282828] to-[#181818] rounded-xl p-4 hover:from-[#383838] hover:to-[#282828] transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{item.label}</p>
                    <p className="text-gray-400 text-xs">{item.count} items</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Recommendation Sections */}
      <div className="px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <SpotifyCleanSection
              key={section.title}
              section={section}
              onPlay={onPlay}
              onSave={onSave}
              onShare={onShare}
              onClick={onClick}
              onSeeAll={onSeeAll}
              showPersonalizedGreeting={index === 0}
              userName={displayName}
              isLoading={loading}
            />
          ))}

          {/* Empty state */}
          {sections.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#1db954] to-[#1ed760] rounded-full flex items-center justify-center">
                <SparklesIcon className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Welcome to Research Discovery</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Start exploring research papers and we'll create personalized recommendations just for you.
              </p>
              <button className="bg-[var(--spotify-green)] text-black px-8 py-3 rounded-full font-semibold hover:scale-105 transition-transform">
                Explore Research
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Footer with Stats */}
      <div className="border-t border-gray-800 mt-16 pt-8 pb-8 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h4 className="text-2xl font-bold text-[var(--spotify-green)] mb-2">
                {sections.reduce((total, section) => total + section.papers.length, 0)}
              </h4>
              <p className="text-gray-400">Papers Recommended Today</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-[var(--spotify-green)] mb-2">
                {Math.floor(Math.random() * 50) + 20}
              </h4>
              <p className="text-gray-400">New Discoveries This Week</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-[var(--spotify-green)] mb-2">
                {Math.floor(Math.random() * 10) + 5}
              </h4>
              <p className="text-gray-400">Research Areas Explored</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedHomePage;
