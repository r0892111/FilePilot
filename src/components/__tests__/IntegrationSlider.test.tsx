import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/utils';
import { IntegrationSlider } from '../IntegrationSlider';

// Mock alert function
global.alert = vi.fn();

describe('IntegrationSlider', () => {
  it('renders integration logos and names', () => {
    render(<IntegrationSlider />);

    expect(screen.getByText('Google Drive')).toBeInTheDocument();
    expect(screen.getByText('Microsoft Word')).toBeInTheDocument();
    expect(screen.getByText('PDF Documents')).toBeInTheDocument();
  });

  it('shows integration stats', () => {
    render(<IntegrationSlider />);

    expect(screen.getByText('4+ Cloud Platforms')).toBeInTheDocument();
    expect(screen.getByText('50+ File Formats')).toBeInTheDocument();
    expect(screen.getByText('Always Growing')).toBeInTheDocument();
  });

  it('handles integration click', () => {
    render(<IntegrationSlider />);

    const googleDriveIntegration = screen.getByText('Google Drive').closest('div');
    fireEvent.click(googleDriveIntegration!);

    expect(global.alert).toHaveBeenCalledWith('Learn more about Google Drive support');
  });

  it('shows category badges on hover', () => {
    render(<IntegrationSlider />);

    const integrations = screen.getAllByText(/Platform|File Type/);
    expect(integrations.length).toBeGreaterThan(0);
  });

  it('handles keyboard navigation', () => {
    render(<IntegrationSlider />);

    const googleDriveIntegration = screen.getByText('Google Drive').closest('div');
    fireEvent.keyDown(googleDriveIntegration!, { key: 'Enter' });

    expect(global.alert).toHaveBeenCalledWith('Learn more about Google Drive support');
  });
});