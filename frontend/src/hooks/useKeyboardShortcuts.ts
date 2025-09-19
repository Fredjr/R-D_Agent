import { useEffect, useCallback, useRef, useState } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category?: string;
  disabled?: boolean;
}

interface ShortcutGroup {
  [category: string]: KeyboardShortcut[];
}

// Default shortcuts for network view
const DEFAULT_NETWORK_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'f',
    ctrlKey: true,
    action: () => {},
    description: 'Search/Filter nodes',
    category: 'Navigation'
  },
  {
    key: 'r',
    ctrlKey: true,
    action: () => {},
    description: 'Refresh network data',
    category: 'Data'
  },
  {
    key: 'z',
    ctrlKey: true,
    action: () => {},
    description: 'Fit network to view',
    category: 'View'
  },
  {
    key: 'Escape',
    action: () => {},
    description: 'Clear selection',
    category: 'Selection'
  },
  {
    key: 'Delete',
    action: () => {},
    description: 'Remove selected nodes',
    category: 'Edit'
  },
  {
    key: 'a',
    ctrlKey: true,
    action: () => {},
    description: 'Select all nodes',
    category: 'Selection'
  },
  {
    key: 'c',
    ctrlKey: true,
    action: () => {},
    description: 'Copy selected nodes',
    category: 'Edit'
  },
  {
    key: 's',
    ctrlKey: true,
    action: () => {},
    description: 'Save to collection',
    category: 'Collections'
  },
  {
    key: 'n',
    ctrlKey: true,
    action: () => {},
    description: 'Create new collection',
    category: 'Collections'
  },
  {
    key: '1',
    action: () => {},
    description: 'Switch to Citations view',
    category: 'View'
  },
  {
    key: '2',
    action: () => {},
    description: 'Switch to References view',
    category: 'View'
  },
  {
    key: '3',
    action: () => {},
    description: 'Switch to Similar Papers view',
    category: 'View'
  },
  {
    key: 'h',
    action: () => {},
    description: 'Show/hide help',
    category: 'Help'
  },
  {
    key: '?',
    shiftKey: true,
    action: () => {},
    description: 'Show keyboard shortcuts',
    category: 'Help'
  }
];

// Hook for managing keyboard shortcuts
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[] = DEFAULT_NETWORK_SHORTCUTS,
  enabled: boolean = true
) {
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const shortcutsRef = useRef<KeyboardShortcut[]>(shortcuts);
  const enabledRef = useRef(enabled);

  // Update refs when props change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    enabledRef.current = enabled;
  }, [shortcuts, enabled]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabledRef.current) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      if (shortcut.disabled) return false;
      
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.metaKey === event.metaKey
      );
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      
      // Special handling for help shortcuts
      if (matchingShortcut.key === 'h' || matchingShortcut.key === '?') {
        setIsHelpVisible(prev => !prev);
      } else {
        matchingShortcut.action();
      }
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    shortcutsRef.current = [...shortcutsRef.current, shortcut];
  }, []);

  const unregisterShortcut = useCallback((key: string, modifiers?: Partial<Pick<KeyboardShortcut, 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'>>) => {
    shortcutsRef.current = shortcutsRef.current.filter(shortcut => {
      if (shortcut.key !== key) return true;
      if (modifiers) {
        return !(
          !!shortcut.ctrlKey === !!modifiers.ctrlKey &&
          !!shortcut.shiftKey === !!modifiers.shiftKey &&
          !!shortcut.altKey === !!modifiers.altKey &&
          !!shortcut.metaKey === !!modifiers.metaKey
        );
      }
      return false;
    });
  }, []);

  const updateShortcut = useCallback((key: string, updates: Partial<KeyboardShortcut>) => {
    shortcutsRef.current = shortcutsRef.current.map(shortcut =>
      shortcut.key === key ? { ...shortcut, ...updates } : shortcut
    );
  }, []);

  const getShortcutsByCategory = useCallback((): ShortcutGroup => {
    return shortcutsRef.current.reduce((groups, shortcut) => {
      const category = shortcut.category || 'General';
      if (!groups[category]) groups[category] = [];
      groups[category].push(shortcut);
      return groups;
    }, {} as ShortcutGroup);
  }, []);

  const formatShortcut = useCallback((shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey || shortcut.metaKey) {
      parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
    }
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  }, []);

  return {
    shortcuts: shortcutsRef.current,
    isHelpVisible,
    setIsHelpVisible,
    registerShortcut,
    unregisterShortcut,
    updateShortcut,
    getShortcutsByCategory,
    formatShortcut
  };
}

