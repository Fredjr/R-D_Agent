/**
 * UI INTEGRATION FIXES v1.0
 * 
 * Comprehensive fixes for data flow and UI integration issues
 * Addresses the 0% data flow success rate from verification
 */

import React, { useState, useEffect } from 'react';

// Data Display Components for API Results
export const APIResultDisplay = ({ data, endpointName, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="api-result-loading" data-testid="result-loading">
        <div className="animate-pulse bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
        <div className="animate-pulse bg-gray-200 rounded h-4 w-1/2"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="api-result-empty" data-testid="result-empty">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="api-result-container" data-testid="result-container">
      <div className="result-header">
        <h3 className="text-lg font-semibold">{endpointName} Results</h3>
        {data.quality_score && (
          <div className="quality-score" data-testid="quality-score">
            Quality: {data.quality_score}/10
          </div>
        )}
      </div>
      
      <div className="result-content" data-testid="result-content">
        {/* Summary Content */}
        {data.summary_content && (
          <div className="summary-section" data-testid="summary-section">
            <h4>Summary</h4>
            <p>{data.summary_content}</p>
          </div>
        )}
        
        {/* Chapters */}
        {data.chapters && (
          <div className="chapters-section" data-testid="chapters-section">
            <h4>Chapters ({data.chapters.length})</h4>
            <ul>
              {data.chapters.map((chapter, index) => (
                <li key={index}>{chapter.title || `Chapter ${index + 1}`}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Research Gaps */}
        {data.identified_gaps && (
          <div className="gaps-section" data-testid="gaps-section">
            <h4>Research Gaps ({data.identified_gaps.length})</h4>
            <ul>
              {data.identified_gaps.map((gap, index) => (
                <li key={index}>{gap.description || gap}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Methodologies */}
        {data.identified_methodologies && (
          <div className="methodologies-section" data-testid="methodologies-section">
            <h4>Methodologies ({data.identified_methodologies.length})</h4>
            <ul>
              {data.identified_methodologies.map((method, index) => (
                <li key={index}>{method.name || method}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Processing Time */}
        {data.processing_time && (
          <div className="processing-time" data-testid="processing-time">
            <small>Processing Time: {data.processing_time}</small>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Form Components
export const EnhancedAnalysisForm = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    objective: '',
    analysisType: 'comprehensive',
    academicLevel: 'phd'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="analysis-form" data-testid="analysis-form">
      <div className="form-group">
        <label htmlFor="objective">Research Objective</label>
        <textarea
          id="objective"
          value={formData.objective}
          onChange={(e) => setFormData({...formData, objective: e.target.value})}
          placeholder="Enter your research objective..."
          className="form-control"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="analysisType">Analysis Type</label>
        <select
          id="analysisType"
          value={formData.analysisType}
          onChange={(e) => setFormData({...formData, analysisType: e.target.value})}
          className="form-control"
        >
          <option value="comprehensive">Comprehensive</option>
          <option value="focused">Focused</option>
          <option value="exploratory">Exploratory</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="academicLevel">Academic Level</label>
        <select
          id="academicLevel"
          value={formData.academicLevel}
          onChange={(e) => setFormData({...formData, academicLevel: e.target.value})}
          className="form-control"
        >
          <option value="phd">PhD</option>
          <option value="masters">Masters</option>
          <option value="undergraduate">Undergraduate</option>
        </select>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary"
        data-testid="submit-button"
      >
        {isLoading ? 'Processing...' : 'Start Analysis'}
      </button>
    </form>
  );
};

// Error Display Component
export const ErrorDisplay = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <div className="error-display" role="alert" data-testid="error-display">
      <div className="error-header">
        <h4>Analysis Error</h4>
      </div>
      <div className="error-content">
        <p>{error.message || error}</p>
        {error.status && (
          <p><small>Status: {error.status}</small></p>
        )}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary">
          Retry Analysis
        </button>
      )}
    </div>
  );
};

// Loading States Component
export const LoadingStates = ({ type = 'default' }) => {
  const loadingTypes = {
    default: (
      <div className="loading-spinner" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span>Loading...</span>
      </div>
    ),
    analysis: (
      <div className="loading-analysis" data-testid="loading-analysis">
        <div className="loading-steps">
          <div className="step active">Analyzing articles...</div>
          <div className="step">Generating insights...</div>
          <div className="step">Preparing results...</div>
        </div>
      </div>
    ),
    skeleton: (
      <div className="loading-skeleton" data-testid="loading-skeleton">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  };

  return loadingTypes[type] || loadingTypes.default;
};

// Responsive Container
export const ResponsiveContainer = ({ children, className = '' }) => {
  return (
    <div className={`responsive-container ${className}`} data-testid="responsive-container">
      <div className="container-mobile md:container-tablet lg:container-desktop">
        {children}
      </div>
    </div>
  );
};

// Interactive Dropdown Component
export const InteractiveDropdown = ({ options, value, onChange, placeholder = "Select option..." }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="interactive-dropdown" data-testid="interactive-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="dropdown-toggle"
        aria-expanded={isOpen}
      >
        {value || placeholder}
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="dropdown-item"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Data Flow Test Component
export const DataFlowTest = ({ projectId }) => {
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const testEndpoint = async (name, endpoint, payload) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': 'fredericle77@gmail.com'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [name]: {
          success: response.ok,
          data: response.ok ? data : null,
          error: response.ok ? null : data
        }
      }));
      
      return response.ok;
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [name]: {
          success: false,
          data: null,
          error: error.message
        }
      }));
      return false;
    }
  };

  const runDataFlowTest = async () => {
    setIsRunning(true);
    setTestResults({});
    
    const tests = [
      {
        name: 'Thesis Chapter Generator',
        endpoint: '/api/proxy/thesis-chapter-generator',
        payload: {
          project_id: projectId,
          objective: 'Test data flow',
          academic_level: 'phd'
        }
      },
      {
        name: 'Literature Gap Analysis',
        endpoint: '/api/proxy/literature-gap-analysis',
        payload: {
          project_id: projectId,
          objective: 'Test data flow',
          gap_types: ['theoretical'],
          academic_level: 'phd'
        }
      },
      {
        name: 'Methodology Synthesis',
        endpoint: '/api/proxy/methodology-synthesis',
        payload: {
          project_id: projectId,
          objective: 'Test data flow',
          methodology_types: ['experimental'],
          academic_level: 'phd'
        }
      }
    ];
    
    for (const test of tests) {
      await testEndpoint(test.name, test.endpoint, test.payload);
    }
    
    setIsRunning(false);
  };

  return (
    <div className="data-flow-test" data-testid="data-flow-test">
      <div className="test-header">
        <h3>Data Flow Test</h3>
        <button
          onClick={runDataFlowTest}
          disabled={isRunning}
          className="btn btn-primary"
        >
          {isRunning ? 'Testing...' : 'Run Test'}
        </button>
      </div>
      
      <div className="test-results">
        {Object.entries(testResults).map(([name, result]) => (
          <div key={name} className="test-result" data-testid={`test-result-${name}`}>
            <div className="result-header">
              <span className={`status ${result.success ? 'success' : 'error'}`}>
                {result.success ? '✅' : '❌'}
              </span>
              <span className="name">{name}</span>
            </div>
            
            {result.success && result.data && (
              <APIResultDisplay data={result.data} endpointName={name} />
            )}
            
            {!result.success && result.error && (
              <ErrorDisplay error={result.error} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Export all components
export default {
  APIResultDisplay,
  EnhancedAnalysisForm,
  ErrorDisplay,
  LoadingStates,
  ResponsiveContainer,
  InteractiveDropdown,
  DataFlowTest
};
