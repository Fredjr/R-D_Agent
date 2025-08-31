'use client';

import React, { useState, FormEvent } from 'react';

type Props = {
  onGenerate?: (args: { molecule: string; objective: string; projectId?: string | null; clinicalMode?: boolean; preference?: 'precision' | 'recall'; dagMode?: boolean; fullTextOnly?: boolean }) => void;
  defaultProjectId?: string | null;
  isLoading?: boolean;
};

export default function InputForm({ onGenerate, defaultProjectId, isLoading = false }: Props) {
  const [molecule, setMolecule] = useState('');
  const [objective, setObjective] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [clinicalMode, setClinicalMode] = useState(false);
  const [preference, setPreference] = useState<'precision' | 'recall'>('precision');
  const [dagMode, setDagMode] = useState(false);
  const [fullTextOnly, setFullTextOnly] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onGenerate?.({ molecule, objective, projectId, clinicalMode, preference, dagMode, fullTextOnly });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-md space-y-4 sm:space-y-6"
    >
      <div>
        <label htmlFor="molecule" className="block text-base sm:text-lg font-semibold mb-2 text-gray-800">
          Molecule
        </label>
        <input
          id="molecule"
          type="text"
          value={molecule}
          onChange={(e) => setMolecule(e.target.value)}
          className="w-full p-3 sm:p-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
          placeholder="e.g., Aspirin"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm font-medium text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={clinicalMode} 
              onChange={(e) => setClinicalMode(e.target.checked)}
              className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="leading-tight">Clinical mode (bias humans[mesh], exclude plants/fungi)</span>
          </label>
          
          <label className="flex items-start gap-3 text-sm font-medium text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={dagMode} 
              onChange={(e) => setDagMode(e.target.checked)}
              className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="leading-tight">Experimental DAG mode</span>
          </label>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Preference</label>
            <select 
              value={preference} 
              onChange={(e) => setPreference(e.target.value as any)} 
              className="w-full p-3 rounded-md border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="precision">Prefer precision</option>
              <option value="recall">Prefer recall</option>
            </select>
          </div>
          
          <label className="flex items-start gap-3 text-sm font-medium text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={fullTextOnly} 
              onChange={(e) => setFullTextOnly(e.target.checked)}
              className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="leading-tight">Only include full-text/OA articles (ensures Deep Dive fully populated)</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="objective" className="block text-base sm:text-lg font-semibold mb-2 text-gray-800">
          Objective <span className="text-red-600">*</span>
        </label>
        <textarea
          id="objective"
          rows={4}
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="w-full p-3 sm:p-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 resize-none"
          placeholder="Be specific. Example: Summarize the anti-inflammatory mechanisms of aspirin in cardiovascular disease."
          required
        />
      </div>

      <div>
        <label htmlFor="projectId" className="block text-base sm:text-lg font-semibold mb-2 text-gray-800">
          Project ID (Optional)
        </label>
        <input
          id="projectId"
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full p-3 sm:p-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
          placeholder="e.g., project-abc"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading || !objective.trim()}
          className="w-full sm:w-auto bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Generating...' : 'Generate Review'}
        </button>
        {projectId && (
          <span className="text-sm text-gray-600 self-center">
            Will save to project: {projectId}
          </span>
        )}
      </div>
    </form>
  );
}
