const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/server');
const { User } = require('../src/models/User');
const { Conversation } = require('../src/models/Conversation');

describe('Conversations API', () => {
  let server;
  let authToken;
  let userId;
  
  beforeAll(async () => {
    // Connect to test database
    const mongoURI = process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/car-sales-ai-test';
    await mongoose.connect(mongoURI);
    
    // Start server
    server = app.listen(0);
  });

  afterAll(async () => {
    // Clean up database
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    // Clear data before each test
    await User.deleteMany({});
    await Conversation.deleteMany({});
    
    // Create and authenticate a test user
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = response.body.token;
    userId = response.body.user.id;
  });

  describe('POST /api/conversations', () => {
    it('should create a new conversation', async () => {
      const conversationData = {
        customerName: 'John Doe',
        customerPhone: '555-1234'
      };

      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conversationData)
        .expect(201);

      expect(response.body).toHaveProperty('conversation');
      expect(response.body.conversation.customerName).toBe(conversationData.customerName);
      expect(response.body.conversation.customerPhone).toBe(conversationData.customerPhone);
      expect(response.body.conversation.status).toBe('active');
    });

    it('should create conversation without customer details', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      expect(response.body).toHaveProperty('conversation');
      expect(response.body.conversation.status).toBe('active');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/conversations')
        .send({
          customerName: 'John Doe',
          customerPhone: '555-1234'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/conversations', () => {
    beforeEach(async () => {
      // Create test conversations
      const conversations = [
        {
          userId: new mongoose.Types.ObjectId(userId),
          customerName: 'John Doe',
          status: 'completed',
          analysis: {
            tone: 'positive',
            confidence: 0.8,
            keyTopics: ['price', 'features'],
            objections: [],
            closingAttempts: 2,
            negotiationPhases: ['introduction', 'presentation'],
            overallScore: 85,
            feedback: ['Great rapport building'],
            salesTechniques: ['value proposition'],
            scenarioProgress: 75,
            customerEngagement: 80
          }
        },
        {
          userId: new mongoose.Types.ObjectId(userId),
          customerName: 'Jane Smith',
          status: 'active',
          analysis: {
            tone: 'neutral',
            confidence: 0.7,
            keyTopics: ['financing'],
            objections: ['price'],
            closingAttempts: 1,
            negotiationPhases: ['needs-assessment'],
            overallScore: 70,
            feedback: ['Address price concerns'],
            salesTechniques: [],
            scenarioProgress: 50,
            customerEngagement: 60
          }
        }
      ];

      await Conversation.insertMany(conversations);
    });

    it('should get all conversations for authenticated user', async () => {
      const response = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('conversations');
      expect(response.body.conversations).toHaveLength(2);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should filter conversations by status', async () => {
      const response = await request(app)
        .get('/api/conversations')
        .query({ status: 'completed' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.conversations).toHaveLength(1);
      expect(response.body.conversations[0].status).toBe('completed');
    });

    it('should paginate conversations', async () => {
      const response = await request(app)
        .get('/api/conversations')
        .query({ page: 1, limit: 1 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.conversations).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should sort conversations', async () => {
      const response = await request(app)
        .get('/api/conversations')
        .query({ sortBy: 'customerName', sortOrder: 'asc' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.conversations[0].customerName).toBe('Jane Smith');
      expect(response.body.conversations[1].customerName).toBe('John Doe');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/conversations')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/conversations/:id', () => {
    let conversationId;

    beforeEach(async () => {
      const conversation = new Conversation({
        userId: new mongoose.Types.ObjectId(userId),
        customerName: 'John Doe',
        status: 'completed',
        analysis: {
          tone: 'positive',
          confidence: 0.8,
          keyTopics: ['price'],
          objections: [],
          closingAttempts: 1,
          negotiationPhases: ['closing'],
          overallScore: 85,
          feedback: ['Excellent closing'],
          salesTechniques: ['assumptive close'],
          scenarioProgress: 90,
          customerEngagement: 85
        }
      });

      const saved = await conversation.save();
      conversationId = saved._id;
    });

    it('should get conversation by ID', async () => {
      const response = await request(app)
        .get(`/api/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('conversation');
      expect(response.body.conversation.customerName).toBe('John Doe');
    });

    it('should return 404 for non-existent conversation', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/conversations/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/conversations/${conversationId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/conversations/:id', () => {
    let conversationId;

    beforeEach(async () => {
      const conversation = new Conversation({
        userId: new mongoose.Types.ObjectId(userId),
        customerName: 'John Doe',
        status: 'active'
      });

      const saved = await conversation.save();
      conversationId = saved._id;
    });

    it('should update conversation', async () => {
      const updateData = {
        status: 'completed',
        notes: 'Customer was satisfied',
        analysis: {
          tone: 'positive',
          confidence: 0.9,
          keyTopics: ['features'],
          objections: [],
          closingAttempts: 1,
          negotiationPhases: ['closing'],
          overallScore: 90,
          feedback: ['Excellent presentation'],
          salesTechniques: ['benefit stacking'],
          scenarioProgress: 95,
          customerEngagement: 90
        }
      };

      const response = await request(app)
        .put(`/api/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.conversation.status).toBe('completed');
      expect(response.body.conversation.notes).toBe('Customer was satisfied');
      expect(response.body.conversation.analysis.overallScore).toBe(90);
    });

    it('should return 404 for non-existent conversation', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/conversations/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/conversations/:id/end', () => {
    let conversationId;

    beforeEach(async () => {
      const conversation = new Conversation({
        userId: new mongoose.Types.ObjectId(userId),
        customerName: 'John Doe',
        status: 'active'
      });

      const saved = await conversation.save();
      conversationId = saved._id;
    });

    it('should end conversation', async () => {
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/end`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.conversation.status).toBe('completed');
      expect(response.body.conversation.endTime).toBeDefined();
    });
  });

  describe('GET /api/conversations/analytics/summary', () => {
    beforeEach(async () => {
      // Create test conversations with analytics data
      const conversations = [
        {
          userId: new mongoose.Types.ObjectId(userId),
          status: 'completed',
          duration: 300,
          analysis: {
            tone: 'positive',
            overallScore: 85,
            salesTechniques: ['value proposition', 'trial close']
          }
        },
        {
          userId: new mongoose.Types.ObjectId(userId),
          status: 'completed',
          duration: 450,
          analysis: {
            tone: 'neutral',
            overallScore: 70,
            salesTechniques: ['needs assessment']
          }
        }
      ];

      await Conversation.insertMany(conversations);
    });

    it('should get analytics summary', async () => {
      const response = await request(app)
        .get('/api/conversations/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics.totalConversations).toBe(2);
      expect(response.body.analytics.averageDuration).toBe(375);
      expect(response.body.analytics.averageScore).toBe(77.5);
      expect(response.body.analytics).toHaveProperty('statusBreakdown');
      expect(response.body.analytics).toHaveProperty('toneBreakdown');
    });

    it('should filter analytics by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const response = await request(app)
        .get('/api/conversations/analytics/summary')
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('analytics');
    });
  });
});
