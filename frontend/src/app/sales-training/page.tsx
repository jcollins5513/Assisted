'use client';

import React, { useState, useEffect } from 'react';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { ConversationDashboard } from '@/components/ConversationDashboard';
import { ConversationAnalysis } from '@/services/conversationAnalysisService';

export default function SalesTrainingPage() {
  const [userId] = useState('demo-user-123'); // In real app, get from auth
  const [currentAnalysis, setCurrentAnalysis] = useState<ConversationAnalysis | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  // Handle analysis updates
  const handleAnalysisUpdate = (analysis: ConversationAnalysis) => {
    setCurrentAnalysis(analysis);
    
    // Add to conversation history
    setConversationHistory(prev => [...prev, {
      ...analysis,
      timestamp: new Date().toLocaleTimeString(),
    }]);
  };

  // Handle feedback updates
  const handleFeedbackUpdate = (newFeedback: string[]) => {
    setFeedback(newFeedback);
  };

  // Handle recording state changes
  const handleRecordingStateChange = (recording: boolean) => {
    setIsRecording(recording);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sales Training Assistant
              </h1>
              <p className="text-sm text-gray-600">
                Real-time conversation analysis and feedback
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-600">
                  {isRecording ? 'Live Session' : 'Ready'}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                User: {userId}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Recorder */}
          <div className="lg:col-span-1">
            <VoiceRecorder
              userId={userId}
              onAnalysisUpdate={handleAnalysisUpdate}
              onFeedbackUpdate={handleFeedbackUpdate}
            />
          </div>

          {/* Analysis Dashboard */}
          <div className="lg:col-span-2">
            <ConversationDashboard
              analysis={currentAnalysis}
              feedback={feedback}
              suggestions={suggestions}
              isRecording={isRecording}
            />
          </div>
        </div>

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Conversation History
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {conversationHistory.map((entry, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-gray-500">{entry.timestamp}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.tone === 'positive' ? 'bg-green-100 text-green-800' :
                          entry.tone === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.tone}
                        </span>
                        <span className="text-sm text-gray-600">
                          Score: {entry.overallScore}
                        </span>
                      </div>
                    </div>
                    
                    {entry.keyTopics.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-500">Topics: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {entry.keyTopics.map((topic: string, topicIndex: number) => (
                            <span key={topicIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {entry.objections.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-500">Objections: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {entry.objections.map((objection: string, objIndex: number) => (
                            <span key={objIndex} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              {objection}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {entry.feedback.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Feedback: </span>
                        <div className="mt-1">
                          {entry.feedback.map((item: string, feedbackIndex: number) => (
                            <div key={feedbackIndex} className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded mb-1">
                              • {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Training Tips */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💡 Sales Training Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">🎯 Objection Handling</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Listen actively and acknowledge concerns</li>
                  <li>• Use "Feel, Felt, Found" technique</li>
                  <li>• Provide specific solutions, not generic responses</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">🤝 Building Rapport</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Match customer's energy and tone</li>
                  <li>• Ask open-ended questions</li>
                  <li>• Show genuine interest in their needs</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">💬 Closing Techniques</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use trial closes throughout conversation</li>
                  <li>• Create urgency with limited-time offers</li>
                  <li>• Ask for the sale confidently</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-2">📊 Performance Metrics</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Track conversation duration</li>
                  <li>• Monitor objection-to-close ratio</li>
                  <li>• Analyze tone consistency</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
