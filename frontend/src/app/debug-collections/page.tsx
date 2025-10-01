'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DebugCollectionsPage() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    setDebugInfo({
      user: user,
      userEmail: user?.email,
      userId: user?.user_id,
      registrationCompleted: user?.registration_completed,
      localStorage: typeof window !== 'undefined' ? localStorage.getItem('rd_agent_user') : null,
    });
  }, [user]);

  const testProjectsAPI = async () => {
    try {
      console.log('🔍 Testing projects API with user:', user?.email);
      const response = await fetch(`/api/proxy/projects?user_id=${user?.email}`, {
        headers: {
          'User-ID': user?.email || 'default_user',
          'Content-Type': 'application/json',
        },
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      };

      if (response.ok) {
        const data = await response.json();
        result.data = data;
      } else {
        const errorText = await response.text();
        result.error = errorText;
      }

      setTestResults(prev => ({ ...prev, projects: result }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, projects: { error: error.message } }));
    }
  };

  const testCollectionsAPI = async (projectId: string) => {
    try {
      console.log('🔍 Testing collections API for project:', projectId, 'with user:', user?.email);
      const response = await fetch(`/api/proxy/projects/${projectId}/collections`, {
        headers: {
          'User-ID': user?.email || 'default_user',
          'Content-Type': 'application/json',
        },
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      };

      if (response.ok) {
        const data = await response.json();
        result.data = data;
      } else {
        const errorText = await response.text();
        result.error = errorText;
      }

      setTestResults(prev => ({ ...prev, collections: result }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, collections: { error: error.message } }));
    }
  };

  const testBackendDirectly = async () => {
    try {
      console.log('🔍 Testing backend directly with user:', user?.email);
      const response = await fetch(`https://r-dagent-production.up.railway.app/projects?user_id=${user?.email}`, {
        headers: {
          'User-ID': user?.email || 'default_user',
          'Content-Type': 'application/json',
        },
      });

      const result = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      };

      if (response.ok) {
        const data = await response.json();
        result.data = data;
      } else {
        const errorText = await response.text();
        result.error = errorText;
      }

      setTestResults(prev => ({ ...prev, backendDirect: result }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, backendDirect: { error: error.message } }));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--spotify-black)] text-[var(--spotify-white)] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[var(--spotify-green)]">🔍 Collections Debug Page</h1>
        
        {/* Authentication Debug */}
        <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-[var(--spotify-green)]">Authentication State</h2>
          <pre className="bg-[var(--spotify-medium-gray)] p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Test Buttons */}
        <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-[var(--spotify-green)]">API Tests</h2>
          <div className="space-y-4">
            <button
              onClick={testProjectsAPI}
              className="bg-[var(--spotify-green)] text-[var(--spotify-black)] px-4 py-2 rounded font-semibold hover:bg-[var(--spotify-green-hover)]"
            >
              Test Projects API
            </button>
            <button
              onClick={() => testCollectionsAPI('test-project-id')}
              className="bg-[var(--spotify-blue)] text-white px-4 py-2 rounded font-semibold hover:opacity-80 ml-4"
            >
              Test Collections API (Test Project)
            </button>
            <button
              onClick={testBackendDirectly}
              className="bg-[var(--spotify-purple)] text-white px-4 py-2 rounded font-semibold hover:opacity-80 ml-4"
            >
              Test Backend Directly
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-[var(--spotify-green)]">Test Results</h2>
          <pre className="bg-[var(--spotify-medium-gray)] p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>

        {/* Instructions */}
        <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-[var(--spotify-orange)]">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-[var(--spotify-light-text)]">
            <li>Check if you are properly logged in (Authentication State should show your user details)</li>
            <li>Click "Test Projects API" to see if you can fetch your projects</li>
            <li>If projects work, use a real project ID from the results to test collections</li>
            <li>Compare results between proxy API and direct backend calls</li>
            <li>Look for 403 errors or authentication issues in the results</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
