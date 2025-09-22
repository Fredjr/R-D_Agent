'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestHomePage() {
  const router = useRouter();

  useEffect(() => {
    const setupTestUser = async () => {
      try {
        console.log('🧪 Setting up test user session...');
        
        // Create test user data
        const testUser = {
          user_id: 'fredericle77@gmail.com',
          username: 'Test User',
          email: 'fredericle77@gmail.com',
          created_at: new Date().toISOString(),
          registration_completed: true
        };

        // Store in localStorage
        localStorage.setItem('rd_agent_user', JSON.stringify(testUser));
        console.log('✅ Test user session created');

        // Redirect to home page
        router.push('/home');
        
      } catch (error) {
        console.error('❌ Failed to setup test user:', error);
      }
    };

    setupTestUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] to-[#000000] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--spotify-green)] mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">Setting up test session...</h1>
        <p className="text-gray-400">Redirecting to home page...</p>
      </div>
    </div>
  );
}
