import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthBanner, ProtectedGymForm, GymList } from './GymUI.jsx';

describe('GymUI unit tests', () => {
  it('shows not logged in message when no user', () => {
    render(<AuthBanner user={null} />);
    expect(screen.getByTestId('auth-msg')).toHaveTextContent('not logged in');
  });

  it('shows user name when logged in', () => {
    render(<AuthBanner user={{ email: 'alex@example.com' }} />);
    expect(screen.getByTestId('user-name')).toHaveTextContent('alex@example.com');
  });

  it('hides protected form when user is not logged in', () => {
    render(
      <ProtectedGymForm user={null}>
        <span>secret form</span>
      </ProtectedGymForm>,
    );
    expect(screen.queryByTestId('protected-form')).toBeNull();
  });

  it('shows gym names when data is provided', () => {
    const gyms = [
      { id: '1', name: 'Iron Hall' },
      { id: '2', name: 'Cardio Corner' },
    ];
    render(<GymList gyms={gyms} />);
    expect(screen.getByTestId('gym-list')).toBeInTheDocument();
    expect(screen.getByText('Iron Hall')).toBeInTheDocument();
    expect(screen.getByText('Cardio Corner')).toBeInTheDocument();
  });

  it('shows error-style empty message when gym list is empty', () => {
    render(<GymList gyms={[]} emptyMessage="Could not load any gyms." />);
    expect(screen.getByTestId('gym-empty')).toHaveTextContent('Could not load any gyms.');
  });
});
