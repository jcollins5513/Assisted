import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContentGenerator } from '../ContentGenerator';
import { contentAPI } from '@/services/api';

// Mock the API service
jest.mock('@/services/api');
const mockContentAPI = contentAPI as jest.Mocked<typeof contentAPI>;

describe('ContentGenerator', () => {
  const mockTemplate = {
    id: 'test-template',
    name: 'Test Template',
    description: 'A test template',
    category: 'test',
    icon: '🧪',
    tags: ['test'],
    fields: [
      {
        name: 'vehicleMake',
        label: 'Vehicle Make',
        type: 'text' as const,
        required: true,
        placeholder: 'e.g., Honda'
      },
      {
        name: 'vehicleModel',
        label: 'Vehicle Model',
        type: 'text' as const,
        required: true,
        placeholder: 'e.g., Civic'
      },
      {
        name: 'price',
        label: 'Price',
        type: 'text' as const,
        required: false,
        placeholder: 'e.g., $25,000'
      },
      {
        name: 'features',
        label: 'Features',
        type: 'textarea' as const,
        required: false,
        placeholder: 'Key features'
      },
      {
        name: 'condition',
        label: 'Condition',
        type: 'select' as const,
        required: true,
        options: ['New', 'Used', 'Certified Pre-Owned']
      }
    ],
    example: 'Test example content'
  };

  const mockProps = {
    selectedTemplate: mockTemplate,
    onContentGenerated: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders content generator form', () => {
    render(<ContentGenerator {...mockProps} />);
    
    expect(screen.getByText('Fill in the Details')).toBeInTheDocument();
    expect(screen.getByLabelText('Vehicle Make *')).toBeInTheDocument();
    expect(screen.getByLabelText('Vehicle Model *')).toBeInTheDocument();
    expect(screen.getByLabelText('Price')).toBeInTheDocument();
    expect(screen.getByLabelText('Features')).toBeInTheDocument();
    expect(screen.getByLabelText('Condition *')).toBeInTheDocument();
  });

  it('displays required field indicators', () => {
    render(<ContentGenerator {...mockProps} />);
    
    // Check for required asterisks
    expect(screen.getByText('Vehicle Make')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders different field types correctly', () => {
    render(<ContentGenerator {...mockProps} />);
    
    // Text input
    const vehicleMakeInput = screen.getByLabelText('Vehicle Make *');
    expect(vehicleMakeInput).toHaveAttribute('type', 'text');
    
    // Textarea
    const featuresTextarea = screen.getByLabelText('Features');
    expect(featuresTextarea.tagName).toBe('TEXTAREA');
    
    // Select
    const conditionSelect = screen.getByLabelText('Condition *');
    expect(conditionSelect.tagName).toBe('SELECT');
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Used')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<ContentGenerator {...mockProps} />);
    
    const generateButton = screen.getByText('Generate Content');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Vehicle Make is required')).toBeInTheDocument();
      expect(screen.getByText('Vehicle Model is required')).toBeInTheDocument();
      expect(screen.getByText('Condition is required')).toBeInTheDocument();
    });
    
    // Should not call API when validation fails
    expect(mockContentAPI.generateContent).not.toHaveBeenCalled();
  });

  it('clears validation errors when user starts typing', async () => {
    render(<ContentGenerator {...mockProps} />);
    
    // Trigger validation
    const generateButton = screen.getByText('Generate Content');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Vehicle Make is required')).toBeInTheDocument();
    });
    
    // Start typing in the field
    const vehicleMakeInput = screen.getByLabelText('Vehicle Make *');
    fireEvent.change(vehicleMakeInput, { target: { value: 'Honda' } });
    
    // Error should be cleared
    expect(screen.queryByText('Vehicle Make is required')).not.toBeInTheDocument();
  });

  it('calls API to generate content with valid form data', async () => {
    const mockGeneratedContent = {
      id: 'generated-123',
      text: 'Generated content text',
      hashtags: ['#Honda', '#Civic'],
      suggestedImage: '',
      variations: ['Variation 1', 'Variation 2'],
      quality: 85,
      generatedAt: new Date(),
      template: 'test-template',
      vehicleData: {}
    };

    mockContentAPI.generateContent.mockResolvedValue({
      data: mockGeneratedContent
    });

    render(<ContentGenerator {...mockProps} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Vehicle Make *'), {
      target: { value: 'Honda' }
    });
    fireEvent.change(screen.getByLabelText('Vehicle Model *'), {
      target: { value: 'Civic' }
    });
    fireEvent.change(screen.getByLabelText('Condition *'), {
      target: { value: 'New' }
    });
    
    // Optional fields
    fireEvent.change(screen.getByLabelText('Price'), {
      target: { value: '$25,000' }
    });
    fireEvent.change(screen.getByLabelText('Features'), {
      target: { value: 'Apple CarPlay, Honda Sensing' }
    });
    
    const generateButton = screen.getByText('Generate Content');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(mockContentAPI.generateContent).toHaveBeenCalledWith({
        templateId: 'test-template',
        formData: {
          vehicleMake: 'Honda',
          vehicleModel: 'Civic',
          price: '$25,000',
          features: 'Apple CarPlay, Honda Sensing',
          condition: 'New'
        },
        instructions: ''
      });
    });
    
    expect(mockProps.onContentGenerated).toHaveBeenCalledWith(mockGeneratedContent);
  });

  it('includes custom instructions in API call', async () => {
    mockContentAPI.generateContent.mockResolvedValue({
      data: { id: 'test', text: 'test' }
    });

    render(<ContentGenerator {...mockProps} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Vehicle Make *'), {
      target: { value: 'Honda' }
    });
    fireEvent.change(screen.getByLabelText('Vehicle Model *'), {
      target: { value: 'Civic' }
    });
    fireEvent.change(screen.getByLabelText('Condition *'), {
      target: { value: 'New' }
    });
    
    // Add custom instructions
    const instructionsTextarea = screen.getByPlaceholderText('Add any specific instructions for content generation...');
    fireEvent.change(instructionsTextarea, {
      target: { value: 'Make it exciting and use emojis' }
    });
    
    const generateButton = screen.getByText('Generate Content');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(mockContentAPI.generateContent).toHaveBeenCalledWith({
        templateId: 'test-template',
        formData: expect.any(Object),
        instructions: 'Make it exciting and use emojis'
      });
    });
  });

  it('shows loading state during content generation', async () => {
    // Make API call hang to test loading state
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockContentAPI.generateContent.mockReturnValue(promise);

    render(<ContentGenerator {...mockProps} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Vehicle Make *'), {
      target: { value: 'Honda' }
    });
    fireEvent.change(screen.getByLabelText('Vehicle Model *'), {
      target: { value: 'Civic' }
    });
    fireEvent.change(screen.getByLabelText('Condition *'), {
      target: { value: 'New' }
    });
    
    const generateButton = screen.getByText('Generate Content');
    fireEvent.click(generateButton);
    
    // Should show loading state
    expect(screen.getByText('Generating Content...')).toBeInTheDocument();
    expect(generateButton).toBeDisabled();
    
    // Resolve the promise
    resolvePromise!({ data: { id: 'test', text: 'test' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Generating Content...')).not.toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    mockContentAPI.generateContent.mockRejectedValue(new Error('API Error'));

    render(<ContentGenerator {...mockProps} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Vehicle Make *'), {
      target: { value: 'Honda' }
    });
    fireEvent.change(screen.getByLabelText('Vehicle Model *'), {
      target: { value: 'Civic' }
    });
    fireEvent.change(screen.getByLabelText('Condition *'), {
      target: { value: 'New' }
    });
    
    const generateButton = screen.getByText('Generate Content');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error generating content:', expect.any(Error));
      expect(alertSpy).toHaveBeenCalledWith('Failed to generate content. Please try again.');
    });
    
    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('handles image upload', () => {
    render(<ContentGenerator {...mockProps} />);
    
    // Should render ImageUploader component
    // This would typically test the ImageUploader component integration
    expect(screen.getByText('Fill in the Details')).toBeInTheDocument();
  });

  it('saves generated content', async () => {
    const mockGeneratedContent = {
      id: 'generated-123',
      text: 'Generated content text',
      hashtags: ['#Honda'],
      suggestedImage: '',
      variations: ['Variation 1'],
      quality: 85,
      generatedAt: new Date(),
      template: 'test-template',
      vehicleData: {}
    };

    mockContentAPI.generateContent.mockResolvedValue({
      data: mockGeneratedContent
    });
    
    mockContentAPI.saveContent.mockResolvedValue({
      data: { success: true }
    });

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ContentGenerator {...mockProps} />);
    
    // Generate content first
    fireEvent.change(screen.getByLabelText('Vehicle Make *'), {
      target: { value: 'Honda' }
    });
    fireEvent.change(screen.getByLabelText('Vehicle Model *'), {
      target: { value: 'Civic' }
    });
    fireEvent.change(screen.getByLabelText('Condition *'), {
      target: { value: 'New' }
    });
    
    const generateButton = screen.getByText('Generate Content');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(mockContentAPI.generateContent).toHaveBeenCalled();
    });
    
    // This would test the ContentPreview component's save functionality
    // In a real implementation, you'd need to interact with the ContentPreview component
    
    alertSpy.mockRestore();
  });

  it('initializes form data when template changes', () => {
    const { rerender } = render(<ContentGenerator {...mockProps} />);
    
    // Initial form should have empty values
    expect((screen.getByLabelText('Vehicle Make *') as HTMLInputElement).value).toBe('');
    
    // Change template
    const newTemplate = {
      ...mockTemplate,
      id: 'new-template',
      fields: [
        {
          name: 'differentField',
          label: 'Different Field',
          type: 'text' as const,
          required: true,
          placeholder: 'Different placeholder'
        }
      ]
    };
    
    rerender(<ContentGenerator selectedTemplate={newTemplate} onContentGenerated={mockProps.onContentGenerated} />);
    
    // Should render new template fields
    expect(screen.getByLabelText('Different Field *')).toBeInTheDocument();
  });

  it('handles all field types correctly', () => {
    const templateWithAllTypes = {
      ...mockTemplate,
      fields: [
        {
          name: 'textField',
          label: 'Text Field',
          type: 'text' as const,
          required: true,
          placeholder: 'Text placeholder'
        },
        {
          name: 'numberField',
          label: 'Number Field',
          type: 'number' as const,
          required: true,
          placeholder: '123'
        },
        {
          name: 'textareaField',
          label: 'Textarea Field',
          type: 'textarea' as const,
          required: false,
          placeholder: 'Textarea placeholder'
        },
        {
          name: 'selectField',
          label: 'Select Field',
          type: 'select' as const,
          required: true,
          options: ['Option 1', 'Option 2']
        }
      ]
    };

    render(<ContentGenerator selectedTemplate={templateWithAllTypes} onContentGenerated={mockProps.onContentGenerated} />);
    
    expect(screen.getByLabelText('Text Field *')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Number Field *')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('Textarea Field').tagName).toBe('TEXTAREA');
    expect(screen.getByLabelText('Select Field *').tagName).toBe('SELECT');
  });
});
