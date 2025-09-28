import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  GlobeAltIcon,
  AdjustmentsHorizontalIcon,
  BeakerIcon,
  LightBulbIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface SemanticDiscoveryInterfaceProps {
  activeMode: 'recommendations' | 'semantic_search' | 'cross_domain' | 'smart_filters';
  onModeChange: (mode: 'recommendations' | 'semantic_search' | 'cross_domain' | 'smart_filters') => void;
  onSemanticSearch: (query: string, options: any) => void;
  onFilterChange: (criteria: any) => void;
  onCrossDomainExplore: (domains: string[]) => void;
  loading?: boolean;
}

export default function SemanticDiscoveryInterface({
  activeMode,
  onModeChange,
  onSemanticSearch,
  onFilterChange,
  onCrossDomainExplore,
  loading = false
}: SemanticDiscoveryInterfaceProps) {
  console.log('🔍 SemanticDiscoveryInterface rendering with activeMode:', activeMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOptions, setSearchOptions] = useState({
    semantic_expansion: true,
    domain_focus: [],
    similarity_threshold: 0.7,
    include_related_concepts: true
  });
  
  const [filterCriteria, setFilterCriteria] = useState({
    min_similarity_score: 0.6,
    preferred_domains: [],
    min_citation_count: 5,
    publication_year_range: [2020, 2024],
    novelty_preference: 0.5
  });

  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const discoveryModes = [
    {
      id: 'recommendations' as const,
      name: 'Smart Recommendations',
      icon: SparklesIcon,
      description: 'AI-powered personalized paper recommendations',
      color: 'bg-purple-500'
    },
    {
      id: 'semantic_search' as const,
      name: 'Semantic Search',
      icon: MagnifyingGlassIcon,
      description: 'Intelligent search with concept expansion',
      color: 'bg-blue-500'
    },
    {
      id: 'cross_domain' as const,
      name: 'Cross-Domain Discovery',
      icon: GlobeAltIcon,
      description: 'Discover connections across research fields',
      color: 'bg-green-500'
    },
    {
      id: 'smart_filters' as const,
      name: 'Smart Filters',
      icon: FunnelIcon,
      description: 'Advanced semantic filtering and ranking',
      color: 'bg-orange-500'
    }
  ];

  const researchDomains = [
    'Oncology', 'Cardiology', 'Neuroscience', 'Immunology', 'Genetics',
    'Pharmacology', 'Biochemistry', 'Microbiology', 'Epidemiology', 'Bioengineering'
  ];

  const handleSemanticSearch = () => {
    if (searchQuery.trim()) {
      onSemanticSearch(searchQuery, searchOptions);
    }
  };

  const handleFilterApply = () => {
    onFilterChange(filterCriteria);
  };

  const handleCrossDomainExplore = () => {
    if (selectedDomains.length > 0) {
      onCrossDomainExplore(selectedDomains);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ minHeight: '200px' }}>
      {/* Mode Selection Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">🔍 Semantic Discovery</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {discoveryModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                activeMode === mode.id
                  ? 'border-white bg-white/20 text-white'
                  : 'border-white/30 text-white/80 hover:border-white/60 hover:bg-white/10'
              }`}
            >
              <mode.icon className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm font-medium">{mode.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode-Specific Content */}
      <div className="p-6">
        {activeMode === 'semantic_search' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semantic Search Query
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter research concepts, methods, or questions..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSemanticSearch()}
                />
                <button
                  onClick={handleSemanticSearch}
                  disabled={loading || !searchQuery.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <MagnifyingGlassIcon className="h-5 w-5" />}
                  Search
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={searchOptions.semantic_expansion}
                    onChange={(e) => setSearchOptions({...searchOptions, semantic_expansion: e.target.checked})}
                    className="rounded"
                  />
                  Enable Semantic Expansion
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={searchOptions.include_related_concepts}
                    onChange={(e) => setSearchOptions({...searchOptions, include_related_concepts: e.target.checked})}
                    className="rounded"
                  />
                  Include Related Concepts
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Similarity Threshold: {searchOptions.similarity_threshold}
              </label>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.1"
                value={searchOptions.similarity_threshold}
                onChange={(e) => setSearchOptions({...searchOptions, similarity_threshold: parseFloat(e.target.value)})}
                className="w-full"
              />
            </div>
          </div>
        )}

        {activeMode === 'smart_filters' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Citation Count
                </label>
                <input
                  type="number"
                  value={filterCriteria.min_citation_count}
                  onChange={(e) => setFilterCriteria({...filterCriteria, min_citation_count: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Novelty Preference: {filterCriteria.novelty_preference}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filterCriteria.novelty_preference}
                  onChange={(e) => setFilterCriteria({...filterCriteria, novelty_preference: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Familiar</span>
                  <span>Novel</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publication Year Range
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  value={filterCriteria.publication_year_range[0]}
                  onChange={(e) => setFilterCriteria({
                    ...filterCriteria, 
                    publication_year_range: [parseInt(e.target.value), filterCriteria.publication_year_range[1]]
                  })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  value={filterCriteria.publication_year_range[1]}
                  onChange={(e) => setFilterCriteria({
                    ...filterCriteria, 
                    publication_year_range: [filterCriteria.publication_year_range[0], parseInt(e.target.value)]
                  })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <button
              onClick={handleFilterApply}
              disabled={loading}
              className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <FunnelIcon className="h-5 w-5" />}
              Apply Smart Filters
            </button>
          </div>
        )}

        {activeMode === 'cross_domain' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Research Domains to Explore
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {researchDomains.map((domain) => (
                  <label key={domain} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDomains.includes(domain)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDomains([...selectedDomains, domain]);
                        } else {
                          setSelectedDomains(selectedDomains.filter(d => d !== domain));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">{domain}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleCrossDomainExplore}
              disabled={loading || selectedDomains.length === 0}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <GlobeAltIcon className="h-5 w-5" />}
              Explore Cross-Domain Opportunities
            </button>
          </div>
        )}

        {activeMode === 'recommendations' && (
          <div className="text-center py-8">
            <SparklesIcon className="h-16 w-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Recommendations Active</h3>
            <p className="text-gray-600">
              Your personalized recommendations are displayed below, powered by advanced AI algorithms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
