'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  GlobeAltIcon,
  FolderIcon,
  BookmarkIcon,
  SparklesIcon,
  ArrowRightIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface HeroQuickStartProps {
  className?: string;
}

export function HeroQuickStart({ className = '' }: HeroQuickStartProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projectCount: 0,
    collectionCount: 0,
    savedPapersCount: 0,
    loading: true
  });

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.email) {
        setStats({ projectCount: 0, collectionCount: 0, savedPapersCount: 0, loading: false });
        return;
      }

      try {
        // Fetch projects
        const projectsRes = await fetch(`/api/proxy/projects?userId=${user.email}`, {
          headers: { 'User-ID': user.email }
        });
        const projectsData = await projectsRes.json();
        const projectCount = projectsData?.projects?.length || 0;

        // Fetch collections (aggregate from all projects)
        let collectionCount = 0;
        if (projectsData?.projects) {
          for (const project of projectsData.projects) {
            const collectionsRes = await fetch(`/api/proxy/projects/${project.id}/collections`, {
              headers: { 'User-ID': user.email }
            });
            const collectionsData = await collectionsRes.json();
            collectionCount += collectionsData?.collections?.length || 0;
          }
        }

        setStats({
          projectCount,
          collectionCount,
          savedPapersCount: 0, // TODO: Implement saved papers count
          loading: false
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({ projectCount: 0, collectionCount: 0, savedPapersCount: 0, loading: false });
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Hero Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-green-600/20 rounded-2xl" />
      <div className="absolute inset-0 bg-[var(--spotify-dark-gray)]/80 backdrop-blur-sm rounded-2xl" />
      
      {/* Content */}
      <div className="relative p-8 sm:p-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="w-6 h-6 text-[var(--spotify-green)]" />
            <span className="text-xs font-semibold text-[var(--spotify-green)] uppercase tracking-wider">
              Core Features
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Discover Research Networks
          </h1>
          <p className="text-lg text-[var(--spotify-light-text)] max-w-2xl">
            Explore connections between papers, discover adjacent research, and build your knowledge graph
          </p>
        </div>

        {/* Primary CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Network Explorer - Primary CTA */}
          <button
            onClick={() => router.push('/explore/network')}
            className="group relative p-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <GlobeAltIcon className="w-7 h-7 text-white" />
              </div>
              <ArrowRightIcon className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Explore Network</h3>
            <p className="text-sm text-white/90">
              Discover connections between papers and explore adjacent research
            </p>
            <div className="mt-4 flex items-center text-xs text-white/80">
              <SparklesIcon className="w-4 h-4 mr-1" />
              <span>Core Feature</span>
            </div>
          </button>

          {/* Project Workspace - Secondary CTA */}
          <button
            onClick={() => router.push('/dashboard')}
            className="group relative p-6 bg-gradient-to-br from-green-600 to-teal-600 rounded-xl hover:from-green-500 hover:to-teal-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FolderIcon className="w-7 h-7 text-white" />
              </div>
              <ArrowRightIcon className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Project Workspace</h3>
            <p className="text-sm text-white/90">
              Organize papers into projects and collections
            </p>
            {!stats.loading && stats.projectCount > 0 && (
              <div className="mt-4 flex items-center text-xs text-white/80">
                <ChartBarIcon className="w-4 h-4 mr-1" />
                <span>{stats.projectCount} project{stats.projectCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </button>

          {/* Collections - Tertiary CTA */}
          <button
            onClick={() => router.push('/collections')}
            className="group relative p-6 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl hover:from-orange-500 hover:to-red-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-orange-500/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <BookmarkIcon className="w-7 h-7 text-white" />
              </div>
              <ArrowRightIcon className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Collections</h3>
            <p className="text-sm text-white/90">
              Browse and manage your saved paper collections
            </p>
            {!stats.loading && stats.collectionCount > 0 && (
              <div className="mt-4 flex items-center text-xs text-white/80">
                <BookmarkIcon className="w-4 h-4 mr-1" />
                <span>{stats.collectionCount} collection{stats.collectionCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </button>
        </div>

        {/* Quick Stats Bar */}
        {!stats.loading && (stats.projectCount > 0 || stats.collectionCount > 0) && (
          <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-[var(--spotify-light-text)]">
                Your workspace is active
              </span>
            </div>
            {stats.projectCount > 0 && (
              <div className="text-sm text-[var(--spotify-light-text)]">
                <span className="font-semibold text-white">{stats.projectCount}</span> active project{stats.projectCount !== 1 ? 's' : ''}
              </div>
            )}
            {stats.collectionCount > 0 && (
              <div className="text-sm text-[var(--spotify-light-text)]">
                <span className="font-semibold text-white">{stats.collectionCount}</span> collection{stats.collectionCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* First-time user message */}
        {!stats.loading && stats.projectCount === 0 && stats.collectionCount === 0 && (
          <div className="flex items-center gap-3 pt-6 border-t border-white/10">
            <SparklesIcon className="w-5 h-5 text-[var(--spotify-green)] flex-shrink-0" />
            <p className="text-sm text-[var(--spotify-light-text)]">
              <span className="text-white font-semibold">New here?</span> Start by exploring the network view to discover papers and their connections
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

