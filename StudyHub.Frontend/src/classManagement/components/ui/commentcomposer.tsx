// url=https://github.com/hoangvkhe180563/SEP490-G97-FA25/blob/main/StudyHub.Frontend/src/classManagement/components/ui/comment-composer.tsx
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

const CommentComposer: React.FC<Props> = ({ avatarUrl, placeholder = "Viết bình luận...", onSend }) => {
  const [text, setText] = useState("");
  const { user } = useAuthStore();
  const fallbackAvatar =
    avatarUrl ;

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <form onSubmit={submit} className="flex items-start gap-3">
      <Avatar>
         { fallbackAvatar ? (
                        <AvatarImage
                          src={fallbackAvatar}
                          alt="avatar"
                         
                        />
                      ) : (
                        <AvatarFallback>
                          {(user as any)?.fullname
                            ? String((user as any).fullname)
                                .split(/\s+/)
                                .map((p: string) => p.charAt(0))
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      )}
      </Avatar>

      <div className="flex-1">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="min-h-[40px]"
        />
      </div>

      <div>
        <Button type="submit" disabled={!text.trim()}>
          Gửi
        </Button>
      </div>
    </form>
  );
};

export default CommentComposer;