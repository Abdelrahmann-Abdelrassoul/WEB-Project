export default function LoadingSpinner({ size = "md", color = "purple" }) {
  const sizes = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
    xl: "h-16 w-16 border-4",
  };

  const colors = {
    purple: "border-purple-500",
    white: "border-white",
    pink: "border-pink-500",
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizes[size]} ${colors[color]} rounded-full animate-spin border-t-transparent`}
      />
    </div>
  );
}