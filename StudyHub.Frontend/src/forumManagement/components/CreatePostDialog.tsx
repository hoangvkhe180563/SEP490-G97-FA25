// src/forumManagement/components/CreatePostDialog.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { useForumStore } from "../stores/useForumStore";
import { documentService } from "@/documentManagement/services/documentService";
import type { Subject } from "../interfaces/forum";
import { DialogDescription } from "@/common/components/ui/dialog";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: number;
}

export const CreatePostDialog = ({
  open,
  onOpenChange,
  schoolId,
}: CreatePostDialogProps) => {
  const { createPost, isLoading, flairs, loadFlairs } = useForumStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [flairId, setFlairId] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (open) {
      documentService.getSubjects().then(setSubjects);
      loadFlairs(schoolId);
    }
  }, [open, schoolId, loadFlairs]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      alert("Tối đa 10 ảnh");
      return;
    }

    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !subjectId || !flairId) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const formData = new FormData();
    formData.append("schoolId", schoolId.toString());
    formData.append("subjectId", subjectId);
    formData.append("flairId", flairId);
    formData.append("title", title);
    formData.append("content", content);
    images.forEach((img) => formData.append("attachments", img));

    const result = await createPost(formData);
    if (result?.success) {
      setTitle("");
      setContent("");
      setSubjectId("");
      setFlairId("");
      setImages([]);
      setImagePreviews([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo bài viết mới</DialogTitle>
          <DialogDescription className="sr-only">
            Form tạo bài viết mới trong diễn đàn
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn môn học" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={flairId} onValueChange={setFlairId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại bài viết" />
              </SelectTrigger>
              <SelectContent>
                {flairs && flairs.length > 0 ? (
                  flairs
                    .filter((f) => f?.id)
                    .map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.name || "N/A"}
                      </SelectItem>
                    ))
                ) : (
                  <SelectItem value="no-flairs" disabled>
                    Không có loại bài viết
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="Tiêu đề bài viết"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />

          <Textarea
            placeholder="Nội dung bài viết..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            maxLength={2000}
          />
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-24 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("post-images")?.click()}
              disabled={images.length >= 10}
            >
              <ImagePlus className="w-4 h-4 mr-2" />
              Thêm ảnh ({images.length}/10)
            </Button>
            <input
              id="post-images"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Đăng bài
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
