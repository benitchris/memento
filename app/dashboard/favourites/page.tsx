import TravellerDashboardPage from '../page';

export const metadata = {
  title: 'Saved favourites — Memento',
};

export default function FavouritesPage() {
  return <TravellerDashboardPage initialTab="favourites" />;
}
