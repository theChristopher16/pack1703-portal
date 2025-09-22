import React from 'react';
import { UserRole, ROLE_COLORS, ROLE_DISPLAY_NAMES } from '../../services/authService';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ 
  role, 
  size = 'md', 
  showIcon = false, 
  className = '' 
}) => {
  const colors = ROLE_COLORS[role];
  const displayName = ROLE_DISPLAY_NAMES[role];
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const getRoleIcon = () => {
    switch (role) {
      case UserRole.ROOT:
        return '👑';
      case UserRole.ADMIN:
        return '⚡';
      case UserRole.VOLUNTEER:
        return '🤝';
      case UserRole.PARENT:
        return '👨‍👩‍👧‍👦';
      case UserRole.AI_ASSISTANT:
        return '🤖';
      default:
        return '👤';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`
      }}
    >
      {showIcon && <span className="text-sm">{getRoleIcon()}</span>}
      {displayName}
    </span>
  );
};

export default RoleBadge;
