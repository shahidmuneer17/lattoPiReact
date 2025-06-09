import useAuth from '../hooks/useAuth';

export default function Home() {
  const { user, login } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 to-pink-500 flex items-center justify-center px-4 sm:hidden">
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 w-full max-w-sm text-center shadow-lg">
        <div className="text-3xl font-extrabold text-white mb-4">🎯 Scratch & Win</div>
        <button onClick={login} className="w-full py-3 rounded-full text-white bg-pink-600 hover:bg-pink-700 font-semibold shadow-lg">
          Login with Pi
        </button>
      </div>
    </div>
  );
}
