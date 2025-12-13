/**
 * AddBusinessFullForm Component
 * Wrapper for the full business registration form
 * Provides consistent interface for full-form business creation
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';

interface AddBusinessFullFormProps {
  onNavigate?: () => void;
  className?: string;
}

export default function AddBusinessFullForm({ onNavigate, className }: AddBusinessFullFormProps) {
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      navigate('/business/register');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Full Business Registration
        </CardTitle>
        <CardDescription>
          Complete form with all business details including location, contact information, and category selection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Use the full registration form to add comprehensive business information including:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Business name and description</li>
          <li>Category selection</li>
          <li>Contact information (phone, email, website)</li>
          <li>Location details (address, island, coordinates)</li>
          <li>Business logo upload</li>
        </ul>
        <Button onClick={handleNavigate} className="w-full" variant="default">
          Open Full Form
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

