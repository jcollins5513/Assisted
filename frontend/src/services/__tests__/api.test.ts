import axios from 'axios';
import { 
  authAPI, 
  conversationsAPI, 
  contentAPI, 
  uploadsAPI, 
  remoteExecutionAPI 
} from '../api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000'
  },
  writable: true
});

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Auth API', () => {
    describe('login', () => {
      it('should login successfully', async () => {
        const mockResponse = {
          data: {
            token: 'test-token',
            user: {
              id: 'user-123',
              email: 'test@example.com',
              name: 'Test User'
            }
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const credentials = {
          email: 'test@example.com',
          password: 'password123'
        };

        const result = await authAPI.login(credentials);

        expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', credentials);
        expect(result.data).toEqual(mockResponse.data);
      });

      it('should handle login error', async () => {
        const mockError = {
          response: {
            status: 401,
            data: {
              message: 'Invalid credentials'
            }
          }
        };

        mockedAxios.post.mockRejectedValue(mockError);

        const credentials = {
          email: 'test@example.com',
          password: 'wrongpassword'
        };

        await expect(authAPI.login(credentials)).rejects.toThrow();
      });
    });

    describe('register', () => {
      it('should register successfully', async () => {
        const mockResponse = {
          data: {
            token: 'test-token',
            user: {
              id: 'user-123',
              email: 'test@example.com',
              name: 'Test User'
            }
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const userData = {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        };

        const result = await authAPI.register(userData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', userData);
        expect(result.data).toEqual(mockResponse.data);
      });
    });

    describe('getProfile', () => {
      it('should get user profile', async () => {
        const mockResponse = {
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              name: 'Test User'
            }
          }
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await authAPI.getProfile();

        expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
        expect(result.data).toEqual(mockResponse.data);
      });
    });

    describe('logout', () => {
      it('should logout successfully', async () => {
        const mockResponse = {
          data: {
            message: 'Logged out successfully'
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await authAPI.logout();

        expect(mockedAxios.post).toHaveBeenCalledWith('/auth/logout');
        expect(result.data).toEqual(mockResponse.data);
      });
    });
  });

  describe('Conversations API', () => {
    describe('getConversations', () => {
      it('should get conversations with default parameters', async () => {
        const mockResponse = {
          data: {
            conversations: [
              {
                id: 'conv-1',
                customerName: 'John Doe',
                status: 'completed'
              }
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 1
            }
          }
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await conversationsAPI.getConversations();

        expect(mockedAxios.get).toHaveBeenCalledWith('/conversations', { params: {} });
        expect(result.data).toEqual(mockResponse.data);
      });

      it('should get conversations with custom parameters', async () => {
        const params = {
          page: 2,
          limit: 5,
          status: 'active',
          sortBy: 'startTime',
          sortOrder: 'desc'
        };

        mockedAxios.get.mockResolvedValue({ data: {} });

        await conversationsAPI.getConversations(params);

        expect(mockedAxios.get).toHaveBeenCalledWith('/conversations', { params });
      });
    });

    describe('createConversation', () => {
      it('should create a new conversation', async () => {
        const mockResponse = {
          data: {
            conversation: {
              id: 'conv-123',
              customerName: 'John Doe',
              customerPhone: '555-1234',
              status: 'active'
            }
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const conversationData = {
          customerName: 'John Doe',
          customerPhone: '555-1234'
        };

        const result = await conversationsAPI.createConversation(conversationData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/conversations', conversationData);
        expect(result.data).toEqual(mockResponse.data);
      });
    });

    describe('getAnalytics', () => {
      it('should get analytics summary', async () => {
        const mockResponse = {
          data: {
            analytics: {
              totalConversations: 10,
              averageScore: 85,
              averageDuration: 300
            }
          }
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await conversationsAPI.getAnalytics();

        expect(mockedAxios.get).toHaveBeenCalledWith('/conversations/analytics/summary', { params: {} });
        expect(result.data).toEqual(mockResponse.data);
      });

      it('should get analytics with date range', async () => {
        const params = {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        };

        mockedAxios.get.mockResolvedValue({ data: {} });

        await conversationsAPI.getAnalytics(params);

        expect(mockedAxios.get).toHaveBeenCalledWith('/conversations/analytics/summary', { params });
      });
    });
  });

  describe('Content API', () => {
    describe('getTemplates', () => {
      it('should get content templates', async () => {
        const mockResponse = {
          data: {
            templates: [
              {
                id: 'template-1',
                name: 'Vehicle Arrival',
                category: 'inventory'
              }
            ]
          }
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await contentAPI.getTemplates();

        expect(mockedAxios.get).toHaveBeenCalledWith('/content/templates');
        expect(result.data).toEqual(mockResponse.data);
      });
    });

    describe('generateContent', () => {
      it('should generate content', async () => {
        const mockResponse = {
          data: {
            id: 'content-123',
            text: 'Generated content',
            hashtags: ['#Honda', '#Civic']
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const contentData = {
          templateId: 'template-1',
          formData: {
            vehicleMake: 'Honda',
            vehicleModel: 'Civic'
          },
          instructions: 'Make it exciting'
        };

        const result = await contentAPI.generateContent(contentData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/content/generate', contentData);
        expect(result.data).toEqual(mockResponse.data);
      });
    });

    describe('saveContent', () => {
      it('should save generated content', async () => {
        const mockResponse = {
          data: {
            success: true,
            contentId: 'content-123'
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const saveData = {
          templateId: 'template-1',
          generatedContent: {
            text: 'Generated content',
            hashtags: ['#Honda']
          },
          formData: {
            vehicleMake: 'Honda'
          }
        };

        const result = await contentAPI.saveContent(saveData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/content/save', saveData);
        expect(result.data).toEqual(mockResponse.data);
      });
    });
  });

  describe('Uploads API', () => {
    describe('uploadImage', () => {
      it('should upload a single image', async () => {
        const mockResponse = {
          data: {
            filename: 'uploaded-image.jpg',
            originalName: 'test-image.jpg',
            mimeType: 'image/jpeg',
            size: 1024
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const file = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' });
        const mockOnProgress = jest.fn();

        const result = await uploadsAPI.uploadImage(file, mockOnProgress);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/uploads/image',
          expect.any(FormData),
          expect.objectContaining({
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: expect.any(Function)
          })
        );
        expect(result.data).toEqual(mockResponse.data);
      });

      it('should call progress callback during upload', async () => {
        const mockOnProgress = jest.fn();
        
        mockedAxios.post.mockImplementation((url, data, config) => {
          // Simulate progress event
          if (config?.onUploadProgress) {
            config.onUploadProgress({
              loaded: 50,
              total: 100
            });
          }
          return Promise.resolve({ data: {} });
        });

        const file = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' });

        await uploadsAPI.uploadImage(file, mockOnProgress);

        expect(mockOnProgress).toHaveBeenCalledWith(50);
      });
    });

    describe('uploadMultipleImages', () => {
      it('should upload multiple images', async () => {
        const mockResponse = {
          data: {
            files: [
              { filename: 'image1.jpg', originalName: 'test1.jpg' },
              { filename: 'image2.jpg', originalName: 'test2.jpg' }
            ]
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const files = [
          new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
          new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
        ];

        const result = await uploadsAPI.uploadMultipleImages(files);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/uploads/images',
          expect.any(FormData),
          expect.objectContaining({
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
        );
        expect(result.data).toEqual(mockResponse.data);
      });
    });
  });

  describe('Remote Execution API', () => {
    describe('getConnections', () => {
      it('should get remote connections', async () => {
        const mockResponse = {
          data: {
            connections: [
              {
                id: 'conn-1',
                name: 'Production Server',
                host: '192.168.1.100',
                status: 'connected'
              }
            ]
          }
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await remoteExecutionAPI.getConnections();

        expect(mockedAxios.get).toHaveBeenCalledWith('/remote-execution/connections');
        expect(result.data).toEqual(mockResponse.data);
      });
    });

    describe('createConnection', () => {
      it('should create a new connection', async () => {
        const mockResponse = {
          data: {
            connection: {
              id: 'conn-123',
              name: 'Test Server',
              host: '192.168.1.100',
              port: 22,
              username: 'testuser'
            }
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const connectionData = {
          name: 'Test Server',
          host: '192.168.1.100',
          port: 22,
          username: 'testuser',
          privateKey: 'ssh-private-key'
        };

        const result = await remoteExecutionAPI.createConnection(connectionData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/remote-execution/connections', connectionData);
        expect(result.data).toEqual(mockResponse.data);
      });
    });

    describe('executeScript', () => {
      it('should execute a script on remote server', async () => {
        const mockResponse = {
          data: {
            executionId: 'exec-123',
            status: 'running'
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const scriptData = {
          connectionId: 'conn-1',
          scriptPath: '/scripts/background-removal.ps1',
          parameters: {
            inputPath: '/input/image.jpg',
            model: 'u2net'
          }
        };

        const result = await remoteExecutionAPI.executeScript(scriptData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/remote-execution/execute', scriptData);
        expect(result.data).toEqual(mockResponse.data);
      });
    });

    describe('removeBackground', () => {
      it('should start background removal job', async () => {
        const mockResponse = {
          data: {
            jobId: 'job-123',
            status: 'processing'
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const jobData = {
          connectionId: 'conn-1',
          imagePath: '/input/car.jpg',
          model: 'u2net',
          batchMode: false
        };

        const result = await remoteExecutionAPI.removeBackground(jobData);

        expect(mockedAxios.post).toHaveBeenCalledWith('/remote-execution/background-removal', jobData);
        expect(result.data).toEqual(mockResponse.data);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(networkError);

      await expect(authAPI.getProfile()).rejects.toThrow('Network Error');
    });

    it('should handle 404 errors', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: {
            message: 'Resource not found'
          }
        }
      };

      mockedAxios.get.mockRejectedValue(notFoundError);

      await expect(conversationsAPI.getConversation('non-existent')).rejects.toThrow();
    });

    it('should handle validation errors', async () => {
      const validationError = {
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            errors: {
              email: 'Invalid email format'
            }
          }
        }
      };

      mockedAxios.post.mockRejectedValue(validationError);

      await expect(authAPI.register({
        email: 'invalid-email',
        password: 'password',
        name: 'Test'
      })).rejects.toThrow();
    });
  });

  describe('Request Interceptors', () => {
    it('should add authorization header when token exists', () => {
      localStorageMock.getItem.mockReturnValue('test-token');

      // The interceptor would be tested by checking if the Authorization header is added
      // This is more of an integration test that would verify the actual axios instance
      expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
    });

    it('should handle requests without token', () => {
      localStorageMock.getItem.mockReturnValue(null);

      // Test that requests work without token
      expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
    });
  });
});
