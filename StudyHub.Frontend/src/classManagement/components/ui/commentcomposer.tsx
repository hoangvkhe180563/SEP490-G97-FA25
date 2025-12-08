// url=https://github.com/hoangvkhe180563/SEP490-G97-FA25/blob/main/StudyHub. Frontend/src/classManagement/components/ui/comment-composer.tsx
import React, { useState } from "react";
import { useAuthStore } from "@/auth/stores/useAuthStore";

/* shadcn components */
import { Avatar, AvatarImage, AvatarFallback } from "@/common/components/ui/avatar";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";

type Props = {
  avatarUrl?: string;
  placeholder?: string;
  onSend: (text: string) => void;
};

const CommentComposer: React. FC<Props> = ({ avatarUrl, placeholder = "Viết bình luận.. .", onSend }) => {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const { user } = useAuthStore();
  const fallbackAvatar = avatarUrl;

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Nội dung bình luận là bắt buộc");
      return;
    }
    setError("");
    onSend(trimmed);
    setText("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      setError("");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-1">
      <div className="flex items-start gap-3">
        <Avatar>
          {fallbackAvatar ? (
            <AvatarImage src={fallbackAvatar} alt="avatar" />
          ) : (
            <AvatarFallback>
              {(user as any)?. fullname
                ? String((user as any).fullname)
                    .split(/\s+/)
                    .map((p: string) => p.charAt(0))
                    .slice(0, 2)
                    . join("")
                    .toUpperCase()
                : "U"}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1">
          <Input
            value={text}
            onChange={handleChange}
            placeholder={placeholder}
            className={`min-h-[40px] ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          />
        </div>

        <div>
          <Button type="submit">Gửi</Button>
        </div>
      </div>
      {error && <p className="text-xs text-red-600 ml-14">{error}</p>}
    </form>
  );
};

export default CommentComposer;