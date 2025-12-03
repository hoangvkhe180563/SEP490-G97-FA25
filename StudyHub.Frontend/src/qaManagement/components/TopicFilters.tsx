import React, { useEffect, useState } from "react";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import { PlusSquare } from "lucide-react";
import useTopicStore from "../stores/useTopicStore";

type Props = {
  onAdd: () => void;
  onSearch: (q?: string, subjectId?: number) => void;
};

const TopicFilters: React.FC<Props> = ({ onAdd, onSearch }) => {
  const [q, setQ] = useState("");
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined);
  const [subjects, setSubjects] = useState<any[]>([]);
  const { getSubjects } = useTopicStore();

  useEffect(() => {
    getSubjects?.().then((s: any[]) => setSubjects(s ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      // call parent search with debounce
      onSearch(q || undefined, subjectId);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, subjectId]);

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2 w-2/3">
        <Input
          className="flex-1 max-w-lg"
          placeholder="Tìm theo tên hoặc mô tả"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <Select
          value={subjectId ? String(subjectId) : undefined}
          onValueChange={(v) =>
            setSubjectId(v && v !== "0" ? Number(v) : undefined)
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tất cả môn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Tất cả môn</SelectItem>
            {subjects.map((s: any) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="default" onClick={onAdd}>
        <PlusSquare className="mr-2 h-4 w-4" /> Thêm
      </Button>
    </div>
  );
};

export default TopicFilters;
