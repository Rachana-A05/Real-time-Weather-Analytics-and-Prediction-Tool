import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-router-dom', () => ({
  Routes: () => null,
  Route: () => null,
  useLocation: () => ({ pathname: "/" }),
}));

import Alerts from '../components/alerts/Alerts';

// First test case
test('renders Current Alerts link', () => {
  render(<Alerts />);
  expect(screen.getAllByText(/Alerts/i)[0]).toBeInTheDocument();

});

// Second test case
test('renders Alert Analytics link', () => {
  render(<Alerts />);
  expect(screen.getByText(/Weather Analytics/i)).toBeInTheDocument();
});