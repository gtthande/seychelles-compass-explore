import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ImageSearchProps {
  onSearchResults: (results: {
    categories: string[];
    keywords: string[];
    searchQuery: string;
    description: string;
  }) => void;
}

const ImageSearch = ({ onSearchResults }: ImageSearchProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processImage = async (file: File) => {
    setIsProcessing(true);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setPreviewImage(base64Image);
        
        try {
          // Call the image search edge function
          const { data, error } = await supabase.functions.invoke('image-search', {
            body: { 
              image: base64Image,
              searchType: 'category'
            }
          });

          if (error) throw error;

          if (data.success) {
            onSearchResults(data);
            toast({
              title: "Image Analyzed!",
              description: `Found ${data.categories.length} relevant categories: ${data.categories.join(', ')}`,
            });
          } else {
            throw new Error(data.error || 'Failed to analyze image');
          }
        } catch (apiError: any) {
          console.error('Image analysis error:', apiError);
          toast({
            title: "Analysis Failed",
            description: "Could not analyze the image. Please try with a different image.",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Image processing error:', error);
      toast({
        title: "Upload Failed",
        description: "Could not process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    processImage(file);
  };

  const handleCameraCapture = () => {
    // Trigger file input with camera constraint
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const clearImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-primary">Image Search</h3>
          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">AI-Powered</span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Take a photo or upload an image to find related businesses and products in Seychelles
        </p>

        {previewImage && (
          <div className="relative mb-4">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="w-full h-32 object-cover rounded-lg border"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={clearImage}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCameraCapture}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Camera className="w-4 h-4 mr-2" />
            )}
            Camera
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {isProcessing && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing image with AI...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageSearch;