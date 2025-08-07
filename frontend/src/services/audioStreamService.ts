import { io, Socket } from 'socket.io-client';

export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
  sequence: number;
}

export interface StreamConfig {
  sampleRate: number;
  channels: number;
  bufferSize: number;
  chunkDuration: number; // in milliseconds
}

export class AudioStreamService {
  private socket: Socket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private sequenceNumber = 0;
  private isStreaming = false;
  private config: StreamConfig;

  constructor(config: Partial<StreamConfig> = {}) {
    this.config = {
      sampleRate: 44100,
      channels: 1,
      bufferSize: 4096,
      chunkDuration: 1000, // 1 second chunks
      ...config,
    };
  }

  // Connect to WebSocket server
  async connect(serverUrl: string, userId: string): Promise<void> {
    try {
      this.socket = io(serverUrl, {
        transports: ['websocket'],
        auth: {
          userId,
        },
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connected to audio streaming server');
        this.socket?.emit('join-room', userId);
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from audio streaming server');
        this.isStreaming = false;
      });

      this.socket.on('error', (error) => {
        console.error('🔌 Audio streaming error:', error);
      });

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        if (this.socket) {
          this.socket.on('connect', () => resolve());
          this.socket.on('connect_error', reject);
        }
      });

    } catch (error) {
      console.error('Failed to connect to audio streaming server:', error);
      throw error;
    }
  }

  // Start real-time audio streaming
  async startStreaming(): Promise<void> {
    if (!this.socket || this.isStreaming) {
      throw new Error('Socket not connected or already streaming');
    }

    try {
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channels,
        },
      });

      // Create audio context
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });

      // Create audio source
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create script processor for real-time processing
      this.processor = this.audioContext.createScriptProcessor(
        this.config.bufferSize,
        this.config.channels,
        this.config.channels
      );

      // Process audio data
      this.processor.onaudioprocess = (event) => {
        if (!this.isStreaming) return;

        const inputBuffer = event.inputBuffer;
        const outputBuffer = event.outputBuffer;

        // Get audio data from input channel
        const inputData = inputBuffer.getChannelData(0);
        const outputData = outputBuffer.getChannelData(0);

        // Copy input to output (pass-through)
        for (let i = 0; i < inputData.length; i++) {
          outputData[i] = inputData[i];
        }

        // Convert to 16-bit PCM and send via WebSocket
        this.sendAudioChunk(inputData);
      };

      // Connect the audio nodes
      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.isStreaming = true;
      console.log('🎤 Started real-time audio streaming');

    } catch (error) {
      console.error('Failed to start audio streaming:', error);
      throw error;
    }
  }

  // Stop audio streaming
  stopStreaming(): void {
    this.isStreaming = false;

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    console.log('🎤 Stopped audio streaming');
  }

  // Send audio chunk to server
  private sendAudioChunk(audioData: Float32Array): void {
    if (!this.socket || !this.isStreaming) return;

    try {
      // Convert Float32Array to Int16Array (16-bit PCM)
      const int16Data = new Int16Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        int16Data[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
      }

      // Create audio chunk
      const chunk: AudioChunk = {
        data: int16Data.buffer,
        timestamp: Date.now(),
        sequence: this.sequenceNumber++,
      };

      // Send via WebSocket
      this.socket.emit('voice-data', chunk);

    } catch (error) {
      console.error('Failed to send audio chunk:', error);
    }
  }

  // Send conversation event
  sendConversationEvent(eventType: string, data: any): void {
    if (!this.socket) return;

    this.socket.emit('conversation-event', {
      type: eventType,
      data,
      timestamp: Date.now(),
    });
  }

  // Listen for real-time analysis results
  onAnalysisResult(callback: (result: any) => void): void {
    if (!this.socket) return;

    this.socket.on('conversation-analysis', callback);
  }

  // Listen for feedback
  onFeedback(callback: (feedback: any) => void): void {
    if (!this.socket) return;

    this.socket.on('real-time-feedback', callback);
  }

  // Disconnect from server
  disconnect(): void {
    this.stopStreaming();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get streaming status
  getStreamingStatus(): boolean {
    return this.isStreaming;
  }
}

// Create singleton instance
export const audioStreamService = new AudioStreamService();
