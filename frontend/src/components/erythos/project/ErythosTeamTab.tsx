'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMember {
  user_id: string;
  username: string;
  email?: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_at: string;
}

interface ErythosTeamTabProps {
  projectId: string;
  ownerId: string;
}

export function ErythosTeamTab({ projectId, ownerId }: ErythosTeamTabProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');

  useEffect(() => {
    fetchTeamMembers();
  }, [projectId]);

  const fetchTeamMembers = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}`, {
        headers: { 'User-ID': user.email }
      });
      if (response.ok) {
        const data = await response.json();
        // Add owner as first member
        const ownerMember: TeamMember = {
          user_id: data.owner_user_id,
          username: data.owner_user_id,
          role: 'owner',
          invited_at: data.created_at
        };
        const collaborators = data.collaborators || [];
        setMembers([ownerMember, ...collaborators]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-500/20 text-yellow-400';
      case 'editor': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'from-orange-500 to-red-500',
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-teal-500',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">👥 Team</h3>
          <p className="text-sm text-gray-400">{members.length} member(s)</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
        >
          ➕ Invite Collaborator
        </button>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member, index) => (
          <div 
            key={member.user_id}
            className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 flex items-center gap-4"
          >
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(index)} flex items-center justify-center text-white font-bold text-lg`}>
              {member.username.charAt(0).toUpperCase()}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-white font-medium">{member.username}</h4>
                <span className={`px-2 py-0.5 rounded text-xs capitalize ${getRoleBadge(member.role)}`}>
                  {member.role}
                </span>
              </div>
              {member.email && (
                <p className="text-gray-400 text-sm">{member.email}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Invite Collaborator</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="viewer">👀 Viewer - Can view only</option>
                  <option value="editor">✏️ Editor - Can edit</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

