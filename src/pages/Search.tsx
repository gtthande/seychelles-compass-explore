import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, MapPin, Building2, Package, Loader2 } from 'lucide-react';
import { unifiedSearch, UnifiedSearchResult } from '@/lib/search';
import GoogleMap from '@/components/GoogleMap';

interface Business {
  id: string;
  name: string;
  description?: string;
  category: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  island?: string;
  logo_url?: string;
}

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<UnifiedSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
      performSearch(searchQuery);
    }
  }, [searchParams]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await unifiedSearch(searchTerm);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery.length >= 2) {
      setSearchParams({ q: trimmedQuery });
      performSearch(trimmedQuery);
    }
  };

  const handleResultClick = (result: UnifiedSearchResult) => {
    if (result.type === 'business') {
      navigate(`/business/${result.id}`);
    } else if (result.type === 'product' && result.businessId) {
      navigate(`/business/${result.businessId}?product=${result.id}`);
    }
  };

  // Convert search results to businesses for map display
  const businessesForMap = useMemo(() => {
    return results
      .filter(r => r.latitude !== null && r.longitude !== null)
      .map(r => ({
        id: r.id,
        name: r.title,
        description: r.subtitle,
        category: r.type,
        latitude: r.latitude!,
        longitude: r.longitude!,
        address: r.subtitle,
        logo_url: undefined,
      } as Business));
  }, [results]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-4">Search</h1>
          
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search businesses and products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </form>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              Map
            </Button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Searching...</p>
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <SearchIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try different search terms or browse the directory.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
            </div>

            {viewMode === 'map' ? (
              <div className="space-y-4">
                <GoogleMap
                  businesses={businessesForMap}
                  selectedBusiness={undefined}
                  onBusinessSelect={() => {}}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((result) => (
                    <Card
                      key={`${result.type}-${result.id}`}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleResultClick(result)}
                    >
                      <CardHeader>
                        <div className="flex items-start gap-2">
                          {result.type === 'business' ? (
                            <Building2 className="w-5 h-5 text-primary mt-1" />
                          ) : (
                            <Package className="w-5 h-5 text-secondary mt-1" />
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-lg">{result.title}</CardTitle>
                            <Badge
                              variant={result.type === 'business' ? 'default' : 'secondary'}
                              className="mt-1"
                            >
                              {result.type === 'business' ? 'Business' : 'Product'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.subtitle}
                        </p>
                        {result.latitude && result.longitude && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>
                              {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((result) => (
                  <Card
                    key={`${result.type}-${result.id}`}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleResultClick(result)}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-2">
                        {result.type === 'business' ? (
                          <Building2 className="w-5 h-5 text-primary mt-1" />
                        ) : (
                          <Package className="w-5 h-5 text-secondary mt-1" />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-lg">{result.title}</CardTitle>
                          <Badge
                            variant={result.type === 'business' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {result.type === 'business' ? 'Business' : 'Product'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.subtitle}
                      </p>
                      {result.lat && result.lng && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {!query && (
          <Card>
            <CardContent className="text-center py-12">
              <SearchIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Start Searching</h3>
              <p className="text-muted-foreground">
                Enter a search term above to find businesses and products.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Search;

