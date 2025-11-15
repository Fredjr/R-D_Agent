'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  QuestionMarkCircleIcon,
  XMarkIcon,
  LightBulbIcon,
  CommandLineIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface HelpTip {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface PageHelp {
  title: string;
  tips: HelpTip[];
  shortcuts?: { key: string; description: string }[];
  videoUrl?: string;
}

const helpContent: Record<string, PageHelp> = {
  '/home': {
    title: 'Home Page Help',
    tips: [
      {
        title: 'AI-Powered Recommendations',
        description: 'Your home page shows personalized paper recommendations based on your research interests and search history.',
        icon: LightBulbIcon
      },
      {
        title: 'Quick Actions',
        description: 'Use the hero cards at the top to quickly access key features like Network Explorer and Search.',
        icon: CommandLineIcon
      },
      {
        title: 'Refine Your Interests',
        description: 'Add research interests in Settings to get better recommendations tailored to your work.',
        icon: QuestionMarkCircleIcon
      }
    ],
    shortcuts: [
      { key: 'Cmd+K', description: 'Open global search' },
      { key: 'Cmd+E', description: 'Explore network' }
    ]
  },
  '/search': {
    title: 'Search Help',
    tips: [
      {
        title: 'MeSH Autocomplete',
        description: 'Start typing to see MeSH term suggestions. MeSH terms help you find more relevant papers.',
        icon: LightBulbIcon
      },
      {
        title: 'Search by PMID or DOI',
        description: 'You can search directly by PMID (e.g., 12345678) or DOI for specific papers.',
        icon: CommandLineIcon
      },
      {
        title: 'Add to Projects',
        description: 'After searching, use the "Add to Project" button to save papers to your research projects.',
        icon: QuestionMarkCircleIcon
      }
    ],
    shortcuts: [
      { key: 'Cmd+K', description: 'Focus search bar' },
      { key: 'Enter', description: 'Execute search' }
    ]
  },
  '/explore/network': {
    title: 'Network Explorer Help',
    tips: [
      {
        title: 'Visualize Connections',
        description: 'The Network Explorer shows how papers are connected through citations, references, and authors.',
        icon: LightBulbIcon
      },
      {
        title: 'Start with Any Paper',
        description: 'Search for a paper by PMID, title, or keywords to start exploring its citation network.',
        icon: CommandLineIcon
      },
      {
        title: 'Browse Trending',
        description: 'Use the "Browse Trending" action to explore popular papers in your field.',
        icon: QuestionMarkCircleIcon
      }
    ],
    shortcuts: [
      { key: 'Cmd+F', description: 'Focus search' },
      { key: 'Cmd+T', description: 'Browse trending' }
    ]
  },
  '/collections': {
    title: 'Collections Help',
    tips: [
      {
        title: 'Organize Your Papers',
        description: 'Collections help you organize papers by topic, project, or any category you choose.',
        icon: LightBulbIcon
      },
      {
        title: 'Create Collections',
        description: 'Click "New Collection" to create a new collection and start adding papers.',
        icon: CommandLineIcon
      },
      {
        title: 'Share Collections',
        description: 'Collections can be shared with collaborators for team research projects.',
        icon: QuestionMarkCircleIcon
      }
    ],
    shortcuts: [
      { key: 'Cmd+Shift+N', description: 'New collection' },
      { key: 'Cmd+S', description: 'Save changes' }
    ]
  },
  '/dashboard': {
    title: 'Projects Help',
    tips: [
      {
        title: 'Research Projects',
        description: 'Projects help you organize papers, notes, and analyses for specific research goals.',
        icon: LightBulbIcon
      },
      {
        title: 'Create Projects',
        description: 'Click "New Project" to start a new research project with a title and description.',
        icon: CommandLineIcon
      },
      {
        title: 'Track Progress',
        description: 'Use projects to track your research progress and collaborate with team members.',
        icon: QuestionMarkCircleIcon
      }
    ],
    shortcuts: [
      { key: 'Cmd+N', description: 'New project' },
      { key: 'Cmd+O', description: 'Open project' }
    ]
  }
};

interface ContextualHelpProps {
  className?: string;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({ className = '' }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const pageHelp = helpContent[pathname] || helpContent['/home'];

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-36 sm:bottom-24 right-4 sm:right-6 z-40 w-12 h-12 bg-[var(--spotify-dark-gray)] hover:bg-[var(--spotify-gray)] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${className}`}
        aria-label="Help"
      >
        <QuestionMarkCircleIcon className="w-6 h-6" />
      </button>

      {/* Help Sidebar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[var(--spotify-dark-gray)] shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
            {/* Header */}
            <div className="sticky top-0 bg-[var(--spotify-dark-gray)] border-b border-[var(--spotify-gray)] p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <QuestionMarkCircleIcon className="w-6 h-6 text-[var(--spotify-green)]" />
                {pageHelp.title}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--spotify-light-text)] hover:text-white transition-colors"
                aria-label="Close help"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Tips Section */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--spotify-light-text)] uppercase mb-3">
                  Tips & Tricks
                </h3>
                <div className="space-y-3">
                  {pageHelp.tips.map((tip, index) => (
                    <div
                      key={index}
                      className="bg-[var(--spotify-black)] rounded-lg p-4 border border-[var(--spotify-gray)] hover:border-[var(--spotify-green)] transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[var(--spotify-green)]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <tip.icon className="w-5 h-5 text-[var(--spotify-green)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium mb-1">{tip.title}</h4>
                          <p className="text-[var(--spotify-light-text)] text-sm">{tip.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              {pageHelp.shortcuts && pageHelp.shortcuts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--spotify-light-text)] uppercase mb-3">
                    Keyboard Shortcuts
                  </h3>
                  <div className="bg-[var(--spotify-black)] rounded-lg p-4 border border-[var(--spotify-gray)]">
                    <div className="space-y-2">
                      {pageHelp.shortcuts.map((shortcut, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-[var(--spotify-light-text)] text-sm">
                            {shortcut.description}
                          </span>
                          <kbd className="px-2 py-1 bg-[var(--spotify-dark-gray)] text-white text-xs rounded border border-[var(--spotify-gray)] font-mono">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Support */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--spotify-light-text)] uppercase mb-3">
                  Need More Help?
                </h3>
                <button className="w-full bg-[var(--spotify-green)] hover:bg-[var(--spotify-green)]/90 text-black font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ContextualHelp;

