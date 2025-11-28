'use client';

import React, { useState } from 'react';

interface LabFile {
  file_id: string;
  file_name: string;
  file_type: 'raw_data' | 'analysis' | 'image';
  file_size: string;
  experiment_name?: string;
  uploaded_at: string;
}

// Mock data for UI demonstration
const MOCK_FILES: LabFile[] = [
  { file_id: '1', file_name: 'dose_response_data.csv', file_type: 'raw_data', file_size: '2.3 MB', experiment_name: 'Dose Response Study', uploaded_at: '2024-01-15' },
  { file_id: '2', file_name: 'binding_assay_results.xlsx', file_type: 'raw_data', file_size: '1.8 MB', experiment_name: 'Binding Assay', uploaded_at: '2024-01-14' },
  { file_id: '3', file_name: 'ic50_analysis.pdf', file_type: 'analysis', file_size: '456 KB', experiment_name: 'Dose Response Study', uploaded_at: '2024-01-16' },
  { file_id: '4', file_name: 'statistical_summary.xlsx', file_type: 'analysis', file_size: '128 KB', experiment_name: 'Binding Assay', uploaded_at: '2024-01-15' },
  { file_id: '5', file_name: 'gel_image_001.png', file_type: 'image', file_size: '3.2 MB', experiment_name: 'Western Blot', uploaded_at: '2024-01-12' },
];

export function ErythosDataManagementTab() {
  const [files] = useState<LabFile[]>(MOCK_FILES);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'raw_data': return '📊';
      case 'analysis': return '📈';
      case 'image': return '🖼️';
      default: return '📄';
    }
  };

  const rawDataFiles = files.filter(f => f.file_type === 'raw_data');
  const analysisFiles = files.filter(f => f.file_type === 'analysis');
  const imageFiles = files.filter(f => f.file_type === 'image');

  const FileSection = ({ title, files, icon, color }: { title: string; files: LabFile[]; icon: string; color: string }) => (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
      <div className={`px-4 py-3 border-b border-gray-800 bg-gradient-to-r ${color}`}>
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium flex items-center gap-2">
            <span>{icon}</span> {title}
          </h4>
          <span className="text-sm text-gray-400">{files.length} files</span>
        </div>
      </div>
      <div className="divide-y divide-gray-800">
        {files.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No files in this category
          </div>
        ) : (
          files.map(file => (
            <div key={file.file_id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">{getFileIcon(file.file_type)}</span>
                <div>
                  <p className="text-white text-sm">{file.file_name}</p>
                  <p className="text-xs text-gray-500">
                    {file.experiment_name} • {file.file_size} • {file.uploaded_at}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors">
                  👁️ View
                </button>
                <button className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-xs transition-colors">
                  ⬇️ Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="px-4 py-2 border-t border-gray-800 bg-gray-900/50">
        <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
          ➕ Upload File
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Bulk Actions */}
      <div className="flex items-center justify-end gap-3">
        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors">
          📦 Export All (ZIP)
        </button>
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
          🧹 Clean Up
        </button>
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
          💾 Backup
        </button>
      </div>

      {/* File Sections */}
      <FileSection 
        title="Raw Data Files" 
        files={rawDataFiles} 
        icon="📊" 
        color="from-blue-500/10 to-transparent"
      />
      <FileSection 
        title="Analysis Results" 
        files={analysisFiles} 
        icon="📈" 
        color="from-green-500/10 to-transparent"
      />
      <FileSection 
        title="Photos & Images" 
        files={imageFiles} 
        icon="🖼️" 
        color="from-purple-500/10 to-transparent"
      />

      {/* Storage Info */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Storage Used</p>
            <p className="text-sm text-gray-400">{files.length} files • ~8 MB total</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-400">8 MB</p>
            <p className="text-xs text-gray-500">of 10 GB limit</p>
          </div>
        </div>
      </div>
    </div>
  );
}

