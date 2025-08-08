import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'salesperson' | 'manager' | 'admin';
  dealership: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  preferences: {
    notifications: boolean;
    voiceRecording: boolean;
    autoAnalysis: boolean;
    remoteProcessing?: {
      remoteScriptPath?: string;
      remoteInputDir?: string;
      remoteOutputDir?: string;
      defaultModel?: 'u2net' | 'u2netp' | 'u2net_human_seg';
      pythonPath?: string;
    };
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['salesperson', 'manager', 'admin'],
    default: 'salesperson'
  },
  dealership: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    voiceRecording: {
      type: Boolean,
      default: true
    },
    autoAnalysis: {
      type: Boolean,
      default: true
    },
    remoteProcessing: {
      remoteScriptPath: { type: String },
      remoteInputDir: { type: String },
      remoteOutputDir: { type: String },
      defaultModel: { type: String, enum: ['u2net', 'u2netp', 'u2net_human_seg'] },
      pythonPath: { type: String }
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods['comparePassword'] = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, (this as any)['password']);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc, ret) {
    // Remove password from serialized output
    Reflect.deleteProperty(ret as any, 'password');
    return ret;
  }
});

export const User = mongoose.model<IUser>('User', userSchema);
