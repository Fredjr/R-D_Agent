'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  user_id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  category?: string;
  role?: string;
  institution?: string;
  subject_area?: string;
  created_at: string;
  registration_completed?: boolean;
}

interface AuthContextType {
  user: User | null;
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  completeRegistration: (userDetails: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  // Legacy support - will be removed in future version
  login?: (email: string, username?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount - use localStorage as primary storage
    const savedUser = localStorage.getItem('rd_agent_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        console.log('✅ User session restored:', userData.email);
      } catch (error) {
        console.error('❌ Failed to parse saved user:', error);
        localStorage.removeItem('rd_agent_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Legacy login method - deprecated, use signin instead
  const login = async (email: string, username?: string) => {
    console.warn('⚠️ login() method is deprecated. Use signin() instead.');
    setIsLoading(true);
    try {
      // For backward compatibility, create a temporary user session
      // This should be replaced with proper signin flow
      const userData: User = {
        user_id: email, // Use email as user_id for consistency with backend
        username: username || email.split('@')[0],
        email: email,
        created_at: new Date().toISOString(),
        registration_completed: false // Mark as incomplete to prompt proper registration
      };

      setUser(userData);
      localStorage.setItem('rd_agent_user', JSON.stringify(userData));
      console.log('⚠️ Temporary user session created. Please complete registration.');
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('🔐 Signing in user:', email);

      const response = await fetch('/api/proxy/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || 'Sign in failed';
        console.error('❌ Sign in failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('rd_agent_user', JSON.stringify(userData));
      console.log('✅ User signed in successfully:', userData.email);
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('📝 Creating new user account:', email);

      const response = await fetch('/api/proxy/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || 'Sign up failed';
        console.error('❌ Sign up failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('rd_agent_user', JSON.stringify(userData));
      console.log('✅ User account created successfully:', userData.email);
    } catch (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeRegistration = async (userDetails: any) => {
    setIsLoading(true);
    try {
      console.log('📋 Completing user registration...');

      // Get current user from localStorage to get user_id
      const currentUser = localStorage.getItem('rd_agent_user');
      let user_id = userDetails.user_id;

      if (!user_id && currentUser) {
        const parsedUser = JSON.parse(currentUser);
        user_id = parsedUser.user_id || parsedUser.email;
      }

      if (!user_id) {
        throw new Error('No user ID found. Please sign up first.');
      }

      const requestData = {
        ...userDetails,
        user_id: user_id
      };

      const response = await fetch('/api/proxy/auth/complete-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.detail || 'Registration completion failed';
        console.error('❌ Registration completion failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('rd_agent_user', JSON.stringify(userData));
      console.log('✅ Registration completed successfully:', userData.email);
      return userData;
    } catch (error) {
      console.error('❌ Registration completion error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('👋 User logging out');
    setUser(null);
    localStorage.removeItem('rd_agent_user');
    console.log('✅ User session cleared');
  };

  return (
    <AuthContext.Provider value={{ user, signin, signup, completeRegistration, logout, isLoading, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
