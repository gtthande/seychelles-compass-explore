import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, X, User } from "lucide-react";
import { uploadImage } from "@/lib/imageUpload";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUploadComplete: (publicUrl: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onUploadComplete,
  onRemove,
  disabled = false,
  size = "md",
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
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

    // Validate file size (2MB limit for avatars)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `Avatar must be less than 2MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
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
        bucket: 'avatars',
        file,
        envBucketVar: 'VITE_IMAGE_BUCKET_AVATARS',
      });

      if (result.success && result.publicUrl) {
        setPreview(result.publicUrl);
        onUploadComplete(result.publicUrl);
      } else {
        // Reset preview on error
        setPreview(currentAvatarUrl || null);
        if (result.error) {
          console.error('Avatar upload error:', result.error);
        }
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setPreview(currentAvatarUrl || null);
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

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={preview || undefined} alt="Avatar" />
        <AvatarFallback className="bg-primary/10 text-primary">
          <User className="w-6 h-6" />
        </AvatarFallback>
      </Avatar>

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
          id="avatar-upload"
        />
        <label htmlFor="avatar-upload">
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
              {uploading ? "Uploading..." : "Upload Avatar"}
            </span>
          </Button>
        </label>
        {preview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || uploading}
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Maximum file size: 2MB. Supported formats: JPEG, PNG, WebP
      </p>
    </div>
  );
};

export default AvatarUpload;

