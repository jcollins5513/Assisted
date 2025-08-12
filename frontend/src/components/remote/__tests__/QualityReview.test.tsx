import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QualityReview } from '../../QualityReview';

jest.mock('@/services/api', () => ({
  qualityAssessmentAPI: {
    getAssessments: jest.fn(() => Promise.resolve({ data: { data: [
      {
        id: 'a1',
        imagePath: 'processed/a1.png',
        originalPath: 'uploads/o1.jpg',
        imageUrl: '/uploads/processed/a1.png',
        originalUrl: '/uploads/o1.jpg',
        score: 80,
        status: 'completed',
        metrics: { edgeSharpness: 80, backgroundRemoval: 85, colorPreservation: 82, noiseLevel: 10, overallQuality: 80 },
        suggestions: [],
        reviewed: false,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }
    ] } })),
    reviewAssessment: jest.fn(() => Promise.resolve({ data: { success: true } })),
  }
}));

describe('QualityReview', () => {
  it('renders list and submits a review', async () => {
    render(<QualityReview />);

    await waitFor(() => expect(screen.getByText('Quality Assessments')).toBeInTheDocument());

    const row = screen.getByText('a1.png').closest('div') as HTMLElement;
    fireEvent.click(row);

    const notes = screen.getByPlaceholderText('Add any notes about this assessment...') as HTMLTextAreaElement;
    fireEvent.change(notes, { target: { value: 'Looks good' } });

    const scoreInput = screen.getByLabelText('Quality Score Override') as HTMLInputElement;
    fireEvent.change(scoreInput, { target: { value: '92' } });

    const submit = screen.getByText('Submit Review');
    fireEvent.click(submit);

    await waitFor(() => expect(screen.queryByText('Assessment Details')).not.toBeInTheDocument());
  });
});


