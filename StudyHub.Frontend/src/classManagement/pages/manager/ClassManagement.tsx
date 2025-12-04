// Updated ClassListManagement: build grade filter like ClassList (grade as its own query param)
// Note: fixed import path for the all-classes store
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/common/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/common/components/ui/select";
import { Button } from "@/common/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import {
  Loader2,
  Inbox,
  AlertCircle,
  Trash2,
  Edit2,
} from "lucide-react";
// use the new store (corrected path)
import useAllClassManagementStore from "@/classManagement/stores/useAllClassManagementStore";
// use class store for create/update actions (modal callbacks)
import useClassStore from "@/classManagement/stores/useClassStore";
// auth store to get current user id (createdBy)
import { useAuthStore } from "@/auth/stores/useAuthStore";
// modals
import CreateClassModal from "@/classManagement/components/ui/createclassmodal";
import EditClassModal from "@/classManagement/components/ui/editclassmodal";

// shadcn AlertDialog
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/common/components/ui/alert-dialog";

// toast
import toast from "react-hot-toast";

// axios + date-fns
import { axiosInstance } from "@/lib/axios";
import { format, parseISO, isValid } from "date-fns";

const ClassListManagement: React.FC = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string | "all">("all");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // modal states
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<any | null>(null); // pass-through object for EditClassModal

  const {
    classes,
    meta,
    isLoading,
    success,
    message,
    fetchAllClasses,
    deleteClass,
  } = useAllClassManagementStore();

  const { addClass, updateClass } = useClassStore();

  // get current user id for createdBy/updatedBy
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? "";

  // AlertDialog state (controlled)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // school name state
  const [schoolName, setSchoolName] = useState<string | null>(null);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // fetch school name on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axiosInstance.get<any>("/ClassManagement/my-school");
        const raw = res && res.data ? res.data : null;
        let name: string | null = null;
        if (raw === null) name = null;
        else if (typeof raw === "string") name = raw;
        else if (typeof raw === "object") {
          name = (raw.schoolName ?? raw.SchoolName ?? raw.name ?? raw.Name ?? null) as string | null;
          if (!name) {
            const keys = Object.keys(raw || {});
            if (keys.length === 1) {
              const v = (raw as any)[keys[0]];
              if (typeof v === "string") name = v;
            }
          }
        }
        if (mounted) setSchoolName(name);
      } catch (err) {
        console.debug("Failed to load school name", err);
        if (mounted) setSchoolName(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // derive available grades from loaded classes (like ClassList)
  const availableGrades = useMemo(() => {
    const s = new Set<number>();
    for (const c of classes) {
      const g = (c as any).grade;
      if (g !== undefined && g !== null && !Number.isNaN(Number(g))) {
        s.add(Number(g));
      }
    }
    return Array.from(s).sort((a, b) => a - b);
  }, [classes]);

  // Build params string same as class-list: text goes to 'query', grade is separate param 'grade'
  const paramsString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("query", debouncedSearch);
    if (gradeFilter && gradeFilter !== "all") params.set("grade", gradeFilter);
    params.set("page", String(page));
    params.set("limit", String(meta?.limit ?? 10));
    return params.toString();
  }, [debouncedSearch, gradeFilter, page, meta?.limit]);

  useEffect(() => {
    // fetch classes when paramsString changes
    (async () => {
      try {
        await fetchAllClasses(paramsString);
      } catch (err) {
        console.error("fetchAllClasses failed", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsString]);

  const total = meta?.total ?? 0;
  const currentPage = meta?.page ?? page;
  const limit = meta?.limit ?? 10;
  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  // open confirm dialog
  const confirmDelete = (id: number) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  // actual delete after user confirms
  const handleConfirmDelete = async () => {
    const id = pendingDeleteId;
    if (id == null) {
      setDeleteDialogOpen(false);
      return;
    }
    try {
      setDeletingId(id);
      const okDelete = await deleteClass(id, paramsString);
      if (okDelete) {
        toast.success("Xóa lớp thành công");
      } else {
        toast.error("Xóa lớp thất bại");
      }
    } catch (err) {
      console.error("Delete class error", err);
      toast.error("Xóa lớp thất bại");
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
      setDeleteDialogOpen(false);
    }
  };

  // open edit modal (populate editing object)
  const openEditModal = (c: any) => {
    setEditing({
      id: c.id,
      title: c.name ?? "",
      description: c.description ?? "",
      grade: c.grade ?? null,
      // include other fields if modal expects them
      subjectId: c.subjectId ?? null,
      raw: c.raw ?? c,
    });
    setShowEdit(true);
  };

  // Create modal callback
  const handleCreate = async (payload: {
    title: string;
    description?: string;
    grade?: number | null;
  }) => {
    try {
      const createdBy = currentUserId || "00000000-0000-0000-0000-000000000000";
      // prefer useClassStore.addClass if available and expects createdBy
      if (typeof addClass === "function") {
        await addClass({
          title: payload.title,
          description: payload.description,
          createdBy: createdBy,
          grade: payload.grade ?? undefined,
        } as any);
      }
      setShowCreate(false);
      // refresh list
      await fetchAllClasses(paramsString);
      toast.success("Tạo lớp thành công");
    } catch (err) {
      console.error("Create class error", err);
      toast.error("Tạo lớp thất bại");
    }
  };

  // Edit modal callback
  const handleEdit = async (payload: {
    id: number;
    title: string;
    description?: string;
    grade: number;
  }) => {
    try {
      const updatedBy = currentUserId || "00000000-0000-0000-0000-000000000000";
      if (typeof updateClass === "function") {
        await updateClass({
          id: payload.id,
          title: payload.title,
          description: payload.description,
          grade: payload.grade,
          updatedBy: updatedBy,
        } as any);
      }
      setShowEdit(false);
      setEditing(null);
      await fetchAllClasses(paramsString);
      toast.success("Cập nhật lớp thành công");
    } catch (err) {
      console.error("Edit class error", err);
      toast.error("Cập nhật lớp thất bại");
    }
  };

  // helper to format date strings to dd/MM/yyyy HH:mm
  const fmt = (s?: string | null) => {
    if (!s) return "-";
    // try parse ISO first
    let dt: Date;
    try {
      dt = parseISO(s);
    } catch {
      const n = Date.parse(String(s));
      dt = isNaN(n) ? new Date(NaN) : new Date(n);
    }
    if (!isValid(dt)) return String(s);
    return format(dt, "dd/MM/yyyy HH:mm");
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-h-full overflow-y-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Quản lý Lớp học</h1>
          <div className="text-sm text-slate-600">
            {schoolName ?? "—"}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            className="bg-black text-white flex items-center gap-2"
            onClick={() => setShowCreate(true)}
          >
            + Thêm lớp
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Input
          placeholder="Tìm kiếm lớp..."
          className="max-w-xs bg-zinc-100 hover:bg-zinc-200 transition-all"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <Select
          onValueChange={(v) => {
            setGradeFilter(v as string);
            setPage(1);
          }}
          value={gradeFilter}
        >
          <SelectTrigger className="w-40 bg-zinc-100 hover:bg-zinc-200 transition-all">
            <SelectValue placeholder="Chọn khối" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Tất cả khối</SelectItem>
              {availableGrades.length > 0
                ? availableGrades.map((g) => (
                    <SelectItem key={g} value={String(g)}>
                      Khối {g}
                    </SelectItem>
                  ))
                : Array.from({ length: 12 }).map((_, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      Khối {i + 1}
                    </SelectItem>
                  ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button
          className="ml-auto flex items-center gap-2"
          variant="outline"
          onClick={() => {
            void fetchAllClasses(paramsString);
          }}
        >
          Làm mới
        </Button>
      </div>

      <div className="overflow-hidden rounded-md ">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lớp
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giáo viên
              </TableHead>

              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khối
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </TableHead>
              <TableHead className="w-36 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-zinc-600" />
                    <p className="text-sm text-gray-500">
                      Đang tải danh sách lớp...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : !success ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 pt-5">
                    <div className="rounded-full bg-red-100 p-3">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        Đã có lỗi xảy ra khi tải dữ liệu
                      </p>
                      <p className="text-sm text-gray-500">
                        {String(message ?? "")}
                      </p>
                    </div>
                    <Button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-zinc-600 text-white text-sm rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                      Thử lại
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : Array.isArray(classes) && classes.length > 0 ? (
              classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="px-6 py-3">
                    <div className="font-medium">{c.name}</div>
                    {c.description ? (
                      <div className="text-sm text-slate-500 mt-1">
                        {c.description}
                      </div>
                    ) : null}
                  </TableCell>

                  <TableCell className="px-6 py-3">
                    <div className="text-sm">{c.instructorName ?? "-"}</div>
                  </TableCell>

                  <TableCell className="px-6 py-3 text-center">
                    <div className="text-sm">{String(c.grade ?? "-")}</div>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <div className="text-sm">{fmt(c.createdAt)}</div>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* Edit icon opens modal */}
                      <Button
                        variant="ghost"
                        aria-label="Edit class"
                        className="text-sm p-2"
                        onClick={() => openEditModal(c)}
                        title="Sửa lớp"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Button>

                      {/* Delete icon */}
                      <AlertDialog
                        open={deleteDialogOpen && pendingDeleteId === c.id}
                        onOpenChange={(v) => {
                          if (!v) {
                            setPendingDeleteId(null);
                          }
                          setDeleteDialogOpen(v);
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            aria-label="Delete class"
                            className="text-sm p-2"
                            onClick={() => confirmDelete(c.id)}
                            disabled={deletingId !== null}
                            title="Xóa lớp"
                          >
                            <Trash2 className="w-5 h-5 text-rose-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa lớp này? Hành động sẽ ẩn lớp (soft delete) và không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmDelete}>
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="rounded-full bg-gray-100 p-3">
                      <Inbox className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        Không tìm thấy lớp nào
                      </p>
                      <p className="text-sm text-gray-500">
                        Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4 px-2">
        <span className="text-sm text-gray-600">
          Hiển thị từ {start} đến {end} trong {total} kết quả
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (currentPage > 1) setPage(currentPage - 1);
            }}
            disabled={currentPage <= 1}
          >
            Trước
          </Button>
          {Array.from({ length: meta?.totalPages ?? 1 }).map((_, i) => (
            <Button
              key={i}
              variant={i + 1 === currentPage ? "default" : "outline"}
              onClick={() => setPage(i + 1)}
              className="min-w-[38px]"
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => {
              if ((meta?.page ?? currentPage) < (meta?.totalPages ?? 1))
                setPage((meta?.page ?? currentPage) + 1);
            }}
            disabled={(meta?.page ?? currentPage) >= (meta?.totalPages ?? 1)}
          >
            Sau
          </Button>
        </div>
      </div>

      {/* Create / Edit modals */}
      <CreateClassModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (p) => {
          await handleCreate(p);
        }}
      />
      <EditClassModal
        open={showEdit}
        classItem={editing}
        onClose={async () => {
          setShowEdit(false);
          setEditing(null);
          // refresh list after modal closes to reflect possible changes
          await fetchAllClasses(paramsString);
        }}
      />
    </div>
  );
};

export default ClassListManagement;