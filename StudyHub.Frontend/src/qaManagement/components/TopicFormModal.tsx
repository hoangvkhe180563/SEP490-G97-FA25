import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import { Label } from "@/common/components/ui/label";
import { Checkbox } from "@/common/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import useTopicStore from "../stores/useTopicStore";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  initial?: any | null;
};

const TopicFormModal: React.FC<Props> = ({ open, setOpen, initial }) => {
  const { createTopic, updateTopic, getSubjects, isSaving } = useTopicStore();
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    if (initial) {
      setName(initial.name ?? "");
      setSubjectId(initial.subjectId ? Number(initial.subjectId) : undefined);
      setDescription(initial.description ?? "");
      setIsActive(initial.isActive ?? true);
    } else {
      setName("");
      setSubjectId(undefined);
      setDescription("");
      setIsActive(true);
    }
  }, [initial]);

  useEffect(() => {
    getSubjects?.().then((res) => setSubjects(res ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async () => {
    const dto = {
      name,
      subjectId: subjectId ?? 0,
      description,
      isActive,
    };
    if (initial && initial.id) {
      await updateTopic(Number(initial.id), dto);
    } else {
      await createTopic(dto);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Cập nhật topic" : "Tạo topic"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Tên chủ đề</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Môn</Label>
            <Select
              value={subjectId ? String(subjectId) : undefined}
              onValueChange={(v) => setSubjectId(v ? Number(v) : undefined)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn môn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={"0"}>Chọn môn</SelectItem>
                {subjects.map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={isActive}
              onCheckedChange={(v) => setIsActive(Boolean(v))}
            />
            <span>Kích hoạt</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TopicFormModal;
