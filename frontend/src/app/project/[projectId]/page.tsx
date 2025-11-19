'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MobileResponsiveLayout } from '@/components/ui/MobileResponsiveLayout';
import AnnotationsFeed from '@/components/AnnotationsFeed';
import ActivityFeed from '@/components/ActivityFeed';
import ResultsList from '@/components/ResultsList';
import NetworkViewWithSidebar from '@/components/NetworkViewWithSidebar';
import MultiColumnNetworkView from '@/components/MultiColumnNetworkView';
import Collections from '@/components/Collections';
import { useAsyncJob } from '@/hooks/useAsyncJob';
import { startReviewJob, startDeepDiveJob, fetchResearchStats, ResearchStats } from '../../../lib/api';
import AsyncJobProgress from '@/components/AsyncJobProgress';
import ClusterExplorationModal from '@/components/ClusterExplorationModal';
import InlineJobResults from '@/components/InlineJobResults';
import { SpotifyTopBar, SpotifyBreadcrumb, SpotifyTabs } from '@/components/ui/SpotifyNavigation';
import { SpotifyCollectionCard } from '@/components/ui/SpotifyCard';
import { SpotifyProjectHeader } from '@/components/ui/SpotifyProjectHeader';
import { InboxTab } from '@/components/project/InboxTab';
import { EnhancedSpotifyProjectHeader } from '@/components/ui/EnhancedSpotifyProjectHeader';
import { SpotifyProjectTabs } from '@/components/ui/SpotifyProjectTabs';
import { SpotifySubTabs } from '@/components/ui/SpotifySubTabs';
import { SpotifyQuickActions, createQuickActions } from '@/components/ui/SpotifyQuickActions';
import { ResearchQuestionTab } from '@/components/project/ResearchQuestionTab';
import { NotesTab } from '@/components/project/NotesTab';
import { ExploreTab } from '@/components/project/ExploreTab';
import { AnalysisTab } from '@/components/project/AnalysisTab';
import { ProgressTab } from '@/components/project/ProgressTab';
import { MyCollectionsTab } from '@/components/project/MyCollectionsTab';
import { ProjectHeroActions } from '@/components/project/ProjectHeroActions';
import { NetworkQuickStart } from '@/components/project/NetworkQuickStart';
import { ContextualActions, ProjectState, ActionType } from '@/components/project/ContextualActions';
import DiscoverSection from '@/components/project/DiscoverSection';
import EnhancedDiscoverSection from '@/components/project/EnhancedDiscoverSection';
import GlobalSearch from '@/components/search/GlobalSearch';
import CollaboratorsList from '@/components/collaboration/CollaboratorsList';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  ProjectNavigation,
  PageHeader,
  SpotifyReportCard,
  DeletableReportCard
} from '@/components/ui';

