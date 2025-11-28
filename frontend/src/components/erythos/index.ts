/**
 * Erythos Design System Components
 * 
 * A unified component library for the Erythos restructuring project.
 * All components follow the Erythos design language:
 * - Dark theme with red/purple/orange accents
 * - Gradient backgrounds
 * - Smooth transitions
 * - Consistent spacing and typography
 * 
 * Usage:
 * import { ErythosCard, ErythosButton, ErythosTabs } from '@/components/erythos';
 */

// Cards
export {
  ErythosCard,
  ErythosWorkflowCard,
  ErythosStatsCard,
  type CardVariant,
} from './ErythosCard';

// Buttons
export {
  ErythosButton,
  ErythosIconButton,
  type ButtonVariant,
  type ButtonSize,
} from './ErythosButton';

// Tabs
export {
  ErythosTabs,
  ErythosTabContent,
  ErythosVerticalTabs,
} from './ErythosTabs';

// Header
export { ErythosHeader } from './ErythosHeader';

// Search
export { ErythosSearchBar } from './ErythosSearchBar';

// Progress
export {
  ErythosProgressBar,
  ErythosCircularProgress,
} from './ErythosProgressBar';

// Status Indicators
export {
  ErythosStatusIndicator,
  ErythosStatusBadge,
  ErythosCountBadge,
} from './ErythosStatusIndicator';

// Collection Card
export { ErythosCollectionCard } from './ErythosCollectionCard';

// Pages
export { ErythosHomePage } from './ErythosHomePage';
export { ErythosCollectionsPage } from './ErythosCollectionsPage';
export { ErythosDiscoverPage } from './ErythosDiscoverPage';

// Discover Tab Components
export {
  ErythosTriageStats,
  ErythosKeyboardShortcuts,
  ErythosTriagedPaperCard,
  ErythosSmartInboxTab,
  ErythosExploreTab,
  ErythosAllPapersTab,
} from './discover';

// Project Workspace
export { ErythosProjectWorkspace } from './ErythosProjectWorkspace';
export {
  ErythosProjectHeader,
  ErythosOverviewTab,
  ErythosQuestionsTab,
  ErythosProjectCollectionsTab,
  ErythosLabProgressTab,
  ErythosDecisionsTab,
  ErythosTeamTab,
  ErythosReportsTab,
} from './project';

// Lab Page
export { ErythosLabPage } from './ErythosLabPage';
export {
  ErythosProtocolsTab,
  ErythosExperimentsTab,
  ErythosDataManagementTab,
} from './lab';

// Write Page
export {
  ErythosWritePage,
  WriteCollectionSelector,
  WriteSourcesPanel,
  WriteEditor,
  WriteAIAssistant,
  WriteStatsBar,
} from './write';

// Project Selector
export {
  ProjectSelector,
  ProjectSelectorCompact,
} from './ProjectSelector';
