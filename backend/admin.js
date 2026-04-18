const fs = require('fs');
const path = require('path');
const https = require('https');

const STORAGE_PATH = path.join(__dirname, 'adminData.json');
const SUPPORTED_APIS = ['openweathermap', 'weatherapi', 'accuweather'];

// Validate API key against the actual weather service
async function validateApiKey(apiKey, service) {
    return new Promise((resolve) => {
        // Mask the API key when logging to avoid leaking secrets in logs
        const masked = apiKey ? `****${String(apiKey).slice(-4)}` : 'none';
        console.log('Validating API key for service:', service, 'key:', masked);

        if (!apiKey) {
            resolve({ isValid: false, error: 'API key is required' });
            return;
        }

        if (!service) {
            resolve({ isValid: false, error: 'Weather service is required' });
            return;
        }

        let testUrl;
        
        switch (service) {
            case 'openweathermap':
                testUrl = `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${apiKey}&units=metric`;
                break;
            case 'weatherapi':
                testUrl = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=London`;
                break;
            case 'accuweather':
                testUrl = `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${apiKey}&q=London`;
                break;
            default:
                console.log('Unsupported service:', service);
                resolve({ isValid: false, error: 'Unsupported weather service' });
                return;
        }
        
    console.log('Testing API key with URL:', testUrl);
        
        const protocol = testUrl.startsWith('https') ? https : require('http');
        protocol.get(testUrl, (resp) => {
            let data = '';
            resp.on('data', (chunk) => { data += chunk; });
            resp.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    let isValid = false;
                    let error = null;

                    switch (service) {
                        case 'openweathermap':
                            if (parsed.cod) {
                                isValid = parsed.cod === 200;
                                error = !isValid ? parsed.message : null;
                            } else {
                                isValid = true; // No error code means success
                            }
                            break;
                        case 'weatherapi':
                            isValid = !parsed.error;
                            error = parsed.error ? parsed.error.message : null;
                            break;
                        case 'accuweather':
                            isValid = Array.isArray(parsed);
                            error = !isValid ? 'Invalid response from AccuWeather' : null;
                            break;
                    }
                    
                    console.log('API validation result:', { service, isValid, error, status: resp.statusCode });
                    resolve({ 
                        isValid,
                        error: error || (resp.statusCode !== 200 ? `HTTP Error ${resp.statusCode}` : null)
                    });
                } catch (err) {
                    resolve({ isValid: false, error: 'Invalid API response' });
                }
            });
        }).on('error', (err) => {
            resolve({ isValid: false, error: err.message });
        });
    });
}

function readData() {
    try {
        if (!fs.existsSync(STORAGE_PATH)) {
            const initialData = { 
                apiKeys: {},
                roles: [],
                settings: {
                    defaultApi: 'openweathermap',
                    refreshInterval: 300, // 5 minutes
                    locations: ['Bangalore', 'Mumbai', 'Delhi']
                }
            };
            fs.writeFileSync(STORAGE_PATH, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        return JSON.parse(fs.readFileSync(STORAGE_PATH));
    } catch (err) {
        console.error('Error reading admin data:', err);
        return { apiKeys: {}, roles: [], settings: {} };
    }
}

function writeData(data) {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
}

// Enhanced API key management
exports.saveAPIKey = async (req, res, next) => {
    try {
        console.log('=== API Key Save Request ===');
        // Avoid logging raw request body (may contain the API key)
        console.log('Content-Type:', req.get('Content-Type'));
        
        // Validate request body
        if (!req.body) {
            return res.status(400).json({ 
                success: false, 
                message: 'Request body is required' 
            });
        }
        
        const { apiKey, service = 'openweathermap' } = req.body;
        
        console.log('Parsed request:', { service, hasKey: !!apiKey, keyLength: apiKey?.length });
        
        if (!apiKey) {
            console.log('API key missing in request');
            return res.status(400).json({ 
                success: false, 
                message: 'API key is required' 
            });
        }

        if (!SUPPORTED_APIS.includes(service)) {
            console.log('Unsupported service:', service);
            return res.status(400).json({ 
                success: false, 
                message: `Unsupported service. Supported: ${SUPPORTED_APIS.join(', ')}` 
            });
        }

    // Validate and save the API key
        const validation = await validateApiKey(apiKey, service);
        console.log('Validation result:', validation);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.error || 'API key validation failed'
            });
        }

        // Save to storage
        const data = readData();
        if (!data.apiKeys) {
            data.apiKeys = {};
        }

        // Ensure we're using the apiKeys object and not saving at root level
        delete data.apiKey; // Remove old format if exists

        data.apiKeys[service] = {
            // Persist the raw key (demo). In production consider encrypting at rest.
            key: apiKey,
            addedAt: new Date().toISOString(),
            lastValidated: new Date().toISOString(),
            isValid: true
        };

        writeData(data);
        console.log('API key saved successfully');

        return res.json({
            success: true,
            message: 'API key validated and saved successfully',
            service
        });

    } catch (error) {
        console.error('Error in saveAPIKey:', error);
        next(error);
    }
};

// Get API keys with status
exports.getAPIKey = (req, res) => {
    const data = readData();
    // Remove actual key values for security
    const sanitizedKeys = Object.entries(data.apiKeys || {}).reduce((acc, [service, info]) => {
        acc[service] = {
            isValid: info.isValid,
            addedAt: info.addedAt,
            lastValidated: info.lastValidated
        };
        return acc;
    }, {});
    
    res.json({ 
        apiKeys: sanitizedKeys,
        supportedApis: SUPPORTED_APIS 
    });
};

// Export weather report with real data analysis
exports.exportReport = async (req, res) => {
    const data = readData();
    const apiKey = data.apiKeys?.openweathermap?.key;
    
    if (!apiKey) {
        return res.status(400).json({ 
            success: false, 
            message: 'No valid API key found' 
        });
    }

    try {
    // Get weather data for configured locations
    const locations = data.settings?.locations || ['Bangalore'];
        const weatherPromises = locations.map(city => 
            new Promise((resolve) => {
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
                https.get(url, (resp) => {
                    let data = '';
                    resp.on('data', (chunk) => { data += chunk; });
                    resp.on('end', () => {
                        try {
                            const weather = JSON.parse(data);
                            resolve({
                                city,
                                temperature: weather.main?.temp,
                                humidity: weather.main?.humidity,
                                conditions: weather.weather?.[0]?.main,
                                windSpeed: weather.wind?.speed,
                                timestamp: new Date().toISOString()
                            });
                        } catch (e) {
                            resolve({
                                city,
                                error: 'Failed to fetch weather data'
                            });
                        }
                    });
                }).on('error', () => {
                    resolve({
                        city,
                        error: 'Network error'
                    });
                });
            })
        );

        const weatherData = await Promise.all(weatherPromises);
        
        // Generate CSV
        const headers = ['City', 'Temperature (°C)', 'Humidity (%)', 'Conditions', 'Wind Speed (m/s)', 'Timestamp'];

        const formatTimestamp = (ts) => ts ? new Date(ts).toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
        }) : 'N/A';

        const rows = weatherData.map(w => {
            return [
                w.city,
                (typeof w.temperature === 'number' ? w.temperature.toFixed(1) : 'N/A'),
                (typeof w.humidity === 'number' ? String(w.humidity) : 'N/A'),
                w.conditions || 'N/A',
                (typeof w.windSpeed === 'number' ? w.windSpeed.toFixed(2) : 'N/A'),
                formatTimestamp(w.timestamp)
            ];
        });

        const headerLine = headers.join(',');
        const rowsText = rows.map(r => r.map(field => String(field)).join(',')).join('\n') + '\n';
        const csv = headerLine + '\n' + rowsText;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=weather_report.csv');

        // Persist the generated CSV to backend/weather_report.csv so dashboard stats can count reports
        try {
            const reportPath = path.join(__dirname, '..', 'weather_report.csv');

            // If file exists but doesn't have the expected header, back it up and replace with clean header
            if (fs.existsSync(reportPath)) {
                const existing = fs.readFileSync(reportPath, 'utf8');
                if (!existing.startsWith(headerLine)) {
                    const bakPath = reportPath + `.bak.${Date.now()}`;
                    fs.copyFileSync(reportPath, bakPath);
                    console.log('Backed up malformed CSV to', bakPath);
                    // Write a fresh file with header + current rows
                    fs.writeFileSync(reportPath, headerLine + '\n' + rowsText, 'utf8');
                } else {
                    // Append only the rows
                    fs.appendFileSync(reportPath, rowsText, 'utf8');
                }
            } else {
                // Create new file with header + rows
                fs.writeFileSync(reportPath, headerLine + '\n' + rowsText, 'utf8');
            }
        } catch (err) {
            console.error('Failed to persist weather report:', err);
        }

        // Add UTF-8 BOM for Excel compatibility when sending to client
        res.send('\uFEFF' + csv);

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate weather report' 
        });
    }
};

// Enhanced role management
exports.getRoles = (req, res) => {
    const data = readData();
    res.json({ 
        roles: data.roles || [],
        defaultRoles: [
            { name: 'Admin', permissions: ['all'] },
            { name: 'Analyst', permissions: ['view', 'export', 'analyze'] },
            { name: 'Viewer', permissions: ['view'] }
        ]
    });
};

exports.createRole = (req, res) => {
    const { role, permissions } = req.body;

    if (!role) {
        return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one permission is required' });
    }

    const data = readData();

    // Check for duplicate role names
    if (data.roles.some(r => r.role.toLowerCase() === role.toLowerCase())) {
        return res.status(400).json({ success: false, message: 'A role with this name already exists' });
    }

    // Create new role
    const newRole = {
        id: data.roles.length ? Math.max(...data.roles.map(r => Number(r.id))) + 1 : 1,
        role,
        permissions,
        userCount: 0,
        createdAt: new Date().toISOString()
    };

    data.roles.push(newRole);
    writeData(data);

    res.json({ 
        success: true,
        message: 'Role created successfully',
        role: newRole
    });
};

exports.updateRole = (req, res) => {
    // Accept either { id, role, permissions } or legacy { user, role, permissions }
    const { id, user, role, permissions } = req.body;

    if (!role && !user) {
        return res.status(400).json({ message: 'Role name (or user) is required' });
    }

    const data = readData();

    // Prepare role object to store (normalize to have id, role, permissions)
    const roleObj = {
        id: id ?? (role ? String(role).toLowerCase().replace(/\s+/g, '-') : Date.now()),
        role: role || user,
        permissions: Array.isArray(permissions) ? permissions : (permissions ? [permissions] : []),
        updatedAt: new Date().toISOString()
    };

    // Try to find existing by id, then by role name, then by user property (legacy)
    let existingIndex = -1;
    if (id) {
        existingIndex = data.roles.findIndex(r => String(r.id) === String(id));
    }
    if (existingIndex === -1 && roleObj.role) {
        existingIndex = data.roles.findIndex(r => String(r.role).toLowerCase() === String(roleObj.role).toLowerCase());
    }
    if (existingIndex === -1 && user) {
        existingIndex = data.roles.findIndex(r => r.user === user);
    }

    if (existingIndex >= 0) {
        // Preserve existing id if present
        roleObj.id = data.roles[existingIndex].id ?? roleObj.id;
        // Merge into existing entry but keep other properties like userCount
        data.roles[existingIndex] = Object.assign({}, data.roles[existingIndex], roleObj);
    } else {
        // Assign a numeric id if none present
        if (!roleObj.id || String(roleObj.id).length === 0) {
            roleObj.id = (data.roles.length ? Math.max(...data.roles.map(r => r.id || 0)) + 1 : 1);
        }
        data.roles.push(roleObj);
    }

    writeData(data);
    res.json({ 
        success: true,
        message: `Updated role ${roleObj.role}`,
        role: roleObj
    });
};

// Settings endpoints
exports.getSettings = (req, res) => {
    const data = readData();
    res.json({ settings: data.settings || {} });
};

// Delete role by id
exports.deleteRole = (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Role ID is required' });
    }

    const data = readData();
    const roleIndex = data.roles.findIndex(r => String(r.id) === String(id));

    if (roleIndex === -1) {
        return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const deletedRole = data.roles[roleIndex];
    if (deletedRole.userCount > 0) {
        return res.status(400).json({
            success: false,
            message: 'Cannot delete role that is assigned to users'
        });
    }

    data.roles.splice(roleIndex, 1);
    writeData(data);

    return res.json({
        success: true,
        message: `Deleted role ${deletedRole.role}`,
        deletedRole
    });
};

exports.updateSettings = (req, res) => {
    try {
        const { defaultApi, refreshInterval, locations } = req.body || {};
        const data = readData();

        data.settings = data.settings || {};

        if (typeof defaultApi === 'string') data.settings.defaultApi = defaultApi;
        if (typeof refreshInterval === 'number' && isFinite(refreshInterval)) data.settings.refreshInterval = refreshInterval;
        if (Array.isArray(locations)) data.settings.locations = locations;
        // Accept comma-separated string for convenience
        if (!Array.isArray(locations) && typeof locations === 'string') {
            data.settings.locations = locations.split(',').map(s => s.trim()).filter(Boolean);
        }

        writeData(data);
        res.json({ success: true, settings: data.settings });
    } catch (err) {
        console.error('Failed to update settings:', err);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
};

// Dashboard summary stats - adjust as needed for your data
// GET /admin/stats - Dashboard summary for frontend
exports.getDashboardStats = (req, res) => {
  // customize to match frontend expectations!
  const fs = require('fs');
  const path = require('path');
  const STORAGE_PATH = path.join(__dirname, 'adminData.json');
  let totalReports = 0;
  let activeAdmins = 1; // replace with your logic
  let apiCallsToday = 0; // replace with your logic

  // Try to count total reports from weatherreport.csv
  const reportPath = path.join(__dirname, '..', 'weatherreport.csv');
  if (fs.existsSync(reportPath)) {
    const rows = fs.readFileSync(reportPath, 'utf8').trim().split('\n');
    totalReports = Math.max(0, rows.length - 1); // subtract header
  }
  // Optionally, count activeAdmins/apiCallsToday as required

  res.json({ totalReports, activeAdmins, apiCallsToday });
};

// GET /admin/trends - Dummy weather chart data
exports.getWeatherTrends = (req, res) => {
  res.json({ 
    trends: [
      { city: "Bangalore", temps: [27, 28, 29, 28, 27, 30] },
      { city: "Mumbai", temps: [30, 32, 33, 35, 34, 36] },
    ]
  });
};
