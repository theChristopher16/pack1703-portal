// API Key Rotation Service
// Implements automatic key rotation and monitoring

import { secureKeyManager } from './secureKeyManager';

export interface RotationConfig {
  rotationIntervalDays: number;
  warningDaysBeforeRotation: number;
  autoRotationEnabled: boolean;
  notificationChannels: string[];
}

export interface KeyRotationStatus {
  keyName: string;
  currentAge: number;
  lastRotation: Date;
  nextRotation: Date;
  needsRotation: boolean;
  warningDaysRemaining: number;
  rotationHistory: Date[];
}

class KeyRotationService {
  private rotationConfig: RotationConfig;
  private rotationStatus: Map<string, KeyRotationStatus> = new Map();

  constructor() {
    this.rotationConfig = {
      rotationIntervalDays: 90, // Rotate every 90 days
      warningDaysBeforeRotation: 14, // Warn 14 days before rotation
      autoRotationEnabled: false, // Manual rotation for now
      notificationChannels: ['console', 'email'] // Where to send notifications
    };

    this.initializeRotationStatus();
  }

  /**
   * Initialize rotation status for all keys
   */
  private async initializeRotationStatus(): Promise<void> {
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
      'recaptcha-site-key',
      'recaptcha-secret-key'
    ];

    for (const keyName of keyNames) {
      await this.updateKeyRotationStatus(keyName);
    }
  }

  /**
   * Update rotation status for a specific key
   */
  private async updateKeyRotationStatus(keyName: string): Promise<void> {
    try {
      // In a real implementation, this would check Secret Manager metadata
      // For now, we'll simulate with current date
      const lastRotation = new Date(); // Would be fetched from Secret Manager
      const currentAge = this.calculateKeyAge(lastRotation);
      const nextRotation = new Date(lastRotation);
      nextRotation.setDate(nextRotation.getDate() + this.rotationConfig.rotationIntervalDays);
      
      const needsRotation = currentAge >= this.rotationConfig.rotationIntervalDays;
      const warningDaysRemaining = Math.max(0, 
        this.rotationConfig.rotationIntervalDays - currentAge - this.rotationConfig.warningDaysBeforeRotation
      );

      this.rotationStatus.set(keyName, {
        keyName,
        currentAge,
        lastRotation,
        nextRotation,
        needsRotation,
        warningDaysRemaining,
        rotationHistory: [lastRotation] // Would be fetched from Secret Manager
      });
    } catch (error) {
      console.error(`Failed to update rotation status for ${keyName}:`, error);
    }
  }

  /**
   * Calculate key age in days
   */
  private calculateKeyAge(lastRotation: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastRotation.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if any keys need rotation
   */
  async checkRotationNeeded(): Promise<KeyRotationStatus[]> {
    const keysNeedingRotation: KeyRotationStatus[] = [];
    
    for (const [keyName, status] of this.rotationStatus) {
      await this.updateKeyRotationStatus(keyName);
      const updatedStatus = this.rotationStatus.get(keyName);
      
      if (updatedStatus?.needsRotation) {
        keysNeedingRotation.push(updatedStatus);
      }
    }

    return keysNeedingRotation;
  }

  /**
   * Check for keys approaching rotation
   */
  async checkRotationWarnings(): Promise<KeyRotationStatus[]> {
    const keysWithWarnings: KeyRotationStatus[] = [];
    
    for (const [keyName, status] of this.rotationStatus) {
      if (status.warningDaysRemaining <= this.rotationConfig.warningDaysBeforeRotation && 
          !status.needsRotation) {
        keysWithWarnings.push(status);
      }
    }

    return keysWithWarnings;
  }

  /**
   * Rotate a specific key
   */
  async rotateKey(keyName: string, newKeyValue: string): Promise<boolean> {
    try {
      console.log(`🔄 Rotating key: ${keyName}`);
      
      // In a real implementation, this would:
      // 1. Create a new version in Secret Manager
      // 2. Update the application to use the new key
      // 3. Verify the new key works
      // 4. Archive the old key version
      
      // For now, we'll simulate the rotation
      await this.simulateKeyRotation(keyName, newKeyValue);
      
      // Update rotation status
      await this.updateKeyRotationStatus(keyName);
      
      console.log(`✅ Successfully rotated key: ${keyName}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to rotate key ${keyName}:`, error);
      return false;
    }
  }

  /**
   * Simulate key rotation (placeholder for real implementation)
   */
  private async simulateKeyRotation(keyName: string, newKeyValue: string): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In real implementation, this would update Secret Manager
    console.log(`📝 Simulated rotation for ${keyName} with new value: ${newKeyValue.substring(0, 10)}...`);
  }

  /**
   * Get rotation status for all keys
   */
  getAllRotationStatus(): KeyRotationStatus[] {
    return Array.from(this.rotationStatus.values());
  }

  /**
   * Get rotation status for a specific key
   */
  getKeyRotationStatus(keyName: string): KeyRotationStatus | undefined {
    return this.rotationStatus.get(keyName);
  }

  /**
   * Update rotation configuration
   */
  updateRotationConfig(config: Partial<RotationConfig>): void {
    this.rotationConfig = { ...this.rotationConfig, ...config };
    console.log('🔄 Updated rotation configuration:', this.rotationConfig);
  }

  /**
   * Get rotation configuration
   */
  getRotationConfig(): RotationConfig {
    return { ...this.rotationConfig };
  }

  /**
   * Generate rotation report
   */
  generateRotationReport(): string {
    const allStatus = this.getAllRotationStatus();
    const keysNeedingRotation = allStatus.filter(status => status.needsRotation);
    const keysWithWarnings = allStatus.filter(status => 
      status.warningDaysRemaining <= this.rotationConfig.warningDaysBeforeRotation && 
      !status.needsRotation
    );

    let report = '\n🔄 API Key Rotation Report\n';
    report += '========================\n\n';

    // Keys needing immediate rotation
    if (keysNeedingRotation.length > 0) {
      report += `🚨 Keys Needing Immediate Rotation (${keysNeedingRotation.length}):\n`;
      keysNeedingRotation.forEach(status => {
        report += `  • ${status.keyName}: ${status.currentAge} days old\n`;
      });
      report += '\n';
    }

    // Keys with warnings
    if (keysWithWarnings.length > 0) {
      report += `⚠️ Keys Approaching Rotation (${keysWithWarnings.length}):\n`;
      keysWithWarnings.forEach(status => {
        report += `  • ${status.keyName}: ${status.warningDaysRemaining} days until warning\n`;
      });
      report += '\n';
    }

    // All keys status
    report += `📊 All Keys Status (${allStatus.length} total):\n`;
    allStatus.forEach(status => {
      const statusIcon = status.needsRotation ? '🚨' : 
                       status.warningDaysRemaining <= this.rotationConfig.warningDaysBeforeRotation ? '⚠️' : '✅';
      report += `  ${statusIcon} ${status.keyName}: ${status.currentAge} days old\n`;
    });

    report += '\n========================\n';
    return report;
  }

  /**
   * Schedule automatic rotation checks
   */
  startRotationMonitoring(): void {
    console.log('🔄 Starting automatic rotation monitoring...');
    
    // Check daily for rotation needs
    setInterval(async () => {
      try {
        const keysNeedingRotation = await this.checkRotationNeeded();
        const keysWithWarnings = await this.checkRotationWarnings();

        if (keysNeedingRotation.length > 0) {
          console.log('🚨 Keys needing rotation:', keysNeedingRotation.map(k => k.keyName));
          // In production, this would send alerts
        }

        if (keysWithWarnings.length > 0) {
          console.log('⚠️ Keys approaching rotation:', keysWithWarnings.map(k => k.keyName));
          // In production, this would send warnings
        }
      } catch (error) {
        console.error('Error in rotation monitoring:', error);
      }
    }, 24 * 60 * 60 * 1000); // Check every 24 hours
  }

  /**
   * Manual rotation trigger
   */
  async triggerManualRotation(keyName: string, newKeyValue: string): Promise<boolean> {
    console.log(`🔄 Manual rotation triggered for: ${keyName}`);
    return await this.rotateKey(keyName, newKeyValue);
  }

  /**
   * Emergency rotation (for compromised keys)
   */
  async emergencyRotation(keyName: string, newKeyValue: string): Promise<boolean> {
    console.log(`🚨 Emergency rotation triggered for: ${keyName}`);
    
    // Emergency rotation bypasses normal checks
    try {
      await this.rotateKey(keyName, newKeyValue);
      
      // Log emergency rotation
      console.log(`🚨 Emergency rotation completed for: ${keyName}`);
      
      // In production, this would:
      // - Send immediate alerts
      // - Log security incident
      // - Notify administrators
      
      return true;
    } catch (error) {
      console.error(`❌ Emergency rotation failed for ${keyName}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const keyRotationService = new KeyRotationService();

// Export types and functions
export { KeyRotationService };
export type { RotationConfig as KeyRotationConfig, KeyRotationStatus as ApiKeyRotationStatus };
