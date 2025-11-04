import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadImage } from "@/lib/imageUpload";
import { useToast } from "@/hooks/use-toast";

interface ReviewImageUploadProps {
  currentImageUrl?: string | null;
  onUploadComplete: (publicUrl: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

const ReviewImageUpload: React.FC<ReviewImageUploadProps> = ({
  currentImageUrl,
  onUploadComplete,
  onRemove,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast({
        title: "Invalid Image Type",
        description: "Please select a valid image file (JPEG, PNG, or WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit for review images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `Review image must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload image
    setUploading(true);
    try {
      const result = await uploadImage({
        bucket: 'review-images',
        file,
        envBucketVar: 'VITE_IMAGE_BUCKET_REVIEWS',
      });

      if (result.success && result.publicUrl) {
        setPreview(result.publicUrl);
        onUploadComplete(result.publicUrl);
      } else {
        // Reset preview on error
        setPreview(currentImageUrl || null);
        if (result.error) {
          console.error('Review image upload error:', result.error);
        }
      }
    } catch (error) {
      console.error('Review image upload error:', error);
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
      // Clean up object URL
      URL.revokeObjectURL(objectUrl);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Review Image (Optional)</label>
      
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Review preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled || uploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Upload an optional image with your review
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
            id="review-image-upload"
          />
          <label htmlFor="review-image-upload">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || uploading}
              asChild
              className="cursor-pointer"
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Choose Image"}
              </span>
            </Button>
          </label>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Maximum file size: 5MB. Supported formats: JPEG, PNG, WebP
      </p>
    </div>
  );
};

export default ReviewImageUpload;

