import { useNavigate } from "react-router-dom";
import { Edit, Play, Plus } from "lucide-react";

function ViewLessonButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/teacher/lecture/:id")}
      className={`${
        className ?? ""
      } flex items-center gap-2 text-sm text-[#525252] hover:bg-gray-50 p-1 rounded`}
    >
      <Play className="w-3.5 h-3.5" /> View
    </button>
  );
}

function AddLessonButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/teacher/add-lecture?type=video")}
      className={`${
        className ?? ""
      } w-full h-[38px] border border-dashed border-[#D4D4D4] rounded flex items-center justify-center gap-2 text-sm text-[#525252] hover:bg-gray-50`}
    >
      <Plus className="w-3 h-3.5" /> Add Lesson
    </button>
  );
}

function EditLessonButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/teacher/edit-lecture")}
      className={`${
        className ?? ""
      } flex items-center gap-2 text-sm text-[#525252] hover:bg-gray-50 p-1 rounded`}
    >
      <Edit className="w-3.5 h-3.5" /> Edit
    </button>
  );
}

export { ViewLessonButton, AddLessonButton, EditLessonButton };
