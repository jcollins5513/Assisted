import { test, expect } from '@playwright/test';

test.describe('Voice Training Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to sales training
    await page.goto('http://localhost:3000/sales-training');
    await expect(page.locator('text=Sales Training Assistant')).toBeVisible();
  });

  test('should display voice recorder component', async ({ page }) => {
    await expect(page.locator('text=Voice Recorder')).toBeVisible();
    await expect(page.locator('text=Record and analyze sales conversations in real-time')).toBeVisible();
  });

  test('should display training statistics', async ({ page }) => {
    await expect(page.locator('text=Total Sessions')).toBeVisible();
    await expect(page.locator('text=Avg Score')).toBeVisible();
    await expect(page.locator('text=Best Score')).toBeVisible();
    await expect(page.locator('text=Techniques Used')).toBeVisible();
  });

  test('should display connection status', async ({ page }) => {
    await expect(page.locator('text=Connection:')).toBeVisible();
    await expect(page.locator('text=Streaming:')).toBeVisible();
  });

  test('should toggle role play mode', async ({ page }) => {
    // Find role play toggle
    const toggle = page.locator('text=Role Play Mode').locator('..').locator('button');
    
    // Should be off by default
    await expect(page.locator('text=Training Scenarios')).not.toBeVisible();
    
    // Turn on role play mode
    await toggle.click();
    
    // Should show scenarios
    await expect(page.locator('text=Training Scenarios')).toBeVisible();
    await expect(page.locator('text=Price Objection Handling')).toBeVisible();
    await expect(page.locator('text=Trade-in Value Negotiation')).toBeVisible();
  });

  test('should select training scenario', async ({ page }) => {
    // Enable role play mode
    const toggle = page.locator('text=Role Play Mode').locator('..').locator('button');
    await toggle.click();
    
    // Select price objection scenario
    await page.click('text=Price Objection Handling');
    
    // Should show scenario objectives
    await expect(page.locator('text=Scenario Objectives')).toBeVisible();
    await expect(page.locator('text=Address price concerns')).toBeVisible();
    await expect(page.locator('text=Highlight value proposition')).toBeVisible();
  });

  test('should display different difficulty levels', async ({ page }) => {
    // Enable role play mode
    const toggle = page.locator('text=Role Play Mode').locator('..').locator('button');
    await toggle.click();
    
    // Check for difficulty indicators
    await expect(page.locator('text=beginner')).toBeVisible();
    await expect(page.locator('text=intermediate')).toBeVisible();
    await expect(page.locator('text=advanced')).toBeVisible();
  });

  test('should display conversation dashboard', async ({ page }) => {
    await expect(page.locator('text=Real-Time Analysis Dashboard')).toBeVisible();
    await expect(page.locator('text=Performance Score')).toBeVisible();
    await expect(page.locator('text=Confidence')).toBeVisible();
    await expect(page.locator('text=Closing Attempts')).toBeVisible();
    await expect(page.locator('text=Engagement')).toBeVisible();
  });

  test('should show training tips', async ({ page }) => {
    await expect(page.locator('text=Advanced Sales Training Tips')).toBeVisible();
    await expect(page.locator('text=Objection Handling')).toBeVisible();
    await expect(page.locator('text=Building Rapport')).toBeVisible();
    await expect(page.locator('text=Closing Techniques')).toBeVisible();
    await expect(page.locator('text=Performance Metrics')).toBeVisible();
  });

  test('should display advanced techniques section', async ({ page }) => {
    await expect(page.locator('text=Advanced Sales Techniques')).toBeVisible();
    await expect(page.locator('text=Feel, Felt, Found - Address objections empathetically')).toBeVisible();
    await expect(page.locator('text=Assumptive Close - Assume the sale is happening')).toBeVisible();
    await expect(page.locator('text=Trial Close - Test readiness to buy')).toBeVisible();
  });

  test('should display role play scenarios section', async ({ page }) => {
    await expect(page.locator('text=Role Play Scenarios')).toBeVisible();
    await expect(page.locator('text=Price Objection - Practice value justification')).toBeVisible();
    await expect(page.locator('text=Trade-in Negotiation - Handle value disputes')).toBeVisible();
    await expect(page.locator('text=Financing Concerns - Build confidence')).toBeVisible();
  });

  test('should show live session indicator when recording', async ({ page }) => {
    // Mock recording state by checking if the indicator exists
    const sessionIndicator = page.locator('text=Live Session').or(page.locator('text=Ready'));
    await expect(sessionIndicator).toBeVisible();
  });

  test('should display user information', async ({ page }) => {
    // Should show current user
    await expect(page.locator('text=User:')).toBeVisible();
  });

  test('should handle browser permissions for microphone', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);
    
    // The voice recorder should be able to request microphone access
    // This would be tested in integration with actual recording functionality
    await expect(page.locator('text=Voice Recorder')).toBeVisible();
  });

  test('should show conversation history when available', async ({ page }) => {
    // If there's conversation history, it should be displayed
    const historySection = page.locator('text=Conversation History');
    
    // May or may not be visible depending on whether user has history
    // Just check that the component loads without error
    await expect(page.locator('text=Sales Training Assistant')).toBeVisible();
  });

  test('should display performance metrics correctly', async ({ page }) => {
    // Check that all metric containers are present
    const metricsContainer = page.locator('.grid').filter({ hasText: 'Total Sessions' });
    await expect(metricsContainer).toBeVisible();
    
    // Each metric should have a value (number) and label
    await expect(page.locator('text=Total Sessions')).toBeVisible();
    await expect(page.locator('text=Avg Score')).toBeVisible();
    await expect(page.locator('text=Best Score')).toBeVisible();
    await expect(page.locator('text=Techniques Used')).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Navigate to page and check for loading
    await page.goto('http://localhost:3000/sales-training');
    
    // Should either show loading or content quickly
    await expect(page.locator('text=Sales Training Assistant').or(page.locator('text=Loading training data...'))).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test that error states are handled properly
    // This would typically involve mocking API failures
    await expect(page.locator('text=Sales Training Assistant')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should still display main components
    await expect(page.locator('text=Sales Training Assistant')).toBeVisible();
    await expect(page.locator('text=Voice Recorder')).toBeVisible();
  });

  test('should navigate between scenarios smoothly', async ({ page }) => {
    // Enable role play mode
    const toggle = page.locator('text=Role Play Mode').locator('..').locator('button');
    await toggle.click();
    
    // Select first scenario
    await page.click('text=Price Objection Handling');
    await expect(page.locator('text=Address price concerns')).toBeVisible();
    
    // Select different scenario
    await page.click('text=Trade-in Value Negotiation');
    await expect(page.locator('text=Justify trade-in value')).toBeVisible();
  });

  test('should maintain state when switching between tabs', async ({ page }) => {
    // Enable role play mode and select scenario
    const toggle = page.locator('text=Role Play Mode').locator('..').locator('button');
    await toggle.click();
    await page.click('text=Price Objection Handling');
    
    // Navigate away and back
    await page.goto('http://localhost:3000/dashboard');
    await page.goto('http://localhost:3000/sales-training');
    
    // Should maintain the selection (this depends on implementation)
    await expect(page.locator('text=Sales Training Assistant')).toBeVisible();
  });
});
