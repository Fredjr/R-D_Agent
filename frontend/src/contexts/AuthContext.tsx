'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  user_id: string;
  username: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, username?: string) => Promise<void>;
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
        user_id: email, // Use email as user_id for now
        username: username || email.split('@')[0],
        email: email,
        created_at: new Date().toISOString()
      };

      // Save to backend (create user if doesn't exist)
      try {
        const response = await fetch('/api/proxy/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username: userData.username }),
        });
        
        if (response.ok) {
          const backendUser = await response.json();
          setUser(backendUser);
          localStorage.setItem('rd_agent_user', JSON.stringify(backendUser));
        } else {
          // Fallback to client-side user
          setUser(userData);
          localStorage.setItem('rd_agent_user', JSON.stringify(userData));
        }
      } catch (error) {
        // Fallback to client-side user if backend fails
        console.warn('Backend auth failed, using client-side auth:', error);
        setUser(userData);
        localStorage.setItem('rd_agent_user', JSON.stringify(userData));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rd_agent_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
