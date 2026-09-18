import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Risk Assessment Report', () => {
  expect(() => {
    render(<App />);
  }).not.toThrow();

  expect(screen.getAllByText(/Risk Assessment/i).length).toBeGreaterThan(0);
});
