import { Button } from '../../components/ui';
import { usePageTitle } from '../../lib/hooks.js';
import './NotFound.css';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className="container pm-notfound">
      <p className="small fw-semibold text-accent mb-1">404</p>
      <h1 className="page-title">Page not found</h1>
      <p className="fs-5 text-muted mt-3">The page you're looking for doesn't exist or has moved.</p>
      <Button to="/" size="lg" className="mt-4">Back to home</Button>
    </div>
  );
}
