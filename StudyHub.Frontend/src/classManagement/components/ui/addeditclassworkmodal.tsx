import React, { useState, useEffect } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useNavigate, useParams } from "react-router-dom";
import type { UserRole } from "@/classManagement/components/ui/classcard";

/* shadcn components */
import { Card } from "@/common/components/ui/card";
import { Label } from "@/common/components/ui/label";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import { Button } from "@/common/components/ui/button";

const AddEditClassworkForm: React.FC = () => {
  const params = useParams<{ role?: string; id?: string; classworkId?: string }>();
  const { role: roleParam, id: idParam, classworkId } = params;
  const role = (roleParam === "student" ? "student" : "teacher") as UserRole;

  const isEdit = !!classworkId;
  const { createClasswork, editClasswork, getClassWorks, currentClass } = useClassStore();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && classworkId && currentClass?.data?.works) {
      const cw = currentClass.data.works.find((w) => String(w.id) === String(classworkId));
      if (cw) {
        setTitle(cw.title ?? "");
        setDescription(cw.description ?? "");
        setDeadline(cw.deadline ?? "");
      }
    }
  }, [isEdit, classworkId, currentClass?.data?.works]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && classworkId) {
        await editClasswork({
          id: Number(classworkId),
          classId: Number(idParam),
          title,
          description,
          deadline,
        });
      } else {
        await createClasswork({
          classId: Number(idParam),
          title,
          description,
          deadline,
        });
      }
      await getClassWorks(Number(idParam));
      navigate(`/class/${role}/${idParam}?tab=exercise`);
    } catch (err) {
      console.error("Error creating/updating classwork", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/class/${role}/${idParam}?tab=exercise`);
  };

  return (
    <Card className="max-w-lg mx-auto mt-8 p-6">
      <h2 className="text-xl font-bold mb-4">{isEdit ? "Sửa bài tập" : "Thêm bài tập mới"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="mb-1">Tiêu đề</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <Label className="mb-1">Mô tả</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <Label className="mb-1">Hạn nộp</Label>
          <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {isEdit ? (loading ? "Đang cập nhật..." : "Cập nhật") : (loading ? "Đang thêm..." : "Thêm mới")}
          </Button>
          <Button variant="ghost" onClick={handleCancel} type="button">
            Hủy
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddEditClassworkForm;