/**
 * Standardized Validation System
 * Ensures consistency between frontend and backend validation rules
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

/**
 * Create a validation error
 */
export function createValidationError(
  field: string,
  message: string,
  code: string = 'VALIDATION_ERROR'
): ValidationError {
  return { field, message, code };
}

/**
 * Validate a single field against rules
 */
export function validateField(value: any, rules: ValidationRule[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const rule of rules) {
    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors.push(createValidationError(rule.field, `${rule.field} is required`, 'REQUIRED'));
      continue; // Skip other validations if required field is empty
    }
    
    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) {
      continue;
    }
    
    const stringValue = String(value).trim();
    
    // Min length validation
    if (rule.minLength && stringValue.length < rule.minLength) {
      errors.push(createValidationError(
        rule.field,
        `${rule.field} must be at least ${rule.minLength} characters`,
        'MIN_LENGTH'
      ));
    }
    
    // Max length validation
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      errors.push(createValidationError(
        rule.field,
        `${rule.field} must be no more than ${rule.maxLength} characters`,
        'MAX_LENGTH'
      ));
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      errors.push(createValidationError(
        rule.field,
        `${rule.field} format is invalid`,
        'PATTERN'
      ));
    }
    
    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors.push(createValidationError(rule.field, customError, 'CUSTOM'));
      }
    }
  }
  
  return errors;
}

/**
 * Validate an object against a set of rules
 */
export function validateObject(data: Record<string, any>, rules: ValidationRule[]): ValidationResult {
  const allErrors: ValidationError[] = [];
  
  // Group rules by field
  const rulesByField: Record<string, ValidationRule[]> = {};
  for (const rule of rules) {
    if (!rulesByField[rule.field]) {
      rulesByField[rule.field] = [];
    }
    rulesByField[rule.field].push(rule);
  }
  
  // Validate each field
  for (const [field, fieldRules] of Object.entries(rulesByField)) {
    const value = data[field];
    const fieldErrors = validateField(value, fieldRules);
    allErrors.push(...fieldErrors);
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

// =============================================================================
// PREDEFINED VALIDATION RULES (matching backend models)
// =============================================================================

/**
 * Email validation
 */
export const emailRules: ValidationRule[] = [
  {
    field: 'email',
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255
  }
];

/**
 * Password validation
 */
export const passwordRules: ValidationRule[] = [
  {
    field: 'password',
    required: true,
    minLength: 8,
    maxLength: 128,
    custom: (value: string) => {
      if (!value) return null;
      
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        return 'Password must contain uppercase, lowercase, and numbers';
      }
      
      return null;
    }
  }
];

/**
 * User profile validation (matching CompleteRegistrationRequest)
 */
export const userProfileRules: ValidationRule[] = [
  { field: 'first_name', required: true, minLength: 1, maxLength: 100 },
  { field: 'last_name', required: true, minLength: 1, maxLength: 100 },
  { 
    field: 'category', 
    required: true,
    custom: (value: string) => {
      const validCategories = ['Student', 'Academic', 'Industry'];
      return validCategories.includes(value) ? null : 'Invalid category';
    }
  },
  { field: 'role', required: true, minLength: 1, maxLength: 100 },
  { field: 'institution', required: true, minLength: 1, maxLength: 255 },
  { field: 'subject_area', required: true, minLength: 1, maxLength: 255 },
  { field: 'how_heard_about_us', required: true, minLength: 1, maxLength: 255 }
];

/**
 * Project creation validation (matching ProjectCreate)
 */
export const projectCreateRules: ValidationRule[] = [
  { field: 'project_name', required: true, minLength: 1, maxLength: 255 },
  { field: 'description', required: false, maxLength: 1000 }
];

/**
 * Annotation creation validation (matching AnnotationCreate)
 */
export const annotationCreateRules: ValidationRule[] = [
  { field: 'content', required: true, minLength: 1, maxLength: 2000 }
];

/**
 * Report creation validation (matching ReportCreate)
 */
export const reportCreateRules: ValidationRule[] = [
  { field: 'title', required: true, minLength: 1, maxLength: 200 },
  { field: 'objective', required: true, minLength: 1, maxLength: 1000 },
  { field: 'molecule', required: false, maxLength: 255 },
  {
    field: 'preference',
    required: false,
    custom: (value: string) => {
      if (!value) return null;
      const validPreferences = ['precision', 'recall'];
      return validPreferences.includes(value) ? null : 'Invalid preference';
    }
  }
];

/**
 * Deep dive analysis validation (matching DeepDiveAnalysisCreate)
 * At least one of article_title, article_pmid, or article_url must be provided
 */
export const deepDiveAnalysisRules: ValidationRule[] = [
  { field: 'article_title', required: false, minLength: 1, maxLength: 500 },
  { field: 'objective', required: true, minLength: 1, maxLength: 1000 },
  { field: 'article_pmid', required: false, maxLength: 50 },
  {
    field: 'article_url',
    required: false,
    pattern: /^https?:\/\/.+/,
    maxLength: 2000
  }
];

/**
 * Custom validation for deep dive analysis - at least one identifier required
 */
export const validateDeepDiveAnalysis = (data: any): string | null => {
  if (!data.article_title?.trim() && !data.article_pmid?.trim() && !data.article_url?.trim()) {
    return 'Please provide at least one of: Article Title, PMID, or Article URL';
  }
  return null;
};

/**
 * Collaborator invite validation (matching CollaboratorInvite)
 */
export const collaboratorInviteRules: ValidationRule[] = [
  ...emailRules,
  {
    field: 'role',
    required: true,
    custom: (value: string) => {
      const validRoles = ['owner', 'editor', 'viewer'];
      return validRoles.includes(value) ? null : 'Invalid role';
    }
  }
];

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const result = validateField(email, emailRules);
  return result.length === 0;
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  const result = validateField(password, passwordRules);
  return result.length === 0;
}

/**
 * Get password strength score (0-100)
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  
  let score = 0;
  
  // Length bonus
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 10;
  
  // Character variety bonus
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
  
  return Math.min(score, 100);
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;
  
  return errors.map(error => `• ${error.message}`).join('\n');
}

/**
 * Get first validation error message
 */
export function getFirstValidationError(errors: ValidationError[]): string {
  return errors.length > 0 ? errors[0].message : '';
}
