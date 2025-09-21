'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorAlert } from '@/components/ui/Alert';
import { SpotifyRecommendations } from '@/components/ui/SpotifyRecommendations';
import { SpotifyTopBar } from '@/components/ui/SpotifyNavigation';
import { Button } from '@/components/ui/Button';
import { 
  PlusIcon, 
  FolderIcon, 
  ChartBarIcon,
  MusicalNoteIcon,
  ClockIcon,
  FireIcon,
  BeakerIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

interface RecommendationData {
  papers_for_you: any[];
  trending: any[];
  cross_pollination: any[];
  citation_opportunities: any[];
  user_insights: {
    primary_domains: string[];
    activity_level: string;
    research_velocity: string;
    total_saved_papers: number;
  };
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const quickActions: QuickAction[] = [
    {
      title: "Create New Project",
      description: "Start a new research project",
      icon: PlusIcon,
      href: "/project/new",
      color: "bg-[var(--spotify-green)]"
    },
    {
      title: "Browse Projects",
      description: "View all your projects",
      icon: FolderIcon,
      href: "/dashboard",
      color: "bg-blue-600"
    },
    {
      title: "Search Papers",
      description: "Find research papers",
      icon: ChartBarIcon,
      href: "/search",
      color: "bg-purple-600"
    },
    {
      title: "Collections",
      description: "Manage your collections",
      icon: MusicalNoteIcon,
      href: "/collections",
      color: "bg-orange-600"
    }
  ];

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Check if user registration is complete
    if (user.registration_completed === false) {
      console.log('⚠️ User registration incomplete, redirecting to complete profile');
      router.push('/auth/complete-profile');
      return;
    }

    loadRecommendations();
  }, [user, router]);

  const loadRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading recommendations for user:', user.user_id);
      const response = await fetch(`/api/proxy/recommendations/weekly/${user.user_id}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Recommendations API error:', response.status, errorText);
        throw new Error(`Failed to load recommendations: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Recommendations loaded:', data);

      // Check if we got empty recommendations
      const totalRecommendations = (data.recommendations?.papers_for_you?.length || 0) +
                                  (data.recommendations?.trending_in_field?.length || 0) +
                                  (data.recommendations?.cross_pollination?.length || 0) +
                                  (data.recommendations?.citation_opportunities?.length || 0);

      if (totalRecommendations === 0) {
        console.warn('⚠️ No recommendations returned. User profile may be incomplete or no saved articles found.');
      }

      setRecommendations(data);
    } catch (err) {
      console.error('❌ Failed to load recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRecommendations();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--spotify-black)] flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--spotify-black)]">
      {/* Top Navigation */}
      <SpotifyTopBar
        title="Home"
        showSearch={true}
        onSearch={(query) => {
          // Navigate to search page with query
          router.push(`/search?q=${encodeURIComponent(query)}`);
        }}
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-[var(--spotify-dark-gray)] to-[var(--spotify-black)] px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Good {getTimeOfDay()}, {user.first_name || user.username}
              </h1>
              <p className="text-[var(--spotify-light-text)] text-lg">
                Discover new research tailored to your interests
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-[var(--spotify-green)] text-[var(--spotify-green)] hover:bg-[var(--spotify-green)] hover:text-black"
            >
              Refresh Recommendations
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.href)}
                className="group p-6 bg-[var(--spotify-dark-gray)] rounded-lg hover:bg-[var(--spotify-gray)] transition-all duration-200 text-left"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">{action.title}</h3>
                <p className="text-[var(--spotify-light-text)] text-sm">{action.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Recommendations Section */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="xl" />
              <p className="text-[var(--spotify-light-text)] mt-4 text-lg">
                Generating your personalized recommendations...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="py-20">
            <ErrorAlert title="Failed to load recommendations">
              <p className="mb-4">{error}</p>
              <Button
                onClick={handleRefresh}
                className="bg-[var(--spotify-green)] text-black hover:bg-[var(--spotify-green-hover)]"
              >
                Try Again
              </Button>
            </ErrorAlert>
          </div>
        ) : recommendations ? (
          <SpotifyRecommendations 
            recommendations={recommendations}
            onRefresh={handleRefresh}
          />
        ) : null}

        {/* Recent Activity Preview */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              className="text-[var(--spotify-light-text)] hover:text-white"
            >
              View All →
            </Button>
          </div>
          <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6">
            <div className="flex items-center text-[var(--spotify-light-text)]">
              <ClockIcon className="w-5 h-5 mr-2" />
              <span>Your recent projects and collections will appear here</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
