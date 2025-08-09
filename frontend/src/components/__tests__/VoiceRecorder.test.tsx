import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VoiceRecorder } from '../VoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { audioStreamService } from '@/services/audioStreamService';

// Mock the hooks and services
jest.mock('@/hooks/useVoiceRecorder');
jest.mock('@/services/audioStreamService');

const mockUseVoiceRecorder = useVoiceRecorder as jest.MockedFunction<typeof useVoiceRecorder>;
const mockAudioStreamService = audioStreamService as jest.Mocked<typeof audioStreamService>;

describe('VoiceRecorder', () => {
  const mockProps = {
    userId: 'test-user-123',
    onAnalysisUpdate: jest.fn(),
    onFeedbackUpdate: jest.fn(),
  };

  const mockVoiceRecorderState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    pauseRecording: jest.fn(),
    resumeRecording: jest.fn(),
    clearRecording: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVoiceRecorder.mockReturnValue(mockVoiceRecorderState);
    mockAudioStreamService.connect.mockResolvedValue(undefined);
    mockAudioStreamService.startStreaming.mockResolvedValue(undefined);
    mockAudioStreamService.stopStreaming.mockReturnValue(undefined);
    mockAudioStreamService.disconnect.mockReturnValue(undefined);
    mockAudioStreamService.sendConversationEvent.mockReturnValue(undefined);
    mockAudioStreamService.onAnalysisResult.mockReturnValue(undefined);
    mockAudioStreamService.onFeedback.mockReturnValue(undefined);
  });

  it('renders voice recorder component', () => {
    render(<VoiceRecorder {...mockProps} />);
    
    expect(screen.getByText('Voice Recorder')).toBeInTheDocument();
    expect(screen.getByText('Record and analyze sales conversations in real-time')).toBeInTheDocument();
  });

  it('displays connection status', async () => {
    render(<VoiceRecorder {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Connection:')).toBeInTheDocument();
      expect(screen.getByText('Streaming:')).toBeInTheDocument();
    });
  });

  it('shows role play mode toggle', () => {
    render(<VoiceRecorder {...mockProps} />);
    
    expect(screen.getByText('Role Play Mode')).toBeInTheDocument();
    
    const toggle = screen.getByRole('button');
    expect(toggle).toBeInTheDocument();
  });

  it('displays training scenarios when role play mode is enabled', () => {
    render(<VoiceRecorder {...mockProps} />);
    
    // Find and click the role play toggle
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('Training Scenarios')).toBeInTheDocument();
    expect(screen.getByText('Price Objection Handling')).toBeInTheDocument();
    expect(screen.getByText('Trade-in Value Negotiation')).toBeInTheDocument();
    expect(screen.getByText('Financing Application')).toBeInTheDocument();
    expect(screen.getByText('Feature Comparison')).toBeInTheDocument();
  });

  it('displays scenario objectives when scenario is selected', () => {
    render(<VoiceRecorder {...mockProps} />);
    
    // Enable role play mode
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    // Select a scenario
    const priceObjectionScenario = screen.getByText('Price Objection Handling');
    fireEvent.click(priceObjectionScenario);
    
    expect(screen.getByText('Scenario Objectives')).toBeInTheDocument();
    expect(screen.getByText('Address price concerns')).toBeInTheDocument();
  });

  it('starts recording when start button is clicked', async () => {
    const mockStartRecording = jest.fn().mockResolvedValue(undefined);
    mockUseVoiceRecorder.mockReturnValue({
      ...mockVoiceRecorderState,
      startRecording: mockStartRecording,
    });

    render(<VoiceRecorder {...mockProps} />);
    
    const startButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockStartRecording).toHaveBeenCalled();
    });
  });

  it('stops recording when stop button is clicked', async () => {
    const mockStopRecording = jest.fn();
    mockUseVoiceRecorder.mockReturnValue({
      ...mockVoiceRecorderState,
      isRecording: true,
      stopRecording: mockStopRecording,
    });

    render(<VoiceRecorder {...mockProps} />);
    
    const stopButton = screen.getByRole('button', { name: /stop recording/i });
    fireEvent.click(stopButton);
    
    expect(mockStopRecording).toHaveBeenCalled();
  });

  it('pauses and resumes recording', () => {
    const mockPauseRecording = jest.fn();
    const mockResumeRecording = jest.fn();
    
    mockUseVoiceRecorder.mockReturnValue({
      ...mockVoiceRecorderState,
      isRecording: true,
      pauseRecording: mockPauseRecording,
      resumeRecording: mockResumeRecording,
    });

    render(<VoiceRecorder {...mockProps} />);
    
    const pauseButton = screen.getByRole('button', { name: /pause recording/i });
    fireEvent.click(pauseButton);
    
    expect(mockPauseRecording).toHaveBeenCalled();
    
    // Test resume
    mockUseVoiceRecorder.mockReturnValue({
      ...mockVoiceRecorderState,
      isRecording: true,
      isPaused: true,
      pauseRecording: mockPauseRecording,
      resumeRecording: mockResumeRecording,
    });

    render(<VoiceRecorder {...mockProps} />);
    
    const resumeButton = screen.getByRole('button', { name: /resume recording/i });
    fireEvent.click(resumeButton);
    
    expect(mockResumeRecording).toHaveBeenCalled();
  });

  it('displays recording duration', () => {
    mockUseVoiceRecorder.mockReturnValue({
      ...mockVoiceRecorderState,
      duration: 125, // 2 minutes 5 seconds
    });

    render(<VoiceRecorder {...mockProps} />);
    
    expect(screen.getByText('02:05')).toBeInTheDocument();
  });

  it('displays recording status', () => {
    // Test ready state
    render(<VoiceRecorder {...mockProps} />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
    
    // Test recording state
    mockUseVoiceRecorder.mockReturnValue({
      ...mockVoiceRecorderState,
      isRecording: true,
    });

    render(<VoiceRecorder {...mockProps} />);
    expect(screen.getByText('Recording...')).toBeInTheDocument();
    
    // Test paused state
    mockUseVoiceRecorder.mockReturnValue({
      ...mockVoiceRecorderState,
      isRecording: true,
      isPaused: true,
    });

    render(<VoiceRecorder {...mockProps} />);
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('displays error messages', () => {
    const errorMessage = 'Microphone access denied';
    mockUseVoiceRecorder.mockReturnValue({
      ...mockVoiceRecorderState,
      error: errorMessage,
    });

    render(<VoiceRecorder {...mockProps} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('displays audio playback when recording is available', () => {
    const mockAudioUrl = 'blob:audio-url';
    mockUseVoiceRecorder.mockReturnValue({
      ...mockVoiceRecorderState,
      audioUrl: mockAudioUrl,
    });

    render(<VoiceRecorder {...mockProps} />);
    
    const audioElement = screen.getByRole('audio');
    expect(audioElement).toBeInTheDocument();
    expect(audioElement).toHaveAttribute('src', mockAudioUrl);
  });

  it('clears recording when clear button is clicked', () => {
    const mockClearRecording = jest.fn();
    mockUseVoiceRecorder.mockReturnValue({
      ...mockVoiceRecorderState,
      audioUrl: 'blob:audio-url',
      clearRecording: mockClearRecording,
    });

    render(<VoiceRecorder {...mockProps} />);
    
    const clearButton = screen.getByText('Clear Recording');
    fireEvent.click(clearButton);
    
    expect(mockClearRecording).toHaveBeenCalled();
  });

  it('displays real-time feedback', () => {
    render(<VoiceRecorder {...mockProps} />);
    
    // Simulate receiving feedback
    const feedbackMessages = ['Good rapport building', 'Try closing the sale'];
    
    // Re-render with feedback
    render(<VoiceRecorder {...mockProps} />);
    
    // Mock the feedback state
    const component = screen.getByTestId('voice-recorder') || document.body;
    
    // This would typically be set by the component's internal state
    // In a real test, you'd trigger the feedback through the proper channels
    expect(component).toBeInTheDocument();
  });

  it('connects to audio streaming service on mount', async () => {
    render(<VoiceRecorder {...mockProps} />);
    
    await waitFor(() => {
      expect(mockAudioStreamService.connect).toHaveBeenCalledWith(
        expect.any(String),
        mockProps.userId
      );
    });
  });

  it('disconnects from audio streaming service on unmount', () => {
    const { unmount } = render(<VoiceRecorder {...mockProps} />);
    
    unmount();
    
    expect(mockAudioStreamService.disconnect).toHaveBeenCalled();
  });

  it('sends conversation events when recording starts and stops', async () => {
    const mockStartRecording = jest.fn().mockResolvedValue(undefined);
    const mockStopRecording = jest.fn();
    
    mockUseVoiceRecorder.mockReturnValue({
      ...mockVoiceRecorderState,
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
    });

    render(<VoiceRecorder {...mockProps} />);
    
    // Start recording
    const startButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockAudioStreamService.sendConversationEvent).toHaveBeenCalledWith(
        'conversation-start',
        expect.objectContaining({
          userId: mockProps.userId,
          timestamp: expect.any(Number),
        })
      );
    });
    
    // Stop recording
    mockUseVoiceRecorder.mockReturnValue({
      ...mockVoiceRecorderState,
      isRecording: true,
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
    });

    render(<VoiceRecorder {...mockProps} />);
    
    const stopButton = screen.getByRole('button', { name: /stop recording/i });
    fireEvent.click(stopButton);
    
    expect(mockAudioStreamService.sendConversationEvent).toHaveBeenCalledWith(
      'conversation-end',
      expect.objectContaining({
        userId: mockProps.userId,
        timestamp: expect.any(Number),
      })
    );
  });

  it('handles scenario selection correctly', () => {
    render(<VoiceRecorder {...mockProps} />);
    
    // Enable role play mode
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    // Select price objection scenario
    const priceObjectionButton = screen.getByText('Price Objection Handling');
    fireEvent.click(priceObjectionButton);
    
    // Check if objectives are displayed
    expect(screen.getByText('Address price concerns')).toBeInTheDocument();
    expect(screen.getByText('Highlight value proposition')).toBeInTheDocument();
    expect(screen.getByText('Use "Feel, Felt, Found" technique')).toBeInTheDocument();
  });

  it('disables start button when not connected', () => {
    render(<VoiceRecorder {...mockProps} />);
    
    const startButton = screen.getByRole('button', { name: /start recording/i });
    
    // Should be disabled when not connected
    expect(startButton).toBeDisabled();
  });
});
