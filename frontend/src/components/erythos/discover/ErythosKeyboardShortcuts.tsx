'use client';

import React from 'react';

interface KeyboardShortcutsProps {
  className?: string;
}

export function ErythosKeyboardShortcuts({ className = '' }: KeyboardShortcutsProps) {
  const shortcuts = [
    { key: 'A', label: 'Accept', color: 'bg-green-600/20 text-green-400 border-green-500/30' },
    { key: 'R', label: 'Reject', color: 'bg-red-600/20 text-red-400 border-red-500/30' },
    { key: 'M', label: 'Maybe', color: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30' },
    { key: 'D', label: 'Mark Read', color: 'bg-blue-600/20 text-blue-400 border-blue-500/30' },
  ];

  const navShortcuts = [
    { key: 'J', label: 'Next' },
    { key: 'K', label: 'Prev' },
    { key: 'B', label: 'Batch' },
    { key: 'U', label: 'Undo' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {/* Action shortcuts */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 mr-1">Actions:</span>
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.key}
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded border
              ${shortcut.color}
            `}
          >
            <kbd className="font-mono text-xs font-bold">{shortcut.key}</kbd>
            <span className="text-xs opacity-80">{shortcut.label}</span>
          </div>
        ))}
      </div>

      {/* Nav shortcuts */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 mr-1">Nav:</span>
        {navShortcuts.map((shortcut) => (
          <div
            key={shortcut.key}
            className="flex items-center gap-1.5 px-2 py-1 rounded border bg-gray-700/30 text-gray-400 border-gray-600/30"
          >
            <kbd className="font-mono text-xs font-bold">{shortcut.key}</kbd>
            <span className="text-xs opacity-80">{shortcut.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

