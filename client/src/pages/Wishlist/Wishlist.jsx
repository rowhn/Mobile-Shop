import { Navigate } from 'react-router-dom';
import ProductCard, { ProductCardSkeleton } from '../../components/ProductCard.jsx';
import { Button, EmptyState, ErrorState } from '../../components/ui';
import { api } from '../../lib/api.js';
import { useAsync, usePageTitle } from '../../lib/hooks.js';
import { useAuth } from '../../context/Auth.jsx';
import { useWishlist } from '../../context/Wishlist.jsx';
import './Wishlist.css';

export default function Wishlist() {
  usePageTitle('Wishlist');
  const { user, loading: authLoading } = useAuth();
  const wishlist = useWishlist();
  const { data, loading, error, reload } = useAsync(() => (user ? api.get('/wishlist') : null), [user?.id]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" state={{ from: '/wishlist' }} replace />;

  // items un-hearted on this page disappear immediately (the heart state lives in context)
  const items = (data?.items || []).filter((p) => wishlist.has(p.id));

  return (
    <div className="container py-4 py-lg-5">
      <h1 className="page-title mb-4">Wishlist</h1>
      {error ? <ErrorState error={error} onRetry={reload} /> : loading ? (
        <div className="row row-cols-2 row-cols-lg-4 g-3 g-md-4">{[0, 1, 2, 3].map((i) => <div className="col" key={i}><ProductCardSkeleton /></div>)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon="heart" title="Nothing saved yet" text="Tap the heart on any product to save it here." action={<Button to="/shop">Browse products</Button>} />
      ) : (
        <div className="row row-cols-2 row-cols-lg-4 g-3 g-md-4 pm-wishlist__grid">{items.map((p) => <div className="col" key={p.id}><ProductCard product={p} /></div>)}</div>
      )}
    </div>
  );
}
