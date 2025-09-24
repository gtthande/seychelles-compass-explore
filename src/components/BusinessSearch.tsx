import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Building2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BusinessSearchResult {
  id: string;
  name: string;
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

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchBusinesses(query.trim());
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const searchBusinesses = async (searchTerm: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, category, description, address, island')
        .eq('status', 'active')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .order('name')
        .limit(10);

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        setResults(data || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (business: BusinessSearchResult) => {
    setQuery(business.name);
    setIsOpen(false);
    navigate(`/business/${business.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow clicking on results
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
      education: 'Education',
      diving: 'Diving',
      hotels: 'Hotels',
      restaurant: 'Restaurant',
      other: 'Other'
    };
    return categoryLabels[category] || category;
  };

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
          className="pl-10 pr-4 h-12 text-base"
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
                        {business.name}
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
