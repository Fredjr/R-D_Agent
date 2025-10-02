'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MobileResponsiveLayout } from '@/components/ui/MobileResponsiveLayout';
import AnnotationsFeed from '@/components/AnnotationsFeed';
import ActivityFeed from '@/components/ActivityFeed';
import ResultsList from '@/components/ResultsList';
import NetworkViewWithSidebar from '@/components/NetworkViewWithSidebar';
import MultiColumnNetworkView from '@/components/MultiColumnNetworkView';
import Collections from '@/components/Collections';
import { useAsyncJob } from '@/hooks/useAsyncJob';
import { startReviewJob, startDeepDiveJob } from '../../../lib/api';
import AsyncJobProgress from '@/components/AsyncJobProgress';
import ClusterExplorationModal from '@/components/ClusterExplorationModal';
import InlineJobResults from '@/components/InlineJobResults';
import { SpotifyTopBar, SpotifyBreadcrumb, SpotifyTabs } from '@/components/ui/SpotifyNavigation';
import { SpotifyCollectionCard } from '@/components/ui/SpotifyCard';
import { SpotifyProjectHeader } from '@/components/ui/SpotifyProjectHeader';
import { SpotifyProjectTabs } from '@/components/ui/SpotifyProjectTabs';
import { SpotifyQuickActions, createQuickActions } from '@/components/ui/SpotifyQuickActions';
import PhDProgressDashboard from '@/components/PhDProgressDashboard';
import PhDEnhancedSummary from '@/components/phd/PhDEnhancedSummary';
import ThesisChapterStructure from '@/components/phd/ThesisChapterStructure';
import LiteratureGapAnalysis from '@/components/phd/LiteratureGapAnalysis';
import MethodologySynthesis from '@/components/phd/MethodologySynthesis';
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
}

