/**
 * PhD Enhancement UI Design System
 * Consistent styling and patterns for PhD-specific components
 */

// Color Palette for PhD Features
export const phdColors = {
  // Primary PhD gradient (matches existing dashboard)
  gradient: 'bg-gradient-to-r from-purple-500 to-blue-500',
  gradientHover: 'bg-gradient-to-r from-purple-600 to-blue-600',
  
  // Card backgrounds
  cardBg: 'bg-white',
  cardShadow: 'shadow-lg',
  cardBorder: 'border border-gray-200',
  
  // PhD-specific accent colors
  thesis: {
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    accent: 'text-purple-600',
    border: 'border-purple-200'
  },
  
  gap: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    accent: 'text-amber-600',
    border: 'border-amber-200'
  },
  
  methodology: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    accent: 'text-emerald-600',
    border: 'border-emerald-200'
  },
  
  citation: {
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    accent: 'text-blue-600',
    border: 'border-blue-200'
  }
};

// Typography Scale
export const phdTypography = {
  title: 'text-2xl font-bold text-gray-900',
  subtitle: 'text-lg font-semibold text-gray-800',
  sectionHeader: 'text-base font-semibold text-gray-900',
  body: 'text-sm text-gray-700',
  caption: 'text-xs text-gray-600',
  badge: 'text-xs font-medium px-2 py-1 rounded-full'
};

// Spacing System
export const phdSpacing = {
  cardPadding: 'p-6',
  sectionSpacing: 'space-y-6',
  itemSpacing: 'space-y-4',
  gridGap: 'gap-4',
  marginBottom: 'mb-8'
};

// Animation Classes
export const phdAnimations = {
  fadeIn: 'animate-in fade-in duration-300',
  slideIn: 'animate-in slide-in-from-top-2 duration-200',
  progressBar: 'transition-all duration-500 ease-out',
  hover: 'transition-colors duration-200'
};

// Component Base Classes
export const phdComponents = {
  card: `${phdColors.cardBg} rounded-lg ${phdColors.cardShadow} ${phdColors.cardBorder} ${phdSpacing.cardPadding}`,
  
  metricCard: `${phdColors.cardBg} rounded-lg p-4 ${phdColors.cardBorder}`,
  
  progressBar: {
    container: 'bg-gray-200 rounded-full h-3',
    fill: 'bg-gradient-to-r from-purple-500 to-blue-500 rounded-full h-3 transition-all duration-500 ease-out'
  },
  
  badge: {
    phd: `${phdColors.thesis.bg} ${phdColors.thesis.text} ${phdTypography.badge}`,
    new: `bg-green-100 text-green-800 ${phdTypography.badge}`,
    updated: `bg-blue-100 text-blue-800 ${phdTypography.badge}`
  },
  
  button: {
    primary: `${phdColors.gradient} hover:${phdColors.gradientHover} text-white px-4 py-2 rounded-lg font-medium ${phdAnimations.hover}`,
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1 rounded transition-colors'
  }
};

// Icon Mapping for PhD Features
export const phdIcons = {
  thesis: 'BookOpenIcon',
  gap: 'MagnifyingGlassIcon',
  methodology: 'BeakerIcon',
  citation: 'ShareIcon',
  progress: 'ChartBarIcon',
  chapter: 'DocumentTextIcon',
  insight: 'LightBulbIcon',
  timeline: 'ClockIcon'
};

// Layout Patterns
export const phdLayouts = {
  twoColumn: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
  threeColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  fourColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
  
  section: `${phdSpacing.marginBottom}`,
  subsection: `${phdSpacing.sectionSpacing}`,
  
  expandable: {
    header: 'flex items-center justify-between cursor-pointer p-4 hover:bg-gray-50 rounded-lg transition-colors',
    content: 'px-4 pb-4 space-y-3'
  }
};

// Data Visualization Patterns
export const phdDataViz = {
  progressRing: {
    size: 'w-16 h-16',
    stroke: 'stroke-2',
    colors: {
      background: 'text-gray-200',
      progress: 'text-purple-500'
    }
  },
  
  timeline: {
    line: 'border-l-2 border-gray-200',
    dot: 'w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow',
    content: 'ml-6 pb-6'
  },
  
  network: {
    node: 'w-8 h-8 rounded-full border-2 border-white shadow-md',
    edge: 'stroke-gray-300 stroke-1'
  }
};

// Responsive Breakpoints (matching existing system)
export const phdBreakpoints = {
  mobile: 'sm:',
  tablet: 'md:',
  desktop: 'lg:',
  wide: 'xl:'
};

// State Indicators
export const phdStates = {
  loading: {
    skeleton: 'animate-pulse bg-gray-200 rounded',
    spinner: 'animate-spin h-5 w-5 text-purple-500'
  },
  
  empty: {
    container: 'text-center py-8',
    icon: 'h-12 w-12 text-gray-400 mx-auto mb-4',
    text: 'text-gray-600'
  },
  
  error: {
    container: 'bg-red-50 border border-red-200 rounded-lg p-4',
    text: 'text-red-800 text-sm'
  },
  
  success: {
    container: 'bg-green-50 border border-green-200 rounded-lg p-4',
    text: 'text-green-800 text-sm'
  }
};

// Export utility function for combining classes
export const combineClasses = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
