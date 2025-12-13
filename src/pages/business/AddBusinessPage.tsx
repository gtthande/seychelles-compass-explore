/**
 * Business Add Page
 * Combines quick-add and full form options
 * Mode 1: Quick-add (AddBusinessQuick component)
 * Mode 2: Full-page form (BusinessRegister component)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddBusinessQuick from '@/components/business/AddBusinessQuick';
import AddBusinessFullForm from '@/components/business/AddBusinessFullForm';
import { Plus, FileText } from 'lucide-react';

const AddBusinessPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'quick' | 'full'>('quick');

  const handleBusinessAdded = (businessId: string) => {
    // Optionally navigate to the business detail page or refresh list
    navigate(`/business/${businessId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Add New Business</h1>
        <p className="text-muted-foreground">
          Choose how you want to add your business to the directory
        </p>
      </div>

      {/* Tabs for Quick Add vs Full Form */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quick' | 'full')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Quick Add
          </TabsTrigger>
          <TabsTrigger value="full" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Full Form
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <AddBusinessQuick onBusinessAdded={handleBusinessAdded} />
          </div>
        </TabsContent>

        <TabsContent value="full" className="mt-6">
          <div className="max-w-2xl mx-auto">
            <AddBusinessFullForm onNavigate={() => navigate('/business/register')} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Back Button */}
      <div className="text-center">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default AddBusinessPage;

