import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  showHome?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const BackButton = ({ 
  to, 
  showHome = true, 
  className = "",
  children 
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1); // Go back in browser history
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        {children || 'Back'}
      </Button>
      
      {showHome && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHome}
          className="flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Home
        </Button>
      )}
    </div>
  );
};

export default BackButton;
