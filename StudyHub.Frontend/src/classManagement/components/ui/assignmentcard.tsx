import React from "react";

export type Assignment = {
  id: number | string;
  title: string;
  due: string; // ISO or display
  submitted: number;
  icon?: "alert" | "calendar";
};

const AssignmentCard: React.FC<{ a: Assignment }> = ({ a }) => {
  return (
    <div className="bg-white border rounded-lg p-4 flex gap-3 items-start">
      <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-600">
        {a.icon === "calendar" ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M12 8v4" stroke="currentColor" strokeWidth="1.5"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5"/></svg>
        )}
      </div>

      <div className="flex-1">
        <div className="font-medium">{a.title}</div>
        <div className="text-sm text-gray-500 mt-1">Due: {a.due}</div>
        <div className="text-xs text-gray-400 mt-2">Students submitted: {a.submitted}</div>
      </div>
    </div>
  );
};

export default AssignmentCard;