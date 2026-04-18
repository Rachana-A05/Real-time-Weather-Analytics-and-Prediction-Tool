// Track system uptime and errors
class UptimeMonitor {
  constructor() {
    this.startTime = Date.now();
    this.errors = [];
    this.maxErrors = 50; // Keep last 50 errors
    this.healthCheckInterval = null;
    this.isHealthy = true;
  }

  // Get uptime percentage (based on health checks)
  getUptime() {
    const now = Date.now();
    const totalTime = now - this.startTime;
    const totalSeconds = totalTime / 1000;
    
    // Calculate uptime based on error frequency
    const criticalErrors = this.errors.filter(e => e.severity === 'critical').length;
    const downtime = criticalErrors * 60; // Assume 60s downtime per critical error
    
    const uptimeSeconds = Math.max(0, totalSeconds - downtime);
    const uptimePercentage = (uptimeSeconds / totalSeconds) * 100;
    
    return Math.min(99.99, Math.max(0, uptimePercentage)).toFixed(2);
  }

  // Get uptime duration in human readable format
  getUptimeDuration() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Log an error
  logError(error, severity = 'warning') {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message || error.toString(),
      severity, // 'info', 'warning', 'error', 'critical'
      stack: error.stack || null
    };

    this.errors.unshift(errorEntry);
    
    // Keep only last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Mark as unhealthy if critical
    if (severity === 'critical') {
      this.isHealthy = false;
      setTimeout(() => { this.isHealthy = true; }, 60000); // Recovery after 1 min
    }

    console.error(`[${severity.toUpperCase()}] ${errorEntry.message}`);
  }

  // Get error statistics
  getErrorStats() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(e => 
      new Date(e.timestamp).getTime() > last24Hours
    );

    const criticalErrors = this.errors.filter(e => e.severity === 'critical').length;
    const errorsByType = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      total: this.errors.length,
      last24Hours: recentErrors.length,
      critical: criticalErrors,
      byType: errorsByType
    };
  }

  // Get recent errors
  getRecentErrors(limit = 10) {
    return this.errors.slice(0, limit);
  }

  // Get full stats
  getStats() {
    return {
      uptime: this.getUptime(),
      uptimeDuration: this.getUptimeDuration(),
      startTime: new Date(this.startTime).toISOString(),
      isHealthy: this.isHealthy,
      errors: this.getErrorStats(),
      recentErrors: this.getRecentErrors(5)
    };
  }

  // Start health monitoring
  startMonitoring() {
    console.log('🏥 Starting uptime monitoring...');
    
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      if (!this.isHealthy) {
        this.logError(new Error('System health check failed'), 'warning');
      }
    }, 30000);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      console.log('🛑 Uptime monitoring stopped');
    }
  }
}

// Create singleton instance
const uptimeMonitor = new UptimeMonitor();

module.exports = uptimeMonitor;
