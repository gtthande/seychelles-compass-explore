import { supabase } from "@/integrations/supabase/client";

export interface ImageUploadOptions {
  bucket: string;
  file: File;
  onProgress?: (progress: number) => void;
  envBucketVar?: string;
}

export interface ImageUploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

/**
 * Reusable image upload function with error handling
 * @param options Upload options including bucket name, file, and optional progress callback
 * @returns Promise with upload result containing public URL or error
 */
export async function uploadImage({
  bucket,
  file,
  onProgress,
  envBucketVar,
  onError,
  onSuccess,
}: ImageUploadOptions & {
  onError?: (message: string) => void;
  onSuccess?: (url: string) => void;
}): Promise<ImageUploadResult> {
  const startTime = performance.now();
  const bucketName = envBucketVar ? (import.meta.env[envBucketVar] || bucket) : bucket;
  
  console.log('📤 Starting image upload:', {
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    fileType: file.type,
    bucket: bucketName
  });

  try {
    // Verify bucket exists and is accessible
    console.log(`🔍 Verifying bucket '${bucketName}' exists...`);
    const { data: bucketData, error: bucketError } = await supabase.storage
      .getBucket(bucketName);
    
    if (bucketError) {
      const errorDetails = {
        bucket: bucketName,
        error: bucketError,
        message: bucketError.message,
        code: bucketError.statusCode || 'N/A',
        timestamp: new Date().toISOString()
      };
      
      console.error('❌ Bucket verification failed:', errorDetails);
      
      let errorDescription = `The '${bucketName}' storage bucket is not available. `;
      
      if (bucketError.message?.includes('not found') || bucketError.statusCode === 404) {
        errorDescription += `Please create the bucket in Supabase Dashboard:\n1. Go to Storage in Supabase Dashboard\n2. Click "New bucket"\n3. Name it "${bucketName}"\n4. Set it to Public\n5. Save`;
      } else if (bucketError.message?.includes('permission') || bucketError.statusCode === 403) {
        errorDescription += `You don't have permission to access this bucket. Please contact an administrator.`;
      } else {
        errorDescription += `Error: ${bucketError.message}. Check the console for details.`;
      }
      
      const error = `Bucket '${bucketName}' is not accessible: ${bucketError.message}`;
      if (onError) onError(errorDescription);
      return {
        success: false,
        error: errorDescription,
      };
    }

    console.log('✅ Bucket verified:', {
      bucket: bucketName,
      public: bucketData?.public || false,
      createdAt: bucketData?.created_at || 'N/A'
    });

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      const error = 'Invalid image type. Please select a JPEG, PNG, WebP, or GIF image.';
      if (onError) onError(error);
      return { success: false, error };
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const error = `Image must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
      if (onError) onError(error);
      return { success: false, error };
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log(`⬆️  Uploading file to bucket:`, {
      bucket: bucketName,
      filePath,
      fileSize: file.size
    });

    if (onProgress) onProgress(0);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (onProgress) onProgress(50);

    if (uploadError) {
      console.error('❌ Upload failed:', {
        error: uploadError,
        message: uploadError.message,
        code: uploadError.statusCode || 'N/A',
        bucket: bucketName,
        filePath
      });
      
      let errorMessage = uploadError.message || "Failed to upload image";
      
      // Provide specific error messages based on error type
      if (errorMessage.includes('bucket') || errorMessage.includes('not found') || uploadError.statusCode === 404) {
        errorMessage = `The '${bucketName}' storage bucket does not exist. Please create it in the Supabase Dashboard under Storage (set to public), or run the migration to create it.`;
      } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || uploadError.statusCode === 403) {
        errorMessage = `You don't have permission to upload to the '${bucketName}' bucket. Please contact an administrator.`;
      } else if (errorMessage.includes('duplicate') || uploadError.statusCode === 409) {
        errorMessage = "A file with this name already exists. Please try again or choose a different image.";
      }
      
      if (onError) onError(errorMessage);
      return { success: false, error: errorMessage };
    }

    console.log('✅ Upload successful:', {
      path: uploadData?.path || filePath,
      bucket: bucketName
    });

    if (onProgress) onProgress(75);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      console.error('❌ Failed to generate public URL:', {
        filePath,
        bucket: bucketName
      });
      const error = 'Failed to get public URL for uploaded image';
      if (onError) onError(error);
      return { success: false, error };
    }

    if (onProgress) onProgress(100);

    console.log('✅ Public URL generated:', {
      url: urlData.publicUrl,
      duration: `${(performance.now() - startTime).toFixed(2)}ms`
    });

    if (onSuccess) onSuccess(urlData.publicUrl);

    return {
      success: true,
      publicUrl: urlData.publicUrl,
    };
  } catch (error: any) {
    const errorDetails = {
      error,
      message: error?.message || 'Unknown error',
      code: error?.statusCode || error?.code || 'N/A',
      bucket: bucketName,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      duration: `${(performance.now() - startTime).toFixed(2)}ms`
    };
    
    console.error('❌ Image upload error (full details):', errorDetails);
    
    const errorMessage = error?.message || "Failed to upload image";
    
    if (onError) onError(`Failed to upload image: ${errorMessage}. Check the console for details.`);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

