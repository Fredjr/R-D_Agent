'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WriteCollectionSelector } from './WriteCollectionSelector';
import { WriteSourcesPanel } from './WriteSourcesPanel';
import { WriteEditor } from './WriteEditor';
import { WriteAIAssistant } from './WriteAIAssistant';
import { WriteStatsBar } from './WriteStatsBar';

interface Collection {
  collection_id: string;
  collection_name: string;
  article_count: number;
  color?: string;
  icon?: string;
}

interface WriteSource {
  source_id: string;
  collection_id: string;
  article_pmid?: string;
  source_type: string;
  title: string;
  text: string;
  page_number?: string;
  section?: string;
  paper_title?: string;
  paper_authors?: string;
  paper_year?: number;
}

interface Document {
  document_id: string;
  title: string;
  content?: string;
  content_json?: any;
  word_count: number;
  citation_count: number;
  citation_style: string;
  collection_id?: string;
  collection_name?: string;
  updated_at: string;
}

export function ErythosWritePage() {
  const { user } = useAuth();
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sources, setSources] = useState<WriteSource[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [connectionMatches, setConnectionMatches] = useState<any[]>([]);

  // Fetch collections on mount
  useEffect(() => {
    if (user?.email) {
      fetchCollections();
    }
  }, [user?.email]);

  const fetchCollections = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch('/api/proxy/write/collections', {
        headers: { 'User-ID': user.email }
      });
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionSelect = async (collection: Collection) => {
    setSelectedCollection(collection);
    setSourcesLoading(true);
    
    if (!user?.email) return;
    
    try {
      // Fetch sources for the selected collection
      const res = await fetch(`/api/proxy/write/collections/${collection.collection_id}/sources`, {
        headers: { 'User-ID': user.email }
      });
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
      
      // Create a new document for this collection
      const docRes = await fetch('/api/proxy/write/documents', {
        method: 'POST',
        headers: { 
          'User-ID': user.email,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Untitled Document',
          collection_id: collection.collection_id
        })
      });
      if (docRes.ok) {
        const doc = await docRes.json();
        setCurrentDocument(doc);
      }
    } catch (error) {
      console.error('Error loading collection data:', error);
    } finally {
      setSourcesLoading(false);
    }
  };

  // Debounced connection detection
  const detectConnections = useCallback(async (text: string) => {
    if (!user?.email || !selectedCollection || text.length < 50) return;
    
    try {
      const res = await fetch('/api/proxy/write/detect-connections', {
        method: 'POST',
        headers: { 
          'User-ID': user.email,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          collection_id: selectedCollection.collection_id
        })
      });
      if (res.ok) {
        const matches = await res.json();
        setConnectionMatches(matches);
      }
    } catch (error) {
      console.error('Error detecting connections:', error);
    }
  }, [user?.email, selectedCollection]);

  const handleContentChange = useCallback((newContent: string, wordCount: number) => {
    setContent(newContent);
    if (currentDocument) {
      setCurrentDocument(prev => prev ? { ...prev, word_count: wordCount } : null);
    }
    // Debounce connection detection
    const timeoutId = setTimeout(() => detectConnections(newContent), 500);
    return () => clearTimeout(timeoutId);
  }, [currentDocument, detectConnections]);

  const handleSave = async () => {
    if (!user?.email || !currentDocument) return;
    
    try {
      await fetch(`/api/proxy/write/documents/${currentDocument.document_id}`, {
        method: 'PUT',
        headers: { 
          'User-ID': user.email,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          word_count: currentDocument.word_count
        })
      });
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  // Show collection selector if no collection selected
  if (!selectedCollection) {
    return (
      <div className="min-h-screen bg-[#000]">
        <WriteCollectionSelector
          collections={collections}
          loading={loading}
          onSelect={handleCollectionSelect}
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-69px)] bg-[#000] flex flex-col">
      {/* Main 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Sources */}
        <WriteSourcesPanel 
          sources={sources}
          loading={sourcesLoading}
          connectionMatches={connectionMatches}
        />
        
        {/* Center - Editor */}
        <WriteEditor
          document={currentDocument}
          content={content}
          onContentChange={handleContentChange}
          onSave={handleSave}
          onTitleChange={(title) => setCurrentDocument(prev => prev ? { ...prev, title } : null)}
        />
        
        {/* Right Sidebar - AI Assistant */}
        <WriteAIAssistant
          documentId={currentDocument?.document_id}
          collectionId={selectedCollection.collection_id}
          sources={sources}
          onInsertText={(text) => setContent(prev => prev + '\n\n' + text)}
        />
      </div>
      
      {/* Stats Bar */}
      <WriteStatsBar
        wordCount={currentDocument?.word_count || 0}
        citationCount={currentDocument?.citation_count || 0}
        lastSaved={currentDocument?.updated_at}
      />
    </div>
  );
}

