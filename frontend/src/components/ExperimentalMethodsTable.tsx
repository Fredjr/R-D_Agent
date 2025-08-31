import React from 'react';
import { BeakerIcon, TableCellsIcon, LinkIcon } from '@heroicons/react/24/outline';

interface FactAnchor {
  claim: string;
  evidence: {
    title: string;
    year?: number;
    pmid?: string;
    quote: string;
  };
}

interface ExperimentalMethod {
  technique: string;
  measurement: string;
  role_in_study: string;
  parameters: string;
  controls_validation: string;
  limitations_reproducibility: string;
  validation: string;
  accession_ids: string[];
  fact_anchors: FactAnchor[];
}

interface ExperimentalMethodsTableProps {
  data: ExperimentalMethod[];
  className?: string;
}

export default function ExperimentalMethodsTable({ data, className = '' }: ExperimentalMethodsTableProps) {
  const [expandedMethod, setExpandedMethod] = React.useState<number | null>(null);

  const toggleExpanded = (index: number) => {
    setExpandedMethod(expandedMethod === index ? null : index);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <BeakerIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Experimental Methods Analysis</h3>
            <p className="text-sm text-gray-600">Detailed breakdown of research methodology</p>
          </div>
        </div>

        {/* Methods List */}
        {data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((method, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpanded(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TableCellsIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900">{method.technique}</h4>
                        <p className="text-sm text-gray-600">{method.measurement}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {expandedMethod === index ? 'Click to collapse' : 'Click to expand'}
                    </div>
                  </div>
                </div>

                {expandedMethod === index && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role in Study</label>
                        <p className="text-sm text-gray-900">{method.role_in_study || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Parameters</label>
                        <p className="text-sm text-gray-900">{method.parameters || 'Not specified'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Controls & Validation</label>
                        <p className="text-sm text-gray-900">{method.controls_validation || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Validation</label>
                        <p className="text-sm text-gray-900">{method.validation || 'Not specified'}</p>
                      </div>
                    </div>

                    {method.limitations_reproducibility && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Limitations & Reproducibility</label>
                        <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                          <p className="text-sm text-gray-900">{method.limitations_reproducibility}</p>
                        </div>
                      </div>
                    )}

                    {method.accession_ids && method.accession_ids.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data Accessions</label>
                        <div className="flex flex-wrap gap-2">
                          {method.accession_ids.map((accession, accIndex) => (
                            <span
                              key={accIndex}
                              className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono"
                            >
                              {accession}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {method.fact_anchors && method.fact_anchors.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Evidence</label>
                        <div className="space-y-2">
                          {method.fact_anchors.map((anchor, anchorIndex) => (
                            <div key={anchorIndex} className="p-3 bg-white rounded border border-gray-200">
                              <p className="text-sm font-medium text-gray-900 mb-1">{anchor.claim}</p>
                              <div className="text-xs text-gray-600">
                                {anchor.evidence.title && (
                                  <p><strong>Title:</strong> {anchor.evidence.title}</p>
                                )}
                                {anchor.evidence.year && (
                                  <p><strong>Year:</strong> {anchor.evidence.year}</p>
                                )}
                                {anchor.evidence.pmid && (
                                  <p><strong>PMID:</strong> {anchor.evidence.pmid}</p>
                                )}
                                {anchor.evidence.quote && (
                                  <p className="mt-1 italic">"{anchor.evidence.quote}"</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No experimental methods data available</p>
          </div>
        )}
      </div>
    </div>
  );
}