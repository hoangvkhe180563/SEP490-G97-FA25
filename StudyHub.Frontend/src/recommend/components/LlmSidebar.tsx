import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useRecommendStore from "../stores/useRecommendStore";
import {
  Plus,
  Star,
  Trash2,
  MoreVertical,
  MessageSquare,
  StarOff,
} from "lucide-react";
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
  const [actionLoadingIds, setActionLoadingIds] = useState<number[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await listLlmHistories();
      const list = Array.isArray(res) ? res : [];
      const norm = list.map((x: any) => ({
        id: x.Id ?? x.id,
        inputText: x.InputText ?? x.inputText ?? "",
        createdAt: x.CreatedAt ?? x.createdAt,
        status: x.Status ?? x.status ?? "Đang mở",
        raw: x,
      }));
      setItems(sortItems(norm));
    } catch (e) {
      // ignore - store handles errors
    } finally {
      setLoading(false);
    }
  };

  const sortItems = (arr: any[]) => {
    return arr.slice().sort((a, b) => {
      const aPinned = a.status === "Đã ghim";
      const bPinned = b.status === "Đã ghim";
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
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
                <div className="flex items-center gap-2 flex-1 min-w-0">
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
                  {actionLoadingIds.includes(it.id) && (
                    <span
                      title="Đang xử lý"
                      className="ml-2 mr-2 inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"
                    />
                  )}
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
                        disabled={actionLoadingIds.includes(it.id)}
                        onClick={async (e: any) => {
                          e.stopPropagation();
                          setActionLoadingIds((s) => [...s, it.id]);
                          try {
                            const newStatus =
                              it.status === "Đã ghim" ? "Đang mở" : "Đã ghim";
                            setItems((prev) =>
                              sortItems(
                                prev.map((x) =>
                                  x.id === it.id
                                    ? { ...x, status: newStatus }
                                    : x
                                )
                              )
                            );
                            const res = await toggleStar(
                              it.id,
                              newStatus === "Đã ghim"
                            );
                            if (res && res.id === it.id && res.status)
                              setItems((prev) =>
                                sortItems(
                                  prev.map((x) =>
                                    x.id === it.id
                                      ? { ...x, status: res.status }
                                      : x
                                  )
                                )
                              );
                          } catch (err) {
                            try {
                              const list = await listLlmHistories();
                              const found = Array.isArray(list)
                                ? list.find(
                                    (x: any) => (x.Id ?? x.id) === it.id
                                  )
                                : null;
                              if (found) {
                                const status =
                                  found.Status ?? found.status ?? "Đang mở";
                                setItems((prev) =>
                                  sortItems(
                                    prev.map((x) =>
                                      x.id === it.id ? { ...x, status } : x
                                    )
                                  )
                                );
                              }
                            } catch (err2) {
                              // ignore
                            }
                          } finally {
                            setActionLoadingIds((s) =>
                              s.filter((i) => i !== it.id)
                            );
                          }
                        }}
                      >
                        {it.status === "Đã ghim" ? (
                          <>
                            <StarOff className="mr-2 h-4 w-4 text-yellow-500" />
                            Bỏ ghim
                          </>
                        ) : (
                          <>
                            <Star className="mr-2 h-4 w-4 text-yellow-500" />
                            Ghim
                          </>
                        )}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        disabled={actionLoadingIds.includes(it.id)}
                        onClick={async (e: any) => {
                          e.stopPropagation();
                          setActionLoadingIds((s) => [...s, it.id]);
                          try {
                            setItems((prev) =>
                              prev.filter((x) => x.id !== it.id)
                            );
                            await deleteLlmHistory(it.id);
                          } catch (err) {
                            try {
                              const list = await listLlmHistories();
                              const found = Array.isArray(list)
                                ? list.find(
                                    (x: any) => (x.Id ?? x.id) === it.id
                                  )
                                : null;
                              if (found) {
                                const restored = {
                                  id: found.Id ?? found.id,
                                  inputText:
                                    found.InputText ?? found.inputText ?? "",
                                  createdAt: found.CreatedAt ?? found.createdAt,
                                  status:
                                    found.Status ?? found.status ?? "Đang mở",
                                  raw: found,
                                };
                                setItems((prev) =>
                                  sortItems([restored, ...prev])
                                );
                              }
                            } catch (err2) {
                              // ignore
                            }
                          } finally {
                            setActionLoadingIds((s) =>
                              s.filter((i) => i !== it.id)
                            );
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4 text-red-500" />
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
