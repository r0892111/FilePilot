import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/utils';
import { AuthForm } from '../AuthForm';

describe('AuthForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnToggleMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <AuthForm 
        mode="login" 
        onSuccess={mockOnSuccess} 
        onToggleMode={mockOnToggleMode} 
      />
    );

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to access your FilePilot dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders signup form correctly', () => {
    render(
      <AuthForm 
        mode="signup" 
        onSuccess={mockOnSuccess} 
        onToggleMode={mockOnToggleMode} 
      />
    );

    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText('Get started with FilePilot today')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows Google OAuth button', () => {
    render(
      <AuthForm 
        mode="login" 
        onSuccess={mockOnSuccess} 
        onToggleMode={mockOnToggleMode} 
      />
    );

    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('validates email input', async () => {
    render(
      <AuthForm 
        mode="login" 
        onSuccess={mockOnSuccess} 
        onToggleMode={mockOnToggleMode} 
      />
    );

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('toggles between login and signup modes', () => {
    render(
      <AuthForm 
        mode="login" 
        onSuccess={mockOnSuccess} 
        onToggleMode={mockOnToggleMode} 
      />
    );

    const toggleButton = screen.getByText('Sign up');
    fireEvent.click(toggleButton);

    expect(mockOnToggleMode).toHaveBeenCalled();
  });

  it('shows password confirmation field in signup mode', () => {
    render(
      <AuthForm 
        mode="signup" 
        onSuccess={mockOnSuccess} 
        onToggleMode={mockOnToggleMode} 
      />
    );

    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
  });
});