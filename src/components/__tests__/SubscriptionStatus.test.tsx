import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils';
import { SubscriptionStatus } from '../SubscriptionStatus';
import { mockSupabaseClient } from '../../test/utils';

describe('SubscriptionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    render(<SubscriptionStatus />);
    
    expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
  });

  it('shows no subscription message when user has no active subscription', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    render(<SubscriptionStatus />);

    await waitFor(() => {
      expect(screen.getByText('No active subscription')).toBeInTheDocument();
    });
  });

  it('shows active subscription status', async () => {
    const mockSubscription = {
      subscription_status: 'active',
      price_id: 'price_1RdEVlFzbUfm7BYRWpZ2CXVR',
      current_period_end: Math.floor(Date.now() / 1000) + 86400,
      cancel_at_period_end: false,
    };

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockSubscription, error: null }),
    });

    render(<SubscriptionStatus />);

    await waitFor(() => {
      expect(screen.getByText('Yearly Plan')).toBeInTheDocument();
      expect(screen.getByText('Status: Active')).toBeInTheDocument();
    });
  });

  it('shows canceling status when subscription is set to cancel', async () => {
    const mockSubscription = {
      subscription_status: 'active',
      price_id: 'price_1RdEVlFzbUfm7BYRWpZ2CXVR',
      current_period_end: Math.floor(Date.now() / 1000) + 86400,
      cancel_at_period_end: true,
    };

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockSubscription, error: null }),
    });

    render(<SubscriptionStatus />);

    await waitFor(() => {
      expect(screen.getByText('Status: Active (Canceling)')).toBeInTheDocument();
    });
  });
});