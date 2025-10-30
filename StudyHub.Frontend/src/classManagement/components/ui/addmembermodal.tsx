import React, { useState, useEffect } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import type { ClassMemberDto } from "@/classManagement/interfaces/class";

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
        // Try call suggestion endpoint (adjust path if different)
        const res = await fetch(`/User/search?query=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        // Expect array of { email, fullname }
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
    // validate selected contain at least one valid email
    const valid = selected.filter((e) => emailRegex(e));
    if (valid.length === 0) {
      setError("Vui lòng thêm ít nhất 1 email hợp lệ.");
      return;
    }

    setIsSending(true);
    try {
      const result = await inviteMembers(classId, valid, "Student"); // or role selected
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-md shadow-lg w-full max-w-2xl mx-4 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium">Mời thành viên</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm text-gray-600">Nhập tên hoặc email</label>
            <input
              className="mt-2 w-full border rounded px-3 py-2"
              placeholder="Nhập email hoặc tên, nhấn Enter để thêm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // if query contains comma-separated, split
                  const items = query.split(",").map((s) => s.trim()).filter(Boolean);
                  if (items.length > 1) {
                    items.forEach(addEmail);
                  } else {
                    // if looks like email, add; else if suggestion exists and selected, add suggestion.email
                    if (emailRegex(query)) addEmail(query);
                    else if (suggestions[0]) addEmail(suggestions[0].email);
                  }
                }
              }}
            />
          </div>

          {suggestions.length > 0 && (
            <div className="max-h-44 overflow-y-auto border rounded">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => addEmail(s.email)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                    {s.name ? s.name.split(" ").slice(-1)[0].charAt(0) : s.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{s.name ?? s.email}</div>
                    <div className="text-xs text-gray-500">{s.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((e) => (
                <div key={e} className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100">
                  <span className="text-xs mr-2">{e}</span>
                  <button onClick={() => removeEmail(e)} className="text-xs text-gray-600">✕</button>
                </div>
              ))}
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border rounded">Hủy</button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
            >
              {isSending ? "Đang gửi..." : "Mời"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;