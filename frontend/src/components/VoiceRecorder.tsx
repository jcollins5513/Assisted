'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { audioStreamService } from '@/services/audioStreamService';
import { conversationAnalysisService } from '@/services/conversationAnalysisService';

interface VoiceRecorderProps {
  userId: string;
  onAnalysisUpdate?: (analysis: any) => void;
  onFeedbackUpdate?: (feedback: string[]) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  userId,
  onAnalysisUpdate,
  onFeedbackUpdate,
}) => {
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
  } = useVoiceRecorder();

  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Connect to audio streaming service
  useEffect(() => {
    const connectToStreaming = async () => {
      try {
        await audioStreamService.connect('http://localhost:3001', userId);
        setIsConnected(true);
        
        // Set up analysis listeners
        audioStreamService.onAnalysisResult((result) => {
          setAnalysis(result);
          onAnalysisUpdate?.(result);
        });
        
        audioStreamService.onFeedback((newFeedback) => {
          setFeedback(newFeedback);
          onFeedbackUpdate?.(newFeedback);
        });
        
      } catch (error) {
        console.error('Failed to connect to streaming service:', error);
      }
    };

    connectToStreaming();

    return () => {
      audioStreamService.disconnect();
    };
  }, [userId, onAnalysisUpdate, onFeedbackUpdate]);

  // Audio visualization
  useEffect(() => {
    if (!isRecording || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Generate random volume level for visualization
      const level = Math.random() * 100;
      setVolumeLevel(level);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw volume bars
      const barWidth = canvas.width / 20;
      const barHeight = (level / 100) * canvas.height;
      
      ctx.fillStyle = isRecording ? '#10b981' : '#6b7280';
      ctx.fillRect(
        canvas.width / 2 - barWidth / 2,
        canvas.height - barHeight,
        barWidth,
        barHeight
      );
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  // Handle recording start
  const handleStartRecording = async () => {
    try {
      await startRecording();
      
      // Start real-time streaming
      if (isConnected) {
        await audioStreamService.startStreaming();
        setIsStreaming(true);
      }
      
      // Send conversation start event
      audioStreamService.sendConversationEvent('conversation-start', {
        userId,
        timestamp: Date.now(),
      });
      
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Handle recording stop
  const handleStopRecording = () => {
    stopRecording();
    
    // Stop real-time streaming
    if (isStreaming) {
      audioStreamService.stopStreaming();
      setIsStreaming(false);
    }
    
    // Send conversation end event
    audioStreamService.sendConversationEvent('conversation-end', {
      userId,
      duration,
      timestamp: Date.now(),
    });
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Voice Recorder
        </h3>
        <p className="text-sm text-gray-600">
          Record and analyze sales conversations in real-time
        </p>
      </div>

      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Connection:</span>
          <span className={`flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Streaming:</span>
          <span className={`flex items-center ${isStreaming ? 'text-green-600' : 'text-gray-600'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isStreaming ? 'bg-green-500' : 'bg-gray-400'}`} />
            {isStreaming ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Audio Visualization */}
      <div className="mb-6">
        <canvas
          ref={canvasRef}
          width={200}
          height={60}
          className="w-full h-15 bg-gray-100 rounded-lg mx-auto"
        />
      </div>

      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            disabled={!isConnected}
            className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <>
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="flex items-center justify-center w-12 h-12 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors"
            >
              {isPaused ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            <button
              onClick={handleStopRecording}
              className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Duration Display */}
      <div className="text-center mb-4">
        <div className="text-2xl font-mono text-gray-900">
          {formatDuration(duration)}
        </div>
        <div className="text-sm text-gray-600">
          {isRecording ? 'Recording...' : isPaused ? 'Paused' : 'Ready'}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Audio Playback */}
      {audioUrl && (
        <div className="mb-4">
          <audio controls className="w-full" src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
          <button
            onClick={clearRecording}
            className="mt-2 w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Clear Recording
          </button>
        </div>
      )}

      {/* Real-time Feedback */}
      {feedback.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Real-time Feedback:</h4>
          <div className="space-y-2">
            {feedback.map((item, index) => (
              <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