export default function ProjectPage() {
  const params = useParams();
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

  // PhD-specific state
  const [phdAnalysisData, setPhdAnalysisData] = useState<any>(null);
  const [generatingThesisChapter, setGeneratingThesisChapter] = useState(false);
  const [generatingGapAnalysis, setGeneratingGapAnalysis] = useState(false);
  const [generatingMethodologySynthesis, setGeneratingMethodologySynthesis] = useState(false);
  const [showPhdDashboard, setShowPhdDashboard] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [showChapterModal, setShowChapterModal] = useState(false);

  // Collection management state
  const [collections, setCollections] = useState<any[]>([]);
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

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'overview' | 'collections' | 'network' | 'activity'>('overview');

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

  useEffect(() => {
    if (projectId && user) {
      fetchProjectData();
      fetchCollections();
    }
  }, [projectId, user]);

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
      } else {
        const errorText = await response.text();
        console.error('Collections fetch failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
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
      // Enhanced payload for PhD-specific analysis
      const analysisPayload = {
        analysis_type: 'thesis_structured',
        include_methodology_synthesis: true,
        include_gap_analysis: true,
        include_citation_analysis: true,
        output_format: 'academic_chapters',
        user_context: {
          academic_level: 'phd',
          research_stage: 'dissertation',
          preferred_citation_style: 'apa' // Could be user preference
        }
      };

      const response = await fetch(`/api/proxy/projects/${projectId}/generate-comprehensive-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify(analysisPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to generate comprehensive summary');
      }

      const data = await response.json();
      setComprehensiveSummary(data);

      // Enhanced success message with thesis-specific value
      alert(`✅ Thesis-structured analysis generated successfully!

📚 Generated sections:
• Literature Review Framework
• Methodology Synthesis
• Research Gap Analysis
• Future Research Directions
• Citation Bibliography

Perfect for your dissertation chapters! 🎓`);
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

  // PhD-specific handlers
  const handleThesisChapter = async () => {
    setGeneratingThesisChapter(true);
    try {
      console.log('📖 [PhD] Generating thesis chapter for project:', projectId);

      const response = await fetch(`/api/proxy/projects/${projectId}/phd-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify({
          analysis_type: 'thesis_chapter',
          include_thesis_structure: true,
          include_literature_review: true,
          include_methodology_synthesis: true,
          output_format: 'academic_chapters',
          citation_style: 'apa',
          academic_level: 'phd',
          research_stage: 'dissertation'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate thesis chapter');
      }

      const data = await response.json();

      // Merge with existing PhD analysis data instead of overwriting
      setPhdAnalysisData((prevData: any) => ({
        ...prevData,
        ...data,
        agent_results: {
          ...prevData?.agent_results,
          ...data.agent_results
        },
        phd_outputs: {
          ...prevData?.phd_outputs,
          ...data.phd_outputs
        }
      }));

      console.log('📖 Thesis chapter generated successfully:', data);

      // Scroll to the thesis structure component
      setTimeout(() => {
        const thesisElement = document.querySelector('[data-component="thesis-structure"]');
        if (thesisElement) {
          thesisElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

    } catch (error: any) {
      console.error('Error generating thesis chapter:', error);
      alert(`❌ Failed to generate thesis chapter: ${error.message}`);
    } finally {
      setGeneratingThesisChapter(false);
    }
  };

  const handleGapAnalysis = async () => {
    setGeneratingGapAnalysis(true);
    try {
      console.log('🔍 [PhD] Generating gap analysis for project:', projectId);

      const response = await fetch(`/api/proxy/projects/${projectId}/phd-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify({
          analysis_type: 'gap_analysis',
          include_gap_analysis: true,
          include_literature_review: true,
          semantic_gaps: true,
          methodology_gaps: true,
          temporal_gaps: true,
          cross_domain_opportunities: true,
          academic_level: 'phd'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate gap analysis');
      }

      const data = await response.json();

      // Merge with existing PhD analysis data instead of overwriting
      setPhdAnalysisData((prevData: any) => ({
        ...prevData,
        ...data,
        agent_results: {
          ...prevData?.agent_results,
          ...data.agent_results
        },
        phd_outputs: {
          ...prevData?.phd_outputs,
          ...data.phd_outputs
        }
      }));

      console.log('🔍 Gap analysis generated successfully:', data);

      // Scroll to the gap analysis component
      setTimeout(() => {
        const gapElement = document.querySelector('[data-component="gap-analysis"]');
        if (gapElement) {
          gapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

    } catch (error: any) {
      console.error('Error generating gap analysis:', error);
      alert(`❌ Failed to generate gap analysis: ${error.message}`);
    } finally {
      setGeneratingGapAnalysis(false);
    }
  };

  const handleMethodologySynthesis = async () => {
    setGeneratingMethodologySynthesis(true);
    try {
      console.log('🧪 [PhD] Generating methodology synthesis for project:', projectId);

      const response = await fetch(`/api/proxy/projects/${projectId}/phd-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify({
          analysis_type: 'methodology_synthesis',
          include_methodology_synthesis: true,
          classification_model: 'scibert',
          statistical_extraction: true,
          experimental_design_analysis: true,
          methodology_comparison: true,
          academic_level: 'phd'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate methodology synthesis');
      }

      const data = await response.json();

      // Merge with existing PhD analysis data instead of overwriting
      setPhdAnalysisData((prevData: any) => ({
        ...prevData,
        ...data,
        agent_results: {
          ...prevData?.agent_results,
          ...data.agent_results
        },
        phd_outputs: {
          ...prevData?.phd_outputs,
          ...data.phd_outputs
        }
      }));

      console.log('🧪 Methodology synthesis generated successfully:', data);

      // Scroll to the methodology synthesis component
      setTimeout(() => {
        const methodologyElement = document.querySelector('[data-component="methodology-synthesis"]');
        if (methodologyElement) {
          methodologyElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

    } catch (error: any) {
      console.error('Error generating methodology synthesis:', error);
      alert(`❌ Failed to generate methodology synthesis: ${error.message}`);
    } finally {
      setGeneratingMethodologySynthesis(false);
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

  return (
    <MobileResponsiveLayout>
      <div className="w-full max-w-none">
        {/* Spotify-Style Project Header */}
        <SpotifyProjectHeader
          project={project}
          onPlay={() => {
            // Navigate to first tab or main view
            setActiveTab('overview');
          }}
          onShare={() => setShowShareModal(true)}
          onSettings={() => setShowSettingsModal(true)}
          onInvite={() => setShowInviteModal(true)}
        />

        {/* Quick Actions */}
        <div className="py-6">
          <SpotifyQuickActions
            actions={createQuickActions(
              {
                onNewReport: () => setShowReportModal(true),
                onAddNote: () => setShowNoteModal(true),
                onDeepDive: () => setShowDeepDiveModal(true),
                onSummary: () => setShowSummaryModal(true),
                onComprehensiveAnalysis: handleGenerateComprehensiveSummary,
                onInviteCollaborators: () => setShowInviteModal(true),
                // PhD-specific handlers
                onThesisChapter: handleThesisChapter,
                onGapAnalysis: handleGapAnalysis,
                onMethodologySynthesis: handleMethodologySynthesis
              },
              {
                generatingComprehensiveSummary,
                creatingNote,
                // PhD-specific loading states
                generatingThesisChapter,
                generatingGapAnalysis,
                generatingMethodologySynthesis
              }
            )}
          />
        </div>

        {/* Spotify-Style Tab Navigation */}
        <div className="py-4">
          <SpotifyProjectTabs
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as 'overview' | 'collections' | 'network' | 'activity')}
            tabs={[
              {
                id: 'overview',
                label: 'Overview',
                icon: '📊',
                count: (project.reports?.length || 0) + ((project as any).deep_dives?.length || 0)
              },
              {
                id: 'collections',
                label: 'Collections',
                icon: '📁',
                count: (project as any).collections?.length || 0
              },
              {
                id: 'network',
                label: 'Network View',
                icon: '🕸️'
              },
              {
                id: 'activity',
                label: 'Activity & Notes',
                icon: '📝',
                count: (project as any).annotations?.length || 0
              }
            ]}
          />
        </div>

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
                  onClick={() => setActiveTab('collections')}
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

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* PhD Progress Dashboard */}
            <div className="mb-8">
              <PhDProgressDashboard
                projectId={projectId}
                onRefresh={() => {
                  // Refresh project data when PhD progress updates
                  fetchProjectData();
                }}
              />
            </div>

            {/* Project Data Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-8">
          {/* Reports Section */}
          <div className="bg-[var(--spotify-dark-gray)] rounded-lg shadow p-6 border border-[var(--spotify-border-gray)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--spotify-white)] flex items-center">
                <span className="text-green-400 mr-2">📊</span>
                Reports
              </h3>
              <span className="text-xs bg-[var(--spotify-green)]/20 text-[var(--spotify-green)] px-2 py-1 rounded-full">
                {project.reports?.length || 0} reports
              </span>
            </div>
            <div className="text-sm text-[var(--spotify-light-text)] mb-4">
              Generated research reports and analyses
            </div>
            {project.reports && project.reports.length > 0 ? (
              <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-[var(--spotify-medium-gray)] scrollbar-thumb-[var(--spotify-light-gray)] space-y-3">
                {project.reports.map((report) => (
                  <DeletableReportCard
                    key={report.report_id}
                    title={report.title}
                    objective={report.objective}
                    status="completed"
                    createdAt={new Date(report.created_at).toLocaleDateString()}
                    reportId={report.report_id}
                    className="relative"
                    onClick={() => window.open(`/report/${report.report_id}`, '_blank')}
                    onDelete={() => {
                      // Refresh project data after deletion
                      fetchProjectData();
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-green-400 text-4xl mb-4">📊</div>
                <p className="text-[var(--spotify-light-text)] text-sm">No reports yet.</p>
                <p className="text-[var(--spotify-muted-text)] text-xs mt-1">Create your first report to get started</p>
              </div>
            )}
          </div>

          {/* Report Iterations Section */}
          <div className="bg-[var(--spotify-dark-gray)] rounded-lg shadow p-6 border border-[var(--spotify-border-gray)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--spotify-white)]">Report Iterations</h3>
              <span className="text-xs bg-[var(--spotify-medium-gray)] text-[var(--spotify-light-text)] px-2 py-1 rounded-full">
                {project.reports?.length || 0} versions
              </span>
            </div>
            {project.reports && project.reports.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-[var(--spotify-light-text)] mb-3">
                  Track how your research evolves with each report iteration
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-[var(--spotify-medium-gray)] scrollbar-thumb-[var(--spotify-light-gray)] space-y-3">
                  {project.reports
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((report, index) => (
                    <div
                      key={report.report_id}
                      className="border border-[var(--spotify-border-gray)] rounded-lg p-3 hover:border-[var(--spotify-green)] hover:bg-[var(--spotify-medium-gray)] transition-all cursor-pointer relative"
                      onClick={() => window.open(`/report/${report.report_id}`, '_blank')}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-[var(--spotify-blue)]/20 text-[var(--spotify-blue)]">
                          v{project.reports.length - index}
                        </span>
                        <span className="text-xs text-[var(--spotify-light-text)]">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-medium text-[var(--spotify-white)] text-sm mb-1 line-clamp-2">{report.title}</h4>
                      <p className="text-xs text-[var(--spotify-light-text)] line-clamp-2">{report.objective}</p>
                      {index === 0 && (
                        <div className="absolute top-2 right-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-[var(--spotify-green)] text-black">
                            Latest
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-[var(--spotify-blue)]/10 rounded-lg border border-[var(--spotify-blue)]/20">
                  <div className="flex items-center gap-2 text-sm text-[var(--spotify-blue)]">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Iteration Insights</span>
                  </div>
                  <p className="text-xs text-[var(--spotify-light-text)] mt-1">
                    Each report builds on previous research. Compare versions to see how your understanding evolves with new analyses and data.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-[var(--spotify-muted-text)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-[var(--spotify-light-text)] text-sm">No report iterations yet.</p>
                <p className="text-[var(--spotify-muted-text)] text-xs mt-1">Create multiple reports to track research evolution</p>
              </div>
            )}
          </div>

          {/* Deep Dive Analyses Section */}
          <div className="bg-[var(--spotify-dark-gray)] rounded-lg shadow p-6 border border-[var(--spotify-border-gray)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--spotify-white)] flex items-center">
                <span className="text-purple-400 mr-2">🔬</span>
                Deep Dive Analyses
              </h3>
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                {project.deep_dive_analyses?.length || 0} analyses
              </span>
            </div>
            {project.deep_dive_analyses && project.deep_dive_analyses.length > 0 ? (
              <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-[var(--spotify-medium-gray)] scrollbar-thumb-[var(--spotify-light-gray)] space-y-3">
                {project.deep_dive_analyses.map((analysis) => (
                  <div
                    key={analysis.analysis_id}
                    className="border border-[var(--spotify-border-gray)] rounded-lg p-4 hover:border-purple-400/40 hover:bg-[var(--spotify-medium-gray)] transition-all"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => window.open(`/analysis/${analysis.analysis_id}`, '_blank')}
                    >
                      <h4 className="font-medium text-[var(--spotify-white)] mb-1">{analysis.article_title}</h4>
                      {analysis.article_pmid && (
                        <p className="text-sm text-[var(--spotify-blue)] mb-1">PMID: {analysis.article_pmid}</p>
                      )}
                      <div className="flex justify-between items-center mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          analysis.processing_status === 'completed'
                            ? 'bg-[var(--spotify-green)]/20 text-[var(--spotify-green)]'
                            : analysis.processing_status === 'processing'
                            ? 'bg-[var(--spotify-yellow)]/20 text-[var(--spotify-yellow)]'
                            : 'bg-[var(--spotify-muted-text)]/20 text-[var(--spotify-muted-text)]'
                        }`}>
                          {analysis.processing_status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-[var(--spotify-light-text)] mb-3">
                        <span>By {analysis.created_by}</span>
                        <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-[var(--spotify-border-gray)]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCollection({
                            title: analysis.article_title,
                            pmid: analysis.article_pmid,
                            source: 'deep_dive',
                            source_id: analysis.analysis_id
                          });
                        }}
                        className="flex-1 px-3 py-1.5 text-xs bg-[var(--spotify-green)] text-black rounded hover:bg-[var(--spotify-green-hover)] transition-colors font-medium"
                        title="Add this analyzed article to a collection"
                      >
                        📚 Add to Collection
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/analysis/${analysis.analysis_id}`, '_blank');
                        }}
                        className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors font-medium"
                      >
                        View Analysis
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-purple-400 text-4xl mb-4">🔬</div>
                <p className="text-[var(--spotify-light-text)] text-sm">No deep dive analyses yet.</p>
                <p className="text-[var(--spotify-muted-text)] text-xs mt-1">Start your first analysis to explore articles in detail</p>
              </div>
            )}
          </div>

          {/* Collaborators Section */}
          <div className="bg-[var(--spotify-dark-gray)] rounded-lg shadow p-6 border border-[var(--spotify-border-gray)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--spotify-white)] flex items-center">
                <span className="text-orange-400 mr-2">👥</span>
                Collaborators
              </h3>
              <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">
                {project.collaborators?.length || 0} members
              </span>
            </div>
            {project.collaborators && project.collaborators.length > 0 ? (
              <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-[var(--spotify-medium-gray)] scrollbar-thumb-[var(--spotify-light-gray)] space-y-3">
                {project.collaborators.map((collaborator) => (
                  <div key={collaborator.user_id} className="flex items-center justify-between p-3 border border-[var(--spotify-border-gray)] rounded-lg hover:bg-[var(--spotify-medium-gray)] transition-colors">
                    <div>
                      <p className="font-medium text-[var(--spotify-white)]">{collaborator.username}</p>
                      <p className="text-sm text-[var(--spotify-light-text)] capitalize">{collaborator.role}</p>
                    </div>
                    <span className="text-xs text-[var(--spotify-muted-text)]">
                      {new Date(collaborator.invited_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-orange-400 text-4xl mb-4">👥</div>
                <p className="text-[var(--spotify-light-text)] text-sm">No collaborators yet.</p>
                <p className="text-[var(--spotify-muted-text)] text-xs mt-1">Invite team members to collaborate on this project</p>
              </div>
            )}
          </div>
        </div>

        {/* PhD Enhanced Comprehensive Summary */}
        {comprehensiveSummary && (
          <PhDEnhancedSummary
            data={{
              analysis_type: 'comprehensive_summary',
              timestamp: comprehensiveSummary.generated_at,
              project_id: projectId,
              base_analysis: comprehensiveSummary.analysis_results,
              phd_enhancements: comprehensiveSummary.phd_enhancements,
              processing_time_seconds: comprehensiveSummary.processing_time_seconds,
              agents_executed: comprehensiveSummary.agents_executed,
              metadata: comprehensiveSummary.metadata
            }}
            onRegenerateSection={(section) => {
              console.log('Regenerating section:', section);
              // TODO: Implement section regeneration
            }}
            onExportSummary={() => {
              console.log('Exporting summary');
              // TODO: Implement export functionality
            }}
            className="mb-8"
          />
        )}

        {/* Individual PhD Analysis Results */}
        {phdAnalysisData && (
          <div className="space-y-8 mb-8">
            {/* Thesis Chapter Structure */}
            {(phdAnalysisData?.agent_results?.thesis_structure || phdAnalysisData?.phd_outputs?.thesis_structure || generatingThesisChapter) && (
              <div data-component="thesis-structure">
                <ThesisChapterStructure
                  chapters={phdAnalysisData?.agent_results?.thesis_structure?.thesis_chapters || phdAnalysisData?.agent_results?.thesis_structure?.chapters || phdAnalysisData?.phd_outputs?.thesis_structure?.chapters || []}
                  totalEstimatedWords={phdAnalysisData?.agent_results?.thesis_structure?.total_words || phdAnalysisData?.phd_outputs?.thesis_structure?.total_words}
                  completionPercentage={phdAnalysisData?.agent_results?.thesis_structure?.completion_percentage || phdAnalysisData?.phd_outputs?.thesis_structure?.completion_percentage}
                  loading={generatingThesisChapter}
                  error={phdAnalysisData?.error}
                  rawData={phdAnalysisData}
                  thesisData={phdAnalysisData?.agent_results?.thesis_structure || phdAnalysisData?.phd_outputs?.thesis_structure}
                  onRetry={() => handleThesisChapter()}
                  onChapterClick={(chapter) => {
                    console.log('🔍 Chapter clicked:', chapter);
                    console.log('🔍 Chapter key_content:', chapter.key_content);
                    console.log('🔍 Full phdAnalysisData:', phdAnalysisData);
                    setSelectedChapter(chapter);
                    setShowChapterModal(true);
                  }}
                  onEditChapter={(chapter) => {
                    console.log('Edit chapter:', chapter);
                    // TODO: Implement chapter editing
                  }}
                />
              </div>
            )}

            {/* Literature Gap Analysis */}
            {(phdAnalysisData?.agent_results?.gap_analysis || generatingGapAnalysis) && (
              <div data-component="gap-analysis">
                {(() => {
                  console.log('🔍 Gap Analysis Data Structure:', phdAnalysisData?.agent_results?.gap_analysis);
                  return null;
                })()}
                <LiteratureGapAnalysis
                  gaps={phdAnalysisData?.agent_results?.gap_analysis?.identified_gaps ||
                        phdAnalysisData?.agent_results?.literature_review?.review_gaps || []}
                  totalPapersAnalyzed={phdAnalysisData?.agent_results?.literature_review?.papers_analyzed ||
                                     phdAnalysisData?.agent_results?.gap_analysis?.papers_analyzed || 0}
                  analysisDate={phdAnalysisData?.timestamp}
                  researchDomains={phdAnalysisData?.agent_results?.gap_analysis?.research_domains || []}
                  loading={generatingGapAnalysis}
                  error={phdAnalysisData?.agent_results?.gap_analysis?.error ?
                    "Gap analysis backend is being updated. Showing literature review gaps instead." :
                    phdAnalysisData?.error}
                  onRetry={() => handleGapAnalysis()}
                  rawData={phdAnalysisData}
                  gapAnalysisData={phdAnalysisData?.agent_results?.gap_analysis}
                  onGapClick={(gap) => {
                    console.log('Gap clicked:', gap);
                    // TODO: Implement gap detail view
                  }}
                  onExploreOpportunity={(gap) => {
                    console.log('Explore opportunity:', gap);
                    // TODO: Implement opportunity exploration
                  }}
                />
              </div>
            )}

            {/* Methodology Synthesis */}
            {(phdAnalysisData?.agent_results?.methodology_synthesis || generatingMethodologySynthesis) && (
              <div data-component="methodology-synthesis">
                {(() => {
                  console.log('🔍 Methodology Synthesis Data Structure:', phdAnalysisData?.agent_results?.methodology_synthesis);
                  return null;
                })()}
                <MethodologySynthesis
                  methodologies={phdAnalysisData?.agent_results?.methodology_synthesis?.methodologies ||
                               phdAnalysisData?.agent_results?.methodology_synthesis?.methodology_categories || []}
                  comparisons={phdAnalysisData?.agent_results?.methodology_synthesis?.comparisons || []}
                  totalPapersAnalyzed={phdAnalysisData?.agent_results?.methodology_synthesis?.papers_analyzed || 0}
                  recommendedCombinations={phdAnalysisData?.agent_results?.methodology_synthesis?.recommended_combinations || []}
                  loading={generatingMethodologySynthesis}
                  error={phdAnalysisData?.error}
                  onRetry={() => handleMethodologySynthesis()}
                  rawData={phdAnalysisData}
                  methodologyData={phdAnalysisData?.agent_results?.methodology_synthesis}
                  onMethodologyClick={(methodology) => {
                    console.log('Methodology clicked:', methodology);
                    // TODO: Implement methodology detail view
                  }}
                  onCompareMethodologies={(methodA, methodB) => {
                    console.log('Compare methodologies:', methodA, methodB);
                    // TODO: Implement methodology comparison
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Async Job Progress */}
        {reviewJob.jobId && (
          <AsyncJobProgress
            jobId={reviewJob.jobId}
            status={reviewJob.status}
            progress={reviewJob.progress}
            error={reviewJob.error}
            startedAt={reviewJob.startedAt}
            completedAt={reviewJob.completedAt}
            onCancel={reviewJob.cancelJob}
            onReset={reviewJob.resetJob}
            jobType="Generate Review"
            className="mb-6"
          />
        )}

        {/* Deep Dive Job Progress */}
        {deepDiveJob.jobId && (
          <AsyncJobProgress
            jobId={deepDiveJob.jobId}
            status={deepDiveJob.status}
            progress={deepDiveJob.progress}
            error={deepDiveJob.error}
            startedAt={deepDiveJob.startedAt}
            completedAt={deepDiveJob.completedAt}
            onCancel={deepDiveJob.cancelJob}
            onReset={deepDiveJob.resetJob}
            jobType="Deep Dive Analysis"
            className="mb-6"
          />
        )}

        {/* Report Results Section (same as Welcome Page) */}
        {reportResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{reportTitle}</h2>
              <p className="text-gray-600 mb-4">{reportObjective}</p>

              {/* Diagnostics (same as Welcome Page) */}
              {reportDiagnostics && (
                <div className="p-3 sm:p-4 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm mb-6">
                  <div className="font-medium mb-2">Run details</div>
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
                    <span>Pool: {reportDiagnostics.pool_size || 0}</span>
                    <span>Shortlist: {reportDiagnostics.shortlist_size || 0}</span>
                    <span>Deep-dive: {reportDiagnostics.deep_dive_count || 0}</span>
                    {reportDiagnostics.timings_ms && (
                      <>
                        <span>Plan: {reportDiagnostics.timings_ms.plan_ms || 0}ms</span>
                        <span>Harvest: {reportDiagnostics.timings_ms.harvest_ms || 0}ms</span>
                        <span>Deep-dive: {reportDiagnostics.timings_ms.deepdive_ms || 0}ms</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Results List (same as Welcome Page) */}
            <ResultsList results={reportResults} />
          </div>
        )}

            </>
        )}

        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <div className="mb-8">
            <Collections
              projectId={projectId}
              onRefresh={fetchProjectData}
              onGenerateReview={handleGenerateReviewFromNetwork}
              onDeepDive={handleDeepDiveFromNetwork}
              onExploreCluster={handleExploreClusterFromNetwork}
            />
          </div>
        )}

        {/* Network View Tab */}
        {activeTab === 'network' && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Citation Network</h2>
                <p className="text-gray-600">
                  Explore the relationships between articles in this project through citation networks.
                  Click on nodes to see article details and discover related research.
                </p>
              </div>
              <div className="h-[600px]">
                <MultiColumnNetworkView
                  sourceType="project"
                  sourceId={projectId}
                  projectId={projectId}
                  onDeepDiveCreated={fetchProjectData}
                  onArticleSaved={fetchProjectData}
                  onGenerateReview={handleGenerateReviewFromNetwork}
                  onDeepDive={handleDeepDiveFromNetwork}
                  onExploreCluster={handleExploreClusterFromNetwork}
                />
              </div>
            </div>
          </div>
        )}

        {/* Activity & Notes Tab */}
        {activeTab === 'activity' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Annotations</h2>
              <AnnotationsFeed projectId={projectId} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity</h2>
              <ActivityFeed projectId={projectId} />
            </div>
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
            // Close inline results and switch to overview tab where results are displayed
            setInlineResults({ show: false, jobType: null, result: null });
            setActiveTab('overview');
          }}
        />
      )}

      {/* Chapter Detail Modal */}
      {showChapterModal && selectedChapter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Chapter {selectedChapter.chapter_number}: {selectedChapter.title}
                </h2>
                <button
                  onClick={() => setShowChapterModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Chapter Overview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Chapter Overview</h3>
                  <p className="text-gray-700">{selectedChapter.description || selectedChapter.key_content?.research_objective || selectedChapter.key_content?.problem_statement || selectedChapter.key_content?.analysis_framework || selectedChapter.key_content?.research_contributions || 'Chapter overview will be developed based on research progress'}</p>
                </div>

                {/* Key Content */}
                {selectedChapter.key_content && (
                  <div className="space-y-4">
                    {/* Research Objective */}
                    {selectedChapter.key_content.research_objective && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Research Objective</h3>
                        <p className="text-blue-800">{selectedChapter.key_content.research_objective}</p>
                      </div>
                    )}

                    {/* Problem Statement */}
                    {selectedChapter.key_content.problem_statement && (
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h3 className="font-semibold text-orange-900 mb-2">Problem Statement</h3>
                        <p className="text-orange-800">{selectedChapter.key_content.problem_statement}</p>
                      </div>
                    )}

                    {/* Research Questions */}
                    {selectedChapter.key_content.research_questions && selectedChapter.key_content.research_questions.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="font-semibold text-green-900 mb-2">Research Questions</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedChapter.key_content.research_questions.map((question: any, index: number) => (
                            <li key={index} className="text-green-800">{question}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Context Papers */}
                    {selectedChapter.key_content.context_papers && selectedChapter.key_content.context_papers.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-900 mb-2">Key Papers ({selectedChapter.key_content.context_papers.length})</h3>
                        <div className="space-y-2">
                          {selectedChapter.key_content.context_papers.slice(0, 3).map((paper: any, index: number) => (
                            <div key={index} className="text-purple-800 text-sm">
                              <strong>{paper.title || paper.name || `Paper ${index + 1}`}</strong>
                              {paper.authors && <span className="text-purple-600"> - {paper.authors}</span>}
                              {paper.year && <span className="text-purple-600"> ({paper.year})</span>}
                            </div>
                          ))}
                          {selectedChapter.key_content.context_papers.length > 3 && (
                            <p className="text-purple-600 text-sm">...and {selectedChapter.key_content.context_papers.length - 3} more papers</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Seminal Papers */}
                    {selectedChapter.key_content.seminal_papers && selectedChapter.key_content.seminal_papers.length > 0 && (
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <h3 className="font-semibold text-indigo-900 mb-2">Seminal Papers ({selectedChapter.key_content.seminal_papers.length})</h3>
                        <div className="space-y-2">
                          {selectedChapter.key_content.seminal_papers.slice(0, 3).map((paper: any, index: number) => (
                            <div key={index} className="text-indigo-800 text-sm">
                              <strong>{paper.title || paper.name || `Paper ${index + 1}`}</strong>
                              {paper.authors && <span className="text-indigo-600"> - {paper.authors}</span>}
                              {paper.year && <span className="text-indigo-600"> ({paper.year})</span>}
                            </div>
                          ))}
                          {selectedChapter.key_content.seminal_papers.length > 3 && (
                            <p className="text-indigo-600 text-sm">...and {selectedChapter.key_content.seminal_papers.length - 3} more papers</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Comparison Papers */}
                    {selectedChapter.key_content.comparison_papers && selectedChapter.key_content.comparison_papers.length > 0 && (
                      <div className="bg-teal-50 rounded-lg p-4">
                        <h3 className="font-semibold text-teal-900 mb-2">Comparison Papers ({selectedChapter.key_content.comparison_papers.length})</h3>
                        <p className="text-teal-800 text-sm">Comprehensive literature comparison with {selectedChapter.key_content.comparison_papers.length} relevant papers for discussion and analysis.</p>
                      </div>
                    )}

                    {/* Analysis Framework */}
                    {selectedChapter.key_content.analysis_framework && (
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-900 mb-2">Analysis Framework</h3>
                        <p className="text-yellow-800">{selectedChapter.key_content.analysis_framework}</p>
                      </div>
                    )}

                    {/* Theoretical Contributions */}
                    {selectedChapter.key_content.theoretical_contributions && (
                      <div className="bg-pink-50 rounded-lg p-4">
                        <h3 className="font-semibold text-pink-900 mb-2">Theoretical Contributions</h3>
                        <p className="text-pink-800">{selectedChapter.key_content.theoretical_contributions}</p>
                      </div>
                    )}

                    {/* Research Contributions */}
                    {selectedChapter.key_content.research_contributions && (
                      <div className="bg-red-50 rounded-lg p-4">
                        <h3 className="font-semibold text-red-900 mb-2">Research Contributions</h3>
                        <p className="text-red-800">{selectedChapter.key_content.research_contributions}</p>
                      </div>
                    )}

                    {/* Methodology Synthesis */}
                    {selectedChapter.key_content.methodology_synthesis && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Methodology Synthesis</h3>
                        <div className="text-gray-800 text-sm">
                          {typeof selectedChapter.key_content.methodology_synthesis === 'object' ?
                            Object.keys(selectedChapter.key_content.methodology_synthesis).map((key: string) => (
                              <div key={key} className="mb-2">
                                <strong className="capitalize">{key.replace(/_/g, ' ')}:</strong> {selectedChapter.key_content.methodology_synthesis[key]}
                              </div>
                            )) :
                            <p>{selectedChapter.key_content.methodology_synthesis}</p>
                          }
                        </div>
                      </div>
                    )}

                    {/* Future Research */}
                    {selectedChapter.key_content.future_research && selectedChapter.key_content.future_research.length > 0 && (
                      <div className="bg-cyan-50 rounded-lg p-4">
                        <h3 className="font-semibold text-cyan-900 mb-2">Future Research Directions</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedChapter.key_content.future_research.map((direction: any, index: number) => (
                            <li key={index} className="text-cyan-800">{direction}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Chapter Sections */}
                {selectedChapter.sections && selectedChapter.sections.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Sections</h3>
                    <div className="space-y-3">
                      {selectedChapter.sections.map((section: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {section.title || `Section ${index + 1}`}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {section.description || typeof section === 'string' ? section : `This section will cover ${section.title || section || 'key aspects'} of the chapter`}
                          </p>
                          {section.estimated_words && (
                            <p className="text-gray-500 text-xs mt-2">
                              Estimated words: {section.estimated_words}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chapter Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <span className="font-medium text-blue-900">Estimated Words:</span>
                    <span className="text-blue-700 ml-2">
                      {selectedChapter.estimated_words || 'Not specified'}
                    </span>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <span className="font-medium text-green-900">Status:</span>
                    <span className="text-green-700 ml-2">
                      {selectedChapter.status || 'Not Started'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowChapterModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MobileResponsiveLayout>
  );
}