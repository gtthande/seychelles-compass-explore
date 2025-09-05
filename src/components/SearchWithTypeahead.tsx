import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Building2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  name: string;
  type: 'business' | 'product';
  category?: string;
  description?: string;
  business_name?: string;
}

interface SearchWithTypeaheadProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
}

const SearchWithTypeahead = ({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Search businesses and products..." 
}: SearchWithTypeaheadProps) => {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (value.trim().length >= 2) {
        fetchSuggestions(value.trim());
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [value]);

  const fetchSuggestions = async (searchTerm: string) => {
    console.log('Fetching suggestions for:', searchTerm);
    setIsLoading(true);
    try {
      // Search businesses
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('id, name, category, description')
        .eq('status', 'active')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .limit(5);

      if (businessError) {
        console.error('Business search error:', businessError);
      }

      // Search products
      const { data: products, error: productError } = await supabase
        .from('products')
        .select(`
          id, 
          name, 
          category, 
          description,
          business:businesses(name)
        `)
        .eq('status', 'active')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .limit(5);

      if (productError) {
        console.error('Product search error:', productError);
      }

      const businessResults: SearchResult[] = (businesses || []).map(b => ({
        id: b.id,
        name: b.name,
        type: 'business' as const,
        category: b.category,
        description: b.description
      }));

      const productResults: SearchResult[] = (products || []).map(p => ({
        id: p.id,
        name: p.name,
        type: 'product' as const,
        category: p.category,
        description: p.description,
        business_name: p.business?.name
      }));

      const allResults = [...businessResults, ...productResults]
        .sort((a, b) => {
          // Prioritize exact name matches
          const aExactMatch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
          const bExactMatch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;
          return 0;
        })
        .slice(0, 8);

      setSuggestions(allResults);
      setIsOpen(allResults.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    onChange(result.name);
    setIsOpen(false);
    onSelect?.(result);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow clicking on suggestions
    setTimeout(() => setIsOpen(false), 200);
  };

  const formatCategory = (category: string) => {
    const categoryLabels: Record<string, string> = {
      food: 'Food & Beverages',
      accommodation: 'Accommodation',
      tours: 'Tours & Activities',
      transport: 'Transportation',
      retail: 'Retail Products',
      services: 'Services',
      entertainment: 'Entertainment',
      other: 'Other'
    };
    return categoryLabels[category] || category;
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="pl-10 pr-4"
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg border">
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <div
                  key={`${suggestion.type}-${suggestion.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSelect(suggestion)}
                >
                  <div className="flex-shrink-0">
                    {suggestion.type === 'business' ? (
                      <Building2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Package className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {suggestion.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        suggestion.type === 'business' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {suggestion.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {suggestion.category && (
                        <span>{formatCategory(suggestion.category)}</span>
                      )}
                      {suggestion.business_name && (
                        <>
                          <span>•</span>
                          <span>{suggestion.business_name}</span>
                        </>
                      )}
                    </div>
                    {suggestion.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {suggestion.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchWithTypeahead;