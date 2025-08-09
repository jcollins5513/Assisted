const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { app } = require('../src/server');
const { User } = require('../src/models/User');

describe('Uploads API', () => {
  let server;
  let authToken;
  let userId;
  
  beforeAll(async () => {
    // Connect to test database
    const mongoURI = process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/car-sales-ai-test';
    await mongoose.connect(mongoURI);
    
    // Start server
    server = app.listen(0);
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up database
    await User.deleteMany({});
    await mongoose.connection.close();
    server.close();
    
    // Clean up test files
    const uploadsDir = path.join(__dirname, '../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        if (file.startsWith('test_')) {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      });
    }
  });

  beforeEach(async () => {
    // Clear data before each test
    await User.deleteMany({});
    
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

  // Create a test image buffer
  const createTestImage = () => {
    // Create a simple 1x1 PNG image buffer
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk size
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // Width: 1
      0x00, 0x00, 0x00, 0x01, // Height: 1
      0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
      0x1F, 0x15, 0xC4, 0x89, // CRC
      0x00, 0x00, 0x00, 0x0A, // IDAT chunk size
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // Compressed data
      0x0D, 0x0A, 0x2D, 0xB4, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk size
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    return pngBuffer;
  };

  describe('POST /api/uploads/image', () => {
    it('should upload a single image successfully', async () => {
      const testImage = createTestImage();
      
      const response = await request(app)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImage, 'test_image.png')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data).toHaveProperty('originalName', 'test_image.png');
      expect(response.body.data).toHaveProperty('mimeType', 'image/png');
      expect(response.body.data).toHaveProperty('size');
    });

    it('should reject non-image files', async () => {
      const textBuffer = Buffer.from('This is not an image');
      
      const response = await request(app)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', textBuffer, 'test.txt')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject files that are too large', async () => {
      // Create a large buffer (simulate large file)
      const largeBuffer = Buffer.alloc(20 * 1024 * 1024); // 20MB
      
      const response = await request(app)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largeBuffer, 'large_image.png')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      const testImage = createTestImage();
      
      const response = await request(app)
        .post('/api/uploads/image')
        .attach('image', testImage, 'test_image.png')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return error when no file is provided', async () => {
      const response = await request(app)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/uploads/images', () => {
    it('should upload multiple images successfully', async () => {
      const testImage1 = createTestImage();
      const testImage2 = createTestImage();
      
      const response = await request(app)
        .post('/api/uploads/images')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('images', testImage1, 'test_image1.png')
        .attach('images', testImage2, 'test_image2.png')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('files');
      expect(response.body.data.files).toHaveLength(2);
      expect(response.body.data.files[0]).toHaveProperty('filename');
      expect(response.body.data.files[1]).toHaveProperty('filename');
    });

    it('should handle mixed valid and invalid files', async () => {
      const testImage = createTestImage();
      const textBuffer = Buffer.from('This is not an image');
      
      const response = await request(app)
        .post('/api/uploads/images')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('images', testImage, 'test_image.png')
        .attach('images', textBuffer, 'test.txt')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      const testImage = createTestImage();
      
      const response = await request(app)
        .post('/api/uploads/images')
        .attach('images', testImage, 'test_image.png')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/uploads', () => {
    beforeEach(async () => {
      // Upload some test files first
      const testImage = createTestImage();
      
      await request(app)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImage, 'test_image1.png');

      await request(app)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImage, 'test_image2.png');
    });

    it('should get uploaded files list', async () => {
      const response = await request(app)
        .get('/api/uploads')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('files');
      expect(response.body.data.files.length).toBeGreaterThanOrEqual(2);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/uploads')
        .query({ page: 1, limit: 1 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });

    it('should filter by file type', async () => {
      const response = await request(app)
        .get('/api/uploads')
        .query({ type: 'image' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.files.forEach(file => {
        expect(file.mimeType).toMatch(/^image\//);
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/uploads')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/uploads/:id', () => {
    let uploadId;

    beforeEach(async () => {
      // Upload a test file first
      const testImage = createTestImage();
      
      const uploadResponse = await request(app)
        .post('/api/uploads/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImage, 'test_delete.png');

      uploadId = uploadResponse.body.data.id;
    });

    it('should delete uploaded file', async () => {
      const response = await request(app)
        .delete(`/api/uploads/${uploadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent file', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/uploads/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/uploads/${uploadId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('File validation', () => {
    it('should accept valid image formats', async () => {
      const formats = [
        { buffer: createTestImage(), name: 'test.png', expected: 'image/png' },
        { buffer: createTestImage(), name: 'test.jpg', expected: 'image/jpeg' },
        { buffer: createTestImage(), name: 'test.gif', expected: 'image/gif' },
        { buffer: createTestImage(), name: 'test.webp', expected: 'image/webp' }
      ];

      for (const format of formats) {
        const response = await request(app)
          .post('/api/uploads/image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', format.buffer, format.name)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should reject invalid file extensions', async () => {
      const invalidFiles = [
        { buffer: Buffer.from('test'), name: 'test.exe' },
        { buffer: Buffer.from('test'), name: 'test.pdf' },
        { buffer: Buffer.from('test'), name: 'test.doc' }
      ];

      for (const file of invalidFiles) {
        const response = await request(app)
          .post('/api/uploads/image')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', file.buffer, file.name)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      }
    });
  });
});
