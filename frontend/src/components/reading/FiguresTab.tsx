'use client';

import React, { useState, useEffect } from 'react';
import { PhotoIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { extractFiguresFromPDF, type ExtractedFigure } from '@/utils/pdfFigureExtractor';

interface Figure {
  id: string;
  title: string;
  caption: string;
  pageNumber: number;
  imageUrl?: string;
  imageData?: string; // Base64 encoded image
  type: 'figure' | 'chart' | 'table';
}

interface FiguresTabProps {
  pmid: string;
  pdfUrl?: string;
  pdfDocument?: any; // PDF.js document object
  onFigureClick?: (pageNumber: number) => void;
}

export default function FiguresTab({ pmid, pdfUrl, pdfDocument, onFigureClick }: FiguresTabProps) {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFigure, setSelectedFigure] = useState<Figure | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFigures();
  }, [pmid, pdfUrl, pdfDocument]);

  const fetchFigures = async () => {
    setLoading(true);
    try {
      // Try to extract real figures from PDF
      if (pdfUrl) {
        console.log('🔍 Extracting figures from PDF...');
        const extractedFigures = await extractFiguresFromPDF(pdfUrl, pdfDocument);

        if (extractedFigures.length > 0) {
          setFigures(extractedFigures);
          setLoading(false);
          return;
        }
      }

      // Fallback to mock data if extraction fails or no PDF URL
      console.log('⚠️ Using mock figure data');
      const mockFigures: Figure[] = [
        {
          id: '1',
          title: 'Figure 1',
          caption: 'Flow diagram',
          pageNumber: 3,
          type: 'figure',
        },
        {
          id: '2',
          title: 'Figure 2',
          caption: 'Methodological quality summary: review authors\' judgements about each methodological quality item for each included study.',
          pageNumber: 5,
          type: 'figure',
        },
        {
          id: '3',
          title: 'Figure 3',
          caption: 'Methodological quality graph: review authors\' judgements about each methodological quality item presented as percentages across all included studies.',
          pageNumber: 6,
          type: 'chart',
        },
        {
          id: '4',
          title: 'Figure 4',
          caption: 'Comparison 1: ACEi versus placebo, Outcome 1: Death (any cause)',
          pageNumber: 7,
          type: 'chart',
        },
        {
          id: '5',
          title: 'Figure 5',
          caption: 'Comparison 1: ACEi versus placebo, Outcome 2: Cardiovascular disease (fatal and non-fatal)',
          pageNumber: 8,
          type: 'chart',
        },
        {
          id: '6',
          title: 'Figure 6',
          caption: 'Comparison 1: ACEi versus placebo, Outcome 3: Myocardial infarction (fatal and non-fatal)',
          pageNumber: 9,
          type: 'chart',
        },
      ];

      setFigures(mockFigures);
    } catch (error) {
      console.error('Error fetching figures:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFigures = figures.filter((fig) =>
    fig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fig.caption.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFigureClick = (figure: Figure) => {
    setSelectedFigure(figure);
    if (onFigureClick) {
      onFigureClick(figure.pageNumber);
    }
  };

  const handleCloseFigure = () => {
    setSelectedFigure(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading figures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search figures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Download All Button */}
      <div className="px-4 py-2 border-b border-gray-200">
        <button
          onClick={() => {
            // TODO: Implement download all figures
            console.log('Download all figures');
          }}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          📥 Download All
        </button>
      </div>

      {/* Figures List */}
      <div className="flex-1 overflow-y-auto">
        {filteredFigures.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <PhotoIcon className="w-12 h-12 mb-2" />
            <p className="text-sm">No figures found</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {filteredFigures.map((figure) => (
              <div
                key={figure.id}
                onClick={() => handleFigureClick(figure)}
                className="border border-gray-200 rounded-lg p-3 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
              >
                {/* Figure Preview */}
                <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center mb-2 overflow-hidden">
                  {figure.imageData ? (
                    <img
                      src={figure.imageData}
                      alt={figure.title}
                      className="w-full h-full object-contain"
                    />
                  ) : figure.imageUrl ? (
                    <Image
                      src={figure.imageUrl}
                      alt={figure.title}
                      width={200}
                      height={128}
                      className="object-contain"
                    />
                  ) : (
                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                {/* Figure Info */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm text-gray-900">{figure.title}</h4>
                    <span className="text-xs text-gray-500">Page {figure.pageNumber}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{figure.caption}</p>
                  <div className="mt-2">
                    <span className={`
                      inline-block px-2 py-0.5 text-xs rounded-full
                      ${figure.type === 'figure' ? 'bg-blue-100 text-blue-700' :
                        figure.type === 'chart' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'}
                    `}>
                      {figure.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enlarged Figure Modal */}
      {selectedFigure && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4"
          onClick={handleCloseFigure}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedFigure.title}</h3>
                <p className="text-sm text-gray-600">Page {selectedFigure.pageNumber}</p>
              </div>
              <button
                onClick={handleCloseFigure}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Figure Image */}
              <div className="bg-gray-100 rounded-lg p-4 mb-4 flex items-center justify-center min-h-[400px]">
                {selectedFigure.imageData ? (
                  <img
                    src={selectedFigure.imageData}
                    alt={selectedFigure.title}
                    className="object-contain max-w-full max-h-[600px]"
                  />
                ) : selectedFigure.imageUrl ? (
                  <Image
                    src={selectedFigure.imageUrl}
                    alt={selectedFigure.title}
                    width={800}
                    height={600}
                    className="object-contain max-w-full"
                  />
                ) : (
                  <PhotoIcon className="w-24 h-24 text-gray-400" />
                )}
              </div>

              {/* Figure Caption */}
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">DETAILED INFORMATION</h4>
                <p className="text-sm text-gray-700">{selectedFigure.caption}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

