/**
 * Research Topics and Categories for Onboarding
 */

export interface ResearchTopic {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  keywords: string[];
}

export const RESEARCH_TOPICS: ResearchTopic[] = [
  {
    id: 'machine_learning',
    name: 'Machine Learning',
    icon: '🤖',
    color: 'blue',
    description: 'AI, neural networks, deep learning',
    keywords: ['machine learning', 'deep learning', 'neural networks', 'artificial intelligence']
  },
  {
    id: 'biotechnology',
    name: 'Biotechnology',
    icon: '🧬',
    color: 'green',
    description: 'Genetic engineering, CRISPR, synthetic biology',
    keywords: ['biotechnology', 'genetic engineering', 'CRISPR', 'synthetic biology']
  },
  {
    id: 'drug_discovery',
    name: 'Drug Discovery',
    icon: '💊',
    color: 'purple',
    description: 'Pharmaceutical research, drug development',
    keywords: ['drug discovery', 'pharmaceutical', 'drug development', 'medicinal chemistry']
  },
  {
    id: 'clinical_research',
    name: 'Clinical Research',
    icon: '🏥',
    color: 'red',
    description: 'Clinical trials, patient studies, medical research',
    keywords: ['clinical trial', 'clinical research', 'patient study', 'medical research']
  },
  {
    id: 'neuroscience',
    name: 'Neuroscience',
    icon: '🧠',
    color: 'pink',
    description: 'Brain research, cognitive science, neuroimaging',
    keywords: ['neuroscience', 'brain', 'cognitive science', 'neuroimaging']
  },
  {
    id: 'materials_science',
    name: 'Materials Science',
    icon: '⚗️',
    color: 'orange',
    description: 'Nanomaterials, polymers, composites',
    keywords: ['materials science', 'nanomaterials', 'polymers', 'composites']
  },
  {
    id: 'physics',
    name: 'Physics',
    icon: '⚛️',
    color: 'indigo',
    description: 'Quantum physics, particle physics, astrophysics',
    keywords: ['physics', 'quantum', 'particle physics', 'astrophysics']
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: '🧪',
    color: 'yellow',
    description: 'Organic chemistry, biochemistry, analytical chemistry',
    keywords: ['chemistry', 'organic chemistry', 'biochemistry', 'analytical chemistry']
  },
  {
    id: 'environmental_science',
    name: 'Environmental Science',
    icon: '🌍',
    color: 'teal',
    description: 'Climate change, ecology, sustainability',
    keywords: ['environmental science', 'climate change', 'ecology', 'sustainability']
  },
  {
    id: 'immunology',
    name: 'Immunology',
    icon: '🛡️',
    color: 'cyan',
    description: 'Immune system, vaccines, immunotherapy',
    keywords: ['immunology', 'immune system', 'vaccine', 'immunotherapy']
  },
  {
    id: 'oncology',
    name: 'Oncology',
    icon: '🎗️',
    color: 'rose',
    description: 'Cancer research, tumor biology, oncotherapy',
    keywords: ['oncology', 'cancer', 'tumor', 'oncotherapy']
  },
  {
    id: 'other',
    name: 'Other',
    icon: '📚',
    color: 'gray',
    description: 'Other research areas',
    keywords: []
  }
];

export const CAREER_STAGES = [
  {
    value: 'early_career',
    label: 'Early Career',
    description: '0-5 years of research experience'
  },
  {
    value: 'mid_career',
    label: 'Mid Career',
    description: '5-15 years of research experience'
  },
  {
    value: 'senior',
    label: 'Senior Researcher',
    description: '15+ years of research experience'
  },
  {
    value: 'student',
    label: 'Student',
    description: 'Undergraduate or graduate student'
  }
];

/**
 * Get color classes for a topic
 */
export function getTopicColorClasses(color: string, selected: boolean = false) {
  const colorMap: Record<string, { bg: string; border: string; text: string; selectedBg: string; selectedBorder: string; selectedText: string }> = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      selectedBg: 'bg-blue-100',
      selectedBorder: 'border-blue-500',
      selectedText: 'text-blue-800'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      selectedBg: 'bg-green-100',
      selectedBorder: 'border-green-500',
      selectedText: 'text-green-800'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      selectedBg: 'bg-purple-100',
      selectedBorder: 'border-purple-500',
      selectedText: 'text-purple-800'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      selectedBg: 'bg-red-100',
      selectedBorder: 'border-red-500',
      selectedText: 'text-red-800'
    },
    pink: {
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-700',
      selectedBg: 'bg-pink-100',
      selectedBorder: 'border-pink-500',
      selectedText: 'text-pink-800'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      selectedBg: 'bg-orange-100',
      selectedBorder: 'border-orange-500',
      selectedText: 'text-orange-800'
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-700',
      selectedBg: 'bg-indigo-100',
      selectedBorder: 'border-indigo-500',
      selectedText: 'text-indigo-800'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      selectedBg: 'bg-yellow-100',
      selectedBorder: 'border-yellow-500',
      selectedText: 'text-yellow-800'
    },
    teal: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-700',
      selectedBg: 'bg-teal-100',
      selectedBorder: 'border-teal-500',
      selectedText: 'text-teal-800'
    },
    cyan: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      text: 'text-cyan-700',
      selectedBg: 'bg-cyan-100',
      selectedBorder: 'border-cyan-500',
      selectedText: 'text-cyan-800'
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      selectedBg: 'bg-rose-100',
      selectedBorder: 'border-rose-500',
      selectedText: 'text-rose-800'
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      selectedBg: 'bg-gray-100',
      selectedBorder: 'border-gray-500',
      selectedText: 'text-gray-800'
    }
  };

  const colors = colorMap[color] || colorMap.gray;
  
  if (selected) {
    return {
      bg: colors.selectedBg,
      border: colors.selectedBorder,
      text: colors.selectedText
    };
  }
  
  return {
    bg: colors.bg,
    border: colors.border,
    text: colors.text
  };
}

