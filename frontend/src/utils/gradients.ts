/**
 * Erythos Gradient System
 * 
 * Centralized gradient definitions for consistent styling across the app.
 * Each workflow has its own gradient color scheme.
 */

// Workflow gradients (for main workflow cards)
export const workflowGradients = {
  discover: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
  organize: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)',
  lab: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
  write: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
} as const;

// Card background gradients (subtle, for card backgrounds)
export const cardGradients = {
  red: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(153, 27, 27, 0.05) 100%)',
  purple: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(109, 40, 217, 0.05) 100%)',
  orange: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)',
  yellow: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
  blue: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.05) 100%)',
  green: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
} as const;

// Collection card gradients (more vibrant)
export const collectionGradients = {
  orange: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)',
  blue: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
  green: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  purple: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
  red: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
  yellow: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
  pink: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
  teal: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
} as const;

// Erythos color palette
export const erythosColors = {
  // Primary (Red)
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  // Purple (Lab)
  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7C3AED',
    800: '#6D28D9',
    900: '#4C1D95',
  },
  // Orange (Organize)
  orange: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  // Yellow (Write)
  yellow: {
    50: '#FEFCE8',
    100: '#FEF9C3',
    200: '#FEF08A',
    300: '#FDE047',
    400: '#FACC15',
    500: '#EAB308',
    600: '#CA8A04',
    700: '#A16207',
    800: '#854D0E',
    900: '#713F12',
  },
  // Background
  bg: {
    black: '#000000',
    dark: '#1C1C1E',
    medium: '#2C2C2E',
    light: '#3C3C3E',
  },
  // Text
  text: {
    white: '#FFFFFF',
    gray: '#8E8E93',
    light: '#AEAEB2',
    muted: '#636366',
  },
  // Border
  border: {
    dark: '#38383A',
    light: '#48484A',
  },
} as const;

// Workflow metadata (for cards)
export const workflowMeta = {
  discover: {
    icon: '🔍',
    title: 'Discover',
    description: 'Find papers, protocols, and context',
    gradient: workflowGradients.discover,
    color: erythosColors.red[600],
    route: '/discover',
  },
  organize: {
    icon: '📁',
    title: 'Organize',
    description: 'Save and manage collections',
    gradient: workflowGradients.organize,
    color: erythosColors.orange[500],
    route: '/collections',
  },
  lab: {
    icon: '🧪',
    title: 'Lab',
    description: 'Execute protocols and track experiments',
    gradient: workflowGradients.lab,
    color: erythosColors.purple[500],
    route: '/lab',
  },
  write: {
    icon: '✍️',
    title: 'Write',
    description: 'Generate reports and citations',
    gradient: workflowGradients.write,
    color: erythosColors.yellow[500],
    route: '/write',
  },
} as const;

// Type exports
export type WorkflowType = keyof typeof workflowGradients;
export type CardGradientType = keyof typeof cardGradients;
export type CollectionGradientType = keyof typeof collectionGradients;

