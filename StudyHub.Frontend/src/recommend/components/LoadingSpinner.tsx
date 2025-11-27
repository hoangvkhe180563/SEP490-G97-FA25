import React from "react";

const LoadingSpinner: React.FC<{ label?: string }> = ({
  label = "Đang phân tích...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 border-gray-200"></div>
      <div className="mt-4 text-slate-600 dark:text-slate-300">{label}</div>
    </div>
  );
};

export default LoadingSpinner;
