import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col justify-center items-center text-center">
      <h1 className="text-5xl font-bold mb-3">404</h1>
      <p className="mb-4 opacity-80">Page not found.</p>
      <Link to="/" className="text-pi-gold underline">Go home</Link>
    </div>
  );
}
