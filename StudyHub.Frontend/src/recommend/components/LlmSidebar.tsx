import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useRecommendStore from "../stores/useRecommendStore";
import { Plus, Star, Trash2, MoreVertical, MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/common/components/ui/dropdown-menu";
import { Skeleton } from "@/common/components/ui/skeleton";
import { MessageCircle } from "lucide-react";

const truncate = (s: string | undefined, n = 40) => {
  if (!s) return "(Trống)";
  return s.length > n ? s.substring(0, n) + "..." : s;
};

const LlmSidebar: React.FC = () => {
  const navigate = useNavigate();
  const listLlmHistories = useRecommendStore((s: any) => s.listLlmHistories);
  const deleteLlmHistory = useRecommendStore((s: any) => s.deleteLlmHistory);
  const toggleStar = useRecommendStore((s: any) => s.toggleStarLlmHistory);
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await listLlmHistories();
      // normalize fields from backend (Id/InputText/CreatedAt or id/inputText/createdAt)
      const list = Array.isArray(res) ? res : [];
      const norm = list.map((x: any) => ({
        id: x.Id ?? x.id,
        inputText: x.InputText ?? x.inputText ?? "",
        createdAt: x.CreatedAt ?? x.createdAt,
        starred: x.starred ?? false,
        raw: x,
      }));
      setItems(norm);
    } catch (e) {
      // ignore - store handles errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const filtered = useMemo(() => {
    if (!q) return items;
    const low = q.toLowerCase();
    return items.filter((it) =>
      (it.inputText || "").toLowerCase().includes(low)
    );
  }, [items, q]);

  return (
    <div className="w-80 sticky top-6 h-[80vh]">
      <Card className="h-full flex flex-col">
        <CardHeader className="px-4 pt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              <CardTitle className="text-sm">Đề xuất gần đây</CardTitle>
            </div>
            <button
              aria-label="Đề xuất mới"
              title="Tạo đề xuất mới"
              onClick={() => {
                // navigate to input page and clear any stored recommendation
                (useRecommendStore as any).setState({
                  llmRecommendation: null,
                });
                navigate("/recommend/llm");
              }}
              className="size-8 inline-flex items-center justify-center rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3">
            <Input
              placeholder="Tìm đề xuất..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-9"
            />
          </div>
        </CardHeader>

        <CardContent className="px-2 pb-2 overflow-auto flex-1">
          {loading && (
            <div className="p-3 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="p-3 text-sm text-slate-500 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-slate-400" />
              <span>Không có lịch sử chat.</span>
            </div>
          )}

          <ul className="space-y-1">
            {filtered.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-2 p-2 hover:bg-slate-50 rounded-md cursor-pointer"
                onClick={() => navigate(`/recommend/llm/${it.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {truncate(it.inputText, 36)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {it.createdAt
                      ? new Date(it.createdAt).toLocaleString()
                      : ""}
                  </div>
                </div>

                <div className="flex items-center ml-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded hover:bg-slate-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={async (e: any) => {
                          e.stopPropagation();
                          try {
                            await toggleStar(it.id, !it.starred);
                            setItems((prev) =>
                              prev.map((x) =>
                                x.id === it.id
                                  ? { ...x, starred: !x.starred }
                                  : x
                              )
                            );
                          } catch (err) {
                            // store sets error
                          }
                        }}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        {it.starred ? "Bỏ ghim" : "Ghim"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async (e: any) => {
                          e.stopPropagation();
                          try {
                            await deleteLlmHistory(it.id);
                            setItems((prev) =>
                              prev.filter((x) => x.id !== it.id)
                            );
                          } catch (err) {
                            // store sets error
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default LlmSidebar;
