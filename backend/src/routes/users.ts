import express from 'express';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    const { firstName, lastName, phone, avatar, preferences } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        dealership: user.dealership,
        phone: user.phone,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user preferences
router.put('/preferences', async (req, res, next) => {
  try {
    const { notifications, voiceRecording, autoAnalysis } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    if (notifications !== undefined) user.preferences.notifications = notifications;
    if (voiceRecording !== undefined) user.preferences.voiceRecording = voiceRecording;
    if (autoAnalysis !== undefined) user.preferences.autoAnalysis = autoAnalysis;

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    next(error);
  }
});

// Get all users (admin only)
router.get('/', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw createError('Access denied', 403);
    }

    const users = await User.find({}).select('-password');
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Get user by ID (admin only)
router.get('/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw createError('Access denied', 403);
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
