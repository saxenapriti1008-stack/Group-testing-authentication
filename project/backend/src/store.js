/** @type {{ id: string; name: string; address?: string; reviews: { id: string; rating: number; comment: string; userId: string }[] }[]} */
let gyms = [
  {
    id: 'seed-1',
    name: 'Downtown Fitness',
    address: '1 Main St',
    reviews: [],
  },
{
    id: 'seed-2',
    name: 'City Gym',
    address: '100 Oak Ave',
    reviews: [],
  },


];



let nextId = 2;

export function listGyms() {
  return gyms.map((g) => ({
    id: g.id,
    name: g.name,
    address: g.address,
    reviewCount: g.reviews.length,
  }));
}

export function getGym(id) {
  return gyms.find((g) => g.id === id) ?? null;
}

export function createGym({ name, address }, userId) {
  const id = `gym-${nextId++}`;
  const gym = { id, name, address: address ?? '', reviews: [] };
  gyms.push(gym);
  return gym;
}

export function addReview(gymId, { rating, comment }, userId) {
  const gym = getGym(gymId);
  if (!gym) return null;
  const rid = `rev-${gym.reviews.length + 1}-${Date.now()}`;
  const review = { id: rid, rating: Number(rating), comment: String(comment ?? ''), userId };
  gym.reviews.push(review);
  return review;
}

/** Reset store for tests */
export function __resetStore() {
  gyms = [
    {
      id: 'seed-1',
      name: 'Downtown Fitness',
      address: '1 Main St',
      reviews: [],
    },
  ];
  nextId = 2;
}
