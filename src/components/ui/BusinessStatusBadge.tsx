import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BusinessStatusBadgeProps {
  status: 'active' | 'pending' | 'suspended' | 'draft' | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BusinessStatusBadge: React.FC<BusinessStatusBadgeProps> = ({ 
  status, 
  className,
  size = 'md'
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          className: 'bg-green-500 text-white',
          label: 'Active',
          icon: '🟢'
        };
      case 'pending':
        return {
          className: 'bg-yellow-400 text-black',
          label: 'Pending',
          icon: '🟡'
        };
      case 'suspended':
        return {
          className: 'bg-red-500 text-white',
          label: 'Suspended',
          icon: '🔴'
        };
      case 'draft':
        return {
          className: 'bg-gray-300 text-gray-700',
          label: 'Draft',
          icon: '⚪'
        };
      default:
        return {
          className: 'bg-gray-300 text-gray-700',
          label: status || 'Unknown',
          icon: '⚪'
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-3 py-1.5 text-sm';
      default:
        return 'px-2 py-1 text-sm';
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <Badge 
      className={cn(
        'rounded-full font-semibold flex items-center gap-1',
        config.className,
        sizeClasses,
        className
      )}
    >
      <span className="text-xs">{config.icon}</span>
      {config.label}
    </Badge>
  );
};

export default BusinessStatusBadge;
