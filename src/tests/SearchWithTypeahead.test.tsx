import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import SearchWithTypeahead from '@/components/SearchWithTypeahead';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock data
const mockBusinesses = [
  {
    id: '1',
    name: 'Sunset Restaurant',
    category: 'food',
    description: 'Beautiful beachfront dining experience',
  },
  {
    id: '2',
    name: 'Ocean Hotel',
    category: 'accommodation',
    description: 'Luxury oceanview accommodation',
  },
];

const mockProducts = [
  {
    id: '1',
    name: 'Fresh Fish',
    category: 'food',
    description: 'Daily caught local fish',
    business: { name: 'Sunset Restaurant' },
  },
  {
    id: '2',
    name: 'Snorkeling Gear',
    category: 'sports',
    description: 'Professional snorkeling equipment',
    business: { name: 'Water Sports Center' },
  },
];

describe('SearchWithTypeahead', () => {
  const mockOnChange = vi.fn();
  const mockOnSelect = vi.fn();

  const mockBusinessQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: mockBusinesses }),
  };

  const mockProductQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: mockProducts }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'businesses') return mockBusinessQuery;
      if (table === 'products') return mockProductQuery;
      return mockBusinessQuery;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders search input correctly', () => {
    render(
      <SearchWithTypeahead
        value=""
        onChange={mockOnChange}
        placeholder="Test placeholder"
      />
    );

    expect(screen.getByPlaceholderText('Test placeholder')).toBeInTheDocument();
  });

  it('displays suggestions when typing', async () => {
    render(
      <SearchWithTypeahead
        value="sun"
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    // Wait for debounced search
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('businesses');
      expect(supabase.from).toHaveBeenCalledWith('products');
    });

    await waitFor(() => {
      expect(screen.getByText('Sunset Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Fresh Fish')).toBeInTheDocument();
    });
  });

  it('shows business and product type badges', async () => {
    render(
      <SearchWithTypeahead
        value="test"
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('business')).toBeInTheDocument();
      expect(screen.getByText('product')).toBeInTheDocument();
    });
  });

  it('handles suggestion selection', async () => {
    render(
      <SearchWithTypeahead
        value="sun"
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Sunset Restaurant')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sunset Restaurant'));

    expect(mockOnChange).toHaveBeenCalledWith('Sunset Restaurant');
    expect(mockOnSelect).toHaveBeenCalledWith({
      id: '1',
      name: 'Sunset Restaurant',
      type: 'business',
      category: 'food',
      description: 'Beautiful beachfront dining experience',
    });
  });

  it('does not show suggestions for short queries', async () => {
    render(
      <SearchWithTypeahead
        value="a"
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    // Wait to ensure no API calls are made
    await new Promise(resolve => setTimeout(resolve, 400));

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('shows loading state during search', async () => {
    // Mock a delayed response
    const delayedQuery = {
      ...mockBusinessQuery,
      limit: vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: mockBusinesses }), 100))
      ),
    };
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'businesses') return delayedQuery;
      if (table === 'products') return mockProductQuery;
      return delayedQuery;
    });

    render(
      <SearchWithTypeahead
        value="test"
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    // Should show loading spinner
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  it('handles search errors gracefully', async () => {
    const errorQuery = {
      ...mockBusinessQuery,
      limit: vi.fn().mockRejectedValue(new Error('Search failed')),
    };

    (supabase.from as any).mockImplementation(() => errorQuery);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SearchWithTypeahead
        value="test"
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching suggestions:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('prioritizes exact name matches', async () => {
    const mixedResults = [
      { id: '1', name: 'Test Product', category: 'food', description: 'Description with test' },
      { id: '2', name: 'Another Item', category: 'retail', description: 'Test in description' },
    ];

    const priorityQuery = {
      ...mockBusinessQuery,
      limit: vi.fn().mockResolvedValue({ data: mixedResults }),
    };

    (supabase.from as any).mockImplementation(() => priorityQuery);

    render(
      <SearchWithTypeahead
        value="test"
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      const suggestions = screen.getAllByRole('generic');
      // First suggestion should be the one with exact name match
      expect(suggestions[0]).toHaveTextContent('Test Product');
    });
  });

  it('formats categories correctly', async () => {
    render(
      <SearchWithTypeahead
        value="test"
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Food & Beverages')).toBeInTheDocument();
      expect(screen.getByText('Accommodation')).toBeInTheDocument();
    });
  });

  it('shows business name for products', async () => {
    render(
      <SearchWithTypeahead
        value="fish"
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Sunset Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Water Sports Center')).toBeInTheDocument();
    });
  });
});