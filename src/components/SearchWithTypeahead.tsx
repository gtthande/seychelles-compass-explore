import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Building2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAdvancedSearch, SearchResult as AdvancedSearchResult } from '@/hooks/useAdvancedSearch';

interface SearchResult {
  id: string;
  name: string;
  type: 'business' | 'product';
  category?: string;
  description?: string;
  business_name?: string;
  business_id?: string;
  match_type?: 'business_name' | 'business_description' | 'product_name' | 'product_description';
  highlight_field?: string;
  aiEnhanced?: boolean;
}

interface SearchWithTypeaheadProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: SearchResult) => void;
  onSearch: (searchTerm: string) => void; // Made required for better type safety
  placeholder?: string;
}

const SearchWithTypeahead = ({ 
  value, 
  onChange, 
  onSelect,
  onSearch,
  placeholder = "Search businesses and products..." 
}: SearchWithTypeaheadProps) => {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { searchWithFallback, isLoading, error } = useAdvancedSearch();

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (value.trim().length >= 3) { // Increased minimum length for more focused results
        fetchSuggestions(value.trim());
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 200);

    return () => clearTimeout(debounceTimer);
  }, [value]);

  const fetchSuggestions = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      console.log('🔍 SearchWithTypeahead: Fetching suggestions for:', searchTerm);
      
      const searchResponse = await searchWithFallback(searchTerm, 10);
      
      if (searchResponse && searchResponse.results.length > 0) {
        // Convert advanced search results to SearchResult format
        const convertedResults: SearchResult[] = searchResponse.results.map(result => ({
          id: result.business_id,
          name: result.business_name,
          type: result.match_source === 'business' ? 'business' : 'product',
          category: result.business_description ? 'Business' : 'Product',
          description: result.business_description,
          business_id: result.business_id,
          business_name: result.business_name,
          match_type: result.matched_field === 'name' ? 
            (result.match_source === 'business' ? 'business_name' : 'product_name') :
            (result.match_source === 'business' ? 'business_description' : 'product_description'),
          highlight_field: result.matched_field
        }));

        console.log('🔍 SearchWithTypeahead: Found', convertedResults.length, 'suggestions');
        setSuggestions(convertedResults);
        setIsOpen(convertedResults.length > 0);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
      
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setIsOpen(false);
      if (error) {
        toast({
          title: "Search Error",
          description: "Failed to search businesses and products. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSelect = (result: SearchResult) => {
    console.log('🔍 SearchWithTypeahead: Selected result:', result);
    onChange(result.name);
    setIsOpen(false);
    
    // Navigate to business page or directory with search
    if (result.type === 'business') {
      console.log('🔍 SearchWithTypeahead: Navigating to business page:', result.id);
      navigate(`/business/${result.id}`);
    } else {
      // For products or general search, navigate to directory
      console.log('🔍 SearchWithTypeahead: Navigating to directory with search:', result.name);
      navigate(`/directory?search=${encodeURIComponent(result.name)}`);
    }
    
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

  const handleSearch = () => {
    if (value.trim()) {
      console.log('🔍 SearchWithTypeahead: Performing search for:', value.trim());
      onSearch(value.trim()); // No longer optional since onSearch is required
      setIsOpen(false);
    } else {
      console.warn('🔍 SearchWithTypeahead: Empty search term, no action taken');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
      education: 'Education',
      other: 'Other'
    };
    return categoryLabels[category] || category;
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center gap-2">
        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70 z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyPress={handleKeyPress}
          className="flex-1 bg-transparent border-none text-white placeholder:text-white/70 focus:ring-0 text-lg pl-14 pr-4 h-14"
        />
        <Button 
          size="lg" 
          className="rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-glow"
          onClick={handleSearch}
        >
          <Search className="h-5 w-5" />
        </Button>
        {isLoading && (
          <div className="absolute right-20 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-white/80">AI searching...</span>
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
                      {suggestion.aiEnhanced && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-200">
                          AI Enhanced
                        </span>
                      )}
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
                      {suggestion.match_type && (
                        <>
                          <span>•</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            suggestion.match_type.includes('business') 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'bg-green-50 text-green-600'
                          }`}>
                            {suggestion.match_type === 'business_name' && 'Business Name'}
                            {suggestion.match_type === 'business_description' && 'Business Description'}
                            {suggestion.match_type === 'product_name' && 'Product/Service'}
                            {suggestion.match_type === 'product_description' && 'Product Description'}
                          </span>
                        </>
                      )}
                    </div>
                    {suggestion.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {suggestion.description}
                      </p>
                    )}
                    {suggestion.type === 'product' && (
                      <p className="text-xs text-sky-600 mt-1 italic">
                        Found under product/service: {suggestion.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results State */}
      {isOpen && !isLoading && suggestions.length === 0 && value.trim() && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg border">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-muted/50 p-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">No businesses found for "{value}"</p>
                <p className="text-xs text-muted-foreground">
                  Try different keywords or check spelling
                </p>
              </div>
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="text-xs px-3 py-1.5 bg-muted text-muted-foreground rounded-full hover:bg-muted/80 transition-colors"
                >
                  Clear search
                </button>
                <button 
                  onClick={() => fetchSuggestions(value)}
                  className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchWithTypeahead;