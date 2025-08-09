import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  const { baseURL } = config.projects[0].use;
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for frontend to be ready
    console.log('⏳ Waiting for frontend to be ready...');
    await page.goto(baseURL || 'http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Wait for backend to be ready
    console.log('⏳ Waiting for backend to be ready...');
    const maxRetries = 30;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const response = await page.request.get('http://localhost:3001/api/health');
        if (response.ok()) {
          console.log('✅ Backend is ready');
          break;
        }
      } catch (error) {
        // Backend not ready yet
      }
      
      retries++;
      await page.waitForTimeout(2000);
      
      if (retries >= maxRetries) {
        throw new Error('Backend failed to start within timeout');
      }
    }
    
    // Create test user for authentication tests
    console.log('👤 Creating test user...');
    try {
      await page.request.post('http://localhost:3001/api/auth/register', {
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        }
      });
      console.log('✅ Test user created successfully');
    } catch (error) {
      // User might already exist, that's okay
      console.log('ℹ️ Test user might already exist, continuing...');
    }
    
    // Create admin user
    console.log('👑 Creating admin user...');
    try {
      await page.request.post('http://localhost:3001/api/auth/register', {
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123',
          role: 'admin'
        }
      });
      console.log('✅ Admin user created successfully');
    } catch (error) {
      console.log('ℹ️ Admin user might already exist, continuing...');
    }
    
    // Create sample content templates
    console.log('📝 Setting up sample content templates...');
    try {
      // Login as admin to create templates
      const loginResponse = await page.request.post('http://localhost:3001/api/auth/login', {
        data: {
          email: 'admin@example.com',
          password: 'admin123'
        }
      });
      
      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        const token = loginData.token;
        
        // Create sample templates
        await page.request.post('http://localhost:3001/api/content/templates', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          data: {
            id: 'vehicle-arrival',
            name: 'Vehicle Arrival',
            description: 'Announce new vehicle arrivals',
            category: 'inventory',
            icon: '🚗',
            tags: ['new', 'arrival', 'inventory'],
            fields: [
              {
                name: 'vehicleMake',
                label: 'Vehicle Make',
                type: 'text',
                required: true,
                placeholder: 'e.g., Honda'
              },
              {
                name: 'vehicleModel',
                label: 'Vehicle Model',
                type: 'text',
                required: true,
                placeholder: 'e.g., Civic'
              },
              {
                name: 'year',
                label: 'Year',
                type: 'number',
                required: true,
                placeholder: 'e.g., 2024'
              },
              {
                name: 'price',
                label: 'Price',
                type: 'text',
                required: true,
                placeholder: 'e.g., $28,500'
              }
            ],
            example: '🚗 Just arrived! {year} {vehicleMake} {vehicleModel} for only {price}!'
          }
        });
        console.log('✅ Sample templates created');
      }
    } catch (error) {
      console.log('⚠️ Could not create sample templates:', error.message);
    }
    
    // Grant microphone permissions for voice tests
    console.log('🎤 Setting up microphone permissions...');
    const context = await browser.newContext({
      permissions: ['microphone', 'camera']
    });
    await context.close();
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
