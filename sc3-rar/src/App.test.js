import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Risk Assessment Report', () => {
  render(<App />);
  const titleElement = screen.getByRole('heading', { level: 1, name: /Risk Assessment Report/i });
  expect(titleElement).toBeInTheDocument();
});

test('renders severity risk level table with thresholds', () => {
  render(<App />);
  const quantitativeThresholdElements = screen.getAllByText(/Quantitative ALE Threshold/i);
  expect(quantitativeThresholdElements[0]).toBeInTheDocument();
  
  const advancedThresholdElements = screen.getAllByText(/Advanced Quantitative Expected Loss Threshold/i);
  expect(advancedThresholdElements[0]).toBeInTheDocument();
});
