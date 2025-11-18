import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { getPendingBusinessesCount, subscribeToPendingBusinesses } from '@/lib/admin-utils';
import { useAuth } from '@/hooks/useAuth';

interface PendingCountBadgeProps {
  className?: string;
  showIcon?: boolean;
}

const PendingCountBadge: React.FC<PendingCountBadgeProps> = ({ 
  className = '', 
  showIcon = true 
}) => {
  const { isAdmin } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchCount = async () => {
      const count = await getPendingBusinessesCount();
      setPendingCount(count);
      setLoading(false);
    };

    fetchCount();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToPendingBusinesses(
      () => {
        // New pending business added
        setPendingCount(prev => prev + 1);
      },
      () => {
        // Pending business updated (might have been activated or suspended)
        // Refetch count to be accurate
        getPendingBusinessesCount().then(count => setPendingCount(count));
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isAdmin]);

  if (!isAdmin || loading) {
    return null;
  }

  if (pendingCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className={`flex items-center gap-1 ${className}`}
    >
      {showIcon && <Bell className="w-3 h-3" />}
      <span>{pendingCount}</span>
    </Badge>
  );
};

export default PendingCountBadge;

