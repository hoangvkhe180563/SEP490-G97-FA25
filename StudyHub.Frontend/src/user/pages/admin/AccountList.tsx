import { useEffect, useMemo, useState, useRef } from "react";
import toast from "react-hot-toast";
import { AlertCircle, Download, Inbox, Loader2, Upload } from "lucide-react";
import { Input } from "@/common/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import AccountItem from "../../components/AccountItem";
import AccountImportPreviewModal from "../../components/AccountImportPreviewModal";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import useAppUserExcelStore from "@/user/stores/useAppUserExcelStore";
import type { AppUser } from "@/user/interfaces/app-user";
import { Link } from "react-router-dom";
import { useAppRoleStore } from "@/user/stores/useRoleStore";
import { useLocationStore } from "@/user/stores/useLocationStore";

import { Paging } from "@/common/components/Paging";

const AdminAccountList = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [schoolFilter, setSchoolFilter] = useState<string | "all">("all");
  const [page, setPage] = useState(1);

  const {
    appUsers,
    setAppUsers,
    meta,
    isLoading,
    success,
    message,
    filterAppUsers,
  } = useAppUserStore();
  const {
    previewFile,
    exportAccounts,
    exportTemplate,
    importAccounts,
    uploadPreview,
  } = useAppUserExcelStore();
  const [importErrors, setImportErrors] = useState<Record<number, string[]>>(
    {}
  );
  const [importCellErrors, setImportCellErrors] = useState<
    Record<number, Record<number, string[]>>
  >({});
  const [showImportErrors, setShowImportErrors] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    rows: string[][];
  } | null>(null);
  const { appRoles, getAppRoles } = useAppRoleStore();
  const { schools, fetchAllSchools } = useLocationStore();

  const statusColor: Record<AppUser["status"], string> = {
    Active:
      "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 focus:ring-green-300",
    Inactive: "bg-rose-100 text-rose-800 hover:bg-rose-200 focus:ring-rose-300",
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const normalize = (s?: string) =>
    String(s ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]/g, "");

  const cleanMessage = (msg: string, fieldName?: string) => {
    let t = String(msg ?? "");
    if (fieldName) {
      const fn = normalize(fieldName);
      const prefixPattern = new RegExp(
        "^\\s*" + escapeRegExp(fieldName) + "\\s*[:\\-\\s]+",
        "i"
      );
      if (prefixPattern.test(t)) t = t.replace(prefixPattern, "").trim();
      const tNorm = normalize(t);
      if (tNorm.startsWith(fn)) {
        t = t.replace(new RegExp("^\\s*" + fn + "[:\\-\\s]*", "i"), "").trim();
      }
    }
    return t;
  };

  const headerMatchIndex = (headers: string[], fieldName?: string) => {
    if (!fieldName) return -1;
    const fnNorm = normalize(fieldName);
    const usernameTokens = [
      "user",
      "username",
      "tendangnhap",
      "tendang",
      "tendn",
      "tennguoi",
      "teng",
      "tengnguoi",
    ];
    const phoneTokens = ["phone", "phonenumber", "sdt", "sodienthoai", "phone"];
    const dobTokens = ["dob", "birth", "birthdate", "ngaysinh", "dob"];
    const createdTokens = ["created", "createdat", "ngaytao", "ngaytao"];
    const roleTokens = ["role", "roles", "roleids", "vaitro", "vaitro"];

    return headers.findIndex((h) => {
      if (!h) return false;
      const hhNorm = normalize(h);
      if (
        hhNorm === fnNorm ||
        hhNorm.includes(fnNorm) ||
        fnNorm.includes(hhNorm)
      )
        return true;
      if (
        usernameTokens.some((t) => fnNorm.includes(t)) &&
        (hhNorm.includes("tendang") ||
          hhNorm.includes("tennguoi") ||
          hhNorm.includes("username"))
      )
        return true;
      if (
        phoneTokens.some((t) => fnNorm.includes(t)) &&
        hhNorm.includes("sodienthoai")
      )
        return true;
      if (
        dobTokens.some((t) => fnNorm.includes(t)) &&
        hhNorm.includes("ngaysinh")
      )
        return true;
      if (
        createdTokens.some((t) => fnNorm.includes(t)) &&
        hhNorm.includes("ngaytao")
      )
        return true;
      if (
        roleTokens.some((t) => fnNorm.includes(t)) &&
        (hhNorm.includes("vaitro") || hhNorm.includes("role"))
      )
        return true;
      return false;
    });
  };

  const headerIndexByKeywords = (headers: string[], fnNorm: string) => {
    if (!fnNorm) return -1;
    const keywordGroups: Record<string, string[]> = {
      phone: ["sodienthoai", "sdt", "phone"],
      email: ["email"],
      username: ["username", "tendangnhap", "tendang", "tendn"],
      role: ["vaitro", "role", "roles", "roleids"],
      dob: ["ngaysinh", "dob", "birth", "birthdate"],
      created: ["ngaytao", "created", "createdat"],
    };

    for (const keys of Object.values(keywordGroups)) {
      if (keys.some((k) => fnNorm.includes(k))) {
        for (let i = 0; i < headers.length; i++) {
          const hh = normalize(headers[i] || "");
          if (keys.some((k) => hh.includes(k))) return i;
        }
      }
    }
    for (let i = 0; i < headers.length; i++) {
      const hh = normalize(headers[i] || "");
      if (fnNorm.split(/[^a-z0-9]+/).some((tok) => tok && hh.includes(tok)))
        return i;
    }
    return -1;
  };

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const detectFieldFromMessage = (msg?: string) => {
    const t = String(msg ?? "").toLowerCase();
    if (!t) return null;
    if (
      t.includes("số điện thoại") ||
      t.includes("sodienthoai") ||
      t.includes("sdt") ||
      t.includes("phone")
    )
      return "Số điện thoại";
    if (t.includes("email")) return "Email";
    if (
      t.includes("tên người dùng") ||
      t.includes("tendangnhap") ||
      t.includes("tendang")
    )
      return "Tên người dùng";
    if (t.includes("vai trò") || t.includes("vaitro") || t.includes("role"))
      return "Vai trò";
    if (
      t.includes("ngày tạo") ||
      t.includes("ngaytao") ||
      t.includes("created")
    )
      return "Ngày tạo";
    if (t.includes("ngày sinh") || t.includes("ngaysinh") || t.includes("dob"))
      return "Ngày sinh";
    return null;
  };

  const guessIndexFromMessageContent = (msg: string, headers: string[]) => {
    const t = String(msg ?? "").toLowerCase();
    const phoneMatch = t.match(/\d{7,}/);
    if (phoneMatch) {
      for (let i = 0; i < headers.length; i++) {
        const hh = normalize(headers[i] || "");
        if (
          hh.includes("sodienthoai") ||
          hh.includes("sdt") ||
          hh.includes("phone")
        )
          return i;
      }
    }
    if (t.includes("@")) {
      for (let i = 0; i < headers.length; i++) {
        const hh = normalize(headers[i] || "");
        if (hh.includes("email")) return i;
      }
    }
    if (t.includes("vai trò") || t.includes("vaitro") || t.includes("role")) {
      for (let i = 0; i < headers.length; i++) {
        const hh = normalize(headers[i] || "");
        if (hh.includes("vaitro") || hh.includes("role")) return i;
      }
    }
    if (
      t.includes("tên người dùng") ||
      t.includes("tendang") ||
      t.includes("username")
    ) {
      for (let i = 0; i < headers.length; i++) {
        const hh = normalize(headers[i] || "");
        if (
          hh.includes("tendang") ||
          hh.includes("username") ||
          hh.includes("tennguoi")
        )
          return i;
      }
    }
    return -1;
  };

  const mapServerFieldToHeaderIndex = (
    headers: string[],
    fieldName?: string,
    msg?: string
  ) => {
    if (!headers || headers.length === 0) return -1;
    if (!fieldName) {
      if (msg) return guessIndexFromMessageContent(msg, headers);
      return -1;
    }
    let idx = headerMatchIndex(headers, fieldName);
    if (idx >= 0) return idx;
    const fnNorm = normalize(fieldName);
    idx = headerIndexByKeywords(headers, fnNorm);
    if (idx >= 0) return idx;
    const translations: Record<string, string> = {
      PhoneNumber: "Số điện thoại",
      Email: "Email",
      Username: "Tên người dùng",
      RoleIds: "Vai trò",
      CreatedAt: "Ngày tạo",
      Dob: "Ngày sinh",
    };
    const t = translations[fieldName];
    if (t) {
      idx = headerMatchIndex(headers, t);
      if (idx >= 0) return idx;
    }
    if (msg) {
      idx = guessIndexFromMessageContent(msg, headers);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (roleFilter && roleFilter !== "all") params.set("role", roleFilter);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (schoolFilter && schoolFilter !== "all")
      params.set("schoolId", schoolFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("page", String(page));
    params.set("limit", "6");
    return params.toString();
  }, [roleFilter, statusFilter, schoolFilter, debouncedSearch, page]);

  useEffect(() => {
    filterAppUsers(query).catch(() => {});
    getAppRoles().catch(() => {});
    fetchAllSchools?.().catch(() => {});
  }, [query, filterAppUsers, getAppRoles, fetchAllSchools]);

  const total = meta?.total ?? 0;
  const currentPage = meta?.page ?? page;
  const limit = meta?.limit ?? 6;
  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  const formatMessage = (msg: unknown): string => {
    if (!msg && msg !== 0) return "";
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "object") {
      try {
        const vals = Object.values(msg as any)
          .flat?.()
          .filter((v: any) => v != null);
        if (Array.isArray(vals) && vals.length > 0)
          return String(vals.join(", "));
        if (vals && vals.length === 0) return JSON.stringify(msg);
      } catch (_) {
        return String(msg);
      }
    }
    return String(msg);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-4 mb-6">
        <Input
          placeholder="Tìm kiếm tài khoản..."
          className="max-w-xs bg-zinc-100 hover:bg-zinc-200 transition-all"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          onValueChange={(v) => {
            setRoleFilter(v as string);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40 bg-zinc-100 hover:bg-zinc-200 transition-all">
            <SelectValue placeholder="Chọn vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              {appRoles.map((role) => (
                <SelectItem key={role.id} value={String(role.id)}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(v) => {
            setSchoolFilter(v as string);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48 bg-zinc-100 hover:bg-zinc-200 transition-all">
            <SelectValue placeholder="Chọn trường" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Tất cả trường</SelectItem>
              {schools.map((s: any) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(v) => {
            setStatusFilter(v as string);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40 bg-zinc-100 hover:bg-zinc-200 transition-all">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Active">Hoạt động</SelectItem>
            <SelectItem value="Inactive">Không hoạt động</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="ml-auto flex items-center gap-2"
          disabled={isLoading}
          onClick={() => {
            exportAccounts?.();
          }}
        >
          <Download className="w-4 h-4" /> Export
        </Button>
        <Button
          variant="outline"
          className="ml-2 flex items-center gap-2"
          onClick={() => exportTemplate?.(1000)}
        >
          <Download className="w-4 h-4" />
          Mẫu Import
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          id="import-file"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const p = await previewFile(f);
            setImportErrors({});
            setImportCellErrors({});
            setShowImportErrors(false);
            if (p) {
              setPreviewData(p);
              setShowPreviewModal(true);
            } else {
              const result = await importAccounts?.(f, (errors) => {
                const rowMap: Record<number, string[]> = {};
                const cellMap: Record<number, Record<number, string[]>> = {};
                try {
                  Object.entries(errors || {}).forEach(([k, msgs]) => {
                    const textMsgs = Array.isArray(msgs)
                      ? msgs
                      : [String(msgs)];
                    textMsgs.forEach((raw) => {
                      let t = String(raw ?? "");
                      const rowMatch = k.match(/(\d+)/);
                      let row = rowMatch
                        ? parseInt(rowMatch[1], 10)
                        : undefined;
                      if (row === undefined) {
                        const m2 = t.match(/(?:Hàng|Row)\s*(\d+)/i);
                        if (m2) {
                          row = parseInt(m2[1], 10);
                          t = t
                            .replace(/^(?:Hàng|Row)\s*\d+[:\s-]*/i, "")
                            .trim();
                        }
                      }
                      if (row === undefined) row = 0;

                      const fieldMatch =
                        k.match(/Row\s*\d+\s*[-:]?\s*(.+)$/i) ||
                        k.match(/(.+)[_\-.]\d+$/i);
                      let fieldName = fieldMatch ? fieldMatch[1].trim() : null;
                      if (!fieldName && !/\d+/.test(k)) fieldName = k.trim();
                      if (!fieldName) {
                        const d = detectFieldFromMessage(t);
                        if (d) fieldName = d;
                      }

                      t = cleanMessage(t, fieldName || undefined);
                      if (fieldName && previewData) {
                        const idx = mapServerFieldToHeaderIndex(
                          previewData.headers,
                          fieldName,
                          t
                        );
                        if (idx >= 0) {
                          if (!cellMap[row]) cellMap[row] = {};
                          if (!cellMap[row][idx]) cellMap[row][idx] = [];
                          cellMap[row][idx].push(t);
                          return;
                        }
                      }

                      if (!rowMap[row]) rowMap[row] = [];
                      rowMap[row].push(t);
                    });
                  });
                } catch (err) {
                  rowMap[0] = [JSON.stringify(errors)];
                }
                setImportErrors(rowMap);
                setImportCellErrors(cellMap);
                setShowImportErrors(true);
              });
              if (result && result.success !== false) {
                filterAppUsers(query).catch(() => {});
                setImportErrors({});
                setShowImportErrors(false);
                toast.success("Import thành công");
              }
            }
            e.currentTarget.value = "";
          }}
        />

        <Button
          className="bg-black text-white flex items-center gap-2"
          onClick={() => {
            if (inputRef?.current) inputRef.current.value = "";
            inputRef?.current?.click();
          }}
        >
          <Upload className="w-4 h-4" /> Import
        </Button>
        <Button className="bg-black text-white flex items-center gap-2">
          <Link to="/user/admin/add-account">+ Thêm tài khoản</Link>
        </Button>
      </div>
      {showImportErrors && Object.keys(importErrors).length > 0 && (
        <div className="mb-4 p-4 border border-rose-200 rounded-md bg-rose-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-rose-800">
              Lỗi khi import
            </h3>
            <div className="flex items-center gap-2">
              <button
                className="text-sm text-rose-700 underline"
                onClick={() => {
                  const lines: string[] = [];
                  const rows = new Set<number>();
                  Object.keys(importErrors).forEach((k) => rows.add(Number(k)));
                  Object.keys(importCellErrors).forEach((k) =>
                    rows.add(Number(k))
                  );
                  Array.from(rows)
                    .sort((a, b) => a - b)
                    .forEach((r) => {
                      const rowMsgs = importErrors[Number(r)] ?? [];
                      rowMsgs.forEach((m) => lines.push(`Hàng ${r}: ${m}`));
                      const cellMsgs = importCellErrors[Number(r)] ?? {};
                      Object.keys(cellMsgs)
                        .map((ci) => Number(ci))
                        .sort((a, b) => a - b)
                        .forEach((ci) => {
                          (cellMsgs[ci] || []).forEach((m) =>
                            lines.push(`Hàng ${r}: ${m}`)
                          );
                        });
                    });
                  navigator.clipboard
                    .writeText(lines.join("\n"))
                    .then(() => toast.success("Copied lỗi vào clipboard"))
                    .catch(() => toast.error("Không thể copy"));
                }}
              >
                Copy
              </button>
              <button
                className="text-sm text-rose-700"
                onClick={() => setShowImportErrors(false)}
              >
                Đóng
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-auto">
            {(() => {
              const rows = new Set<number>();
              Object.keys(importErrors).forEach((k) => rows.add(Number(k)));
              Object.keys(importCellErrors).forEach((k) => rows.add(Number(k)));
              return Array.from(rows)
                .sort((a, b) => a - b)
                .map((r) => (
                  <div key={r} className="text-sm">
                    <div className="font-medium text-rose-800">Hàng {r}</div>
                    <ul className="list-disc list-inside text-rose-700">
                      {(importErrors[Number(r)] || []).map((m, i) => (
                        <li key={`r-${i}`}>{m}</li>
                      ))}
                      {Object.keys(importCellErrors[Number(r)] || {})
                        .map((ci) => Number(ci))
                        .sort((a, b) => a - b)
                        .flatMap((ci) =>
                          (importCellErrors[Number(r)][ci] || []).map(
                            (m, i) => <li key={`c-${ci}-${i}`}>{m}</li>
                          )
                        )}
                    </ul>
                  </div>
                ));
            })()}
          </div>
        </div>
      )}
      <AccountImportPreviewModal
        open={showPreviewModal}
        onOpenChange={(v) => setShowPreviewModal(v)}
        previewData={previewData}
        importErrors={importErrors}
        importCellErrors={importCellErrors}
        onPreviewChange={(p) => setPreviewData(p)}
        onClose={() => setShowPreviewModal(false)}
        onConfirmUpload={async () => {
          if (!previewData) return;
          const res = await uploadPreview(previewData, (errors) => {
            const rowMap: Record<number, string[]> = {};
            const cellMap: Record<number, Record<number, string[]>> = {};
            try {
              Object.entries(errors || {}).forEach(([k, msgs]) => {
                const textMsgs = Array.isArray(msgs) ? msgs : [String(msgs)];
                textMsgs.forEach((raw) => {
                  let t = String(raw ?? "");
                  const rowMatch = k.match(/(\d+)/);
                  let row = rowMatch ? parseInt(rowMatch[1], 10) : undefined;
                  if (row === undefined) {
                    const m2 = t.match(/(?:Hàng|Row)\s*(\d+)/i);
                    if (m2) {
                      row = parseInt(m2[1], 10);
                      t = t.replace(/^(?:Hàng|Row)\s*\d+[:\s-]*/i, "").trim();
                    }
                  }
                  if (row === undefined) row = 0;

                  const fieldMatch =
                    k.match(/Row\s*\d+\s*[-:]?\s*(.+)$/i) ||
                    k.match(/(.+)[_\-.]\d+$/i);
                  let fieldName = fieldMatch ? fieldMatch[1].trim() : null;
                  if (!fieldName && !/\d+/.test(k)) fieldName = k.trim();
                  if (!fieldName) {
                    const d = detectFieldFromMessage(t);
                    if (d) fieldName = d;
                  }

                  t = cleanMessage(t, fieldName || undefined);
                  if (fieldName && previewData) {
                    const idx = mapServerFieldToHeaderIndex(
                      previewData.headers,
                      fieldName,
                      t
                    );
                    if (idx >= 0) {
                      if (!cellMap[row]) cellMap[row] = {};
                      if (!cellMap[row][idx]) cellMap[row][idx] = [];
                      cellMap[row][idx].push(t);
                      return;
                    }
                  }

                  if (!rowMap[row]) rowMap[row] = [];
                  rowMap[row].push(t);
                });
              });
            } catch (err) {
              rowMap[0] = [JSON.stringify(errors)];
            }
            setImportErrors(rowMap);
            setImportCellErrors(cellMap);
            setShowImportErrors(true);
          });
          if (res && res.success !== false) {
            filterAppUsers(query).catch(() => {});
            setImportErrors({});
            setImportCellErrors({});
            setShowImportErrors(false);
            setShowPreviewModal(false);
            toast.success("Import thành công");
          }
        }}
      />
      <div className="overflow-hidden rounded-md ">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người dùng
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vai trò
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trường
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Môn học
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
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
                    <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
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
                        {formatMessage(message)}
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
            ) : appUsers.length > 0 ? (
              appUsers.map((user, idx) => (
                <AccountItem
                  key={user.id}
                  user={user}
                  idx={idx}
                  setUsers={setAppUsers}
                  statusColor={statusColor}
                />
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
                        Không tìm thấy tài khoản nào phù hợp
                      </p>
                      <p className="text-sm text-gray-500">
                        Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn để
                        tìm kiếm kết quả khác.
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
        <div>
          <Paging
            currentPage={currentPage}
            totalPages={meta?.totalPages ?? 0}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminAccountList;
