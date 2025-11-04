# Image Upload Implementation Guide

This document describes the complete image upload functionality for Categories, Products, Reviews, and User Avatars.

## Overview

All image uploads are stored in public Supabase storage buckets and are accessible via public URLs. The system preserves existing hardcoded images as fallbacks when no uploaded image is available.

## Storage Buckets

All buckets are configured as **public** for read access:

- `category-images` - Category images
- `product-images` - Product images  
- `review-images` - Review photos (optional)
- `avatars` - User profile pictures

### Environment Variables

Configure in `.env`:

```bash
VITE_IMAGE_BUCKET_CATEGORIES=category-images
VITE_IMAGE_BUCKET_PRODUCTS=product-images
VITE_IMAGE_BUCKET_REVIEWS=review-images
VITE_IMAGE_BUCKET_AVATARS=avatars
```

## Implementation Details

### 1. Category Images ✅

**Location**: `src/components/admin/CategoryManager.tsx`

**Features**:
- Upload via admin panel
- Stores in `category-images` bucket
- Saves URL to `categories.image_url` field
- Display: Uses `image_url` if available, falls back to hardcoded images

**Usage**:
```tsx
// Already integrated in CategoryManager
// Upload button in category edit/create dialog
```

**Display Logic**:
```tsx
// In CategoryGrid.tsx and OptimizedCategoryGrid.tsx
const categoryImage = category.image_url || getImageForCategory(category.slug);
```

### 2. Product Images ✅

**Locations**:
- `src/components/admin/AddProductModal.tsx`
- `src/pages/admin/ProductCreate.tsx`
- `src/pages/admin/ProductEdit.tsx`
- `src/components/business/ProductManager.tsx`

**Features**:
- Upload via admin panel and business dashboard
- Stores in `product-images` bucket
- Supports multiple images (stored in `products.images` array)
- Bucket verification before upload
- Detailed error handling

**Display Logic**:
```tsx
// Products display uploaded images from images array
{product.images && product.images.length > 0 ? (
  <img src={product.images[0]} alt={product.name} />
) : (
  <div>No image placeholder</div>
)}
```

**Error Handling**:
- Verifies bucket exists before upload
- Validates file type (JPEG, PNG, WebP, GIF)
- Validates file size (5MB limit)
- Shows specific error messages for bucket not found, permissions, etc.

### 3. Review Images ✅

**Component**: `src/components/ui/ReviewImageUpload.tsx`

**Features**:
- Optional image upload with reviews
- Stores in `review-images` bucket
- Saves URL to `reviews.image_url` field
- Preview before upload
- Remove functionality

**Integration**:
```tsx
import ReviewImageUpload from "@/components/ui/ReviewImageUpload";

<ReviewImageUpload
  currentImageUrl={review?.image_url}
  onUploadComplete={(url) => {
    // Save review with image_url
    saveReview({ image_url: url });
  }}
  onRemove={() => {
    // Clear image_url
    saveReview({ image_url: null });
  }}
/>
```

**Display Logic**:
```tsx
// In review display components
{review.image_url && (
  <img src={review.image_url} alt="Review photo" />
)}
```

### 4. User Avatars ✅

**Component**: `src/components/ui/AvatarUpload.tsx`

**Features**:
- Upload during registration or profile edit
- Stores in `avatars` bucket
- Saves URL to `profiles.avatar_url` field
- Preview before upload
- Remove functionality
- Default fallback icon

**Integration**:
```tsx
import AvatarUpload from "@/components/ui/AvatarUpload";

<AvatarUpload
  currentAvatarUrl={profile?.avatar_url}
  onUploadComplete={(url) => {
    // Update profile with avatar_url
    updateProfile({ avatar_url: url });
  }}
  onRemove={() => {
    // Clear avatar_url
    updateProfile({ avatar_url: null });
  }}
/>
```

**Display Logic**:
```tsx
// Using Avatar component with fallback
<Avatar>
  <AvatarImage src={profile?.avatar_url} alt="Avatar" />
  <AvatarFallback>
    <User className="w-6 h-6" />
  </AvatarFallback>
</Avatar>
```

## Reusable Upload Utility

**Location**: `src/lib/imageUpload.ts`

**Usage**:
```tsx
import { uploadImage } from "@/lib/imageUpload";

const result = await uploadImage({
  bucket: 'product-images',
  file: selectedFile,
  envBucketVar: 'VITE_IMAGE_BUCKET_PRODUCTS',
  onProgress: (progress) => setProgress(progress),
  onError: (error) => toast.error(error),
  onSuccess: (url) => setImageUrl(url),
});

if (result.success) {
  console.log('Uploaded:', result.publicUrl);
}
```

## Database Schema

### Categories Table
```sql
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### Reviews Table
```sql
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### Profiles Table
```sql
-- Already exists
avatar_url TEXT
```

### Products Table
```sql
-- Already exists
images TEXT[]  -- Array of image URLs
```

## Migrations

All migrations are in `supabase/migrations/`:

1. `20250120000000_add_image_url_to_categories.sql` - Adds image_url to categories
2. `20250120000001_add_category_images_bucket.sql` - Creates category-images bucket
3. `20250120000002_add_image_url_to_reviews.sql` - Adds image_url to reviews
4. `20250120000003_add_review_images_and_avatars_buckets.sql` - Creates review-images and avatars buckets

## Error Handling

All upload functions include:

1. **Bucket Verification** - Checks if bucket exists before upload
2. **File Type Validation** - JPEG, PNG, WebP, GIF only
3. **File Size Validation** - 5MB for products/reviews, 2MB for avatars
4. **Detailed Error Messages** - Specific messages for:
   - Bucket not found
   - Permission denied
   - File too large
   - Invalid file type
   - Upload failures

5. **Console Logging** - Detailed logs for debugging

## Fallback Behavior

The system preserves all hardcoded images:

1. **Categories**: Uses `image_url` if available, otherwise `getImageForCategory(slug)`
2. **Products**: Uses `images` array if available, otherwise shows placeholder
3. **Reviews**: Shows image only if `image_url` exists
4. **Avatars**: Uses `avatar_url` if available, otherwise shows default user icon

## Best Practices

1. Always verify bucket exists before upload
2. Validate file type and size client-side before upload
3. Show preview before saving to database
4. Use environment variables for bucket names
5. Preserve existing URLs when updating (don't overwrite with empty)
6. Provide clear error messages to users
7. Log detailed information for debugging

## Testing

To test upload functionality:

1. **Categories**: Admin Panel → Category Management → Edit Category → Upload Image
2. **Products**: Admin Panel → Product Management → Create/Edit Product → Upload Image
3. **Reviews**: Use `ReviewImageUpload` component in review form
4. **Avatars**: Use `AvatarUpload` component in profile edit form

## Troubleshooting

### Bucket Not Found
- Run migrations to create buckets
- Or create manually in Supabase Dashboard (Storage → New Bucket)
- Ensure bucket is set to **Public**

### Permission Denied
- Check storage policies in Supabase
- Verify user has admin role or appropriate permissions
- Check RLS policies

### Upload Fails
- Check browser console for detailed error logs
- Verify Supabase credentials in `.env`
- Check network connectivity
- Verify file size and type meet requirements

## Next Steps

When integrating review and avatar uploads:

1. **Review Forms**: Import and use `ReviewImageUpload` component
2. **Profile Editing**: Import and use `AvatarUpload` component  
3. **Display Components**: Update to show uploaded images with fallbacks

All components are ready to use and include proper error handling and validation.

