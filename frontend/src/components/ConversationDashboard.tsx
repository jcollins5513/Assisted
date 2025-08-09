'use client';

import React, { useState, useEffect } from 'react';
import { ConversationAnalysis } from '@/services/conversationAnalysisService';

interface ConversationDashboardProps {
  analysis: ConversationAnalysis | null;
  feedback: string[];
  suggestions: string[];
  isRecording: boolean;
}

export const ConversationDashboard: React.FC<ConversationDashboardProps> = ({
  analysis,
  feedback,
  suggestions,
  isRecording,
}) => {
  const [performanceScore, setPerformanceScore] = useState(0);
  const [toneHistory, setToneHistory] = useState<Array<{ tone: string; timestamp: number }>>([]);
  const [salesTechniquesHistory, setSalesTechniquesHistory] = useState<string[]>([]);

  // Update performance score when analysis changes
  useEffect(() => {
    if (analysis) {
      setPerformanceScore(analysis.overallScore);
      setToneHistory(prev => [...prev, { tone: analysis.tone, timestamp: analysis.timestamp }]);
      
      // Track sales techniques
      if (analysis.salesTechniques.length > 0) {
        setSalesTechniquesHistory(prev => [...prev, ...analysis.salesTechniques]);
      }
    }
  }, [analysis]);

  // Get tone color
  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get performance color
  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get performance label
  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  // Get engagement color
  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Real-Time Analysis Dashboard
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {isRecording ? 'Live Analysis Active' : 'Analysis Paused'}
          </span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getPerformanceColor(performanceScore)}`}>
              {performanceScore}
            </div>
            <div className="text-sm text-gray-600">Performance Score</div>
            <div className={`text-xs font-medium ${getPerformanceColor(performanceScore)}`}>
              {getPerformanceLabel(performanceScore)}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {analysis?.confidence ? Math.round(analysis.confidence * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Confidence</div>
            <div className="text-xs text-green-600 font-medium">Analysis Quality</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {analysis?.closingAttempts || 0}
            </div>
            <div className="text-sm text-gray-600">Closing Attempts</div>
            <div className="text-xs text-purple-600 font-medium">Sales Technique</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getEngagementColor(analysis?.customerEngagement || 0)}`}>
              {analysis?.customerEngagement || 0}%
            </div>
            <div className="text-sm text-gray-600">Engagement</div>
            <div className="text-xs text-orange-600 font-medium">Customer Interest</div>
          </div>
        </div>
      </div>

      {/* Scenario Progress */}
      {analysis?.scenarioProgress && analysis.scenarioProgress > 0 && (
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-indigo-900">Scenario Progress</h4>
            <span className="text-sm font-medium text-indigo-700">{analysis.scenarioProgress}%</span>
          </div>
          <div className="w-full bg-indigo-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analysis.scenarioProgress}%` }}
            />
          </div>
          <div className="text-xs text-indigo-600 mt-1">
            Progress on training objectives
          </div>
        </div>
      )}

      {/* Current Analysis */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Tone Analysis */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Current Tone</h4>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getToneColor(analysis.tone)}`}>
              {analysis.tone.charAt(0).toUpperCase() + analysis.tone.slice(1)}
            </div>
            
            {analysis.keyTopics.length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Key Topics:</h5>
                <div className="flex flex-wrap gap-1">
                  {analysis.keyTopics.map((topic, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sales Techniques & Objections */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Sales Analysis</h4>
            
            {analysis.salesTechniques.length > 0 && (
              <div className="mb-3">
                <h5 className="text-sm font-medium text-green-700 mb-2">Techniques Detected:</h5>
                <div className="space-y-1">
                  {analysis.salesTechniques.map((technique, index) => (
                    <div key={index} className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                      ✅ {technique}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.objections.length > 0 && (
              <div className="mb-3">
                <h5 className="text-sm font-medium text-red-700 mb-2">Objections Detected:</h5>
                <div className="space-y-1">
                  {analysis.objections.map((objection, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                      ⚠️ {objection}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.negotiationPhases.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Negotiation Phases:</h5>
                <div className="flex flex-wrap gap-1">
                  {analysis.negotiationPhases.map((phase, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {phase.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real-time Feedback */}
      {feedback.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Real-time Feedback</h4>
          <div className="space-y-2">
            {feedback.map((item, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div className="text-sm text-blue-800">{item}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Improvement Suggestions</h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                <div className="text-sm text-yellow-800">{suggestion}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales Techniques History */}
      {salesTechniquesHistory.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Sales Techniques Used</h4>
          <div className="flex flex-wrap gap-2">
            {[...new Set(salesTechniquesHistory)].map((technique, index) => (
              <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                {technique}
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Total techniques used: {salesTechniquesHistory.length}
          </div>
        </div>
      )}

      {/* Tone History */}
      {toneHistory.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Tone History</h4>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {toneHistory.slice(-10).map((entry, index) => (
              <div key={index} className="flex-shrink-0">
                <div className={`w-4 h-4 rounded-full ${getToneColor(entry.tone).split(' ')[0]}`} />
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Last 10 tone changes • Green: Positive • Gray: Neutral • Red: Negative
          </div>
        </div>
      )}

      {/* Detailed Feedback */}
      {analysis?.feedback && analysis.feedback.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-900 mb-3">Detailed Analysis</h4>
          <div className="space-y-2">
            {analysis.feedback.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-700">{item}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
