// API Key Monitoring and Alerting Service
// Monitors API usage, costs, and security events

import { secureKeyManager } from './secureKeyManager';
import { keyRotationService } from './keyRotationService';

export interface UsageMetrics {
  keyName: string;
  requestsToday: number;
  requestsThisMonth: number;
  costToday: number;
  costThisMonth: number;
  errorRate: number;
  lastUsed: Date;
  peakUsageHour: number;
  unusualActivity: boolean;
}

export interface SecurityEvent {
  eventType: 'unauthorized_access' | 'rate_limit_exceeded' | 'unusual_pattern' | 'key_compromise' | 'cost_spike';
  keyName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description: string;
  details: Record<string, any>;
  resolved: boolean;
}

export interface AlertConfig {
  costThresholdDaily: number;
  costThresholdMonthly: number;
  errorRateThreshold: number;
  unusualActivityThreshold: number;
  enableEmailAlerts: boolean;
  enableConsoleAlerts: boolean;
  alertChannels: string[];
}

class ApiKeyMonitoringService {
  private usageMetrics: Map<string, UsageMetrics> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private alertConfig: AlertConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.alertConfig = {
      costThresholdDaily: 10.00, // Alert if daily cost exceeds $10
      costThresholdMonthly: 200.00, // Alert if monthly cost exceeds $200
      errorRateThreshold: 0.1, // Alert if error rate exceeds 10%
      unusualActivityThreshold: 0.5, // Alert if unusual activity detected
      enableEmailAlerts: false, // Email alerts disabled by default
      enableConsoleAlerts: true, // Console alerts enabled
      alertChannels: ['console']
    };

    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring for all API keys
   */
  private async initializeMonitoring(): Promise<void> {
    const keyNames = [
      'admin-openai-key',
      'user-openai-key',
      'admin-google-maps-key',
      'user-google-maps-key',
      'admin-openweather-key',
      'user-openweather-key',
      'admin-google-places-key',
      'user-google-places-key',
      'phone-validation-key',
      'tenor-key',
      'recaptcha-site-key'
    ];

    for (const keyName of keyNames) {
      this.usageMetrics.set(keyName, {
        keyName,
        requestsToday: 0,
        requestsThisMonth: 0,
        costToday: 0,
        costThisMonth: 0,
        errorRate: 0,
        lastUsed: new Date(),
        peakUsageHour: 0,
        unusualActivity: false
      });
    }

    console.log('📊 API Key monitoring initialized');
  }

  /**
   * Record API usage
   */
  recordUsage(keyName: string, cost: number, success: boolean): void {
    const metrics = this.usageMetrics.get(keyName);
    if (!metrics) return;

    // Update metrics
    metrics.requestsToday++;
    metrics.requestsThisMonth++;
    metrics.costToday += cost;
    metrics.costThisMonth += cost;
    metrics.lastUsed = new Date();

    // Calculate error rate
    const totalRequests = metrics.requestsToday;
    const errorCount = totalRequests * metrics.errorRate;
    const newErrorRate = success ? 
      (errorCount / totalRequests) : 
      ((errorCount + 1) / totalRequests);
    
    metrics.errorRate = newErrorRate;

    // Check for unusual activity
    this.checkUnusualActivity(keyName, metrics);

    // Check for alerts
    this.checkAlerts(keyName, metrics);

    console.log(`📊 Recorded usage for ${keyName}: $${cost.toFixed(4)}`);
  }

  /**
   * Check for unusual activity patterns
   */
  private checkUnusualActivity(keyName: string, metrics: UsageMetrics): void {
    const currentHour = new Date().getHours();
    
    // Simple heuristic: flag if usage is 3x higher than average
    const averageRequestsPerHour = metrics.requestsToday / 24;
    const currentHourRequests = metrics.requestsToday; // Simplified for demo
    
    if (currentHourRequests > averageRequestsPerHour * 3) {
      metrics.unusualActivity = true;
      
      this.recordSecurityEvent({
        eventType: 'unusual_pattern',
        keyName,
        severity: 'medium',
        timestamp: new Date(),
        description: `Unusual activity detected for ${keyName}`,
        details: {
          currentHourRequests,
          averageRequestsPerHour,
          threshold: averageRequestsPerHour * 3
        },
        resolved: false
      });
    }
  }

