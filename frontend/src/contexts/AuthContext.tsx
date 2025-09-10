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
  login: (email: string, username?: string) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  completeRegistration: (userDetails: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const savedUser = localStorage.getItem('rd_agent_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('rd_agent_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, username?: string) => {
    setIsLoading(true);
    try {
      // For now, we'll create a simple client-side user object
      // In a full implementation, this would authenticate with the backend
      const userData: User = {
        user_id: 'default_user', // Use consistent user_id for project persistence
        username: username || email.split('@')[0],
        email: email,
        created_at: new Date().toISOString()
      };

      setUser(userData);
      localStorage.setItem('rd_agent_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/proxy/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Sign in failed');
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('rd_agent_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/proxy/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Sign up failed');
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('rd_agent_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeRegistration = async (userDetails: any) => {
    setIsLoading(true);
    try {
      // Get current user from localStorage to get user_id
      const currentUser = localStorage.getItem('rd_agent_user');
      let user_id = userDetails.user_id;
      
      if (!user_id && currentUser) {
        const parsedUser = JSON.parse(currentUser);
        user_id = parsedUser.user_id || parsedUser.email;
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
        throw new Error(error.detail || 'Registration completion failed');
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('rd_agent_user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Registration completion failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rd_agent_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signin, signup, completeRegistration, logout, isLoading }}>
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
