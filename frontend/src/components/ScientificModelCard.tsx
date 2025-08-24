import React from 'react';

export interface ScientificModelCardProps {
  model_type: string;
  study_design: string;
  population_description: string;
  protocol_summary: string;
  strengths: string;
  limitations: string;
  model_type_taxonomy?: string;
  study_design_taxonomy?: string;
  sample_size?: string;
  arms_groups?: string;
  blinding_randomization?: string;
  control_type?: string;
  collection_timepoints?: string;
  justification?: string;
  link_to_objective?: string;
}

export const ScientificModelCard: React.FC<ScientificModelCardProps> = ({
  model_type,
  study_design,
  population_description,
  protocol_summary,
  strengths,
  limitations,
  model_type_taxonomy,
  study_design_taxonomy,
  sample_size,
  arms_groups,
  blinding_randomization,
  control_type,
  collection_timepoints,
  justification,
  link_to_objective,
}) => {
  const NA = (s: string) => (s && s.trim().length > 0 ? s : 'Not reported');
  return (
    <div className="border rounded-lg shadow-sm p-4 bg-white text-black">
      <h3 className="text-lg font-semibold mb-3 text-black">Scientific Model</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <dl className="divide-y divide-gray-200">
            <div className="py-2">
              <dt className="text-sm font-medium text-black">Model Type</dt>
              <dd className="mt-1 text-sm text-black">{NA(model_type)}</dd>
            </div>
            <div className="py-2">
              <dt className="text-sm font-medium text-black">Study Design</dt>
              <dd className="mt-1 text-sm text-black">{NA(study_design)}</dd>
            </div>
            <div className="py-2">
              <dt className="text-sm font-medium text-black">Population & Sample</dt>
              <dd className="mt-1 text-sm text-black">{NA(population_description)}</dd>
            </div>
            {model_type_taxonomy && (
              <div className="py-2">
                <dt className="text-sm font-medium text-black">Model Taxonomy</dt>
                <dd className="mt-1 text-sm text-black">{NA(model_type_taxonomy)}</dd>
              </div>
            )}
            {study_design_taxonomy && (
              <div className="py-2">
                <dt className="text-sm font-medium text-black">Study Design Taxonomy</dt>
                <dd className="mt-1 text-sm text-black">{NA(study_design_taxonomy)}</dd>
              </div>
            )}
            {(sample_size || arms_groups) && (
              <div className="py-2">
                <dt className="text-sm font-medium text-black">Sample Size · Arms</dt>
                <dd className="mt-1 text-sm text-black">{[sample_size, arms_groups].filter(Boolean).join(' · ') || 'Not reported'}</dd>
              </div>
            )}
            {(blinding_randomization || control_type) && (
              <div className="py-2">
                <dt className="text-sm font-medium text-black">Blinding/Randomization · Controls</dt>
                <dd className="mt-1 text-sm text-black">{[blinding_randomization, control_type].filter(Boolean).join(' · ') || 'Not reported'}</dd>
              </div>
            )}
            {collection_timepoints && (
              <div className="py-2">
                <dt className="text-sm font-medium text-black">Collection Timepoints</dt>
                <dd className="mt-1 text-sm text-black">{NA(collection_timepoints)}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-black">Protocol Summary</h4>
            <p className="mt-1 text-sm text-black whitespace-pre-line">{NA(protocol_summary)}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-black">Strengths</h4>
            <p className="mt-1 text-sm text-black whitespace-pre-line">{NA(strengths)}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-black">Limitations</h4>
            <p className="mt-1 text-sm text-black whitespace-pre-line">{NA(limitations)}</p>
          </div>
          {(justification || link_to_objective) && (
            <div>
              <h4 className="text-sm font-semibold text-black">Rationale & Link to Objective</h4>
              <p className="mt-1 text-sm text-black whitespace-pre-line">{[justification || '', link_to_objective || ''].filter(Boolean).join('\n\n') || 'Not reported'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScientificModelCard;


