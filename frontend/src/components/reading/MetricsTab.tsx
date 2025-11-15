'use client';

import React, { useState, useEffect } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface PaperMetrics {
  pmid: string;
  title: string;
  citation_count: number;
  reference_count: number;
  publication_year: number;
  journal: string;
  impact_factor?: number;
  altmetric_score?: number;
  views?: number;
  downloads?: number;
  shares?: number;
}

interface MetricsTabProps {
  pmid: string;
}

export default function MetricsTab({ pmid }: MetricsTabProps) {
  const [metrics, setMetrics] = useState<PaperMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [pmid]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      console.log(`📊 Fetching metrics for PMID: ${pmid}`);
      
      // Fetch paper details
      const response = await fetch(`/api/proxy/pubmed/details/${pmid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }

      const data = await response.json();
      
      // Fetch citation count
      const citationsResponse = await fetch(`/api/proxy/pubmed/citations?pmid=${pmid}&limit=1`);
      let citationCount = 0;
      if (citationsResponse.ok) {
        const citationsData = await citationsResponse.json();
        citationCount = citationsData.total_count || citationsData.citations?.length || 0;
      }

      // Fetch reference count
      const referencesResponse = await fetch(`/api/proxy/pubmed/references?pmid=${pmid}&limit=1`);
      let referenceCount = 0;
      if (referencesResponse.ok) {
        const referencesData = await referencesResponse.json();
        referenceCount = referencesData.total_count || referencesData.references?.length || 0;
      }

      setMetrics({
        pmid: data.pmid || pmid,
        title: data.title || 'Unknown',
        citation_count: citationCount,
        reference_count: referenceCount,
        publication_year: data.year || new Date().getFullYear(),
        journal: data.journal || 'Unknown Journal',
        impact_factor: undefined, // TODO: Fetch from external API
        altmetric_score: undefined, // TODO: Fetch from Altmetric API
        views: undefined,
        downloads: undefined,
        shares: undefined,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <ChartBarIcon className="w-12 h-12 mb-2" />
        <p className="text-sm">No metrics available</p>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const yearsOld = currentYear - metrics.publication_year;
  const citationsPerYearValue = yearsOld > 0 ? metrics.citation_count / yearsOld : metrics.citation_count;
  const citationsPerYear = yearsOld > 0 ? citationsPerYearValue.toFixed(1) : metrics.citation_count.toString();

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Paper Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Paper Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-600">PMID:</span>
              <span className="text-xs font-medium text-gray-900">{metrics.pmid}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-600">Journal:</span>
              <span className="text-xs font-medium text-gray-900 text-right max-w-[60%]">
                {metrics.journal}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-600">Year:</span>
              <span className="text-xs font-medium text-gray-900">{metrics.publication_year}</span>
            </div>
          </div>
        </div>

        {/* Citation Metrics */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Citation Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-900 mb-1">
                {metrics.citation_count}
              </div>
              <div className="text-xs text-purple-700">Total Citations</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-900 mb-1">
                {citationsPerYear}
              </div>
              <div className="text-xs text-blue-700">Citations/Year</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-900 mb-1">
                {metrics.reference_count}
              </div>
              <div className="text-xs text-green-700">References</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-900 mb-1">
                {yearsOld}
              </div>
              <div className="text-xs text-orange-700">Years Old</div>
            </div>
          </div>
        </div>

        {/* Journal Metrics */}
        {metrics.impact_factor && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Journal Metrics</h3>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-indigo-900 mb-1">
                {metrics.impact_factor.toFixed(2)}
              </div>
              <div className="text-xs text-indigo-700">Impact Factor</div>
            </div>
          </div>
        )}

        {/* Altmetric Score */}
        {metrics.altmetric_score && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Alternative Metrics</h3>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-pink-900 mb-1">
                {metrics.altmetric_score}
              </div>
              <div className="text-xs text-pink-700">Altmetric Score</div>
              <p className="text-xs text-pink-600 mt-2">
                Measures online attention from news, blogs, social media, etc.
              </p>
            </div>
          </div>
        )}

        {/* Usage Metrics */}
        {(metrics.views || metrics.downloads || metrics.shares) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Usage Metrics</h3>
            <div className="space-y-2">
              {metrics.views && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600">Views</span>
                  <span className="text-sm font-semibold text-gray-900">{metrics.views.toLocaleString()}</span>
                </div>
              )}
              {metrics.downloads && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600">Downloads</span>
                  <span className="text-sm font-semibold text-gray-900">{metrics.downloads.toLocaleString()}</span>
                </div>
              )}
              {metrics.shares && (
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600">Shares</span>
                  <span className="text-sm font-semibold text-gray-900">{metrics.shares.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Citation Context */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Citation Context</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <p>
              This paper has been cited <strong>{metrics.citation_count}</strong> times since publication in <strong>{metrics.publication_year}</strong>.
            </p>
            {yearsOld > 0 && (
              <p>
                With an average of <strong>{citationsPerYear}</strong> citations per year, this paper shows{' '}
                {citationsPerYearValue > 10 ? 'strong' : citationsPerYearValue > 5 ? 'moderate' : 'modest'} impact in its field.
              </p>
            )}
            <p>
              The paper references <strong>{metrics.reference_count}</strong> other works, indicating{' '}
              {metrics.reference_count > 50 ? 'comprehensive' : metrics.reference_count > 30 ? 'thorough' : 'focused'} literature coverage.
            </p>
          </div>
        </div>

        {/* Data Sources */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>Data Sources:</strong> PubMed, PubMed Central
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

