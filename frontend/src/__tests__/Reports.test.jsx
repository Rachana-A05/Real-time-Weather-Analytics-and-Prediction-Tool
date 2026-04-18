import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Reports from '../pages/Reports';
import * as adminService from '../services/adminService';

jest.mock('../services/adminService');

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}));

jest.mock('../components/AnimatedPage', () => {
  return function AnimatedPage({ children }) {
    return <div data-testid="animated-page">{children}</div>;
  };
});

describe('Reports Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Reports page with title and button', () => {
    render(<Reports />);
    
    expect(screen.getByText('Download Reports')).toBeInTheDocument();
    expect(screen.getByText('Weather Data Export')).toBeInTheDocument();
    expect(screen.getByText(/Click the button below to download/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download CSV Report/i })).toBeInTheDocument();
  });

  test('button shows correct initial state', () => {
    render(<Reports />);
    
    const downloadButton = screen.getByRole('button', { name: /Download CSV Report/i });
    expect(downloadButton).toBeEnabled();
    expect(downloadButton).toHaveTextContent('Download CSV Report');
  });

  test('calls downloadWeatherReport when button is clicked', async () => {
    adminService.downloadWeatherReport.mockResolvedValue();
    
    render(<Reports />);
    
    const downloadButton = screen.getByRole('button', { name: /Download CSV Report/i });
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      expect(adminService.downloadWeatherReport).toHaveBeenCalledTimes(1);
    });
  });

  test('shows loading state while downloading', async () => {
    adminService.downloadWeatherReport.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<Reports />);
    
    const downloadButton = screen.getByRole('button', { name: /Download CSV Report/i });
    fireEvent.click(downloadButton);
    
    expect(screen.getByText('Downloading...')).toBeInTheDocument();
    expect(downloadButton).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.getByText('Download CSV Report')).toBeInTheDocument();
    });
  });

  test('handles download error gracefully', async () => {
    adminService.downloadWeatherReport.mockRejectedValue(new Error('Download failed'));
    
    render(<Reports />);
    
    const downloadButton = screen.getByRole('button', { name: /Download CSV Report/i });
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      expect(screen.getByText('Download CSV Report')).toBeInTheDocument();
      expect(downloadButton).toBeEnabled();
    });
  });

  test('renders with AnimatedPage wrapper', () => {
    render(<Reports />);
    expect(screen.getByTestId('animated-page')).toBeInTheDocument();
  });
});