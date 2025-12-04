#!/bin/bash
# Regenerate Supabase TypeScript Types
# This script regenerates the TypeScript types from your Supabase project

PROJECT_ID="bwlmlniotyrjttglbjrl"
OUTPUT_FILE="src/types/supabase.types.ts"

echo "🔄 Regenerating Supabase TypeScript types..."
echo "Project ID: $PROJECT_ID"
echo "Output: $OUTPUT_FILE"
echo ""

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    echo "Running: supabase gen types typescript --project-id $PROJECT_ID > $OUTPUT_FILE"
    supabase gen types typescript --project-id $PROJECT_ID > $OUTPUT_FILE
    
    if [ $? -eq 0 ]; then
        echo "✅ Types generated successfully!"
    else
        echo "❌ Error generating types. You may need to login:"
        echo "   supabase login"
    fi
else
    echo "⚠️  Supabase CLI not found. Using npx..."
    echo "Running: npx supabase gen types typescript --project-id $PROJECT_ID > $OUTPUT_FILE"
    npx supabase gen types typescript --project-id $PROJECT_ID > $OUTPUT_FILE
    
    if [ $? -eq 0 ]; then
        echo "✅ Types generated successfully!"
    else
        echo "❌ Error generating types."
        echo "   Make sure you're logged in: npx supabase login"
    fi
fi

echo ""
echo "📝 Next steps:"
echo "   1. Review the generated types in $OUTPUT_FILE"
echo "   2. Update imports if necessary"
echo "   3. Restart your dev server: npm run dev"

