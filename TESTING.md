# 🧪 Testing Guide - Car Sales AI Assistant

This guide covers all testing aspects of the Car Sales AI Assistant, including unit tests, integration tests, and end-to-end tests.

## 📋 Table of Contents

- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Backend Tests](#backend-tests)
- [Frontend Tests](#frontend-tests)
- [End-to-End Tests](#end-to-end-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [Continuous Integration](#continuous-integration)
- [Troubleshooting](#troubleshooting)

## 🏗️ Test Structure

```
car-sales-ai-assistant/
├── backend/
│   ├── tests/
│   │   ├── setup.js              # Global test setup
│   │   ├── auth.test.js          # Authentication tests
│   │   ├── conversations.test.js # Conversations API tests
│   │   └── uploads.test.js       # File upload tests
│   └── jest.config.js            # Backend Jest configuration
├── frontend/
│   ├── src/
│   │   ├── __mocks__/            # Mock files
│   │   ├── components/
│   │   │   └── __tests__/        # Component tests
│   │   ├── services/
│   │   │   └── __tests__/        # Service tests
│   │   └── setupTests.ts         # Test setup
│   └── jest.config.js            # Frontend Jest configuration
├── e2e/
│   ├── auth.spec.ts              # E2E authentication tests
│   ├── voice-training.spec.ts    # E2E voice training tests
│   ├── global-setup.ts           # E2E global setup
│   └── global-teardown.ts        # E2E global teardown
└── playwright.config.ts          # Playwright configuration
```

## 🚀 Running Tests

### Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Install test dependencies
npm install
```

### Run All Tests

```bash
# Run all tests (backend + frontend + e2e)
npm run test:all

# Run backend and frontend tests only
npm test

# Run individual test suites
npm run test:backend
npm run test:frontend
npm run test:e2e
```

### Watch Mode

```bash
# Run tests in watch mode
npm run test:watch

# Watch backend tests
npm run test:backend:watch

# Watch frontend tests
npm run test:frontend:watch
```

### Coverage Reports

```bash
# Generate coverage reports
npm run test:coverage

# Backend coverage
npm run test:backend:coverage

# Frontend coverage
npm run test:frontend:coverage
```

## 🔧 Backend Tests

### Test Categories

1. **Authentication Tests** (`auth.test.js`)
   - User registration
   - Login/logout
   - Token validation
   - Profile management

2. **Conversations Tests** (`conversations.test.js`)
   - CRUD operations
   - Analytics
   - Real-time features
   - Data validation

3. **Uploads Tests** (`uploads.test.js`)
   - File upload validation
   - Image processing
   - Storage management
   - Error handling

### Running Backend Tests

```bash
cd backend

# Run all backend tests
npm test

# Run specific test file
npm test auth.test.js

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Database

Backend tests use MongoDB Memory Server for isolated testing:

- Automatic in-memory database setup
- Clean state for each test
- No external dependencies
- Fast execution

### Example Backend Test

```javascript
describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe(userData.email);
  });
});
```

## ⚛️ Frontend Tests

### Test Categories

1. **Component Tests**
   - VoiceRecorder functionality
   - ContentGenerator behavior
   - User interactions
   - State management

2. **Service Tests**
   - API client functionality
   - Error handling
   - Authentication flow
   - Data transformation

3. **Hook Tests**
   - Custom hook behavior
   - State updates
   - Side effects

### Running Frontend Tests

```bash
cd frontend

# Run all frontend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test
npm test VoiceRecorder.test.tsx
```

### Test Environment

Frontend tests use:

- **Jest** - Test runner
- **React Testing Library** - Component testing
- **jsdom** - DOM simulation
- **MSW** - API mocking (if needed)

### Example Frontend Test

```typescript
describe('VoiceRecorder', () => {
  it('should start recording when start button is clicked', async () => {
    render(<VoiceRecorder userId="test-user" />);
    
    const startButton = screen.getByRole('button', { name: /start recording/i });
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockStartRecording).toHaveBeenCalled();
    });
  });
});
```

## 🎭 End-to-End Tests

### Test Categories

1. **Authentication Flow** (`auth.spec.ts`)
   - Registration process
   - Login/logout
   - Protected routes
   - Session persistence

2. **Voice Training** (`voice-training.spec.ts`)
   - Voice recorder interface
   - Role-play scenarios
   - Real-time feedback
   - Training statistics

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test auth.spec.ts
```

### Browser Support

E2E tests run on multiple browsers:

- Chromium
- Firefox
- WebKit (Safari)
- Mobile Chrome
- Mobile Safari

### Example E2E Test

```typescript
test('should login with valid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/.*dashboard/);
});
```

## 📊 Test Coverage

### Coverage Thresholds

Minimum coverage requirements:

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Viewing Coverage Reports

```bash
# Generate and view coverage
npm run test:coverage

# Coverage files are generated in:
# - backend/coverage/
# - frontend/coverage/
```

### Coverage Reports Include

- HTML reports (interactive)
- JSON reports (CI/CD)
- Text summaries
- LCOV files

## ✍️ Writing Tests

### Backend Test Guidelines

1. **Use descriptive test names**
   ```javascript
   it('should return 401 for invalid credentials', async () => {
   ```

2. **Follow AAA pattern**
   ```javascript
   // Arrange
   const userData = { email: 'test@example.com' };
   
   // Act
   const response = await request(app).post('/api/auth/login').send(userData);
   
   // Assert
   expect(response.status).toBe(401);
   ```

3. **Clean up after tests**
   ```javascript
   afterEach(async () => {
     await clearDatabase();
   });
   ```

### Frontend Test Guidelines

1. **Test user interactions**
   ```typescript
   fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
   ```

2. **Use accessible queries**
   ```typescript
   screen.getByRole('textbox', { name: 'Email' })
   screen.getByLabelText('Password')
   ```

3. **Wait for async operations**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Success')).toBeInTheDocument();
   });
   ```

### E2E Test Guidelines

1. **Use data-testid for reliable selectors**
   ```typescript
   await page.locator('[data-testid="login-form"]').fill('email', 'test@example.com');
   ```

2. **Wait for elements**
   ```typescript
   await expect(page.locator('text=Dashboard')).toBeVisible();
   ```

3. **Group related tests**
   ```typescript
   test.describe('Authentication Flow', () => {
     // Related tests here
   });
   ```

## 🔄 Continuous Integration

### GitHub Actions

Tests automatically run on:

- Pull requests
- Push to main branch
- Scheduled runs (daily)

### CI Configuration

```yaml
- name: Run Backend Tests
  run: |
    cd backend
    npm ci
    npm run test:ci

- name: Run Frontend Tests
  run: |
    cd frontend
    npm ci
    npm run test:ci

- name: Run E2E Tests
  run: |
    npm run test:e2e
```

### Test Reports

CI generates:

- Test results
- Coverage reports
- Performance metrics
- Screenshots/videos (E2E failures)

## 🔧 Troubleshooting

### Common Issues

#### Backend Tests

**MongoDB Connection Issues**
```bash
# Ensure MongoDB Memory Server is properly installed
npm install --save-dev mongodb-memory-server
```

**Jest Timeout Errors**
```javascript
// Increase timeout in jest.config.js
testTimeout: 30000
```

#### Frontend Tests

**Module Resolution Issues**
```javascript
// Check moduleNameMapping in jest.config.js
moduleNameMapping: {
  '^@/(.*)$': '<rootDir>/src/$1'
}
```

**React 19 Compatibility**
```bash
# Ensure you're using compatible testing library versions
npm install @testing-library/react@latest
```

#### E2E Tests

**Browser Launch Issues**
```bash
# Install browsers
npx playwright install
```

**Test Timeouts**
```typescript
// Increase timeout in playwright.config.ts
timeout: 60000
```

**Server Not Ready**
```bash
# Check that backend and frontend are running
npm run dev
```

### Debug Mode

#### Backend Tests
```bash
cd backend
npm test -- --verbose --no-coverage
```

#### Frontend Tests
```bash
cd frontend
npm test -- --verbose --watchAll=false
```

#### E2E Tests
```bash
npm run test:e2e:debug
```

### Logs and Output

Check logs for debugging:

```bash
# Backend test logs
cd backend && npm test 2>&1 | tee test.log

# Frontend test logs
cd frontend && npm test -- --verbose

# E2E test logs
npm run test:e2e -- --reporter=list
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🤝 Contributing

When adding new features:

1. Write tests first (TDD)
2. Ensure all tests pass
3. Maintain coverage above 70%
4. Add E2E tests for user flows
5. Update this documentation

For test-related questions or issues, please create an issue in the repository.
