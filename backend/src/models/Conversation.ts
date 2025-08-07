import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  customerName?: string;
  customerPhone?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'active' | 'completed' | 'paused';
  audioFile?: string;
  transcript?: string;
  analysis: {
    tone: 'positive' | 'neutral' | 'negative';
    confidence: number;
    keyTopics: string[];
    objections: string[];
    closingAttempts: number;
    negotiationPhases: string[];
    overallScore: number;
    feedback: string[];
  };
  tags: string[];
  notes?: string;
}

const conversationSchema = new Schema<IConversation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in seconds
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  audioFile: {
    type: String
  },
  transcript: {
    type: String
  },
  analysis: {
    tone: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    keyTopics: [{
      type: String,
      trim: true
    }],
    objections: [{
      type: String,
      trim: true
    }],
    closingAttempts: {
      type: Number,
      default: 0
    },
    negotiationPhases: [{
      type: String,
      trim: true
    }],
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    feedback: [{
      type: String,
      trim: true
    }]
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
conversationSchema.index({ userId: 1, startTime: -1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ 'analysis.overallScore': -1 });

// Virtual for duration calculation
conversationSchema.virtual('calculatedDuration').get(function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  }
  return null;
});

// Pre-save middleware to calculate duration
conversationSchema.pre('save', function(next) {
  if (this.endTime && this.startTime && !this.duration) {
    this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  }
  next();
});

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
