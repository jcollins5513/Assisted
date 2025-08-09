import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  try {
    // Clean up test data
    console.log('🗑️ Cleaning up test data...');
    
    // You can add cleanup logic here, such as:
    // - Deleting test users
    // - Cleaning up uploaded files
    // - Resetting database state
    // - Clearing Redis cache
    
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here as it might mask test failures
  }
}

export default globalTeardown;
