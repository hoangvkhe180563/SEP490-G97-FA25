import React, { useState, useEffect } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import type { ClassMemberDto } from "@/classManagement/interfaces/class";

/* shadcn components */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/common/components/ui/dialog";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar";
import { Badge } from "@/common/components/ui/badge";
import { ScrollArea } from "@/common/components/ui/scroll-area";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  classId: number;
  onClose: () => void;
  onInvited?: (result?: any) => void;
};

const emailRegex = (s: string) =>
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(s.trim());

const AddMemberModal: React.FC<Props> = ({ open, classId, onClose, onInvited }) => {
  const inviteMembers = useClassStore((s) => s.inviteMembers);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{ name?: string; email: string }>>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const q = debounced.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/User/search?query=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data)) {
          setSuggestions(
            data.map((u: any) => ({ name: u.fullname ?? u.name ?? undefined, email: u.email ?? u.userName ?? "" }))
          );
        } else if (data?.data && Array.isArray(data.data)) {
          setSuggestions(
            data.data.map((u: any) => ({ name: u.fullname ?? u.name ?? undefined, email: u.email ?? u.userName ?? "" }))
          );
        }
      } catch {
        // ignore suggestion errors
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelected([]);
      setSuggestions([]);
      setError(null);
    }
  }, [open]);

  const addEmail = (email: string) => {
    const cleaned = email.trim();
    if (!cleaned) return;
    if (!selected.includes(cleaned)) setSelected((s) => [...s, cleaned]);
    setQuery("");
    setSuggestions([]);
  };

  const removeEmail = (email: string) => {
    setSelected((s) => s.filter((e) => e !== email));
  };

  const handleSend = async () => {
    setError(null);
    const valid = selected.filter((e) => emailRegex(e));
    if (valid.length === 0) {
      setError("Vui lòng thêm ít nhất 1 email hợp lệ.");
      return;
    }

    setIsSending(true);
    try {
      const result = await inviteMembers(classId, valid, "Student");
      setIsSending(false);
      if (result?.success) {
        onInvited?.(result);
        onClose();
      } else {
        setError(result?.message ?? "Không thể gửi lời mời.");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi khi gửi lời mời.");
      setIsSending(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-2xl w-full">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>Mời thành viên</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Nhập email hoặc tên để mời thành viên vào lớp
              </DialogDescription>
            </div>
            <DialogClose asChild>
             
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="px-4 pb-4">
          <div>
            <label className="text-sm text-slate-600 block mb-2">Nhập tên hoặc email</label>
            <Input
              placeholder="Nhập email hoặc tên, nhấn Enter để thêm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const items = query.split(",").map((s) => s.trim()).filter(Boolean);
                  if (items.length > 1) {
                    items.forEach(addEmail);
                  } else {
                    if (emailRegex(query)) addEmail(query);
                    else if (suggestions[0]) addEmail(suggestions[0].email);
                  }
                }
              }}
            />
          </div>

          {suggestions.length > 0 && (
            <div className="mt-3 border rounded overflow-hidden">
              <ScrollArea className="max-h-44">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => addEmail(s.email)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm">
                      {s.name ? s.name.split(" ").slice(-1)[0].charAt(0) : s.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{s.name ?? s.email}</div>
                      <div className="text-xs text-slate-500 truncate">{s.email}</div>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </div>
          )}

          {selected.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selected.map((e) => (
                <div key={e} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100">
                  <span className="text-xs">{e}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeEmail(e)} className="h-6 w-6 p-0">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>Hủy</Button>
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? "Đang gửi..." : "Mời"}
            </Button>
          </div>
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberModal;