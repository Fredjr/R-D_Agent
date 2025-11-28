/**
 * TeamMembersWidget Component
 *
 * Phase 2: Implementation (Week 3) - COMPLETE
 *
 * Purpose: Displays team members/collaborators with avatars and roles
 * Features:
 * - User avatars with initials
 * - Role badges (Owner, Editor, Viewer)
 * - Email addresses
 * - "+ Invite Collaborator" button
 *
 * Created: 2025-11-27
 * Updated: 2025-11-27 (Phase 2)
 */

'use client';

import React from 'react';
import { UserPlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { SpotifyTabCard, SpotifyTabCardHeader, SpotifyTabButton, SpotifyTabBadge } from './shared';

interface TeamMember {
  user_id: string;
  username?: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  avatar_url?: string;
  invited_at?: string;
}

interface TeamMembersWidgetProps {
  projectId: string;
  project?: any;
  onInviteCollaborator?: () => void;
}

export default function TeamMembersWidget({
  projectId,
  project,
  onInviteCollaborator,
}: TeamMembersWidgetProps) {
  // Get collaborators from project
  const collaborators = project?.collaborators || [];
  const owner = project?.owner_user_id;

  // Create team members list (owner + collaborators)
  const teamMembers: TeamMember[] = [
    // Owner
    {
      user_id: owner || 'unknown',
      email: owner || 'Unknown',
      username: owner?.split('@')[0] || 'Owner',
      role: 'owner' as const,
    },
    // Collaborators
    ...collaborators.map((collab: any) => ({
      user_id: collab.user_id || collab.email,
      email: collab.email || collab.user_id,
      username: collab.username || collab.email?.split('@')[0] || 'User',
      role: (collab.role || 'viewer') as 'owner' | 'editor' | 'viewer',
      invited_at: collab.invited_at,
    })),
  ];

  // Get initials from email or username
  const getInitials = (member: TeamMember) => {
    const name = member.username || member.email;
    const parts = name.split(/[@._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Get role badge color
  const getRoleBadgeVariant = (role: string): 'success' | 'info' | 'default' => {
    if (role === 'owner') return 'success';
    if (role === 'editor') return 'info';
    return 'default';
  };

  return (
    <SpotifyTabCard className="h-full flex flex-col">
      {/* Header */}
      <SpotifyTabCardHeader
        title="👥 Team"
        description={`${teamMembers.length} member${teamMembers.length !== 1 ? 's' : ''}`}
        action={
          onInviteCollaborator && (
            <button
              onClick={onInviteCollaborator}
              className="p-2 rounded-lg hover:bg-[var(--spotify-medium-gray)] transition-colors"
              title="Invite Collaborator"
            >
              <UserPlusIcon className="w-5 h-5 text-[var(--spotify-green)]" />
            </button>
          )
        }
      />

      {/* Team Members List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-spotify-medium scrollbar-thumb-spotify-light">
        {teamMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <UserGroupIcon className="w-12 h-12 text-[var(--spotify-muted-text)] mb-3" />
            <p className="text-[var(--spotify-light-text)] text-sm mb-4">
              No team members yet
            </p>
            {onInviteCollaborator && (
              <SpotifyTabButton
                onClick={onInviteCollaborator}
                variant="primary"
                size="sm"
              >
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Invite Collaborator
              </SpotifyTabButton>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--spotify-medium-gray)] transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">
                    {getInitials(member)}
                  </span>
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[var(--spotify-white)] text-sm font-medium truncate">
                      {member.username || member.email.split('@')[0]}
                    </h4>
                    <SpotifyTabBadge variant={getRoleBadgeVariant(member.role)}>
                      {member.role}
                    </SpotifyTabBadge>
                  </div>
                  <p className="text-[var(--spotify-light-text)] text-xs truncate">
                    {member.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Invite Button */}
      {teamMembers.length > 0 && onInviteCollaborator && (
        <div className="mt-4 pt-4 border-t border-[var(--spotify-border-gray)]">
          <SpotifyTabButton
            onClick={onInviteCollaborator}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            <UserPlusIcon className="w-4 h-4 mr-2" />
            Invite Collaborator
          </SpotifyTabButton>
        </div>
      )}
    </SpotifyTabCard>
  );
}

