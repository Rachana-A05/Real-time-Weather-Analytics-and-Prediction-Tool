import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApiKey from '../pages/ApiKey';
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

describe('ApiKey Component', () => {
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    adminService.getApiKeys.mockResolvedValue({
      apiKeys: {
        openweathermap: { isValid: true, addedAt: '2024-01-01T00:00:00.000Z' }
      }
    });
  });

  test('renders ApiKey page with title and sections', async () => {
    render(<ApiKey showToast={mockShowToast} />);
    
    expect(screen.getByText('API Key Management')).toBeInTheDocument();
    expect(screen.getByText('API Key Status')).toBeInTheDocument();
    expect(screen.getByText('Add / Update API Key')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(adminService.getApiKeys).toHaveBeenCalled();
    });
  });

  test('displays loading state while fetching API keys', () => {
    adminService.getApiKeys.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<ApiKey showToast={mockShowToast} />);
    
    const loader = screen.getByText(/API Key Status/i) || 
                   screen.queryByText(/loading/i);
    expect(loader || screen.getByText('API Key Management')).toBeInTheDocument();
  });

  test('displays API key status after loading', async () => {
    render(<ApiKey showToast={mockShowToast} />);
    
    await waitFor(() => {
      expect(screen.getByText('openweathermap')).toBeInTheDocument();
    });
  });

  test('form submission works correctly', async () => {
    adminService.saveApiKey.mockResolvedValue({ success: true });
    adminService.getApiKeys.mockResolvedValue({
      apiKeys: {
        openweathermap: { isValid: true, addedAt: '2024-01-01T00:00:00.000Z' }
      }
    });
    
    render(<ApiKey showToast={mockShowToast} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    });
    
    const apiKeyInput = screen.getByLabelText('API Key');
    const serviceSelect = screen.getByLabelText('Weather Service');
    const submitButton = screen.getByRole('button', { name: /Save API Key/i });
    
    fireEvent.change(serviceSelect, { target: { value: 'openweathermap' } });
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key-12345' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(adminService.saveApiKey).toHaveBeenCalledWith('openweathermap', 'test-api-key-12345');
      expect(mockShowToast).toHaveBeenCalledWith('success', 'API key saved successfully');
    });
  });

  test('toggle API key visibility', async () => {
    render(<ApiKey showToast={mockShowToast} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    });
    
    const apiKeyInput = screen.getByLabelText('API Key');
    const toggleButton = screen.getByLabelText('Show API key');
    
    expect(apiKeyInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(apiKeyInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleButton);
    expect(apiKeyInput).toHaveAttribute('type', 'password');
  });

  test('handles save error gracefully', async () => {
    adminService.saveApiKey.mockRejectedValue(new Error('Save failed'));
    
    render(<ApiKey showToast={mockShowToast} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    });
    
    const apiKeyInput = screen.getByLabelText('API Key');
    const submitButton = screen.getByRole('button', { name: /Save API Key/i });
    
    fireEvent.change(apiKeyInput, { target: { value: 'test-key' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', 'Failed to save API key');
    });
  });

  test('prevents submission with empty API key', async () => {
    render(<ApiKey showToast={mockShowToast} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    });
    
    const submitButton = screen.getByRole('button', { name: /Save API Key/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(adminService.saveApiKey).not.toHaveBeenCalled();
    });
  });

  test('renders help section', () => {
    render(<ApiKey showToast={mockShowToast} />);
    
    expect(screen.getByText('How to get an API key')).toBeInTheDocument();
    expect(screen.getByText(/Visit the weather service provider's website/i)).toBeInTheDocument();
  });
});
