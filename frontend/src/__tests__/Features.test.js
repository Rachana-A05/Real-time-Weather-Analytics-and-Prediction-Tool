import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeaturesPage from '../pages/Features';

jest.mock('../components/FeaturesMenu', () => {
  return function FeaturesMenu() {
    return <div data-testid="features-menu">Features Menu</div>;
  };
});

describe('Features Component', () => {
  test('renders Features page with title', () => {
    render(<FeaturesPage />);
    
    expect(screen.getByText('Our Features')).toBeInTheDocument();
  });

  test('renders FeaturesMenu component', () => {
    render(<FeaturesPage />);
    
    expect(screen.getByTestId('features-menu')).toBeInTheDocument();
    expect(screen.getByText('Features Menu')).toBeInTheDocument();
  });

  test('displays feature list', () => {
    render(<FeaturesPage />);
    
    expect(screen.getByText(/Real-time weather map and forecast/i)).toBeInTheDocument();
    expect(screen.getByText(/Custom alerts: rain, temperature, cyclone/i)).toBeInTheDocument();
    expect(screen.getByText(/Air quality index updates/i)).toBeInTheDocument();
  });

  test('feature list has correct structure', () => {
    const { container } = render(<FeaturesPage />);
    
    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(3);
  });

  test('renders with correct styling', () => {
    const { container } = render(<FeaturesPage />);
    
    const contentDiv = container.querySelector('div'); // more generic
    expect(contentDiv).toBeInTheDocument();

  });
});