interface Project {
  project_id: string;
  project_name: string;
  description?: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  settings?: {
    research_question?: string;
    seed_paper_pmid?: string;
    seed_paper_title?: string;
    [key: string]: any;
  };
  reports: Array<{
    report_id: string;
    title: string;
    objective: string;
    created_at: string;
    created_by: string;
  }>;
  collaborators: Array<{
    user_id: string;
    username: string;
    role: string;
    invited_at: string;
  }>;
  annotations: Array<{
    annotation_id: string;
    content: string;
    author_id: string;
    created_at: string;
    article_pmid?: string;
    report_id?: string;
  }>;
  deep_dive_analyses: Array<{
    analysis_id: string;
    article_title: string;
    article_pmid?: string;
    article_url?: string;
    processing_status: string;
    created_at: string;
    created_by: string;
  }>;
  // Statistics fields from backend
  reports_count?: number;
  deep_dive_analyses_count?: number;
  annotations_count?: number;
  active_days?: number;
}

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [creatingNote, setCreatingNote] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    title: '',
    objective: '',
    molecule: '',
    clinical_mode: false,
    dag_mode: false,
    full_text_only: false,
    preference: 'precision'
  });

  const [showDeepDiveModal, setShowDeepDiveModal] = useState(false);
  const [deepDiveData, setDeepDiveData] = useState({
    article_title: '',
    article_pmid: '',
    article_url: '',
    objective: ''
  });
  const [creatingDeepDive, setCreatingDeepDive] = useState(false);
  const [creatingReport, setCreatingReport] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'viewer'
  });
  const [sendingInvite, setSendingInvite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Collection management state
  const [collections, setCollections] = useState<any[]>([]);
  const [totalPapers, setTotalPapers] = useState(0);
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false);
  const [selectedArticleForCollection, setSelectedArticleForCollection] = useState<{
    pmid?: string;
    title: string;
    authors?: string[];
    journal?: string;
    year?: number;
    source: 'report' | 'deep_dive';
    source_id: string;
  } | null>(null);

  // Collection creation modal state
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [newCollectionData, setNewCollectionData] = useState({
    collection_name: '',
    description: ''
  });
  const [creatingCollection, setCreatingCollection] = useState(false);

  // Tab navigation state - New 5-tab structure
  const [activeTab, setActiveTab] = useState<'research' | 'papers' | 'lab' | 'notes' | 'analysis'>('research');
  const [activeSubTab, setActiveSubTab] = useState<string>('questions'); // Default sub-tab for each main tab

  // Research stats state - For enhanced header and discover section
  const [researchStats, setResearchStats] = useState<ResearchStats>({
    questionsCount: 0,
    hypothesesCount: 0,
    evidenceCount: 0,
    answeredCount: 0,
    unansweredCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Global search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Report generation results (same as Welcome Page)
  const [reportResults, setReportResults] = useState<any[]>([]);
  const [reportDiagnostics, setReportDiagnostics] = useState<any | null>(null);
  const [reportQueries, setReportQueries] = useState<string[] | null>(null);
  const [reportTitle, setReportTitle] = useState<string>('');
  const [reportObjective, setReportObjective] = useState<string>('');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Async job management for generate-review
  const reviewJob = useAsyncJob({
    pollInterval: 10000, // 10 seconds (reduced polling frequency)
    storageKey: `reviewJob_${projectId}`,
    userId: user?.email,
    onProgress: (status) => {
      console.log(`🚀 [Review Job] Status: ${status}`);
    },
    onComplete: (result) => {
      // Handle completed review
      const arr = Array.isArray(result?.results) ? result.results : [];
      const enriched = arr.map((it: any) => ({ ...it, _objective: reportObjective, query: reportObjective }));

      setReportResults(enriched);
      setReportDiagnostics(result?.diagnostics ?? null);
      setReportQueries(Array.isArray(result?.queries) ? result.queries : null);

      // Show inline results
      setInlineResults({
        show: true,
        jobType: 'review',
        result: result
      });

      fetchProjectData(); // Refresh project data
    },
    onError: (error) => {
      console.error('❌ [Review Job] Error:', error);
      alert(`❌ Failed to generate report: ${error}. Please try again.`);
    }
  });

  // Async job management for deep-dive
  const deepDiveJob = useAsyncJob({
    pollInterval: 10000, // 10 seconds (reduced polling frequency)
    storageKey: `deepDiveJob_${projectId}`,
    userId: user?.email,
    onProgress: (status) => {
      console.log(`🔍 [Deep Dive Job] Status: ${status}`);
    },
    onComplete: (result) => {
      // Handle completed deep dive
      // Show inline results
      setInlineResults({
        show: true,
        jobType: 'deep-dive',
        result: result
      });

      fetchProjectData(); // Refresh project data
    },
    onError: (error) => {
      console.error('❌ [Deep Dive Job] Error:', error);
      alert(`❌ Failed to complete deep dive: ${error}. Please try again.`);
    }
  });

  // Comprehensive project summary state
  const [comprehensiveSummary, setComprehensiveSummary] = useState<any>(null);
  const [generatingComprehensiveSummary, setGeneratingComprehensiveSummary] = useState(false);

  // 🔧 Fetch research stats when project loads
  useEffect(() => {
    const loadResearchStats = async () => {
      if (!projectId || !user?.user_id) return;

      setLoadingStats(true);
      try {
        const stats = await fetchResearchStats(projectId as string, user.user_id);
        setResearchStats(stats);
        console.log('📊 Research stats loaded:', stats);
      } catch (error) {
        console.error('❌ Error loading research stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadResearchStats();
  }, [projectId, user?.user_id]);

  // 🔧 Handle URL parameters to set active tab - Map old tab names to new structure
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      console.log('📍 Setting active tab from URL:', tab);
      // Map old tab names to new structure
      if (tab === 'research-question') {
        setActiveTab('research');
        setActiveSubTab('questions');
      } else if (tab === 'explore') {
        setActiveTab('papers');
        setActiveSubTab('explore');
      } else if (tab === 'collections') {
        setActiveTab('papers');
        setActiveSubTab('collections');
      } else if (tab === 'notes') {
        setActiveTab('notes');
        setActiveSubTab('ideas');
      } else if (tab === 'analysis') {
        setActiveTab('analysis');
        setActiveSubTab('reports');
      } else if (tab === 'progress') {
        setActiveTab('analysis');
        setActiveSubTab('timeline');
      }
      // New tab names
      else if (['research', 'papers', 'lab', 'notes', 'analysis'].includes(tab)) {
        setActiveTab(tab as 'research' | 'papers' | 'lab' | 'notes' | 'analysis');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (projectId && user) {
      fetchProjectData();
      fetchCollections();
    }
  }, [projectId, user]);

  // 🔍 Global search keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 🔍 Handle search result navigation - Updated for new tab structure
  const handleSearchResultClick = (result: any) => {
    console.log('🔍 [Global Search] Result clicked:', result);

    // Navigate to appropriate tab based on result type
    switch (result.type) {
      case 'paper':
        // Navigate to papers → collections
        setActiveTab('papers');
        setActiveSubTab('collections');
        break;
      case 'collection':
        // Navigate to papers → collections
        setActiveTab('papers');
        setActiveSubTab('collections');
        break;
      case 'note':
        // Navigate to notes → ideas
        setActiveTab('notes');
        setActiveSubTab('ideas');
        break;
      case 'report':
        // Navigate to analysis → reports
        setActiveTab('analysis');
        setActiveSubTab('reports');
        break;
      case 'analysis':
        // Navigate to analysis → reports
        setActiveTab('analysis');
        setActiveSubTab('reports');
        break;
      default:
        console.warn('Unknown result type:', result.type);
    }
  };

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}`, {
        headers: {
          'User-ID': user?.email || 'default_user',
        },
      });

      if (response.status === 403) {
        setError('Access denied. You do not have permission to view this project. Please check if you are logged in with the correct account or if you have been granted access to this project.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const projectData = await response.json();
      setProject(projectData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      console.log('Fetching collections for project:', projectId);
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: {
          'User-ID': user?.email || 'default_user',
        },
      });
      console.log('Collections response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Collections data received:', data);
        // Backend returns collections directly as array, not wrapped in collections property
        const collectionsArray = Array.isArray(data) ? data : (data.collections || []);
        setCollections(collectionsArray);
        console.log('Collections set to state:', collectionsArray);

        // Calculate total papers from all collections
        await fetchTotalPapers(collectionsArray);
      } else {
        const errorText = await response.text();
        console.error('Collections fetch failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const fetchTotalPapers = async (collectionsArray: any[]) => {
    try {
      let total = 0;
      const uniquePmids = new Set<string>();

      for (const collection of collectionsArray) {
        const response = await fetch(
          `/api/proxy/collections/${collection.collection_id}/articles?projectId=${projectId}&limit=1000`,
          { headers: { 'User-ID': user?.email || 'default_user' } }
        );

        if (response.ok) {
          const data = await response.json();
          const articles = data.articles || [];

          // Count unique PMIDs to avoid double-counting papers in multiple collections
          // Backend returns article_pmid, not pmid
          articles.forEach((article: any) => {
            const pmid = article.article_pmid || article.pmid;
            if (pmid) {
              uniquePmids.add(pmid);
            }
          });
        }
      }

      setTotalPapers(uniquePmids.size);
      console.log(`📊 Total unique papers across all collections: ${uniquePmids.size}`);
    } catch (error) {
      console.error('Error calculating total papers:', error);
      setTotalPapers(0);
    }
  };

  const handleCreateNote = async () => {
    if (!noteContent.trim()) return;
    
    setCreatingNote(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify({
          content: noteContent.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      // Reset form and close modal
      setNoteContent('');
      setShowNoteModal(false);
      
      // Note: The AnnotationsFeed component will automatically update via WebSocket
    } catch (err) {
      console.error('Error creating note:', err);
      alert('Failed to create note. Please try again.');
    } finally {
      setCreatingNote(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportData.title.trim() || !reportData.objective.trim() || !reportData.molecule.trim()) {
      alert('Please fill in all required fields (Title, Research Objective, and Molecule)');
      return;
    }
    
    setCreatingReport(true);

    // Store report data for background processing
    const reportToGenerate = {
      molecule: reportData.molecule.trim(),
      objective: reportData.objective.trim(),
      title: reportData.title.trim(),
      projectId: projectId,
      clinicalMode: reportData.clinical_mode,
      dagMode: reportData.dag_mode,
      fullTextOnly: reportData.full_text_only,
      preference: reportData.preference,
    };

    try {
      // Reset form and close modal immediately
      setReportData({
        title: '',
        objective: '',
        molecule: '',
        clinical_mode: false,
        dag_mode: false,
        full_text_only: false,
        preference: 'precision'
      });
      setShowReportModal(false);
      setCreatingReport(false);

      // Store report info for completion handler
      setReportTitle(reportToGenerate.title);
      setReportObjective(reportToGenerate.objective);

      try {
        // Start async job
        const jobResponse = await startReviewJob({
          molecule: reportToGenerate.molecule,
          objective: reportToGenerate.objective,
          projectId: projectId,
          clinicalMode: reportToGenerate.clinicalMode,
          dagMode: reportToGenerate.dagMode,
          fullTextOnly: reportToGenerate.fullTextOnly,
          preference: reportToGenerate.preference as 'precision' | 'recall'
        }, user?.email);

        // Start polling for job completion
        reviewJob.startJob(jobResponse.job_id);

        alert(`🚀 Report generation started!\n\nThis process will continue in the background. You can close your browser and return later to check the results.`);

      } catch (error: any) {
        console.error('Error starting report generation:', error);
        alert(`❌ Failed to start report generation: ${error.message || 'Unknown error'}. Please try again.`);
      }

    } catch (err) {
      console.error('Error starting report generation:', err);
      alert('Failed to start report generation. Please try again.');
      setCreatingReport(false);
    }
  };

  const handleCreateDeepDive = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that at least one identifier is provided
    const hasTitle = deepDiveData.article_title.trim();
    const hasPmid = deepDiveData.article_pmid.trim();
    const hasUrl = deepDiveData.article_url.trim();

    if (!hasTitle && !hasPmid && !hasUrl) {
      alert('Please provide at least one of: Article Title, PMID, or Article URL');
      return;
    }

    if (!deepDiveData.objective.trim()) {
      alert('Please provide a research objective');
      return;
    }

    setCreatingDeepDive(true);
    try {
      // Import the API functions
      const { fetchDeepDive, detectOpenAccessUrl } = await import('../../../lib/api');

      // Step 1: Detect Open Access URL if PMID provided and no URL given
      let fullTextUrl = deepDiveData.article_url.trim() || null;
      if (!fullTextUrl && deepDiveData.article_pmid.trim()) {
        console.log('🔍 [Project Page] Detecting Open Access URL for PMID:', deepDiveData.article_pmid);
        fullTextUrl = await detectOpenAccessUrl(deepDiveData.article_pmid.trim());
        console.log('🔍 [Project Page] Detected OA URL:', fullTextUrl || 'None found');
      }

      // Step 2: Use Research Hub approach (same as ArticleCard.tsx)
      console.log('🔍 [Project Page] Starting manual deep dive analysis using Research Hub approach...');
      const data = await fetchDeepDive({
        url: fullTextUrl,
        pmid: deepDiveData.article_pmid.trim() || null,
        title: deepDiveData.article_title.trim(),
        objective: deepDiveData.objective.trim() || `Deep dive analysis of: ${deepDiveData.article_title.trim()}`,
        projectId // This will trigger database storage in backend
      });

      console.log('✅ [Project Page] Manual deep dive analysis completed:', data);

      // Reset form and close modal
      setDeepDiveData({
        article_title: '',
        article_pmid: '',
        article_url: '',
        objective: ''
      });
      setShowDeepDiveModal(false);

      // Refresh project data to show new analysis
      fetchProjectData();

      alert('✅ Deep dive analysis completed successfully!');
    } catch (err: any) {
      console.error('Error creating deep dive analysis:', err);
      const errorMessage = err?.message || 'Unknown error occurred';
      alert(`❌ Deep dive analysis failed: ${errorMessage}`);
    } finally {
      setCreatingDeepDive(false);
    }
  };

  const handleAddToCollection = (article: {
    pmid?: string;
    title: string;
    authors?: string[];
    journal?: string;
    year?: number;
    source: 'report' | 'deep_dive';
    source_id: string;
  }) => {
    setSelectedArticleForCollection(article);
    setShowAddToCollectionModal(true);
    // Refresh collections when modal opens to ensure we have the latest data
    fetchCollections();
  };

  const handleConfirmAddToCollection = async (collectionId: string) => {
    if (!selectedArticleForCollection) return;

    try {
      const response = await fetch(`/api/proxy/collections/${collectionId}/articles?projectId=${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify({
          article_pmid: selectedArticleForCollection.pmid || '',
          article_title: selectedArticleForCollection.title,
          article_authors: selectedArticleForCollection.authors || [],
          article_journal: selectedArticleForCollection.journal || '',
          article_year: selectedArticleForCollection.year || new Date().getFullYear(),
          source_type: selectedArticleForCollection.source || 'manual',
          source_report_id: selectedArticleForCollection.source === 'report' ? selectedArticleForCollection.source_id : null,
          source_analysis_id: selectedArticleForCollection.source === 'deep_dive' ? selectedArticleForCollection.source_id : null,
          notes: `Added from ${selectedArticleForCollection.source === 'report' ? 'Report' : 'Deep Dive Analysis'}: ${selectedArticleForCollection.source_id}`
        }),
      });

      if (response.ok) {
        alert('✅ Article added to collection successfully!');
        setShowAddToCollectionModal(false);
        setSelectedArticleForCollection(null);
        fetchCollections(); // Refresh collections
      } else {
        throw new Error('Failed to add article to collection');
      }
    } catch (error) {
      console.error('Error adding to collection:', error);
      alert('❌ Failed to add article to collection. Please try again.');
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionData.collection_name.trim()) {
      alert('Please enter a collection name');
      return;
    }

    setCreatingCollection(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify(newCollectionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create collection');
      }

      // Reset form and close modal
      setNewCollectionData({ collection_name: '', description: '' });
      setShowCollectionModal(false);

      // Refresh project data
      await fetchProjectData();

      alert('✅ Collection created successfully!');
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('❌ Failed to create collection. Please try again.');
    } finally {
      setCreatingCollection(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      // Generate project-linked summary report using new endpoint
      const summaryData = {
        molecule: project?.project_name || 'project-summary',
        objective: `Comprehensive summary of project: ${project?.project_name}`,
        preference: 'precision'
      };

      const response = await fetch(`/api/proxy/projects/${projectId}/generate-summary-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify(summaryData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary report');
      }

      setShowSummaryModal(false);

      // Refresh project data to show new report
      fetchProjectData();

      alert('Summary report generated successfully!');
    } catch (err) {
      console.error('Error generating summary:', err);
      alert('Failed to generate summary report. Please try again.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateComprehensiveSummary = async () => {
    setGeneratingComprehensiveSummary(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/generate-comprehensive-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate comprehensive summary');
      }

      const data = await response.json();
      setComprehensiveSummary(data);
      alert('✅ Comprehensive project summary generated successfully!');
    } catch (error: any) {
      console.error('Error generating comprehensive summary:', error);
      alert(`❌ Failed to generate comprehensive summary: ${error.message}`);
    } finally {
      setGeneratingComprehensiveSummary(false);
    }
  };

  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.email.trim()) return;
    
    setSendingInvite(true);
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify({
          email: inviteData.email.trim(),
          role: inviteData.role,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      // Reset form and close modal
      setInviteData({
        email: '',
        role: 'viewer'
      });
      setShowInviteModal(false);
      
      alert(`Invitation sent successfully to ${inviteData.email}!`);
      
      // Note: The ActivityFeed component will automatically update via WebSocket
    } catch (err) {
      console.error('Error sending invitation:', err);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  };

  // Smart Action Handlers for Phase 1.2
  const handleGenerateReviewFromNetwork = async (pmid: string, title: string, fullTextOnly: boolean = false) => {
    console.log('🚀 [Project Page] Generate Review from Network triggered:', {
      pmid,
      title,
      projectId,
      hasReviewJob: !!reviewJob,
      reviewJobStatus: reviewJob?.status
    });

    try {
      // Use the paper title and PMID to create an optimized query
      const optimizedQuery = `"${pmid}"[PMID] OR "${title}"[Title]`;

      // Enhanced payload with OA/Full-Text option
      const reviewPayload = {
        molecule: title.substring(0, 50), // Use first 50 chars of title as molecule
        objective: `Comprehensive review focusing on: ${title}`,
        projectId: projectId,
        clinicalMode: false,
        dagMode: false,
        fullTextOnly: fullTextOnly, // Use the toggle value
        preference: 'precision' as 'precision' | 'recall'
      };

      console.log('🚀 [Project Page] Starting review job with params:', reviewPayload);

      // Use the same working logic as dashboard "New Report" button
      try {
        console.log('🔍 [Project Page] Using working dashboard logic (async job system)...');

        // Start async job using the same method as dashboard
        const jobResponse = await startReviewJob({
          molecule: reviewPayload.molecule,
          objective: reviewPayload.objective,
          projectId: projectId,
          clinicalMode: reviewPayload.clinicalMode,
          dagMode: reviewPayload.dagMode,
          fullTextOnly: fullTextOnly, // Use the toggle value
          preference: reviewPayload.preference as 'precision' | 'recall'
        }, user?.email);

        // Start polling for job completion
        reviewJob.startJob(jobResponse.job_id);

        alert(`🚀 Report generation started!\n\nThis process will continue in the background. Check the Reports section for results.`);

        return; // Exit early since we're using async processing

        fetchProjectData(); // Refresh project data

      } catch (directError: any) {
        console.error('🔍 [Project Page] Synchronous API call failed:', directError);
        throw directError; // Re-throw to be caught by outer try-catch
      }

      console.log('✅ [Project Page] Review completed successfully from network sidebar');

    } catch (error: any) {
      console.error('❌ [Project Page] Error starting review from network:', error);
      alert(`❌ Failed to start review: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeepDiveFromNetwork = async (pmid: string, title: string, fullTextOnly: boolean = false) => {
    console.log('🔍 [Project Page] Deep Dive from Network triggered:', {
      pmid,
      title,
      projectId,
      hasDeepDiveJob: !!deepDiveJob,
      deepDiveJobStatus: deepDiveJob?.status
    });

    try {
      // Import the API functions
      const { fetchDeepDive, detectOpenAccessUrl } = await import('../../../lib/api');

      // Step 1: Detect Open Access URL for better analysis
      console.log('🔍 [Project Page] Detecting Open Access URL for PMID:', pmid);
      const fullTextUrl = await detectOpenAccessUrl(pmid);
      console.log('🔍 [Project Page] Detected OA URL:', fullTextUrl || 'None found');

      // Step 2: Use Research Hub approach (same as ArticleCard.tsx)
      console.log('🔍 [Project Page] Starting deep dive analysis using Research Hub approach...');
      const data = await fetchDeepDive({
        url: fullTextUrl,
        pmid,
        title,
        objective: `Deep dive analysis of: ${title}`,
        projectId // This will trigger database storage in backend
      });

      console.log('✅ [Project Page] Deep dive analysis completed:', data);

      // Show inline results immediately
      setInlineResults({
        show: true,
        jobType: 'deep-dive',
        result: data
      });

      fetchProjectData(); // Refresh project data

      console.log('✅ [Project Page] Deep dive completed successfully from network sidebar');

    } catch (error: any) {
      console.error('❌ [Project Page] Error starting deep dive from network:', error);
      alert(`❌ Failed to start deep dive: ${error.message || 'Unknown error'}`);
    }
  };

  // State for inline cluster exploration
  const [clusterExploration, setClusterExploration] = useState<{
    isOpen: boolean;
    sourceArticle: { pmid: string; title: string } | null;
    results: {
      citations: any[];
      references: any[];
      similar: any[];
    };
    loading: boolean;
    currentCollectionId: string | null;
  }>({
    isOpen: false,
    sourceArticle: null,
    results: { citations: [], references: [], similar: [] },
    loading: false,
    currentCollectionId: null
  });

  // State for inline job results
  const [inlineResults, setInlineResults] = useState<{
    show: boolean;
    jobType: 'review' | 'deep-dive' | null;
    result: any;
  }>({
    show: false,
    jobType: null,
    result: null
  });

  const handleExploreClusterFromNetwork = async (pmid: string, title: string) => {
    console.log('🌐 [Project Page] Explore Cluster from Network triggered:', {
      pmid,
      title,
      projectId,
      userId: user?.email
    });

    // Get current collection ID - if we're in collections tab, use the first collection
    // In the future, this could be more sophisticated to detect which specific collection
    const currentCollection = collections.length > 0 ? collections[0] : null;

    // Open cluster exploration modal/sidebar
    setClusterExploration({
      isOpen: true,
      sourceArticle: { pmid, title },
      results: { citations: [], references: [], similar: [] },
      loading: true,
      currentCollectionId: currentCollection?.collection_id || null
    });

    try {
      console.log('🌐 [Project Page] Finding related cluster papers for PMID:', pmid);
      let citations: any[] = [];
      let references: any[] = [];
      let similar: any[] = [];

      // Strategy 1: Find papers that cite this one
      console.log('🌐 [Project Page] Fetching citations for PMID:', pmid);
      try {
        const citationsResponse = await fetch(`/api/proxy/pubmed/citations?pmid=${pmid}&type=citations&limit=5`);
        if (citationsResponse.ok) {
          const citationsData = await citationsResponse.json();
          console.log('🌐 [Project Page] Citations API response:', citationsData);
          // Citations API returns { citations: [...] }
          citations = citationsData.citations?.slice(0, 3) || [];
          console.log('🌐 [Project Page] Found citations:', citations.length);
        }
      } catch (error) {
        console.warn('🌐 [Project Page] Citations fetch failed:', error);
      }

      // Strategy 2: Find papers this one references
      console.log('🌐 [Project Page] Fetching references for PMID:', pmid);
      try {
        const referencesResponse = await fetch(`/api/proxy/pubmed/references?pmid=${pmid}&limit=5`);
        if (referencesResponse.ok) {
          const referencesData = await referencesResponse.json();
          console.log('🌐 [Project Page] References API response:', referencesData);
          // References API returns { references: [...] }
          references = referencesData.references?.slice(0, 3) || [];
          console.log('🌐 [Project Page] Found references:', references.length);
        }
      } catch (error) {
        console.warn('🌐 [Project Page] References fetch failed:', error);
      }

      // Strategy 3: Find similar articles by title - use better keywords
      console.log('🌐 [Project Page] Searching for similar articles by title keywords');
      try {
        // Extract meaningful keywords from title, avoiding common words
        const commonWords = ['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'];
        const titleWords = title.toLowerCase()
          .split(' ')
          .filter(word => word.length > 3 && !commonWords.includes(word))
          .slice(0, 4) // Take up to 4 meaningful words
          .join(' ');

        console.log('🌐 [Project Page] Using search keywords:', titleWords);

        const similarResponse = await fetch(`/api/proxy/pubmed/search?q=${encodeURIComponent(titleWords)}&limit=10`);
        if (similarResponse.ok) {
          const similarData = await similarResponse.json();
          console.log('🌐 [Project Page] Similar API response:', similarData);
          // Search API returns { articles: [...] }
          similar = similarData.articles?.filter((article: any) => article.pmid !== pmid).slice(0, 3) || [];
          console.log('🌐 [Project Page] Found similar articles:', similar.length);
        }
      } catch (error) {
        console.warn('🌐 [Project Page] Similar articles fetch failed:', error);
      }

      // Update cluster exploration with results
      setClusterExploration(prev => ({
        ...prev,
        results: { citations, references, similar },
        loading: false
      }));

      console.log('✅ [Project Page] Cluster exploration completed successfully');

    } catch (error: any) {
      console.error('❌ [Project Page] Error in cluster exploration:', error);
      setClusterExploration(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  // Handle adding selected cluster articles to current collection
  const handleAddClusterArticlesToCollection = async (articles: any[], collectionId: string) => {
    if (!user?.email) return;

    console.log('🔗 [Project Page] Adding cluster articles to collection:', {
      articlesCount: articles.length,
      collectionId,
      articles: articles.map(a => ({ pmid: a.pmid, title: a.title.substring(0, 50) + '...' }))
    });

    const addPromises = articles.map(async (article) => {
      try {
        const response = await fetch(`/api/proxy/collections/${collectionId}/articles?projectId=${projectId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': user.email,
          },
          body: JSON.stringify({
            article_pmid: article.pmid,
            article_title: article.title,
            article_authors: article.authors || [],
            article_journal: article.journal || '',
            article_year: article.year || new Date().getFullYear(),
            source_type: 'cluster_exploration',
            notes: `Added from cluster exploration of: ${clusterExploration.sourceArticle?.title}`
          })
        });

        if (response.ok) {
          console.log('✅ [Project Page] Added cluster article:', article.title.substring(0, 50) + '...');
          return true;
        } else {
          console.warn('❌ [Project Page] Failed to add cluster article:', article.title);
          return false;
        }
      } catch (error) {
        console.error('❌ [Project Page] Error adding cluster article:', article.title, error);
        return false;
      }
    });

    const results = await Promise.all(addPromises);
    const successCount = results.filter(Boolean).length;

    // Refresh collections to show updated counts
    await fetchCollections();

    if (successCount === articles.length) {
      alert(`✅ Successfully added ${successCount} papers to your collection!`);
    } else {
      alert(`⚠️ Added ${successCount} of ${articles.length} papers to your collection. Some papers may have failed to add.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
          <a href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // ============================================================================
  // PROJECT STATE DETECTION FOR CONTEXTUAL ACTIONS
  // ============================================================================
  const getProjectState = (): ProjectState => {
    const hasResearchQuestion =
      !!project?.settings?.research_question &&
      project.settings.research_question.trim().length > 0;

    const hasPapers = totalPapers > 0;

    let stage: ProjectState['stage'] = 'no-question';
    if (hasResearchQuestion && !hasPapers) {
      stage = 'has-question';
    } else if (hasResearchQuestion && hasPapers) {
      stage = 'has-papers';
    }

    return {
      stage,
      hasResearchQuestion,
      hasPapers,
      hasCollections: collections.length > 0,
      paperCount: totalPapers,
      collectionCount: collections.length,
      notesCount: project.annotations_count || project.annotations?.length || 0,
      reportsCount: (project.reports_count || project.reports?.length || 0) +
                    (project.deep_dive_analyses_count || project.deep_dive_analyses?.length || 0),
    };
  };

  // ============================================================================
  // ACTION HANDLER FOR CONTEXTUAL ACTIONS
  // ============================================================================
  const handleContextualAction = (action: ActionType) => {
    console.log('🎯 Contextual action triggered:', action);

    switch (action) {
      case 'define-question':
        setActiveTab('research');
        setActiveSubTab('questions');
        // Scroll to research question section after tab change
        setTimeout(() => {
          const element = document.getElementById('research-question-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
        break;

      case 'view-collections':
        setActiveTab('papers');
        setActiveSubTab('collections');
        break;

      case 'browse-trending':
        setActiveTab('papers');
        setActiveSubTab('explore');
        // TODO: Trigger trending view in ExploreTab
        break;

      case 'recent-papers':
        setActiveTab('papers');
        setActiveSubTab('explore');
        // TODO: Trigger recent papers view in ExploreTab
        break;

      case 'ai-suggestions':
        setActiveTab('papers');
        setActiveSubTab('explore');
        // TODO: Trigger AI suggestions in ExploreTab
        break;

      case 'custom-search':
        setActiveTab('papers');
        setActiveSubTab('explore');
        // TODO: Focus on search bar in ExploreTab
        break;

      case 'new-collection':
        setShowCollectionModal(true);
        break;

      case 'generate-report':
        setShowReportModal(true);
        break;

      case 'deep-dive':
        setShowDeepDiveModal(true);
        break;

      case 'generate-summary':
        setShowSummaryModal(true);
        break;

      case 'add-note':
        setShowNoteModal(true);
        break;

      default:
        console.warn(`Unhandled contextual action: ${action}`);
    }
  };

  return (
    <MobileResponsiveLayout>
      <div className="w-full max-w-none">
        {/* Enhanced Spotify-Style Project Header with Research Stats */}
        <EnhancedSpotifyProjectHeader
          project={project}
          researchStats={researchStats}
          onPlay={() => {
            // Navigate to first tab or main view
            setActiveTab('research');
            setActiveSubTab('questions');
          }}
          onShare={() => setShowShareModal(true)}
          onSettings={() => setShowSettingsModal(true)}
          onInvite={() => setShowInviteModal(true)}
        />

        {/* Enhanced Discover Section - Research context boxes with stats and quick actions */}
        <div className="py-6 px-4">
          <EnhancedDiscoverSection
            projectId={projectId as string}
            collectionsCount={collections.length}
            researchStats={researchStats}
            onAddNote={() => setShowNoteModal(true)}
            onNewReport={() => setShowReportModal(true)}
            onDeepDive={() => setShowDeepDiveModal(true)}
            onAddQuestion={() => {
              setActiveTab('research');
              setActiveSubTab('questions');
              // TODO: Open add question modal
            }}
            onAddHypothesis={() => {
              setActiveTab('research');
              setActiveSubTab('hypotheses');
              // TODO: Open add hypothesis modal
            }}
          />
        </div>

        {/* Contextual Actions - Smart button system based on project stage */}
        <div className="py-6 px-4">
          <ContextualActions
            projectState={getProjectState()}
            activeTab={activeTab}
            onAction={handleContextualAction}
          />
        </div>

        {/* Spotify-Style Tab Navigation - New 5-Tab Structure */}
        <div className="py-4">
          <SpotifyProjectTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab as 'research' | 'papers' | 'lab' | 'notes' | 'analysis');
              // Set default sub-tab for each main tab
              if (tab === 'research') setActiveSubTab('questions');
              else if (tab === 'papers') setActiveSubTab('explore');
              else if (tab === 'lab') setActiveSubTab('protocols');
              else if (tab === 'notes') setActiveSubTab('ideas');
              else if (tab === 'analysis') setActiveSubTab('reports');
            }}
            tabs={[
              {
                id: 'research',
                label: 'Research',
                icon: '🎯',
                description: 'Questions, hypotheses, and decisions'
              },
              {
                id: 'papers',
                label: 'Papers',
                icon: '📄',
                count: collections.length,
                description: 'Explore, organize, and manage papers'
              },
              {
                id: 'lab',
                label: 'Lab',
                icon: '🔬',
                description: 'Protocols, experiments, and summaries'
              },
              {
                id: 'notes',
                label: 'Notes',
                icon: '📝',
                count: project.annotations_count || project.annotations?.length || 0,
                description: 'Ideas, annotations, and comments'
              },
              {
                id: 'analysis',
                label: 'Analysis',
                icon: '📊',
                count: (project.reports_count || project.reports?.length || 0) + (project.deep_dive_analyses_count || project.deep_dive_analyses?.length || 0),
                description: 'Reports, insights, and timeline'
              }
            ]}
          />
        </div>

        {/* Sub-Tabs Navigation */}
        {activeTab === 'research' && (
          <SpotifySubTabs
            subTabs={[
              { id: 'questions', label: 'Questions', icon: '❓' },
              { id: 'hypotheses', label: 'Hypotheses', icon: '💡' },
              { id: 'decisions', label: 'Decisions', icon: '✅', badge: 'new' }
            ]}
            activeSubTab={activeSubTab}
            onSubTabChange={setActiveSubTab}
          />
        )}

        {activeTab === 'papers' && (
          <SpotifySubTabs
            subTabs={[
              { id: 'inbox', label: 'Inbox', icon: '📥', badge: 'new' },
              { id: 'explore', label: 'Explore', icon: '🔍' },
              { id: 'collections', label: 'Collections', icon: '📚', count: collections.length }
            ]}
            activeSubTab={activeSubTab}
            onSubTabChange={setActiveSubTab}
          />
        )}

        {activeTab === 'lab' && (
          <SpotifySubTabs
            subTabs={[
              { id: 'protocols', label: 'Protocols', icon: '📋', badge: 'beta' },
              { id: 'experiments', label: 'Experiments', icon: '🧪', badge: 'beta' },
              { id: 'summaries', label: 'Summaries', icon: '📝', badge: 'beta' }
            ]}
            activeSubTab={activeSubTab}
            onSubTabChange={setActiveSubTab}
          />
        )}

        {activeTab === 'notes' && (
          <SpotifySubTabs
            subTabs={[
              { id: 'ideas', label: 'Ideas', icon: '💭', count: project.annotations_count || 0 },
              { id: 'annotations', label: 'Annotations', icon: '✏️' },
              { id: 'comments', label: 'Comments', icon: '💬' }
            ]}
            activeSubTab={activeSubTab}
            onSubTabChange={setActiveSubTab}
          />
        )}

        {activeTab === 'analysis' && (
          <SpotifySubTabs
            subTabs={[
              { id: 'reports', label: 'Reports', icon: '📊', count: project.reports_count || 0 },
              { id: 'insights', label: 'Insights', icon: '💡', badge: 'new' },
              { id: 'timeline', label: 'Timeline', icon: '📈' }
            ]}
            activeSubTab={activeSubTab}
            onSubTabChange={setActiveSubTab}
          />
        )}

        {/* Create Collection Modal */}
        {showCollectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Collection</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={newCollectionData.collection_name}
                    onChange={(e) => setNewCollectionData({ ...newCollectionData, collection_name: e.target.value })}
                    placeholder="e.g., Cancer Immunotherapy Papers"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={creatingCollection}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newCollectionData.description}
                    onChange={(e) => setNewCollectionData({ ...newCollectionData, description: e.target.value })}
                    placeholder="Brief description of this collection..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={creatingCollection}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCollectionModal(false);
                    setNewCollectionData({ collection_name: '', description: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={creatingCollection}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCollection}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={creatingCollection}
                >
                  {creatingCollection ? 'Creating...' : 'Create Collection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Note</h3>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your note..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={creatingNote}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowNoteModal(false);
                    setNoteContent('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={creatingNote}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  disabled={!noteContent.trim() || creatingNote}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {creatingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Report</h3>
              <form onSubmit={handleCreateReport} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={reportData.title}
                    onChange={(e) => setReportData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter report title..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={generatingReport}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Research Objective *</label>
                  <textarea
                    value={reportData.objective}
                    onChange={(e) => setReportData(prev => ({ ...prev, objective: e.target.value }))}
                    placeholder="Describe the research objective..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={generatingReport}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Molecule *</label>
                  <input
                    type="text"
                    value={reportData.molecule}
                    onChange={(e) => setReportData(prev => ({ ...prev, molecule: e.target.value }))}
                    placeholder="Enter molecule name (e.g., finerenone, metformin)..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={generatingReport}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Preference</label>
                    <select
                      value={reportData.preference}
                      onChange={(e) => setReportData(prev => ({ ...prev, preference: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={generatingReport}
                    >
                      <option value="precision">Precision</option>
                      <option value="recall">Recall</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportData.clinical_mode}
                        onChange={(e) => setReportData(prev => ({ ...prev, clinical_mode: e.target.checked }))}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={generatingReport}
                      />
                      <span className="text-sm text-gray-700">Clinical Mode</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportData.dag_mode}
                        onChange={(e) => setReportData(prev => ({ ...prev, dag_mode: e.target.checked }))}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={generatingReport}
                      />
                      <span className="text-sm text-gray-700">DAG Mode</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportData.full_text_only}
                        onChange={(e) => setReportData(prev => ({ ...prev, full_text_only: e.target.checked }))}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={generatingReport}
                      />
                      <span className="text-sm text-gray-700">Full Text Only</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportModal(false);
                      setReportData({
                        title: '',
                        objective: '',
                        molecule: '',
                        clinical_mode: false,
                        dag_mode: false,
                        full_text_only: false,
                        preference: 'precision'
                      });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={generatingReport}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reportData.title.trim() || !reportData.objective.trim() || !reportData.molecule.trim() || reviewJob.isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {reviewJob.isProcessing ? 'Starting Job...' : 'Generate Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deep Dive Analysis Modal */}
        {showDeepDiveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Start Deep Dive Analysis</h3>
              <form onSubmit={handleCreateDeepDive} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Article Title</label>
                  <input
                    type="text"
                    value={deepDiveData.article_title}
                    onChange={(e) => setDeepDiveData(prev => ({ ...prev, article_title: e.target.value }))}
                    placeholder="Enter article title..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={creatingDeepDive}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Research Objective *</label>
                  <textarea
                    value={deepDiveData.objective}
                    onChange={(e) => setDeepDiveData(prev => ({ ...prev, objective: e.target.value }))}
                    placeholder="Describe what you want to analyze about this article..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={creatingDeepDive}
                    required
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-700 font-medium mb-1">Article Identification</p>
                  <p className="text-xs text-blue-600">Provide at least one of the following to identify the article:</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PMID</label>
                    <input
                      type="text"
                      value={deepDiveData.article_pmid}
                      onChange={(e) => setDeepDiveData(prev => ({ ...prev, article_pmid: e.target.value }))}
                      placeholder="Enter PubMed ID..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={creatingDeepDive}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Article URL</label>
                    <input
                      type="url"
                      value={deepDiveData.article_url}
                      onChange={(e) => setDeepDiveData(prev => ({ ...prev, article_url: e.target.value }))}
                      placeholder="Enter article URL..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={creatingDeepDive}
                    />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">🧠</span>
                    <p className="text-sm text-purple-700 font-medium">
                      <strong>AI-Powered Deep Dive Analysis</strong> with semantic understanding
                    </p>
                  </div>
                  <ul className="text-sm text-purple-600 mt-2 ml-4 list-disc">
                    <li>🔍 Semantic model evaluation with context analysis</li>
                    <li>⚗️ Experimental methods assessment with cross-domain insights</li>
                    <li>📊 Results interpretation with AI-powered analysis</li>
                    <li>🌐 Cross-domain connections and semantic relationships</li>
                  </ul>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeepDiveModal(false);
                      setDeepDiveData({
                        article_title: '',
                        article_pmid: '',
                        article_url: '',
                        objective: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={creatingDeepDive}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!deepDiveData.article_title.trim() || !deepDiveData.objective.trim() || creatingDeepDive}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {creatingDeepDive ? 'Starting Analysis...' : 'Start Analysis'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add to Collection Modal */}
        {showAddToCollectionModal && selectedArticleForCollection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to Collection</h3>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{selectedArticleForCollection.title}</p>
                {selectedArticleForCollection.pmid && (
                  <p className="text-xs text-blue-600 mt-1">PMID: {selectedArticleForCollection.pmid}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  From {selectedArticleForCollection.source === 'report' ? 'Report' : 'Deep Dive Analysis'}
                </p>
              </div>

              {(() => {
                console.log('Modal rendering - collections state:', collections);
                console.log('Modal rendering - collections length:', collections.length);
                return collections.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    <label className="block text-sm font-medium text-gray-700">Select Collection:</label>
                    {collections.map((collection) => (
                      <button
                        key={collection.collection_id}
                        onClick={() => handleConfirmAddToCollection(collection.collection_id)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{collection.collection_name}</div>
                        <div className="text-sm text-gray-600">{collection.description || 'No description'}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {collection.article_count || 0} articles
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">No collections found. Create a collection first in the Collections tab.</p>
                    <p className="text-xs text-gray-600 mt-1">Debug: Collections array length = {collections.length}</p>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddToCollectionModal(false);
                    setSelectedArticleForCollection(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setActiveTab('papers');
                    setActiveSubTab('collections');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Manage Collections
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Report Modal */}
        {showSummaryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Summary Report</h3>
              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm text-indigo-700 mb-2">
                    <strong>Project Summary</strong> will generate a comprehensive overview including:
                  </p>
                  <ul className="text-sm text-indigo-600 ml-4 list-disc space-y-1">
                    <li>Project objectives and scope</li>
                    <li>All reports and their key findings</li>
                    <li>Deep dive analyses performed</li>
                    <li>Annotations and collaborative insights</li>
                    <li>Activity timeline and progress</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Project:</span>
                    <span className="font-medium text-gray-900">{project?.project_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-900">{project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={generatingSummary}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={generatingSummary}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {generatingSummary ? 'Generating...' : 'Generate Summary'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invite Collaborators Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Collaborator</h3>
              <form onSubmit={handleInviteCollaborator} className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-700 mb-2">
                    <strong>Invite a collaborator</strong> to join this project and contribute to research.
                  </p>
                  <ul className="text-sm text-orange-600 ml-4 list-disc space-y-1">
                    <li>Viewer: Can view project content and annotations</li>
                    <li>Editor: Can add notes, create reports, and collaborate</li>
                    <li>Admin: Full project management access</li>
                  </ul>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="colleague@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={inviteData.role}
                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={sendingInvite}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingInvite || !inviteData.email.trim()}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {sendingInvite ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab Content - New Structure with Sub-Tabs */}

        {/* Research Tab */}
        {activeTab === 'research' && (
          <div className="mb-8 space-y-6">
            {activeSubTab === 'questions' && (
              <ResearchQuestionTab
                project={project}
                user={user}
                totalPapers={totalPapers}
                collectionsCount={collections.length}
                onUpdateProject={async (updates) => {
                  try {
                    const response = await fetch(`/api/proxy/projects/${projectId}`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        'User-ID': user?.email || ''
                      },
                      body: JSON.stringify(updates)
                    });

                    if (!response.ok) {
                      throw new Error('Failed to update project');
                    }

                    await fetchProjectData();
                  } catch (error) {
                    console.error('Error updating project:', error);
                    throw error;
                  }
                }}
                onNavigateToTab={(tab) => {
                  // Map old tab names to new structure
                  if (tab === 'collections') {
                    setActiveTab('papers');
                    setActiveSubTab('collections');
                  } else if (tab === 'notes') {
                    setActiveTab('notes');
                    setActiveSubTab('ideas');
                  } else if (tab === 'analysis') {
                    setActiveTab('analysis');
                    setActiveSubTab('reports');
                  }
                }}
                onOpenModal={(modal) => {
                  if (modal === 'collection') {
                    setShowCollectionModal(true);
                  } else if (modal === 'note') {
                    setShowNoteModal(true);
                  } else if (modal === 'report') {
                    setShowReportModal(true);
                  }
                }}
              />
            )}

            {activeSubTab === 'hypotheses' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Hypotheses</h2>
                <p className="text-gray-400">Hypotheses view - Already implemented in ResearchQuestionTab</p>
              </div>
            )}

            {activeSubTab === 'decisions' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Decisions</h2>
                <p className="text-gray-400">Coming in Phase 2 - Week 10</p>
              </div>
            )}
          </div>
        )}

        {/* Papers Tab */}
        {activeTab === 'papers' && (
          <div className="mb-8">
            {activeSubTab === 'inbox' && (
              <div className="p-6">
                <InboxTab projectId={projectId as string} />
              </div>
            )}

            {activeSubTab === 'explore' && (
              <ExploreTab
                project={project}
                onRefresh={fetchProjectData}
              />
            )}

            {activeSubTab === 'collections' && (
              <MyCollectionsTab
                projectId={projectId}
                onRefresh={fetchProjectData}
                onCreateCollection={() => setShowCollectionModal(true)}
              />
            )}
          </div>
        )}

        {/* Lab Tab */}
        {activeTab === 'lab' && (
          <div className="mb-8 p-6">
            {activeSubTab === 'protocols' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Protocols</h2>
                <p className="text-gray-400">Coming in Phase 3 - Week 17</p>
              </div>
            )}

            {activeSubTab === 'experiments' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Experiments</h2>
                <p className="text-gray-400">Coming in Phase 3 - Week 18</p>
              </div>
            )}

            {activeSubTab === 'summaries' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Living Summaries</h2>
                <p className="text-gray-400">Coming in Phase 3 - Week 19-20</p>
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="mb-8">
            {activeSubTab === 'ideas' && (
              <NotesTab
                project={project}
                onRefresh={fetchProjectData}
              />
            )}

            {activeSubTab === 'annotations' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Annotations</h2>
                <p className="text-gray-400">Paper annotations view</p>
              </div>
            )}

            {activeSubTab === 'comments' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Comments</h2>
                <p className="text-gray-400">Collaboration comments</p>
              </div>
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="mb-8">
            {activeSubTab === 'reports' && (
              <AnalysisTab
                project={project}
                onGenerateReport={() => setShowReportModal(true)}
                onGenerateDeepDive={() => setShowDeepDiveModal(true)}
              />
            )}

            {activeSubTab === 'insights' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Insights</h2>
                <p className="text-gray-400">Coming in Phase 2 - AI-powered insights</p>
              </div>
            )}

            {activeSubTab === 'timeline' && (
              <ProgressTab
                project={project}
                totalPapers={totalPapers}
                collectionsCount={collections.length}
              />
            )}
          </div>
        )}
      </div>

      {/* Share Project Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Project</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={`${window.location.origin}/project/${projectId}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-900"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/project/${projectId}`);
                      alert('URL copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Collaborator
                </label>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md text-gray-900"
                  />
                  <button className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700">
                    Invite
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  defaultValue={project?.project_name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  defaultValue={project?.description}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900">
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                  <option value="team">Team Only</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                Delete Project
              </button>
              <div className="space-x-2">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cluster Exploration Modal */}
      <ClusterExplorationModal
        isOpen={clusterExploration.isOpen}
        sourceArticle={clusterExploration.sourceArticle}
        results={clusterExploration.results}
        loading={clusterExploration.loading}
        currentCollectionId={clusterExploration.currentCollectionId}
        onClose={() => setClusterExploration(prev => ({ ...prev, isOpen: false }))}
        onAddToCollection={handleAddClusterArticlesToCollection}
        projectId={projectId}
      />

      {/* Inline Job Results Modal */}
      {inlineResults.show && inlineResults.jobType && (
        <InlineJobResults
          jobType={inlineResults.jobType}
          jobStatus="completed"
          result={inlineResults.result}
          onClose={() => setInlineResults({ show: false, jobType: null, result: null })}
          onViewFullResults={() => {
            // Close inline results and switch to research tab where results are displayed
            setInlineResults({ show: false, jobType: null, result: null });
            setActiveTab('research');
            setActiveSubTab('questions');
          }}
        />
      )}

      {/* Global Search Modal (Cmd+K) */}
      <GlobalSearch
        projectId={projectId}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onResultClick={handleSearchResultClick}
      />
    </MobileResponsiveLayout>
  );
}