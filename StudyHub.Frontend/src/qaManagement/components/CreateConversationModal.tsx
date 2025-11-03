import React, { useEffect, useState } from "react";
import { Input } from "@/common/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/common/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/common/components/ui/alert-dialog";
import { Label } from "@/common/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/common/components/ui/select";
import { Checkbox } from "@/common/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "@/lib/axios";
import { Plus } from "lucide-react";
import { Button } from "@/common/components/ui/button";

interface CreateConversationModalProps {
  setCreateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  createOpen: boolean;
}

const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
  setCreateOpen,
  createOpen,
}) => {
  const navigate = useNavigate();
  const [cTitle, setCTitle] = useState("");
  const [cTopicId, setCTopicId] = useState<number>(0);
  const [cTopics, setCTopics] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [cIsPaid, setCIsPaid] = useState(false);
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError] = useState<string | null>(null);

  useEffect(() => {
    // load topics for the create modal
    let mounted = true;
    const load = async () => {
      try {
        const resp = await axiosInstance.get("/QATopic");
        const json = resp.data;
        if (json && json.success && Array.isArray(json.data)) {
          if (!mounted) return;
          const tlist = json.data.map((d: any) => ({
            id: d.id ?? d.Id ?? 0,
            name: d.name ?? d.Name ?? d.title ?? d.Title ?? String(d.id),
          }));
          setCTopics(tlist);
          if (tlist.length > 0) setCTopicId(tlist[0].id);
        }
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const createConversation = async () => {
    if (!cTitle.trim()) {
      setCError("Tiêu đề là bắt buộc");
      return;
    }
    setCError(null);
    setCLoading(true);
    try {
      const payload = {
        title: cTitle.trim(),
        topicId: cTopicId || 0,
        teacherId: null,
        isPaid: cIsPaid,
      };
      const resp = await axiosInstance.post("/QAConversation", payload);
      const json = resp.data;
      if ((json && json.success) || resp.status === 201) {
        const id = json?.data?.id ?? json?.data?.Id;
        setCreateOpen(false);
        // navigate to conversation details if id present
        if (id) navigate(`/qa/student/conversations/${id}`);
        return;
      }
      setCError(json?.message ?? "Không thể tạo cuộc hội thoại");
    } catch (err: any) {
      setCError(err?.message ?? String(err));
    } finally {
      setCLoading(false);
    }
  };

  return (
    <div>
      <AlertDialog open={createOpen} onOpenChange={setCreateOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button variant="default" size="icon" className="rounded-full">
                  <Plus className="w-20 h-20" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="!px-2 !py-1">
              Thêm hội thoại
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tạo cuộc hội thoại mới</AlertDialogTitle>
            <AlertDialogDescription>
              Nhập tiêu đề và chọn chủ đề (tùy chọn)
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 mt-2">
            <div>
              <Label className="mb-2">Tiêu đề</Label>
              <Input
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                placeholder="Nhập tiêu đề cuộc hội thoại"
              />
              {cError && (
                <div className="text-sm mt-2 text-red-600">{cError}</div>
              )}
            </div>

            <div>
              <Label className="mb-2">Chủ đề</Label>
              <Select
                value={String(cTopicId ?? 0)}
                onValueChange={(v) => setCTopicId(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn chủ đề (tùy chọn)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Chọn chủ đề (tùy chọn)</SelectItem>
                  {cTopics.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="isPaid_modal"
                checked={cIsPaid}
                onCheckedChange={(v) => setCIsPaid(Boolean(v))}
              />
              <Label htmlFor="isPaid_modal">Trả phí</Label>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCreateOpen(false)}>
              Hủy
            </AlertDialogCancel>
            {/* Use a regular Button here so we can run validation and keep the dialog open on error.
                AlertDialogAction (Radix) will close the dialog automatically which prevents showing
                validation errors inside the modal. */}
            <div>
              <Button onClick={createConversation} disabled={cLoading}>
                {cLoading ? "Đang tạo..." : "Tạo cuộc hội thoại"}
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateConversationModal;
