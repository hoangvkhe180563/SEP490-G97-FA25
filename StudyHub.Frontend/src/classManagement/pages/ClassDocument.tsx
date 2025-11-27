import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import type { DocumentDto } from "@/classManagement/interfaces/class";
import { format } from "date-fns";

import { Card } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { ScrollArea } from "@/common/components/ui/scroll-area";
import { Separator } from "@/common/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/common/components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";

const DocumentTile: React.FC<{ doc: DocumentDto }> = ({ doc }) => {
  const isImage = !!(doc.fileType && /jpg|jpeg|png|gif|bmp|webp/i.test(String(doc.fileType)));
  const isPdf = !!(doc.fileType && /pdf/i.test(String(doc.fileType)));
  const preview = doc.documentUrl;

  return (
    <Card className="p-3 hover:shadow-md transition">
      <div className="w-full flex flex-col gap-3">
        <div className="w-full h-40 bg-gray-50 rounded-md overflow-hidden flex items-center justify-center">
          {isImage ? (
            <img src={preview} alt={doc.name} className="w-full h-full object-cover" />
          ) : isPdf ? (
            <div className="text-center text-slate-600 px-4">
              <svg className="mx-auto mb-1" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 2v6h6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-sm font-medium">PDF</div>
            </div>
          ) : (
            <div className="text-center text-slate-600 px-4">
              <div className="mb-1 text-3xl">📄</div>
              <div className="text-sm">Tài liệu</div>
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium line-clamp-2">{doc.name}</div>
            <div className="text-xs text-slate-500 mt-1">{doc.uploaderName ? `Tải lên bởi ${doc.uploaderName}` : ""}</div>
            <div className="text-xs text-slate-400 mt-1">{doc.createdAt ? format(new Date(doc.createdAt), "dd/MM/yyyy HH:mm") : ""}</div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-600 hover:underline">Xem</a>
            <a href={doc.documentUrl} download className="text-xs text-slate-600 hover:underline">Tải</a>
          </div>
        </div>
      </div>
    </Card>
  );
};

const ClassDocumentsPage: React.FC = () => {
  const params = useParams<{ id?: string }>();
  const classId = Number(params.id ?? 0);
  const navigate = useNavigate();

  // getDocumentsByClassId and getClassInfo are optional on the store, guard before calling
  const { getDocumentsByClassId, getClassInfo, currentClass } = useClassStore();

  const [docs, setDocs] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "pdf" | "image" | "other">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");

  useEffect(() => {
    if (!classId) {
      setLoading(false);
      setError("ClassId không hợp lệ.");
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Guard: only call if function exists
        if (typeof getDocumentsByClassId !== "function") {
          // If the store doesn't expose this function, return empty list gracefully
          setDocs([]);
          return;
        }
        const fetched = await (getDocumentsByClassId as (id: number) => Promise<DocumentDto[]>)(Number(classId));
        if (!mounted) return;
        setDocs(fetched ?? []);
        // also refresh class info if function available and not present
        if (!currentClass?.data?.classInfo && typeof getClassInfo === "function") {
          try {
            await (getClassInfo as (id: number) => Promise<any>)(classId);
          } catch {
            // ignore
          }
        }
      } catch (err: any) {
        console.error("getDocumentsByClassId failed", err);
        if (mounted) setError("Không thể tải tài liệu. Vui lòng thử lại.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [classId, getDocumentsByClassId, getClassInfo, currentClass?.data?.classInfo]);

  const filtered = useMemo(() => {
    const q = (query ?? "").trim().toLowerCase();
    let list = docs ?? [];
    if (filterType !== "all") {
      if (filterType === "pdf") list = list.filter((d) => d.fileType && /pdf/i.test(String(d.fileType)));
      else if (filterType === "image") list = list.filter((d) => d.fileType && /jpg|jpeg|png|gif|webp|bmp/i.test(String(d.fileType)));
      else list = list.filter((d) => !(d.fileType && (/pdf/i.test(String(d.fileType)) || /jpg|jpeg|png|gif|webp|bmp/i.test(String(d.fileType)))));
    }
    if (q) {
      list = list.filter((d) => (d.name ?? "").toLowerCase().includes(q) || (d.uploaderName ?? "").toLowerCase().includes(q));
    }
    if (sortBy === "newest") list = list.slice().sort((a, b) => Number(new Date(b.createdAt ?? 0)) - Number(new Date(a.createdAt ?? 0)));
    else if (sortBy === "oldest") list = list.slice().sort((a, b) => Number(new Date(a.createdAt ?? 0)) - Number(new Date(b.createdAt ?? 0)));
    else list = list.slice().sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));
    return list;
  }, [docs, query, filterType, sortBy]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Breadcrumb>
        <BreadcrumbList className="flex items-center gap-2">
          <BreadcrumbItem>
            <BreadcrumbLink href={`/class`}>Lớp học</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage aria-current="page" className="truncate">
              {currentClass?.data?.classInfo?.name ?? `Lớp ${classId}`}
            </BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>Toàn bộ tài liệu</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Tài liệu lớp</h2>
          <div className="text-sm text-slate-500 mt-1">{docs.length} tài liệu</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label>Loại</Label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="all">Tất cả</option>
              <option value="pdf">PDF</option>
              <option value="image">Ảnh</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Label>Sắp xếp</Label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name">Tên (A → Z)</option>
            </select>
          </div>

          <Input placeholder="Tìm theo tên hoặc người tải lên..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button variant="ghost" onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>

      <Separator className="my-6" />

      {loading ? (
        <div className="text-center text-slate-500 py-12">Đang tải...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-slate-500 py-12">Không tìm thấy tài liệu.</div>
      ) : (
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((d) => (
              <DocumentTile key={d.id} doc={d} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ClassDocumentsPage;