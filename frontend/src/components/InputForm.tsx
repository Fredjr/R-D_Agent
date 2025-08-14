'use client';

import React, { useState, FormEvent } from 'react';

type Props = {
  onGenerate?: (args: { molecule: string; objective: string; projectId?: string | null; clinicalMode?: boolean; preference?: 'precision' | 'recall'; dagMode?: boolean }) => void;
};

export default function InputForm({ onGenerate }: Props) {
  const [molecule, setMolecule] = useState('');
  const [objective, setObjective] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clinicalMode, setClinicalMode] = useState(false);
  const [preference, setPreference] = useState<'precision' | 'recall'>('precision');
  const [dagMode, setDagMode] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onGenerate?.({ molecule, objective, projectId, clinicalMode, preference, dagMode });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto bg-slate-100 p-8 rounded-lg shadow-md space-y-6"
    >
      <div>
        <label htmlFor="molecule" className="block text-lg font-semibold mb-2">
          Molecule
        </label>
        <input
          id="molecule"
          type="text"
          value={molecule}
          onChange={(e) => setMolecule(e.target.value)}
          className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Aspirin"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={clinicalMode} onChange={(e) => setClinicalMode(e.target.checked)} />
            Clinical mode (bias humans[mesh], exclude plants/fungi)
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Preference</label>
          <select value={preference} onChange={(e) => setPreference(e.target.value as any)} className="w-full p-2 rounded-md border border-gray-300">
            <option value="precision">Prefer precision</option>
            <option value="recall">Prefer recall</option>
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={dagMode} onChange={(e) => setDagMode(e.target.checked)} />
            Experimental DAG mode
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="objective" className="block text-lg font-semibold mb-2">
          Objective <span className="text-red-600">*</span>
        </label>
        <textarea
          id="objective"
          rows={5}
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Be specific. Example: Summarize the anti-inflammatory mechanisms of aspirin in cardiovascular disease."
          required
        />
      </div>

      <div>
        <label htmlFor="projectId" className="block text-lg font-semibold mb-2">
          Project ID (Optional)
        </label>
        <input
          id="projectId"
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., project-abc"
        />
      </div>

      <div>
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Generate Review
        </button>
      </div>
    </form>
  );
}
