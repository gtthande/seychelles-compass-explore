import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Category mappings for Seychelles businesses
const categoryMappings = {
  food: ['food', 'restaurant', 'cafe', 'bakery', 'pizza', 'seafood', 'meal', 'cooking', 'dining', 'beverage', 'drink', 'coffee', 'tea'],
  accommodation: ['hotel', 'resort', 'villa', 'apartment', 'lodge', 'guesthouse', 'bed', 'bedroom', 'accommodation', 'stay'],
  tours: ['tour', 'excursion', 'adventure', 'hiking', 'snorkeling', 'diving', 'boat', 'beach', 'island', 'nature', 'wildlife', 'tourist'],
  transport: ['car', 'bus', 'taxi', 'vehicle', 'transportation', 'rental', 'transfer', 'boat', 'ferry', 'plane', 'helicopter'],
  retail: ['shop', 'store', 'boutique', 'market', 'clothing', 'jewelry', 'souvenir', 'product', 'goods', 'merchandise'],
  services: ['service', 'repair', 'maintenance', 'cleaning', 'beauty', 'salon', 'spa', 'medical', 'clinic', 'office'],
  entertainment: ['entertainment', 'music', 'show', 'event', 'bar', 'club', 'cinema', 'theater', 'casino', 'game']
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, searchType = 'category' } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing image search request...');

    // Use GPT-4 Vision to analyze the image
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing images to identify business categories and products for a Seychelles directory.
            
            Available business categories: food, accommodation, tours, transport, retail, services, entertainment.
            
            Analyze the image and respond with ONLY a JSON object in this format:
            {
              "categories": ["category1", "category2"],
              "keywords": ["keyword1", "keyword2", "keyword3"],
              "description": "Brief description of what you see"
            }
            
            Focus on identifying businesses, products, or services that would be relevant in Seychelles.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and identify the most relevant business categories and search keywords.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('OpenAI response:', content);

    try {
      const analysisResult = JSON.parse(content);
      
      // Map detected items to our business categories
      const detectedCategories = new Set<string>();
      const allKeywords = [...(analysisResult.keywords || [])];
      
      // Add detected categories directly
      if (analysisResult.categories) {
        analysisResult.categories.forEach((cat: string) => {
          if (Object.keys(categoryMappings).includes(cat.toLowerCase())) {
            detectedCategories.add(cat.toLowerCase());
          }
        });
      }
      
      // Map keywords to categories
      allKeywords.forEach(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        Object.entries(categoryMappings).forEach(([category, terms]) => {
          if (terms.some(term => lowerKeyword.includes(term) || term.includes(lowerKeyword))) {
            detectedCategories.add(category);
          }
        });
      });

      const result = {
        success: true,
        categories: Array.from(detectedCategories),
        keywords: allKeywords,
        description: analysisResult.description || 'Image analyzed',
        searchQuery: allKeywords.slice(0, 3).join(' ') // Top 3 keywords as search query
      };

      console.log('Analysis result:', result);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      
      // Fallback: extract keywords from the raw content
      const fallbackKeywords = content.toLowerCase()
        .split(/[,.\s]+/)
        .filter(word => word.length > 3)
        .slice(0, 5);

      return new Response(JSON.stringify({
        success: true,
        categories: ['retail'], // default fallback
        keywords: fallbackKeywords,
        description: 'Image processed with fallback method',
        searchQuery: fallbackKeywords.slice(0, 2).join(' ')
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error in image-search function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process image', 
        details: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});