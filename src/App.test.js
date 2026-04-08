import { render, screen } from '@testing-library/react';
import App from './App';

test('renders LattoPi brand', () => {
  render(<App />);
  expect(screen.getByText(/LattoPi/i)).toBeInTheDocument();
});
