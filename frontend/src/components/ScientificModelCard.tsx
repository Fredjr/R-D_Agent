import React from 'react';

export interface ScientificModelCardProps {
  model_type: string;
  study_design: string;
  population_description: string;
  protocol_summary: string;
  strengths: string;
  limitations: string;
}

export const ScientificModelCard: React.FC<ScientificModelCardProps> = ({
  model_type,
  study_design,
  population_description,
  protocol_summary,
  strengths,
  limitations,
}) => {
  const NA = (s: string) => (s && s.trim().length > 0 ? s : 'Not reported');
  return (
    <div className="border rounded-lg shadow-sm p-4 bg-white">
      <h3 className="text-lg font-semibold mb-3">Scientific Model</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <dl className="divide-y divide-gray-200">
            <div className="py-2">
              <dt className="text-sm font-medium text-gray-600">Model Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{NA(model_type)}</dd>
            </div>
            <div className="py-2">
              <dt className="text-sm font-medium text-gray-600">Study Design</dt>
              <dd className="mt-1 text-sm text-gray-900">{NA(study_design)}</dd>
            </div>
            <div className="py-2">
              <dt className="text-sm font-medium text-gray-600">Population & Sample</dt>
              <dd className="mt-1 text-sm text-gray-900">{NA(population_description)}</dd>
            </div>
          </dl>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-800">Protocol Summary</h4>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{NA(protocol_summary)}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800">Strengths</h4>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{NA(strengths)}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800">Limitations</h4>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{NA(limitations)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScientificModelCard;

