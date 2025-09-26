'use client';

import React, { useState } from 'react';
import { 
  UserIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  PaintBrushIcon,
  GlobeAltIcon,
  KeyIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui/Navigation';
import { Button } from '@/components/ui/Button';
import { MobileResponsiveLayout } from '@/components/ui/MobileResponsiveLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    profile: {
      name: (user as any)?.name || '',
      email: user?.email || '',
      bio: '',
      organization: '',
      researchArea: ''
    },
    notifications: {
      emailNotifications: true,
      projectUpdates: true,
      collaborationInvites: true,
      weeklyDigest: false,
      marketingEmails: false
    },
    privacy: {
      profileVisibility: 'team',
      projectVisibility: 'private',
      allowCollaboration: true,
      dataSharing: false
    },
    appearance: {
      theme: 'dark',
      sidebarCollapsed: false,
      compactMode: false,
      animations: true
    }
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'privacy', label: 'Privacy & Security', icon: ShieldCheckIcon },
    { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
    { id: 'account', label: 'Account', icon: KeyIcon }
  ];

  const handleSave = async () => {
    try {
      // TODO: Implement actual save functionality
      console.log('Saving settings:', settings);
      // Show success message
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={settings.profile.name}
            onChange={(e) => setSettings({
              ...settings,
              profile: { ...settings.profile, name: e.target.value }
            })}
            className="w-full px-3 py-2 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg text-[var(--spotify-white)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={settings.profile.email}
            onChange={(e) => setSettings({
              ...settings,
              profile: { ...settings.profile, email: e.target.value }
            })}
            className="w-full px-3 py-2 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg text-[var(--spotify-white)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">
          Bio
        </label>
        <textarea
          value={settings.profile.bio}
          onChange={(e) => setSettings({
            ...settings,
            profile: { ...settings.profile, bio: e.target.value }
          })}
          rows={3}
          className="w-full px-3 py-2 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg text-[var(--spotify-white)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]"
          placeholder="Tell us about your research interests..."
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">
            Organization
          </label>
          <input
            type="text"
            value={settings.profile.organization}
            onChange={(e) => setSettings({
              ...settings,
              profile: { ...settings.profile, organization: e.target.value }
            })}
            className="w-full px-3 py-2 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg text-[var(--spotify-white)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">
            Research Area
          </label>
          <input
            type="text"
            value={settings.profile.researchArea}
            onChange={(e) => setSettings({
              ...settings,
              profile: { ...settings.profile, researchArea: e.target.value }
            })}
            className="w-full px-3 py-2 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg text-[var(--spotify-white)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]"
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      {Object.entries(settings.notifications).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <div>
            <h4 className="text-[var(--spotify-white)] font-medium">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </h4>
            <p className="text-sm text-[var(--spotify-light-text)]">
              {getNotificationDescription(key)}
            </p>
          </div>
          <button
            onClick={() => setSettings({
              ...settings,
              notifications: { ...settings.notifications, [key]: !value }
            })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value ? 'bg-[var(--spotify-green)]' : 'bg-[var(--spotify-medium-gray)]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">
          Profile Visibility
        </label>
        <select
          value={settings.privacy.profileVisibility}
          onChange={(e) => setSettings({
            ...settings,
            privacy: { ...settings.privacy, profileVisibility: e.target.value }
          })}
          className="w-full px-3 py-2 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg text-[var(--spotify-white)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]"
        >
          <option value="public">Public</option>
          <option value="team">Team Only</option>
          <option value="private">Private</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">
          Default Project Visibility
        </label>
        <select
          value={settings.privacy.projectVisibility}
          onChange={(e) => setSettings({
            ...settings,
            privacy: { ...settings.privacy, projectVisibility: e.target.value }
          })}
          className="w-full px-3 py-2 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-border-gray)] rounded-lg text-[var(--spotify-white)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]"
        >
          <option value="public">Public</option>
          <option value="team">Team Only</option>
          <option value="private">Private</option>
        </select>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[var(--spotify-white)] font-medium">Allow Collaboration Requests</h4>
          <p className="text-sm text-[var(--spotify-light-text)]">
            Let other researchers invite you to collaborate
          </p>
        </div>
        <button
          onClick={() => setSettings({
            ...settings,
            privacy: { ...settings.privacy, allowCollaboration: !settings.privacy.allowCollaboration }
          })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.privacy.allowCollaboration ? 'bg-[var(--spotify-green)]' : 'bg-[var(--spotify-medium-gray)]'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.privacy.allowCollaboration ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[var(--spotify-white)] mb-2">
          Theme
        </label>
        <div className="grid grid-cols-2 gap-4">
          {['dark', 'light'].map((theme) => (
            <button
              key={theme}
              onClick={() => setSettings({
                ...settings,
                appearance: { ...settings.appearance, theme }
              })}
              className={`p-4 rounded-lg border-2 transition-colors ${
                settings.appearance.theme === theme
                  ? 'border-[var(--spotify-green)] bg-[var(--spotify-green)]/10'
                  : 'border-[var(--spotify-border-gray)] bg-[var(--spotify-dark-gray)]'
              }`}
            >
              <div className="text-center">
                <div className={`w-8 h-8 mx-auto mb-2 rounded ${
                  theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                }`} />
                <span className="text-[var(--spotify-white)] capitalize">{theme}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {Object.entries(settings.appearance).filter(([key]) => key !== 'theme').map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <div>
            <h4 className="text-[var(--spotify-white)] font-medium">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </h4>
            <p className="text-sm text-[var(--spotify-light-text)]">
              {getAppearanceDescription(key)}
            </p>
          </div>
          <button
            onClick={() => setSettings({
              ...settings,
              appearance: { ...settings.appearance, [key]: !value }
            })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value ? 'bg-[var(--spotify-green)]' : 'bg-[var(--spotify-medium-gray)]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 border border-[var(--spotify-border-gray)]">
        <h3 className="text-lg font-semibold text-[var(--spotify-white)] mb-4">Change Password</h3>
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Current password"
            className="w-full px-3 py-2 bg-[var(--spotify-medium-gray)] border border-[var(--spotify-border-gray)] rounded-lg text-[var(--spotify-white)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]"
          />
          <input
            type="password"
            placeholder="New password"
            className="w-full px-3 py-2 bg-[var(--spotify-medium-gray)] border border-[var(--spotify-border-gray)] rounded-lg text-[var(--spotify-white)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            className="w-full px-3 py-2 bg-[var(--spotify-medium-gray)] border border-[var(--spotify-border-gray)] rounded-lg text-[var(--spotify-white)] focus:outline-none focus:ring-2 focus:ring-[var(--spotify-green)]"
          />
          <Button variant="spotifyPrimary" size="spotifySm">
            Update Password
          </Button>
        </div>
      </div>
      
      <div className="bg-red-500/10 rounded-lg p-6 border border-red-500/20">
        <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
        <p className="text-[var(--spotify-light-text)] mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button variant="outline" size="spotifySm" className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white">
          <TrashIcon className="h-4 w-4 mr-2" />
          Delete Account
        </Button>
      </div>
    </div>
  );

  const getNotificationDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      emailNotifications: 'Receive email notifications for important updates',
      projectUpdates: 'Get notified when projects you\'re involved in are updated',
      collaborationInvites: 'Receive notifications for collaboration invitations',
      weeklyDigest: 'Get a weekly summary of your research activity',
      marketingEmails: 'Receive updates about new features and research tips'
    };
    return descriptions[key] || '';
  };

  const getAppearanceDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      sidebarCollapsed: 'Start with sidebar collapsed by default',
      compactMode: 'Use more compact spacing throughout the interface',
      animations: 'Enable smooth animations and transitions'
    };
    return descriptions[key] || '';
  };

  return (
    <MobileResponsiveLayout>
      <div className="w-full max-w-none py-6 sm:py-8">
        {/* Mobile-friendly header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--spotify-white)] mb-2">Settings</h1>
          <p className="text-[var(--spotify-light-text)] text-sm sm:text-base">
            Manage your account preferences and application settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible space-x-2 lg:space-x-0 lg:space-y-1 pb-2 lg:pb-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[var(--spotify-green)] text-[var(--spotify-black)]'
                        : 'text-[var(--spotify-light-text)] hover:text-[var(--spotify-white)] hover:bg-[var(--spotify-medium-gray)]'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 border border-[var(--spotify-border-gray)]">
              {activeTab === 'profile' && renderProfileSettings()}
              {activeTab === 'notifications' && renderNotificationSettings()}
              {activeTab === 'privacy' && renderPrivacySettings()}
              {activeTab === 'appearance' && renderAppearanceSettings()}
              {activeTab === 'account' && renderAccountSettings()}
              
              {activeTab !== 'account' && (
                <div className="mt-8 pt-6 border-t border-[var(--spotify-border-gray)]">
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" size="spotifyDefault">
                      Cancel
                    </Button>
                    <Button 
                      variant="spotifyPrimary" 
                      size="spotifyDefault"
                      onClick={handleSave}
                      className="inline-flex items-center"
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MobileResponsiveLayout>
  );
}
