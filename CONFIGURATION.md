# Configuration Management System

The Pack 1703 Families Portal now includes a comprehensive configuration management system that allows administrators to manage various settings through the admin portal without requiring code changes.

## Overview

The configuration system provides:
- **Centralized Settings**: All configurable values are stored in Firestore
- **Admin Interface**: Easy-to-use web interface for managing configurations
- **Type Safety**: Strong typing with validation rules
- **Caching**: Efficient caching to minimize database reads
- **Fallbacks**: Graceful fallbacks when configurations are unavailable

## Accessing the Configuration Manager

1. Log into the admin portal at `/admin`
2. Click on the "Configuration" tab
3. Use the interface to view, edit, add, or delete configurations

## Default Configurations

The system automatically initializes with these default configurations:

### Email Settings
- `contact.email.primary` - Primary contact email (default: pack1703@gmail.com)
- `contact.email.support` - Support email for technical issues
- `contact.email.emergency` - Emergency contact email

### Contact Information
- `contact.phone.primary` - Primary contact phone number

### System Information
- `system.pack.name` - Official pack name (default: Pack 1703)
- `system.pack.location` - Pack location/city (default: Peoria, IL)

### Display Settings
- `display.site.title` - Website title (default: Pack 1703 Families Portal)

### Feature Flags
- `notifications.enabled` - Enable email notifications (default: true)
- `security.require.approval` - Require admin approval for registrations (default: false)

## Using Configurations in Code

### Basic Usage with Hooks

```typescript
import { useConfig, useEmailConfig, usePackNameConfig } from '../hooks/useConfig';

function MyComponent() {
  // Get a specific configuration
  const { value: primaryEmail, loading } = useEmailConfig('contact.email.primary');
  
  // Get pack name with fallback
  const { value: packName } = usePackNameConfig();
  
  // Get multiple configurations at once
  const { primaryEmail, supportEmail, loading } = useContactConfigs();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Welcome to {packName}</h1>
      <p>Contact us at: {primaryEmail}</p>
    </div>
  );
}
```

### Direct Service Usage

```typescript
import configService from '../services/configService';

// Get a configuration value
const email = await configService.getConfigValue('contact.email.primary');

// Get full configuration object
const config = await configService.getConfig('contact.email.primary');

// Update a configuration
await configService.updateConfig('contact.email.primary', { value: 'new@email.com' });
```

### Convenience Hooks

The system provides several convenience hooks for common configurations:

- `useEmailConfig(key)` - For email addresses with fallback
- `usePhoneConfig(key)` - For phone numbers with fallback
- `usePackNameConfig()` - For pack name
- `usePackLocationConfig()` - For pack location
- `useSiteTitleConfig()` - For site title
- `useContactConfigs()` - For all contact-related configs

## Adding New Configurations

### Through the Admin Interface

1. Go to the Configuration tab in the admin portal
2. Click "Add Configuration"
3. Fill in the required fields:
   - **Key**: Unique identifier (e.g., `contact.email.newsletter`)
   - **Category**: Grouping (contact, email, system, etc.)
   - **Value**: The actual value
   - **Description**: Human-readable description

### Through Code

```typescript
await configService.setConfig(
  'contact.email.newsletter',
  'newsletter@pack1703.com',
  'email',
  'Newsletter subscription email address',
  true, // isEditable
  { type: 'email', required: true }, // validation rules
  'admin' // userId
);
```

## Validation Rules

Configurations can include validation rules:

```typescript
{
  type: 'email' | 'url' | 'phone' | 'number' | 'boolean' | 'string' | 'array',
  required?: boolean,
  minLength?: number,
  maxLength?: number,
  pattern?: string, // regex pattern
  allowedValues?: string[]
}
```

## Categories

Configurations are organized into categories:

- **contact** - Contact information
- **email** - Email addresses
- **system** - System settings
- **display** - UI/display settings
- **security** - Security settings
- **notifications** - Notification preferences
- **integrations** - Third-party integrations

## Best Practices

1. **Use Descriptive Keys**: Choose clear, hierarchical keys (e.g., `contact.email.primary`)
2. **Provide Fallbacks**: Always provide sensible default values
3. **Validate Input**: Use appropriate validation rules
4. **Cache Appropriately**: Use the built-in caching for frequently accessed values
5. **Document Changes**: Update this documentation when adding new configurations

## Migration from Hardcoded Values

To migrate from hardcoded values to the configuration system:

1. **Identify the value** in your code
2. **Create a configuration** in the admin portal
3. **Replace the hardcoded value** with a configuration hook
4. **Test the change** to ensure it works correctly

### Example Migration

**Before:**
```typescript
const contactEmail = 'pack1703@gmail.com';
```

**After:**
```typescript
const { value: contactEmail } = useEmailConfig('contact.email.primary');
```

## Troubleshooting

### Common Issues

1. **Configuration not found**: Check if the key exists in the admin portal
2. **Loading state stuck**: Check network connectivity and Firestore permissions
3. **Validation errors**: Ensure the value matches the validation rules
4. **Cache issues**: Use the refresh function or clear cache if needed

### Debug Commands

```typescript
// Clear cache
configService.clearCache();

// Get all configurations
const allConfigs = await configService.getAllConfigs();

// Check if configuration exists
const config = await configService.getConfig('your.key');
```

## Security Considerations

- Only authenticated admin users can modify configurations
- All changes are logged in the audit trail
- Sensitive configurations should be marked as read-only
- Consider using environment variables for truly sensitive data

## Performance Notes

- Configurations are cached for 5 minutes by default
- Use the `refreshInterval` option for frequently changing values
- The system gracefully handles network failures with fallback values
