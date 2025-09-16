'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NetworkView from './NetworkView';
import NetworkSidebar from './NetworkSidebar';

interface NetworkNode {
  id: string;
  data: {
    pmid: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    citation_count: number;
    node_type: string;
    abstract?: string;
    url?: string;
  };
}

interface NetworkViewWithSidebarProps {
  sourceType: 'project' | 'collection' | 'report' | 'article';
  sourceId: string;
  projectId?: string; // For deep dive and collection actions
  onDeepDiveCreated?: () => void;
  onArticleSaved?: () => void;
  onBack?: () => void;
  className?: string;
}

export default function NetworkViewWithSidebar({
  sourceType,
  sourceId,
  projectId,
  onDeepDiveCreated,
  onArticleSaved,
  className = ''
}: NetworkViewWithSidebarProps) {
  const { user } = useAuth();
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  const handleNodeSelect = useCallback((node: any | null) => {
    if (node) {
      // Convert NetworkView format to NetworkSidebar format
      const convertedNode: NetworkNode = {
        id: node.id,
        data: {
          pmid: node.metadata.pmid,
          title: node.metadata.title,
          authors: node.metadata.authors,
          journal: node.metadata.journal,
          year: node.metadata.year,
          citation_count: node.metadata.citation_count,
          node_type: 'selected_article',
          url: node.metadata.url
        }
      };
      setSelectedNode(convertedNode);
    } else {
      setSelectedNode(null);
    }
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleDeepDive = useCallback(async (pmid: string, title: string) => {
    if (!projectId) {
      alert('Project ID is required for deep dive analysis');
      return;
    }

    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/deep-dive-analyses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user?.email || 'default_user',
        },
        body: JSON.stringify({
          article_title: title,
          article_pmid: pmid,
          objective: `Deep dive analysis of: ${title}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create deep dive analysis');
      }

      alert('✅ Deep dive analysis started successfully!');
      onDeepDiveCreated?.();
      
    } catch (error) {
      console.error('Error creating deep dive:', error);
      alert('❌ Failed to start deep dive analysis. Please try again.');
      throw error;
    }
  }, [projectId, onDeepDiveCreated]);

  const handleSaveToCollection = useCallback(async (pmid: string, title: string) => {
    // For now, we'll show a simple alert. In a full implementation,
    // this would open a collection selection modal
    alert(`Save to Collection feature coming soon!\n\nArticle: ${title}\nPMID: ${pmid}`);
    onArticleSaved?.();
  }, [onArticleSaved]);

  return (
    <div className={`flex h-full ${className}`}>
      {/* Main Network View */}
      <div className={`flex-1 ${selectedNode ? 'mr-80' : ''} transition-all duration-300`}>
        <NetworkView
          sourceType={sourceType}
          sourceId={sourceId}
          onNodeSelect={handleNodeSelect}
          className="h-full"
        />
      </div>

      {/* Sidebar */}
      {selectedNode && (
        <div className="fixed right-0 top-0 bottom-0 w-80 z-50">
          <NetworkSidebar
            selectedNode={selectedNode}
            onClose={handleCloseSidebar}
            onNavigationChange={(mode) => {
              // Handle navigation mode changes
              console.log('Navigation mode changed:', mode);
            }}
            onAddToCollection={(pmid) => {
              // Handle adding to collection
              console.log('Add to collection:', pmid);
            }}
            currentMode="default"
            projectId={projectId || ''}
            collections={[]}
          />
        </div>
      )}
    </div>
  );
}
