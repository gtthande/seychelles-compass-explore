import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Building2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BusinessSearchResult {
  id: string;
  title: string;
  category: string;
  description?: string;
  address?: string;
  island?: string;
}

interface BusinessSearchProps {
  placeholder?: string;
  className?: string;
}

const BusinessSearch: React.FC<BusinessSearchProps> = ({ 
  placeholder = "Search businesses...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BusinessSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounced search with minimum length requirement
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim().length >= 3) { // Increased minimum length for more focused results
        searchBusinesses(query.trim());
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Memoize search function to prevent unnecessary re-renders
  const searchBusinesses = useCallback(async (searchTerm: string) => {
    setIsLoading(true);
    try {
      // Enhanced search with relevance scoring
      const { data, error } = await supabase
        .from('businesses')
        .select('id, title, category, description, address, island, featured')
        .eq('status', 'active')
        .or(`title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .order('featured', { ascending: false })
        .order('title')
        .limit(15); // Get more results for better scoring

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        // Apply relevance scoring and filtering
        const scoredResults = (data || [])
          .map(business => {
            let relevanceScore = 0;
            const name = business.title?.toLowerCase() || '';
            const category = business.category?.toLowerCase() || '';
            const searchLower = searchTerm.toLowerCase();
            
            // Prioritize exact name matches
            if (name.includes(searchLower)) {
              relevanceScore += 100;
              if (name === searchLower) relevanceScore += 50;
              if (name.startsWith(searchLower)) relevanceScore += 25;
            }
            
            // Category match
            if (category.includes(searchLower)) {
              relevanceScore += 75;
            }
            
            // Featured business bonus
            if (business.featured) {
              relevanceScore += 30;
            }
            
            return { ...business, relevanceScore };
          })
          .filter(business => business.relevanceScore > 0)
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 8); // Limit to top 8 results
        
        setResults(scoredResults);
        setIsOpen(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since we don't use any external values

  // Memoize handlers to prevent unnecessary re-renders
  const handleSelect = useCallback((business: BusinessSearchResult) => {
    setQuery(business.title);
    setIsOpen(false);
    navigate(`/business/${business.id}`);
  }, [navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }, [isOpen, results, selectedIndex, handleSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  }, [results.length]);

  const handleInputBlur = useCallback(() => {
    // Delay closing to allow clicking on results
    setTimeout(() => setIsOpen(false), 200);
  }, []);

  // Memoize category labels to prevent recreation on every render
  const categoryLabels = useMemo(() => ({
    food: 'Food & Beverages',
    accommodation: 'Accommodation',
    tours: 'Tours & Activities',
    transport: 'Transportation',
    retail: 'Retail Products',
    services: 'Services',
    entertainment: 'Entertainment',
    education: 'Education',
    diving: 'Diving',
    hotels: 'Hotels',
    restaurant: 'Restaurant',
    other: 'Other'
  }), []);

  const formatCategory = useCallback((category: string) => {
    return categoryLabels[category] || category;
  }, [categoryLabels]);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 h-12 text-base bg-white border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg border">
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {results.map((business, index) => (
                <div
                  key={business.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                    index === selectedIndex 
                      ? 'bg-primary/10 border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleSelect(business)}
                >
                  <div className="flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">
                        {business.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {formatCategory(business.category)}
                      </span>
                    </div>
                    {business.description && (
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                        {business.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {business.address && (
                        <>
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">
                            {business.address}
                            {business.island && `, ${business.island}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isOpen && !isLoading && results.length === 0 && query.trim() && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg border">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-muted/50 p-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">No businesses found</p>
                <p className="text-xs text-muted-foreground">
                  Try different keywords or check spelling
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BusinessSearch;