  /**
   * Check for various alert conditions
   */
  private checkAlerts(keyName: string, metrics: UsageMetrics): void {
    // Cost alerts
    if (metrics.costToday > this.alertConfig.costThresholdDaily) {
      this.triggerAlert('cost_spike', keyName, 'high', 
        `Daily cost for ${keyName} exceeded threshold: $${metrics.costToday.toFixed(2)}`);
    }

    if (metrics.costThisMonth > this.alertConfig.costThresholdMonthly) {
      this.triggerAlert('cost_spike', keyName, 'critical', 
        `Monthly cost for ${keyName} exceeded threshold: $${metrics.costThisMonth.toFixed(2)}`);
    }

    // Error rate alerts
    if (metrics.errorRate > this.alertConfig.errorRateThreshold) {
      this.triggerAlert('rate_limit_exceeded', keyName, 'high', 
        `Error rate for ${keyName} exceeded threshold: ${(metrics.errorRate * 100).toFixed(1)}%`);
    }

    // Unusual activity alerts
    if (metrics.unusualActivity) {
      this.triggerAlert('unusual_pattern', keyName, 'medium', 
        `Unusual activity pattern detected for ${keyName}`);
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(eventType: SecurityEvent['eventType'], keyName: string, severity: SecurityEvent['severity'], description: string): void {
    const alert: SecurityEvent = {
      eventType,
      keyName,
      severity,
      timestamp: new Date(),
      description,
      details: {},
      resolved: false
    };

    this.securityEvents.push(alert);

    // Send alerts based on configuration
    if (this.alertConfig.enableConsoleAlerts) {
      this.sendConsoleAlert(alert);
    }

    if (this.alertConfig.enableEmailAlerts) {
      this.sendEmailAlert(alert);
    }

    console.log(`🚨 Alert triggered: ${severity.toUpperCase()} - ${description}`);
  }

  /**
   * Send console alert
   */
  private sendConsoleAlert(alert: SecurityEvent): void {
    const severityIcon = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🚨',
      critical: '🔥'
    };

    console.log(`\n${severityIcon[alert.severity]} SECURITY ALERT`);
    console.log(`Key: ${alert.keyName}`);
    console.log(`Type: ${alert.eventType}`);
    console.log(`Severity: ${alert.severity.toUpperCase()}`);
    console.log(`Description: ${alert.description}`);
    console.log(`Timestamp: ${alert.timestamp.toISOString()}`);
    console.log('---\n');
  }

  /**
   * Send email alert (placeholder)
   */
  private sendEmailAlert(alert: SecurityEvent): void {
    // In production, this would send actual emails
    console.log(`📧 Email alert sent for ${alert.keyName}: ${alert.description}`);
  }

  /**
   * Record a security event
   */
  recordSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    console.log(`🔒 Security event recorded: ${event.eventType} for ${event.keyName}`);
  }

  /**
   * Get usage metrics for all keys
   */
  getAllUsageMetrics(): UsageMetrics[] {
    return Array.from(this.usageMetrics.values());
  }

  /**
   * Get usage metrics for a specific key
   */
  getKeyUsageMetrics(keyName: string): UsageMetrics | undefined {
    return this.usageMetrics.get(keyName);
  }

  /**
   * Get all security events
   */
  getAllSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  /**
   * Get unresolved security events
   */
  getUnresolvedSecurityEvents(): SecurityEvent[] {
    return this.securityEvents.filter(event => !event.resolved);
  }

  /**
   * Resolve a security event
   */
  resolveSecurityEvent(eventId: number): boolean {
    if (eventId >= 0 && eventId < this.securityEvents.length) {
      this.securityEvents[eventId].resolved = true;
      console.log(`✅ Security event ${eventId} resolved`);
      return true;
    }
    return false;
  }

  /**
   * Generate monitoring report
   */
  generateMonitoringReport(): string {
    const allMetrics = this.getAllUsageMetrics();
    const unresolvedEvents = this.getUnresolvedSecurityEvents();
    const totalCostToday = allMetrics.reduce((sum, m) => sum + m.costToday, 0);
    const totalCostThisMonth = allMetrics.reduce((sum, m) => sum + m.costThisMonth, 0);
    const totalRequestsToday = allMetrics.reduce((sum, m) => sum + m.requestsToday, 0);

    let report = '\n📊 API Key Monitoring Report\n';
    report += '============================\n\n';

    // Summary
    report += `💰 Cost Summary:\n`;
    report += `  Today: $${totalCostToday.toFixed(2)}\n`;
    report += `  This Month: $${totalCostThisMonth.toFixed(2)}\n`;
    report += `  Requests Today: ${totalRequestsToday}\n\n`;

    // Unresolved events
    if (unresolvedEvents.length > 0) {
      report += `🚨 Unresolved Security Events (${unresolvedEvents.length}):\n`;
      unresolvedEvents.forEach((event, index) => {
        const severityIcon = {
          low: 'ℹ️',
          medium: '⚠️',
          high: '🚨',
          critical: '🔥'
        };
        report += `  ${severityIcon[event.severity]} ${event.keyName}: ${event.description}\n`;
      });
      report += '\n';
    }

    // Key-specific metrics
    report += `📈 Key Metrics:\n`;
    allMetrics.forEach(metrics => {
      const statusIcon = metrics.unusualActivity ? '⚠️' : '✅';
      report += `  ${statusIcon} ${metrics.keyName}: $${metrics.costToday.toFixed(2)} today, ${metrics.requestsToday} requests\n`;
    });

    report += '\n============================\n';
    return report;
  }

  /**
   * Start continuous monitoring
   */
  startContinuousMonitoring(): void {
    console.log('📊 Starting continuous API key monitoring...');
    
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCheck();
    }, 60 * 1000); // Check every minute
  }

  /**
   * Stop continuous monitoring
   */
  stopContinuousMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('📊 Stopped continuous monitoring');
    }
  }

  /**
   * Perform periodic monitoring check
   */
  private async performMonitoringCheck(): Promise<void> {
    try {
      // Check for rotation needs
      const keysNeedingRotation = await keyRotationService.checkRotationNeeded();
      if (keysNeedingRotation.length > 0) {
        this.triggerAlert('key_compromise', 'rotation-service', 'medium', 
          `${keysNeedingRotation.length} keys need rotation`);
      }

      // Check for unusual patterns
      const allMetrics = this.getAllUsageMetrics();
      allMetrics.forEach(metrics => {
        if (metrics.unusualActivity) {
          this.triggerAlert('unusual_pattern', metrics.keyName, 'medium', 
            `Unusual activity detected for ${metrics.keyName}`);
        }
      });

    } catch (error) {
      console.error('Error in monitoring check:', error);
    }
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
    console.log('📊 Updated monitoring configuration:', this.alertConfig);
  }

  /**
   * Get alert configuration
   */
  getAlertConfig(): AlertConfig {
    return { ...this.alertConfig };
  }

  /**
   * Simulate API usage for testing
   */
  simulateUsage(keyName: string, requests: number, costPerRequest: number): void {
    for (let i = 0; i < requests; i++) {
      const success = Math.random() > 0.1; // 90% success rate
      this.recordUsage(keyName, costPerRequest, success);
    }
  }

  /**
   * Reset daily metrics (call at midnight)
   */
  resetDailyMetrics(): void {
    this.usageMetrics.forEach(metrics => {
      metrics.requestsToday = 0;
      metrics.costToday = 0;
      metrics.errorRate = 0;
      metrics.unusualActivity = false;
    });
    console.log('📊 Daily metrics reset');
  }

  /**
   * Reset monthly metrics (call at month start)
   */
  resetMonthlyMetrics(): void {
    this.usageMetrics.forEach(metrics => {
      metrics.requestsThisMonth = 0;
      metrics.costThisMonth = 0;
    });
    console.log('📊 Monthly metrics reset');
  }
}

// Export singleton instance
export const apiKeyMonitoringService = new ApiKeyMonitoringService();

// Export types and functions
export { ApiKeyMonitoringService };
export type { UsageMetrics as ApiUsageMetrics, SecurityEvent as ApiSecurityEvent, AlertConfig as ApiAlertConfig };
