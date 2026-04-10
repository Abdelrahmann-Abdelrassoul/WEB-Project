import LoadingSpinner from "./LoadingSpinner";

export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center justify-center z-50">
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse" />
        <LoadingSpinner size="xl" color="purple" />
      </div>
      <p className="mt-6 text-gray-400 text-lg animate-pulse">{message}</p>
    </div>
  );
}