/**
 * Presentational pieces for easy unit testing (fake data / props only — no network).
 */

export function AuthBanner({ user }) {
  if (!user) {
    return <p data-testid="auth-msg">You are not logged in.</p>;
  }
  return <p data-testid="user-name">Hello, {user.email ?? user.displayName ?? 'member'}</p>;
}

export function ProtectedGymForm({ user, children }) {
  if (!user) return null;
  return <div data-testid="protected-form">{children}</div>;
}

export function GymList({ gyms, emptyMessage = 'No gyms to show.' }) {
  if (!gyms || gyms.length === 0) {
    return <p data-testid="gym-empty">{emptyMessage}</p>;
  }
  return (
    <ul data-testid="gym-list">
      {gyms.map((g) => (
        <li key={g.id}>{g.name}</li>
      ))}
    </ul>
  );
}
