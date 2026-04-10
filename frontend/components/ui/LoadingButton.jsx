import LoadingSpinner from "./LoadingSpinner";

export default function LoadingButton({ loading, children, className = "", ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`relative overflow-hidden transition-all duration-200 ${className} ${
        loading ? "opacity-70 cursor-wait" : ""
      }`}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" color="white" />
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}