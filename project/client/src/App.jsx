import { useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebase.js';
import { fetchGyms, fetchProfile, createGym, createReview } from './api.js';
import { AuthBanner, ProtectedGymForm, GymList } from './GymUI.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gymName, setGymName] = useState('');
  const [reviewGymId, setReviewGymId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadError('');
        const data = await fetchGyms();
        if (!cancelled) setGyms(data);
      } catch {
        if (!cancelled) setLoadError('Failed to load gyms.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchProfile();
        if (!cancelled) setProfile(p);
      } catch {
        if (!cancelled) setProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleLogin(e) {
    e.preventDefault();
    setStatus('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setStatus(err.message ?? 'Login failed');
    }
  }

  async function handleLogout() {
    await signOut(auth);
    setProfile(null);
    setStatus('');
  }

  async function handleAddGym(e) {
    e.preventDefault();
    setStatus('');
    try {
      const g = await createGym({ name: gymName });
      setGymName('');
      setGyms((prev) => [...prev, { id: g.id, name: g.name, address: g.address, reviewCount: 0 }]);
      setStatus('Gym created.');
    } catch (err) {
      setStatus(err.response?.data?.error ?? err.message ?? 'Failed');
    }
  }

  async function handleAddReview(e) {
    e.preventDefault();
    setStatus('');
    try {
      await createReview(reviewGymId, { rating: reviewRating, comment: reviewComment });
      setReviewComment('');
      const data = await fetchGyms();
      setGyms(data);
      setStatus('Review added.');
    } catch (err) {
      setStatus(err.response?.data?.error ?? err.message ?? 'Failed');
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 640, margin: '2rem auto', padding: 16 }}>
      <h1>Gym reviews</h1>
      <AuthBanner user={user} />

      {!user ? (
        <form onSubmit={handleLogin} style={{ marginTop: 16 }}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label style={{ display: 'block', marginTop: 8 }}>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          <button type="submit" style={{ marginTop: 12 }}>
            Log in
          </button>
        </form>
      ) : (
        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
          {profile?.user && (
            <p style={{ marginTop: 8 }}>
              Profile uid: <code>{profile.user.uid}</code>
            </p>
          )}
        </div>
      )}

      <section style={{ marginTop: 24 }}>
        <h2>Gyms</h2>
        {loadError ? <GymList gyms={[]} emptyMessage={loadError} /> : <GymList gyms={gyms} />}
      </section>

      <ProtectedGymForm user={user}>
        <section style={{ marginTop: 24 }}>
          <h2>Add a gym</h2>
          <form onSubmit={handleAddGym}>
            <input
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              placeholder="Gym name"
              required
            />
            <button type="submit" style={{ marginLeft: 8 }}>
              Submit
            </button>
          </form>
        </section>
        <section style={{ marginTop: 24 }}>
          <h2>Add a review</h2>
          <form onSubmit={handleAddReview}>
            <input
              value={reviewGymId}
              onChange={(e) => setReviewGymId(e.target.value)}
              placeholder="Gym id"
              required
            />
            <input
              type="number"
              min={1}
              max={5}
              value={reviewRating}
              onChange={(e) => setReviewRating(Number(e.target.value))}
              style={{ width: 64, marginLeft: 8 }}
            />
            <input
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Comment"
              style={{ marginLeft: 8 }}
            />
            <button type="submit" style={{ marginLeft: 8 }}>
              Submit review
            </button>
          </form>
        </section>
      </ProtectedGymForm>

      {status && <p style={{ marginTop: 16 }}>{status}</p>}
    </main>
  );
}
