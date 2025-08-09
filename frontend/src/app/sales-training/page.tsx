'use client';

import React, { useState, useEffect } from 'react';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { ConversationDashboard } from '@/components/ConversationDashboard';
import { ConversationAnalysis } from '@/services/conversationAnalysisService';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { conversationsAPI, usersAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export default function SalesTrainingPage() {
  const { user } = useAuth();
  const [currentAnalysis, setCurrentAnalysis] = useState<ConversationAnalysis | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [trainingStats, setTrainingStats] = useState({
    totalSessions: 0,
    averageScore: 0,
    bestScore: 0,
    techniquesUsed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's training data
  useEffect(() => {
    const loadTrainingData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Load conversation history
        const conversationsResponse = await conversationsAPI.getConversations({
          limit: 50,
          sortBy: 'startTime',
          sortOrder: 'desc'
        });
        
        if (conversationsResponse.data?.conversations) {
          const history = conversationsResponse.data.conversations.map((conv: any) => ({
            ...conv.analysis,
            timestamp: new Date(conv.startTime).toLocaleTimeString(),
            conversationId: conv._id,
          }));
          
          setConversationHistory(history);
          
          // Calculate training stats
          const conversations = conversationsResponse.data.conversations;
          const totalSessions = conversations.length;
          const averageScore = conversations.length > 0 
            ? Math.round(conversations.reduce((sum: number, conv: any) => sum + (conv.analysis?.overallScore || 0), 0) / conversations.length)
            : 0;
          const bestScore = conversations.length > 0
            ? Math.max(...conversations.map((conv: any) => conv.analysis?.overallScore || 0))
            : 0;
          const techniquesUsed = conversations.reduce((sum: number, conv: any) => 
            sum + (conv.analysis?.salesTechniques?.length || 0), 0
          );
          
          setTrainingStats({
            totalSessions,
            averageScore,
            bestScore,
            techniquesUsed,
          });
        }
        
        // Load analytics
        const analyticsResponse = await conversationsAPI.getAnalytics();
        if (analyticsResponse.data?.analytics) {
          // Update stats with analytics data if available
          const analytics = analyticsResponse.data.analytics;
          setTrainingStats(prev => ({
            ...prev,
            totalSessions: analytics.totalConversations || prev.totalSessions,
            averageScore: Math.round(analytics.averageScore || prev.averageScore),
          }));
        }
        
      } catch (err) {
        console.error('Failed to load training data:', err);
        setError('Failed to load training data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadTrainingData();
  }, [user?.id]);

  // Handle analysis updates
  const handleAnalysisUpdate = async (analysis: ConversationAnalysis) => {
    setCurrentAnalysis(analysis);
    
    // Add to conversation history
    setConversationHistory(prev => [...prev, {
      ...analysis,
      timestamp: new Date().toLocaleTimeString(),
    }]);

    // Update training stats
    setTrainingStats(prev => ({
      ...prev,
      totalSessions: prev.totalSessions + 1,
      averageScore: Math.round((prev.averageScore + analysis.overallScore) / 2),
      bestScore: Math.max(prev.bestScore, analysis.overallScore),
      techniquesUsed: prev.techniquesUsed + analysis.salesTechniques.length,
    }));

    // Save conversation to backend if user is authenticated
    if (user?.id) {
      try {
        await conversationsAPI.createConversation({
          customerName: 'Training Session',
          customerPhone: '',
        });
      } catch (err) {
        console.error('Failed to save conversation:', err);
      }
    }
  };

  // Handle feedback updates
  const handleFeedbackUpdate = (newFeedback: string[]) => {
    setFeedback(newFeedback);
  };

  // Handle recording state changes
  const handleRecordingStateChange = (recording: boolean) => {
    setIsRecording(recording);
  };

  // Handle scenario selection
  const handleScenarioSelect = (scenario: string) => {
    setSelectedScenario(scenario);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading training data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex justify-between items-center">
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
              User: {user?.name || user?.email || 'Guest'}
            </div>
          </div>
        </div>

        {/* Training Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{trainingStats.totalSessions}</div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{trainingStats.averageScore}</div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{trainingStats.bestScore}</div>
              <div className="text-sm text-gray-600">Best Score</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{trainingStats.techniquesUsed}</div>
              <div className="text-sm text-gray-600">Techniques Used</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Recorder */}
          <div className="lg:col-span-1">
            <VoiceRecorder
              userId={user?.id || 'guest'}
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

                  {entry.salesTechniques && entry.salesTechniques.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-500">Techniques: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.salesTechniques.map((technique: string, techIndex: number) => (
                          <span key={techIndex} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {technique}
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
        )}

        {/* Enhanced Training Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💡 Advanced Sales Training Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2">🎯 Objection Handling</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Listen actively and acknowledge concerns</li>
                <li>• Use "Feel, Felt, Found" technique</li>
                <li>• Provide specific solutions, not generic responses</li>
                <li>• Address emotional concerns first</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2">🤝 Building Rapport</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Match customer's energy and tone</li>
                <li>• Ask open-ended questions</li>
                <li>• Show genuine interest in their needs</li>
                <li>• Find common ground quickly</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2">💬 Closing Techniques</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use trial closes throughout conversation</li>
                <li>• Create urgency with limited-time offers</li>
                <li>• Ask for the sale confidently</li>
                <li>• Use assumptive closing language</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2">📊 Performance Metrics</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Track conversation duration</li>
                <li>• Monitor objection-to-close ratio</li>
                <li>• Analyze tone consistency</li>
                <li>• Measure customer engagement</li>
              </ul>
            </div>
          </div>

          {/* Advanced Techniques */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2">🔧 Advanced Sales Techniques</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span>Feel, Felt, Found - Address objections empathetically</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>Assumptive Close - Assume the sale is happening</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  <span>Trial Close - Test readiness to buy</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  <span>Value Proposition - Highlight unique benefits</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-2">🎭 Role Play Scenarios</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span>Price Objection - Practice value justification</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span>Trade-in Negotiation - Handle value disputes</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  <span>Financing Concerns - Build confidence</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  <span>Feature Comparison - Highlight advantages</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
