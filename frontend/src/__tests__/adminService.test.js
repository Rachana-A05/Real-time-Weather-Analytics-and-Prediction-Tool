// frontend/src/__tests__/adminService.test.js

import {
  getRoles,
  getApiKeys,
  saveApiKey,
  downloadWeatherReport,
  deleteRole,
  updateRole,
  getSettings,
  updateSettings,
  createRole
} from '../services/adminService';

// Mock the global fetch
global.fetch = jest.fn();

describe('adminService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    fetch.mockClear();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getRoles', () => {
    test('should fetch roles successfully from backend', async () => {
      const mockRoles = [
        { id: 1, role: 'Admin', permissions: ['all'], userCount: 5 },
        { id: 2, role: 'User', permissions: ['read'], userCount: 10 }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoles
      });

      const result = await getRoles();

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/admin//roles');
      expect(result).toEqual(mockRoles);
    });

    test('should return fallback mock data when backend returns empty array', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const result = await getRoles();

      expect(result).toHaveLength(3);
      expect(result[0].role).toBe('Administrator');
      expect(console.warn).toHaveBeenCalled();
    });

    test('should return fallback data when fetch fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getRoles();

      expect(result).toHaveLength(3);
      expect(result[0].role).toBe('Administrator');
      expect(console.error).toHaveBeenCalled();
    });

    test('should normalize roles with missing fields', async () => {
      const mockRoles = [
        { name: 'CustomRole' }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ roles: mockRoles })
      });

      const result = await getRoles();

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('role');
      expect(result[0]).toHaveProperty('permissions');
      expect(result[0]).toHaveProperty('userCount');
    });

    test('should handle non-OK response status', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await getRoles();

      expect(result).toHaveLength(3);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getApiKeys', () => {
    test('should fetch API keys successfully', async () => {
      const mockApiKeys = {
        apiKeys: {
          openweathermap: { apiKey: 'test123', isValid: true }
        },
        supportedApis: ['openweathermap', 'weatherapi']
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiKeys
      });

      const result = await getApiKeys();

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/admin//apikey');
      expect(result).toEqual(mockApiKeys);
    });

    test('should return empty apiKeys on error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getApiKeys();

      expect(result).toEqual({ apiKeys: {}, supportedApis: [] });

      expect(console.error).toHaveBeenCalled();
    });

    test('should handle non-OK response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await getApiKeys();

      expect(result).toEqual({ apiKeys: {}, supportedApis: [] });

    });
  });

  describe('saveApiKey', () => {
    test('should save API key successfully', async () => {
      const mockResponse = { success: true, message: 'API key saved' };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify(mockResponse)
      });

      await expect(saveApiKey('openweathermap', 'test-key-123')).resolves.not.toThrow();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/admin//apikey',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ service: 'openweathermap', apiKey: 'test-key-123' })
        })
      );
    });

    test('should throw error when service or apiKey is missing', async () => {
      await expect(saveApiKey('', 'test-key')).rejects.toThrow('Service and API key are required');
      await expect(saveApiKey('openweathermap', '')).rejects.toThrow('Service and API key are required');
    });

    test('should throw error on non-OK response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Map(),
        text: async () => JSON.stringify({ success: false, message: 'Invalid API key' })
      });

      await expect(saveApiKey('openweathermap', 'invalid-key')).rejects.toThrow();
    });

    test('should handle invalid JSON response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        text: async () => 'Invalid JSON'
      });

      await expect(saveApiKey('openweathermap', 'test-key')).rejects.toThrow('Invalid response from server');
    });

    test('should throw error when success is false', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        text: async () => JSON.stringify({ success: false, message: 'Validation failed' })
      });

      await expect(saveApiKey('openweathermap', 'test-key')).rejects.toThrow('Validation failed');
    });
  });

  describe('downloadWeatherReport', () => {
    test('should download weather report successfully', async () => {
      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      
      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
        remove: jest.fn()
      };
      
      document.createElement = jest.fn(() => mockLink);
      document.body.appendChild = jest.fn();
      window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      window.URL.revokeObjectURL = jest.fn();

      fetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      });

      await downloadWeatherReport();

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/admin//export');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toBe('weather_report.csv');
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    test('should throw error on failed download', async () => {
      window.alert = jest.fn();
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(downloadWeatherReport()).rejects.toThrow('Failed to download report');
      expect(console.error).toHaveBeenCalled();
    });

    test('should alert user when backend is not running', async () => {
      window.alert = jest.fn();
      
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(downloadWeatherReport()).rejects.toThrow();
      expect(window.alert).toHaveBeenCalledWith('Failed to download report. The backend might not be running.');
    });
  });

  describe('deleteRole', () => {
    test('should delete role successfully', async () => {
      const mockResponse = { success: true, message: 'Role deleted' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await deleteRole(1);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/admin//roles/1',
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include'
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should throw error on failed deletion', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Failed to delete role'
      });

      await expect(deleteRole(1)).rejects.toThrow('Failed to delete role');
    });
  });

  describe('updateRole', () => {
    test('should update role successfully', async () => {
      const roleUpdate = { id: 1, role: 'Updated Role', permissions: ['read', 'write'] };
      const mockResponse = { success: true, message: 'Role updated' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await updateRole(roleUpdate);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/admin//roles/update',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roleUpdate),
          credentials: 'include'
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should throw error on failed update', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Update failed'
      });

      await expect(updateRole({ id: 1 })).rejects.toThrow('Update failed');
    });
  });

  describe('getSettings', () => {
    test('should fetch settings successfully', async () => {
      const mockSettings = { theme: 'dark', notifications: true };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings
      });

      const result = await getSettings();

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/admin//settings');
      expect(result).toEqual(mockSettings);
    });

    test('should throw error on failed fetch', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(getSettings()).rejects.toThrow('Failed to fetch settings');
    });
  });

  describe('updateSettings', () => {
    test('should update settings successfully', async () => {
      const settings = { theme: 'light', notifications: false };
      const mockResponse = { success: true };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await updateSettings(settings);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/admin//settings/update',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
          credentials: 'include'
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should throw error on failed update', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid settings'
      });

      await expect(updateSettings({})).rejects.toThrow('Invalid settings');
    });
  });

  describe('createRole', () => {
    test('should create role successfully', async () => {
      const roleData = { role: 'New Role', permissions: ['read'] };
      const mockResponse = { success: true, id: 4 };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await createRole(roleData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/admin//roles/create',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roleData),
          credentials: 'include'
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should throw error on failed creation', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Role already exists'
      });

      await expect(createRole({ role: 'Admin' })).rejects.toThrow('Role already exists');
    });
  });
});
