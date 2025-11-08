/**
 * Infer research interests from user's subject area and role
 * Used when user skips the Research Interests step during onboarding
 */

export interface InferredInterests {
  topics: string[];
  keywords: string[];
  careerStage: string;
}

// Mapping from subject areas to research topics (matches research-topics.ts)
const SUBJECT_TO_TOPICS: Record<string, string[]> = {
  // Computer Science & AI
  'Machine Learning': ['ai_ml', 'data_science', 'computer_science'],
  'Artificial Intelligence': ['ai_ml', 'computer_science', 'robotics'],
  'Data Science': ['data_science', 'ai_ml', 'statistics'],
  'Computer Science': ['computer_science', 'ai_ml', 'software_engineering'],
  'Software Engineering': ['computer_science', 'software_engineering', 'ai_ml'],
  
  // Life Sciences
  'Biochemistry': ['biochemistry', 'molecular_biology', 'chemistry'],
  'Molecular Biology': ['molecular_biology', 'biochemistry', 'genetics'],
  'Biology': ['biology', 'molecular_biology', 'ecology'],
  'Genetics': ['genetics', 'molecular_biology', 'biochemistry'],
  'Immunology': ['immunology', 'medicine', 'molecular_biology'],
  'Microbiology': ['microbiology', 'molecular_biology', 'medicine'],
  
  // Medicine & Health
  'Clinical Research': ['clinical_trials', 'medicine', 'healthcare'],
  'Medicine': ['medicine', 'clinical_trials', 'healthcare'],
  'Public Health': ['public_health', 'medicine', 'epidemiology'],
  'Epidemiology': ['epidemiology', 'public_health', 'statistics'],
  'Pharmacology': ['pharmacology', 'medicine', 'chemistry'],
  'Nursing': ['medicine', 'healthcare', 'clinical_trials'],
  
  // Neuroscience & Psychology
  'Neuroscience': ['neuroscience', 'psychology', 'medicine'],
  'Psychology': ['psychology', 'neuroscience', 'behavioral_science'],
  'Cognitive Science': ['psychology', 'neuroscience', 'ai_ml'],
  
  // Physical Sciences
  'Physics': ['physics', 'engineering', 'mathematics'],
  'Chemistry': ['chemistry', 'biochemistry', 'materials_science'],
  'Materials Science': ['materials_science', 'chemistry', 'physics'],
  
  // Environmental & Earth Sciences
  'Environmental Science': ['environmental_science', 'ecology', 'climate_science'],
  'Ecology': ['ecology', 'environmental_science', 'biology'],
  'Climate Science': ['climate_science', 'environmental_science', 'earth_science'],
  
  // Engineering
  'Engineering': ['engineering', 'computer_science', 'physics'],
  'Biomedical Engineering': ['engineering', 'medicine', 'biotechnology'],
  'Electrical Engineering': ['engineering', 'physics', 'computer_science'],
  
  // Mathematics & Statistics
  'Mathematics': ['mathematics', 'statistics', 'computer_science'],
  'Statistics': ['statistics', 'data_science', 'mathematics'],
  
  // Social Sciences
  'Economics': ['economics', 'social_sciences', 'finance'],
  'Social Sciences': ['social_sciences', 'psychology', 'sociology'],
  'Sociology': ['sociology', 'social_sciences', 'psychology'],
  'Political Science': ['social_sciences', 'political_science', 'economics'],
  
  // Other
  'Education': ['education', 'psychology', 'social_sciences'],
  'Business': ['business', 'economics', 'management'],
  'Law': ['law', 'social_sciences', 'political_science'],
};

