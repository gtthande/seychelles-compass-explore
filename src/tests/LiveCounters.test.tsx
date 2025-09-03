import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import LiveCounters from '@/components/LiveCounters';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

// Mock live counter data
const mockCounterData = [
  {
    verified_businesses: 25,
    active_products: 150,
    total_users: 500,
    total_reviews: 75,
  }
];

const mockEmptyCounterData = [
  {
    verified_businesses: 0,
    active_products: 0,
    total_users: 0,
    total_reviews: 0,
  }
];

describe('LiveCounters', () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.channel as any).mockReturnValue(mockChannel);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state initially', () => {
    (supabase.rpc as any).mockResolvedValue({ data: mockCounterData, error: null });
    
    render(<LiveCounters />);
    
    expect(screen.getAllByRole('presentation')).toHaveLength(4); // Loading skeletons
  });

  it('displays counter data correctly', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: mockCounterData, error: null });
    
    render(<LiveCounters />);
    
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    // Check titles
    expect(screen.getByText('Verified Businesses')).toBeInTheDocument();
    expect(screen.getByText('Products Available')).toBeInTheDocument();
    expect(screen.getByText('Registered Users')).toBeInTheDocument();
    expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
  });

  it('handles zero state correctly', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: mockEmptyCounterData, error: null });
    
    render(<LiveCounters />);
    
    await waitFor(() => {
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements).toHaveLength(4);
    });

    // Should show "No data yet" instead of "Live count"
    const noDataTexts = screen.getAllByText('No data yet');
    expect(noDataTexts).toHaveLength(4);
  });

  it('handles error state gracefully', async () => {
    const mockError = new Error('Database connection failed');
    (supabase.rpc as any).mockResolvedValue({ data: null, error: mockError });
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<LiveCounters />);
    
    await waitFor(() => {
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements).toHaveLength(4);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching counts:', mockError);
    
    consoleSpy.mockRestore();
  });

  it('calls the correct database function', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: mockCounterData, error: null });
    
    render(<LiveCounters />);
    
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('get_live_counters');
    });
  });

  it('sets up real-time subscriptions', () => {
    (supabase.rpc as any).mockResolvedValue({ data: mockCounterData, error: null });
    
    render(<LiveCounters />);
    
    // Should create channels for each table
    expect(supabase.channel).toHaveBeenCalledWith('business-changes');
    expect(supabase.channel).toHaveBeenCalledWith('product-changes');
    expect(supabase.channel).toHaveBeenCalledWith('profile-changes');
    expect(supabase.channel).toHaveBeenCalledWith('review-changes');
    
    // Should set up postgres_changes listeners
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'businesses' },
      expect.any(Function)
    );
  });

  it('formats large numbers correctly', async () => {
    const largeNumberData = [
      {
        verified_businesses: 1250,
        active_products: 15000,
        total_users: 50000,
        total_reviews: 7500,
      }
    ];
    
    (supabase.rpc as any).mockResolvedValue({ data: largeNumberData, error: null });
    
    render(<LiveCounters />);
    
    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByText('15,000')).toBeInTheDocument();
      expect(screen.getByText('50,000')).toBeInTheDocument();
      expect(screen.getByText('7,500')).toBeInTheDocument();
    });
  });
});