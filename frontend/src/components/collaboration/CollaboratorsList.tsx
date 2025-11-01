'use client';

import { useState, useEffect } from 'react';
import { UserIcon, XMarkIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Collaborator {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_at: string;
  accepted_at: string | null;
  is_active: boolean;
}

interface CollaboratorsListProps {
  projectId: string;
  currentUserEmail: string;
  isOwner: boolean;
  onInviteClick: () => void;
}

export default function CollaboratorsList({
  projectId,
  currentUserEmail,
  isOwner,
  onInviteClick
}: CollaboratorsListProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [changingRoleUserId, setChangingRoleUserId] = useState<string | null>(null);

  // Fetch collaborators
  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/proxy/projects/${projectId}/collaborators`, {
        headers: {
          'User-ID': currentUserEmail,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch collaborators');
      }

      const data = await response.json();
      setCollaborators(data.collaborators || []);
    } catch (err) {
      console.error('Error fetching collaborators:', err);
      setError('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, [projectId, currentUserEmail]);

  // Remove collaborator
  const handleRemoveCollaborator = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }

    try {
      setRemovingUserId(userId);
      
      const response = await fetch(`/api/proxy/projects/${projectId}/collaborators/${userId}`, {
        method: 'DELETE',
        headers: {
          'User-ID': currentUserEmail,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove collaborator');
      }

      // Refresh list
      await fetchCollaborators();
    } catch (err) {
      console.error('Error removing collaborator:', err);
      alert('Failed to remove collaborator');
    } finally {
      setRemovingUserId(null);
    }
  };

  // Change role
  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      setChangingRoleUserId(userId);
      
      // Note: This endpoint doesn't exist yet, but we'll add it later
      const response = await fetch(`/api/proxy/projects/${projectId}/collaborators/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': currentUserEmail,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to change role');
      }

      // Refresh list
      await fetchCollaborators();
    } catch (err) {
      console.error('Error changing role:', err);
      alert('Failed to change role');
    } finally {
      setChangingRoleUserId(null);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'editor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get user initials
  const getUserInitials = (firstName: string, lastName: string, username: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  // Get display name
  const getDisplayName = (collab: Collaborator) => {
    if (collab.first_name && collab.last_name) {
      return `${collab.first_name} ${collab.last_name}`;
    }
    if (collab.first_name) {
      return collab.first_name;
    }
    return collab.username || collab.email;
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchCollaborators}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Team Members ({collaborators.length})
        </h3>
        {isOwner && (
          <button
            onClick={onInviteClick}
            className="text-sm bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            + Invite
          </button>
        )}
      </div>

      {collaborators.length === 0 ? (
        <div className="text-center py-8">
          <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No team members yet</p>
          {isOwner && (
            <button
              onClick={onInviteClick}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Invite your first collaborator
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {collaborators.map((collab) => {
            const isCurrentUser = collab.email === currentUserEmail;
            const canRemove = isOwner && !isCurrentUser && collab.role !== 'owner';
            const canChangeRole = isOwner && !isCurrentUser && collab.role !== 'owner';
            const isPending = !collab.accepted_at;

            return (
              <div
                key={collab.user_id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {getUserInitials(collab.first_name, collab.last_name, collab.username)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getDisplayName(collab)}
                      {isCurrentUser && (
                        <span className="text-gray-500 font-normal ml-1">(You)</span>
                      )}
                    </p>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <ClockIcon className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                    {!isPending && collab.role !== 'owner' && (
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{collab.email}</p>
                </div>

                {/* Role Badge */}
                {canChangeRole ? (
                  <select
                    value={collab.role}
                    onChange={(e) => handleChangeRole(collab.user_id, e.target.value)}
                    disabled={changingRoleUserId === collab.user_id}
                    className={`text-xs px-2 py-1 rounded-full border font-medium ${getRoleBadgeColor(
                      collab.role
                    )} disabled:opacity-50`}
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span
                    className={`text-xs px-2 py-1 rounded-full border font-medium ${getRoleBadgeColor(
                      collab.role
                    )}`}
                  >
                    {collab.role.charAt(0).toUpperCase() + collab.role.slice(1)}
                  </span>
                )}

                {/* Remove Button */}
                {canRemove && (
                  <button
                    onClick={() => handleRemoveCollaborator(collab.user_id)}
                    disabled={removingUserId === collab.user_id}
                    className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Remove collaborator"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