// Mapping from subject areas to keywords
const SUBJECT_TO_KEYWORDS: Record<string, string[]> = {
  'Machine Learning': ['deep learning', 'neural networks', 'supervised learning', 'unsupervised learning'],
  'Artificial Intelligence': ['AI', 'machine learning', 'natural language processing', 'computer vision'],
  'Data Science': ['data analysis', 'big data', 'predictive modeling', 'data visualization'],
  'Biochemistry': ['protein structure', 'enzymes', 'metabolism', 'molecular interactions'],
  'Molecular Biology': ['gene expression', 'DNA', 'RNA', 'protein synthesis'],
  'Clinical Research': ['clinical trials', 'patient outcomes', 'treatment efficacy', 'randomized controlled trials'],
  'Medicine': ['diagnosis', 'treatment', 'patient care', 'medical imaging'],
  'Neuroscience': ['brain imaging', 'neural circuits', 'synaptic plasticity', 'cognitive function'],
  'Psychology': ['behavior', 'cognition', 'mental health', 'psychological assessment'],
  'Physics': ['quantum mechanics', 'thermodynamics', 'particle physics', 'condensed matter'],
  'Chemistry': ['organic chemistry', 'inorganic chemistry', 'chemical reactions', 'spectroscopy'],
  'Environmental Science': ['climate change', 'sustainability', 'ecosystem dynamics', 'pollution'],
  'Computer Science': ['algorithms', 'data structures', 'software engineering', 'distributed systems'],
  'Public Health': ['disease prevention', 'health policy', 'epidemiology', 'health disparities'],
  'Engineering': ['design', 'optimization', 'systems engineering', 'innovation'],
  'Mathematics': ['algebra', 'calculus', 'topology', 'number theory'],
  'Statistics': ['statistical inference', 'hypothesis testing', 'regression analysis', 'probability'],
  'Economics': ['microeconomics', 'macroeconomics', 'econometrics', 'market analysis'],
  'Social Sciences': ['social behavior', 'cultural studies', 'research methods', 'social theory'],
  'Genetics': ['genomics', 'genetic variation', 'inheritance', 'gene editing'],
  'Immunology': ['immune response', 'antibodies', 'vaccines', 'autoimmunity'],
  'Pharmacology': ['drug development', 'pharmacokinetics', 'drug interactions', 'toxicology'],
  'Epidemiology': ['disease surveillance', 'outbreak investigation', 'risk factors', 'public health'],
};

// Mapping from roles to career stages
const ROLE_TO_CAREER_STAGE: Record<string, string> = {
  // Early Career
  'Undergraduate Student': 'early_career',
  'Graduate Student': 'early_career',
  'PhD Student': 'early_career',
  'Research Assistant': 'early_career',
  'Junior Researcher': 'early_career',
  'Intern': 'early_career',
  
  // Mid Career
  'Postdoctoral Researcher': 'mid_career',
  'Research Associate': 'mid_career',
  'Assistant Professor': 'mid_career',
  'Research Scientist': 'mid_career',
  'Lab Manager': 'mid_career',
  'Industry Researcher': 'mid_career',
  'Data Scientist': 'mid_career',
  'Engineer': 'mid_career',
  
  // Senior Career
  'Associate Professor': 'senior',
  'Professor': 'senior',
  'Principal Investigator': 'senior',
  'Senior Research Scientist': 'senior',
  'Department Head': 'senior',
  'Director': 'senior',
  'Consultant': 'senior',
  'Chief Scientist': 'senior',
  
  // Other
  'Independent Researcher': 'mid_career',
  'Clinician': 'mid_career',
  'Educator': 'mid_career',
  'Other': 'mid_career',
};

/**
 * Infer research interests from user profile data
 * @param subjectArea - User's subject area from Step 1
 * @param role - User's role from Step 1
 * @returns Inferred interests with topics, keywords, and career stage
 */
export function inferInterestsFromProfile(
  subjectArea: string,
  role: string
): InferredInterests {
  // Infer topics from subject area
  const topics = SUBJECT_TO_TOPICS[subjectArea] || ['general_research'];
  
  // Infer keywords from subject area
  const keywords = SUBJECT_TO_KEYWORDS[subjectArea] || [];
  
  // Infer career stage from role
  const careerStage = ROLE_TO_CAREER_STAGE[role] || 'mid_career';
  
  console.log('🧠 Interest Inference:', {
    subjectArea,
    role,
    inferredTopics: topics,
    inferredKeywords: keywords,
    inferredCareerStage: careerStage
  });
  
  return {
    topics,
    keywords,
    careerStage
  };
}

/**
 * Check if interests are empty (not filled by user)
 * @param interests - Research interests object
 * @returns True if interests are empty
 */
export function hasEmptyInterests(interests: InferredInterests): boolean {
  return interests.topics.length === 0 && 
         interests.keywords.length === 0 && 
         !interests.careerStage;
}

/**
 * Check if interests are minimal (likely inferred, not user-selected)
 * @param interests - Research interests object
 * @returns True if interests are minimal
 */
export function hasMinimalInterests(interests: InferredInterests): boolean {
  return interests.topics.length <= 2 && 
         interests.keywords.length === 0;
}

