import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center sm:hidden">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="mb-4">Page not found.</p>
      <Link to="/" className="text-pink-400 underline">Go to Home</Link>
    </div>
  );
}