// Network-specific shortcuts hook
export function useNetworkShortcuts(
  onSearch?: () => void,
  onRefresh?: () => void,
  onFitView?: () => void,
  onClearSelection?: () => void,
  onSelectAll?: () => void,
  onSaveToCollection?: () => void,
  onCreateCollection?: () => void,
  onSwitchView?: (view: 'citations' | 'references' | 'similar') => void
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'f',
      ctrlKey: true,
      action: onSearch || (() => {}),
      description: 'Search/Filter nodes',
      category: 'Navigation',
      disabled: !onSearch
    },
    {
      key: 'r',
      ctrlKey: true,
      action: onRefresh || (() => {}),
      description: 'Refresh network data',
      category: 'Data',
      disabled: !onRefresh
    },
    {
      key: 'z',
      ctrlKey: true,
      action: onFitView || (() => {}),
      description: 'Fit network to view',
      category: 'View',
      disabled: !onFitView
    },
    {
      key: 'Escape',
      action: onClearSelection || (() => {}),
      description: 'Clear selection',
      category: 'Selection',
      disabled: !onClearSelection
    },
    {
      key: 'a',
      ctrlKey: true,
      action: onSelectAll || (() => {}),
      description: 'Select all nodes',
      category: 'Selection',
      disabled: !onSelectAll
    },
    {
      key: 's',
      ctrlKey: true,
      action: onSaveToCollection || (() => {}),
      description: 'Save to collection',
      category: 'Collections',
      disabled: !onSaveToCollection
    },
    {
      key: 'n',
      ctrlKey: true,
      action: onCreateCollection || (() => {}),
      description: 'Create new collection',
      category: 'Collections',
      disabled: !onCreateCollection
    },
    {
      key: '1',
      action: () => onSwitchView?.('citations'),
      description: 'Switch to Citations view',
      category: 'View',
      disabled: !onSwitchView
    },
    {
      key: '2',
      action: () => onSwitchView?.('references'),
      description: 'Switch to References view',
      category: 'View',
      disabled: !onSwitchView
    },
    {
      key: '3',
      action: () => onSwitchView?.('similar'),
      description: 'Switch to Similar Papers view',
      category: 'View',
      disabled: !onSwitchView
    }
  ];

  return useKeyboardShortcuts(shortcuts);
}

// Collection shortcuts hook
export function useCollectionShortcuts(
  onCreateCollection?: () => void,
  onDeleteCollection?: () => void,
  onRenameCollection?: () => void,
  onAddArticle?: () => void,
  onRemoveArticle?: () => void,
  onExportCollection?: () => void
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      action: onCreateCollection || (() => {}),
      description: 'Create new collection',
      category: 'Collections',
      disabled: !onCreateCollection
    },
    {
      key: 'Delete',
      action: onDeleteCollection || (() => {}),
      description: 'Delete selected collection',
      category: 'Collections',
      disabled: !onDeleteCollection
    },
    {
      key: 'F2',
      action: onRenameCollection || (() => {}),
      description: 'Rename collection',
      category: 'Collections',
      disabled: !onRenameCollection
    },
    {
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      action: onAddArticle || (() => {}),
      description: 'Add article to collection',
      category: 'Articles',
      disabled: !onAddArticle
    },
    {
      key: 'Delete',
      shiftKey: true,
      action: onRemoveArticle || (() => {}),
      description: 'Remove article from collection',
      category: 'Articles',
      disabled: !onRemoveArticle
    },
    {
      key: 'e',
      ctrlKey: true,
      action: onExportCollection || (() => {}),
      description: 'Export collection',
      category: 'Collections',
      disabled: !onExportCollection
    }
  ];

  return useKeyboardShortcuts(shortcuts);
}

// Global shortcuts that work across the entire app
export function useGlobalShortcuts(
  onOpenSearch?: () => void,
  onOpenHelp?: () => void,
  onToggleTheme?: () => void,
  onOpenSettings?: () => void
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      action: onOpenSearch || (() => {}),
      description: 'Open global search',
      category: 'Global',
      disabled: !onOpenSearch
    },
    {
      key: 'h',
      ctrlKey: true,
      shiftKey: true,
      action: onOpenHelp || (() => {}),
      description: 'Open help center',
      category: 'Global',
      disabled: !onOpenHelp
    },
    {
      key: 't',
      ctrlKey: true,
      shiftKey: true,
      action: onToggleTheme || (() => {}),
      description: 'Toggle dark/light theme',
      category: 'Global',
      disabled: !onToggleTheme
    },
    {
      key: ',',
      ctrlKey: true,
      action: onOpenSettings || (() => {}),
      description: 'Open settings',
      category: 'Global',
      disabled: !onOpenSettings
    }
  ];

  return useKeyboardShortcuts(shortcuts);
}
