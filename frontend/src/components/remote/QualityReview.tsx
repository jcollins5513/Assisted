'use client';

import React, { useState, useEffect } from 'react';

interface QualityReviewProps {
  assessmentId?: string;
  onReviewComplete?: (assessmentId: string, approved: boolean) => void;
}

interface QualityAssessment {
  id: string;
  imagePath: string;
  originalPath: string;
  score: number;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  metrics: QualityMetrics;
  suggestions: QualitySuggestion[];
  reviewed: boolean;
  reviewNotes?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface QualityMetrics {
  edgeSharpness: number;
  backgroundRemoval: number;
  colorPreservation: number;
  noiseLevel: number;
  overallQuality: number;
}

interface QualitySuggestion {
  type: 'improvement' | 'warning' | 'error';
  category: 'edge' | 'background' | 'color' | 'noise' | 'general';
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: string;
}

export function QualityReview({ assessmentId, onReviewComplete }: QualityReviewProps) {
  const [assessments, setAssessments] = useState<QualityAssessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<QualityAssessment | null>(null);
  const [reviewData, setReviewData] = useState({
    approved: false,
    notes: '',
    qualityScore: 0
  });
  const [assessmentStats, setAssessmentStats] = useState({
    total: 0,
    pending: 0,
    analyzing: 0,
    completed: 0,
    failed: 0,
    reviewed: 0,
    averageScore: 0
  });

  useEffect(() => {
    // Load sample assessments
    loadSampleAssessments();
  }, []);

  useEffect(() => {
    updateAssessmentStats();
  }, [assessments]);

  const loadSampleAssessments = () => {
    const sampleAssessments: QualityAssessment[] = [
      {
        id: 'assessment-1',
        imagePath: '/processed/car-1.png',
        originalPath: '/uploads/car-1.jpg',
        score: 85,
        status: 'completed',
        metrics: {
          edgeSharpness: 88,
          backgroundRemoval: 92,
          colorPreservation: 87,
          noiseLevel: 8,
          overallQuality: 85
        },
        suggestions: [
          {
            type: 'improvement',
            category: 'edge',
            message: 'Edge sharpness is good but could be improved with higher quality settings.',
            priority: 'low',
            actionable: true,
            action: 'Try U²-Net model with higher quality settings'
          }
        ],
        reviewed: false,
        createdAt: new Date(Date.now() - 3600000),
        completedAt: new Date(Date.now() - 3500000)
      },
      {
        id: 'assessment-2',
        imagePath: '/processed/car-2.png',
        originalPath: '/uploads/car-2.jpg',
        score: 72,
        status: 'completed',
        metrics: {
          edgeSharpness: 65,
          backgroundRemoval: 78,
          colorPreservation: 85,
          noiseLevel: 15,
          overallQuality: 72
        },
        suggestions: [
          {
            type: 'improvement',
            category: 'edge',
            message: 'Edge sharpness is below threshold (65% vs 75%). Consider using a higher quality model.',
            priority: 'medium',
            actionable: true,
            action: 'Try U²-Net model with higher quality settings'
          },
          {
            type: 'warning',
            category: 'noise',
            message: 'Noise level is above threshold (15% vs 20%). Consider using noise reduction.',
            priority: 'medium',
            actionable: true,
            action: 'Enable noise reduction in processing settings'
          }
        ],
        reviewed: false,
        createdAt: new Date(Date.now() - 7200000),
        completedAt: new Date(Date.now() - 7100000)
      },
      {
        id: 'assessment-3',
        imagePath: '/processed/car-3.png',
        originalPath: '/uploads/car-3.jpg',
        score: 95,
        status: 'completed',
        metrics: {
          edgeSharpness: 94,
          backgroundRemoval: 96,
          colorPreservation: 93,
          noiseLevel: 3,
          overallQuality: 95
        },
        suggestions: [
          {
            type: 'improvement',
            category: 'general',
            message: 'Excellent quality score (95%). This image meets high-quality standards.',
            priority: 'low',
            actionable: false
          }
        ],
        reviewed: true,
        reviewNotes: 'Auto-approved: Excellent quality score',
        createdAt: new Date(Date.now() - 10800000),
        completedAt: new Date(Date.now() - 10700000)
      }
    ];

    setAssessments(sampleAssessments);
  };

  const updateAssessmentStats = () => {
    const stats = {
      total: assessments.length,
      pending: assessments.filter(a => a.status === 'pending').length,
      analyzing: assessments.filter(a => a.status === 'analyzing').length,
      completed: assessments.filter(a => a.status === 'completed').length,
      failed: assessments.filter(a => a.status === 'failed').length,
      reviewed: assessments.filter(a => a.reviewed).length,
      averageScore: assessments.length > 0 
        ? assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length 
        : 0
    };
    setAssessmentStats(stats);
  };

  const handleAssessmentSelect = (assessment: QualityAssessment) => {
    setSelectedAssessment(assessment);
    setReviewData({
      approved: assessment.score >= 70,
      notes: assessment.reviewNotes || '',
      qualityScore: assessment.score
    });
  };

  const handleReviewSubmit = () => {
    if (!selectedAssessment) return;

    const updatedAssessment = {
      ...selectedAssessment,
      reviewed: true,
      reviewNotes: reviewData.notes,
      score: reviewData.qualityScore
    };

    setAssessments(prev => 
      prev.map(a => a.id === selectedAssessment.id ? updatedAssessment : a)
    );

    if (onReviewComplete) {
      onReviewComplete(selectedAssessment.id, reviewData.approved);
    }

    setSelectedAssessment(null);
    setReviewData({ approved: false, notes: '', qualityScore: 0 });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Acceptable';
    return 'Poor';
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'improvement': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'improvement': return '💡';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Quality Review</h2>
          <p className="text-sm text-gray-600">
            Review and approve processed images based on quality assessment
          </p>
        </div>
      </div>

      {/* Assessment Stats */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{assessmentStats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{assessmentStats.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{assessmentStats.analyzing}</div>
          <div className="text-sm text-gray-600">Analyzing</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{assessmentStats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{assessmentStats.failed}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{assessmentStats.reviewed}</div>
          <div className="text-sm text-gray-600">Reviewed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{Math.round(assessmentStats.averageScore)}</div>
          <div className="text-sm text-gray-600">Avg Score</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quality Assessments</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {assessments.map((assessment) => (
              <div 
                key={assessment.id} 
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedAssessment?.id === assessment.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleAssessmentSelect(assessment)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      assessment.reviewed ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {assessment.imagePath.split('/').pop()}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {assessment.createdAt.toLocaleDateString()} • {assessment.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(assessment.score)}`}>
                      {assessment.score}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {getScoreLabel(assessment.score)}
                    </div>
                  </div>
                </div>
                
                {assessment.suggestions.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Suggestions:</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {assessment.suggestions.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Details */}
        {selectedAssessment && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Assessment Details</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Image Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Image Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">File:</span>
                    <span className="text-gray-900">{selectedAssessment.imagePath.split('/').pop()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original:</span>
                    <span className="text-gray-900">{selectedAssessment.originalPath.split('/').pop()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-gray-900 capitalize">{selectedAssessment.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reviewed:</span>
                    <span className="text-gray-900">{selectedAssessment.reviewed ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Quality Metrics */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Quality Metrics</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Edge Sharpness</span>
                      <span className="text-gray-900">{selectedAssessment.metrics.edgeSharpness}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${selectedAssessment.metrics.edgeSharpness}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Background Removal</span>
                      <span className="text-gray-900">{selectedAssessment.metrics.backgroundRemoval}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${selectedAssessment.metrics.backgroundRemoval}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Color Preservation</span>
                      <span className="text-gray-900">{selectedAssessment.metrics.colorPreservation}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${selectedAssessment.metrics.colorPreservation}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Noise Level</span>
                      <span className="text-gray-900">{selectedAssessment.metrics.noiseLevel}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${selectedAssessment.metrics.noiseLevel}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quality Suggestions */}
              {selectedAssessment.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quality Suggestions</h4>
                  <div className="space-y-2">
                    {selectedAssessment.suggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                          <div className="flex-1">
                            <p className={`text-sm ${getSuggestionColor(suggestion.type)}`}>
                              {suggestion.message}
                            </p>
                            {suggestion.actionable && suggestion.action && (
                              <p className="text-xs text-gray-600 mt-1">
                                Action: {suggestion.action}
                              </p>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                            suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {suggestion.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Form */}
              {!selectedAssessment.reviewed && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Review Decision</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={reviewData.approved}
                          onChange={(e) => setReviewData({ ...reviewData, approved: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Approve this image</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quality Score Override
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={reviewData.qualityScore}
                        onChange={(e) => setReviewData({ ...reviewData, qualityScore: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Review Notes
                      </label>
                      <textarea
                        value={reviewData.notes}
                        onChange={(e) => setReviewData({ ...reviewData, notes: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add any notes about this assessment..."
                      />
                    </div>
                    <button
                      onClick={handleReviewSubmit}
                      className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              )}

              {/* Review Notes (if already reviewed) */}
              {selectedAssessment.reviewed && selectedAssessment.reviewNotes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Review Notes</h4>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">{selectedAssessment.reviewNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Quality Review Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Review edge sharpness and background removal quality carefully</li>
          <li>• Consider noise levels and color preservation for professional use</li>
          <li>• Use quality suggestions to improve processing settings</li>
          <li>• Override quality scores only when necessary</li>
        </ul>
      </div>
    </div>
  );
}
