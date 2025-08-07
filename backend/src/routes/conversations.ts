import express from 'express';
import { Conversation } from '../models/Conversation';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// Start a new conversation
router.post('/', async (req, res, next) => {
  try {
    const { customerName, customerPhone } = req.body;
    
    const conversation = new Conversation({
      userId: req.user._id,
      customerName,
      customerPhone,
      startTime: new Date(),
      status: 'active'
    });

    await conversation.save();

    res.status(201).json({
      message: 'Conversation started successfully',
      conversation
    });
  } catch (error) {
    next(error);
  }
});

// Get all conversations for current user
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'startTime', sortOrder = 'desc' } = req.query;
    
    const query: any = { userId: req.user._id };
    if (status) query.status = status;

    const conversations = await Conversation.find(query)
      .sort({ [sortBy as string]: sortOrder === 'desc' ? -1 : 1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Conversation.countDocuments(query);

    res.json({
      conversations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get conversation by ID
router.get('/:id', async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    res.json({ conversation });
  } catch (error) {
    next(error);
  }
});

// Update conversation
router.put('/:id', async (req, res, next) => {
  try {
    const { status, endTime, transcript, analysis, notes, tags } = req.body;
    
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    if (status) conversation.status = status;
    if (endTime) conversation.endTime = new Date(endTime);
    if (transcript) conversation.transcript = transcript;
    if (analysis) conversation.analysis = { ...conversation.analysis, ...analysis };
    if (notes) conversation.notes = notes;
    if (tags) conversation.tags = tags;

    await conversation.save();

    res.json({
      message: 'Conversation updated successfully',
      conversation
    });
  } catch (error) {
    next(error);
  }
});

// End conversation
router.post('/:id/end', async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      throw createError('Conversation not found', 404);
    }

    conversation.status = 'completed';
    conversation.endTime = new Date();

    await conversation.save();

    res.json({
      message: 'Conversation ended successfully',
      conversation
    });
  } catch (error) {
    next(error);
  }
});

// Get conversation analytics
router.get('/analytics/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query: any = { userId: req.user._id };
    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const conversations = await Conversation.find(query);
    
    const analytics = {
      totalConversations: conversations.length,
      averageDuration: conversations.reduce((acc, conv) => acc + (conv.duration || 0), 0) / conversations.length,
      averageScore: conversations.reduce((acc, conv) => acc + conv.analysis.overallScore, 0) / conversations.length,
      statusBreakdown: {
        active: conversations.filter(c => c.status === 'active').length,
        completed: conversations.filter(c => c.status === 'completed').length,
        paused: conversations.filter(c => c.status === 'paused').length
      },
      toneBreakdown: {
        positive: conversations.filter(c => c.analysis.tone === 'positive').length,
        neutral: conversations.filter(c => c.analysis.tone === 'neutral').length,
        negative: conversations.filter(c => c.analysis.tone === 'negative').length
      }
    };

    res.json({ analytics });
  } catch (error) {
    next(error);
  }
});

export default router;
