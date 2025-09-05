import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import ImageSearch from '@/components/ImageSearch';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock FileReader
global.FileReader = class MockFileReader {
  result: string | null = null;
  onloadend: (() => void) | null = null;
  
  readAsDataURL() {
    this.result = 'data:image/jpeg;base64,mockbase64string';
    setTimeout(() => {
      if (this.onloadend) this.onloadend();
    }, 0);
  }
} as any;

describe('ImageSearch', () => {
  const mockOnSearchResults = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders image search component correctly', () => {
    render(<ImageSearch onSearchResults={mockOnSearchResults} />);

    expect(screen.getByText('Image Search')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
  });

  it('shows file validation error for non-image files', async () => {
    const { useToast } = await import('@/hooks/use-toast');
    const mockToast = vi.fn();
    (useToast as any).mockReturnValue({ toast: mockToast });

    render(<ImageSearch onSearchResults={mockOnSearchResults} />);

    const fileInput = screen.getByLabelText(/upload/i) || document.querySelector('input[type="file"]');
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
    });
  });

  it('shows file size validation error for large files', async () => {
    const { useToast } = await import('@/hooks/use-toast');
    const mockToast = vi.fn();
    (useToast as any).mockReturnValue({ toast: mockToast });

    render(<ImageSearch onSearchResults={mockOnSearchResults} />);

    const fileInput = document.querySelector('input[type="file"]');
    
    // Create a mock file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
    }

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
    });
  });

  it('processes valid image file successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        categories: ['food', 'restaurant'],
        keywords: ['dining', 'cuisine'],
        searchQuery: 'restaurant dining',
        description: 'A restaurant setting with food',
      },
    };

    (supabase.functions.invoke as any).mockResolvedValue(mockResponse);

    render(<ImageSearch onSearchResults={mockOnSearchResults} />);

    const fileInput = document.querySelector('input[type="file"]');
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    }

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('image-search', {
        body: {
          image: 'data:image/jpeg;base64,mockbase64string',
          searchType: 'category',
        },
      });
    });

    await waitFor(() => {
      expect(mockOnSearchResults).toHaveBeenCalledWith(mockResponse.data);
    });
  });

  it('handles API errors gracefully', async () => {
    const { useToast } = await import('@/hooks/use-toast');
    const mockToast = vi.fn();
    (useToast as any).mockReturnValue({ toast: mockToast });

    (supabase.functions.invoke as any).mockRejectedValue(new Error('API Error'));

    render(<ImageSearch onSearchResults={mockOnSearchResults} />);

    const fileInput = document.querySelector('input[type="file"]');
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    }

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Analysis Failed",
        description: "Could not analyze the image. Please try with a different image.",
        variant: "destructive",
      });
    });
  });

  it('shows loading state during processing', async () => {
    // Mock a delayed response
    (supabase.functions.invoke as any).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          data: { success: true, categories: [], keywords: [], searchQuery: '', description: '' }
        }), 100)
      )
    );

    render(<ImageSearch onSearchResults={mockOnSearchResults} />);

    const fileInput = document.querySelector('input[type="file"]');
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    }

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Analyzing image with AI...')).toBeInTheDocument();
    });
  });

  it('displays preview image after upload', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { success: true, categories: [], keywords: [], searchQuery: '', description: '' }
    });

    render(<ImageSearch onSearchResults={mockOnSearchResults} />);

    const fileInput = document.querySelector('input[type="file"]');
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    }

    await waitFor(() => {
      const previewImage = screen.getByAltText('Preview');
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute('src', 'data:image/jpeg;base64,mockbase64string');
    });
  });

  it('allows clearing the preview image', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { success: true, categories: [], keywords: [], searchQuery: '', description: '' }
    });

    render(<ImageSearch onSearchResults={mockOnSearchResults} />);

    const fileInput = document.querySelector('input[type="file"]');
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    }

    await waitFor(() => {
      expect(screen.getByAltText('Preview')).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
  });

  it('handles camera capture mode', () => {
    render(<ImageSearch onSearchResults={mockOnSearchResults} />);

    const cameraButton = screen.getByText('Camera');
    fireEvent.click(cameraButton);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('capture', 'environment');
  });

  it('disables buttons during processing', async () => {
    // Mock a long-running request
    (supabase.functions.invoke as any).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          data: { success: true, categories: [], keywords: [], searchQuery: '', description: '' }
        }), 100)
      )
    );

    render(<ImageSearch onSearchResults={mockOnSearchResults} />);

    const fileInput = document.querySelector('input[type="file"]');
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [validFile] } });
    }

    // Buttons should be disabled during processing
    await waitFor(() => {
      const cameraButton = screen.getByText('Camera');
      const uploadButton = screen.getByText('Upload');
      
      expect(cameraButton).toBeDisabled();
      expect(uploadButton).toBeDisabled();
    });
  });
});