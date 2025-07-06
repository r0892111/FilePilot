import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import App from '../App';
import { mockSupabaseClient } from '../test/utils';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful session check
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it('renders the main landing page', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('FilePilot')).toBeInTheDocument();
    });

    expect(screen.getByText(/Your digital copiloot for smart document management/)).toBeInTheDocument();
  });

  it('shows hero section with call-to-action', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Start Organizing Now')).toBeInTheDocument();
    });

    expect(screen.getByText('View Pricing')).toBeInTheDocument();
  });

  it('displays how it works section', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('How FilePilot works')).toBeInTheDocument();
    });

    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
    expect(screen.getByText('Connect Email & Drive')).toBeInTheDocument();
    expect(screen.getByText('AI Organizes Everything')).toBeInTheDocument();
  });

  it('shows pricing section', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
    });

    expect(screen.getByText('Monthly Plan')).toBeInTheDocument();
    expect(screen.getByText('Yearly Plan')).toBeInTheDocument();
    expect(screen.getByText('€3.49')).toBeInTheDocument();
    expect(screen.getByText('€34.99')).toBeInTheDocument();
  });

  it('displays integration slider', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Seamlessly integrates with your favorite tools')).toBeInTheDocument();
    });
  });

  it('shows authentication buttons when not logged in', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    expect(screen.getByText('Get started')).toBeInTheDocument();
  });

  it('handles authenticated user state', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    };

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { 
        session: { 
          user: mockUser,
          access_token: 'mock-token',
        } 
      },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      eq: vi.fn().mockReturnThis(),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
    });

    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });
});