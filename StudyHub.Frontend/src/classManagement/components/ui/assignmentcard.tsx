import React from "react";
import { Card } from "@/common/components/ui/card";
import { Calendar, AlertCircle } from "lucide-react";

export type Assignment = {
  id: number | string;
  title: string;
  due: string; // ISO or display
  submitted: number;
  icon?: "alert" | "calendar";
};

const AssignmentCard: React.FC<{ a: Assignment }> = ({ a }) => {
  return (
    <Card className="p-4">
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
          {a.icon === "calendar" ? (
            <Calendar className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-slate-900 truncate">{a.title}</div>
          <div className="text-sm text-slate-500 mt-1">Due: {a.due}</div>
          <div className="text-xs text-slate-400 mt-2">
            Students submitted: {a.submitted}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AssignmentCard;
