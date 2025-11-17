import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";

type Preview = { headers: string[]; rows: string[][] };

export const useAppUserExcelStore = create<
  import("@/user/interfaces/stores").ExcelImportState
>()(
  devtools(
    (set) => ({
      preview: null,
      isLoading: false,
      success: false,
      message: "",

      clearPreview: () => set({ preview: null }),

      previewFile: async (file: File) => {
        set({ isLoading: true });
        try {
          const XLSXModule = await import("xlsx");
          const XLSX = (XLSXModule as any).default ?? XLSXModule;
          let wb: any;
          if (file.name.toLowerCase().endsWith(".csv")) {
            const text = await file.text();
            wb = XLSX.read(text, { type: "string" });
          } else {
            const data = await file.arrayBuffer();
            wb = XLSX.read(data, { type: "array" });
          }
          const ws = wb.Sheets[wb.SheetNames[0]];
          const aoa = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            defval: "",
          }) as any[];
          const headers = (aoa[0] || []).map((h: any) => String(h ?? ""));
          const rows = aoa
            .slice(1)
            .map((r: any[]) => r.map((c) => (c == null ? "" : String(c))));
          const preview: Preview = { headers, rows };
          set({ preview, isLoading: false });
          return preview;
        } catch (err) {
          set({ isLoading: false, message: axiosMessageErrorHandler(err) });
          console.error(err);
          return null;
        }
      },

      exportAccounts: async () => {
        set({ isLoading: true });
        try {
          const res = await axiosInstance.get(`/AppUser/export`, {
            responseType: "blob",
          });
          const blob = new Blob([res.data], {
            type: res.headers["content-type"],
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "accounts.xlsx";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          set({ success: true, message: "Exported accounts" });
          return true;
        } catch (err) {
          set({
            isLoading: false,
            success: false,
            message: axiosMessageErrorHandler(err),
          });
          console.error(err);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      exportTemplate: async (rows = 1000) => {
        set({ isLoading: true });
        try {
          const res = await axiosInstance.get(
            `/AppUser/export-template?rows=${rows}`,
            { responseType: "blob" }
          );
          const blob = new Blob([res.data], {
            type: res.headers["content-type"],
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "accounts_import_template.xlsx";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          set({ success: true, message: "Exported import template" });
          return true;
        } catch (err) {
          set({
            isLoading: false,
            success: false,
            message: axiosMessageErrorHandler(err),
          });
          console.error(err);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      importAccounts: async (
        file: File,
        onValidationError?: (errors: { [key: string]: string[] }) => void
      ) => {
        set({ isLoading: true });
        try {
          const formData = new FormData();
          formData.append("FileName", file);
          const res = await axiosInstance.post(`/AppUser/import`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const body = res.data;
          const success = body?.success ?? body?.Success ?? false;
          if (success) {
            set({
              success: true,
              message: body?.message ?? "Import succeeded",
            });
            return body?.data ?? body;
          }
          const validation = body?.data ?? body?.Data ?? null;
          if (validation && typeof validation === "object") {
            onValidationError?.(validation);
            set({
              success: false,
              message: body?.message ?? "Validation failed",
            });
            return { success: false, data: validation };
          }
          set({ success: false, message: body?.message ?? "Import failed" });
          return body;
        } catch (err: any) {
          const resErr = err?.response?.data ?? err?.response;
          if (err?.response && err.response.status === 400) {
            const validation = resErr?.Data ?? resErr?.data ?? null;
            if (validation && typeof validation === "object") {
              onValidationError?.(validation);
              set({ success: false, message: "Validation failed" });
              return { success: false, data: validation };
            }
          }
          set({ success: false, message: axiosMessageErrorHandler(err) });
          console.error(err);
          return { success: false, message: axiosMessageErrorHandler(err) };
        } finally {
          set({ isLoading: false });
        }
      },

      uploadPreview: async (
        preview: Preview,
        onValidationError?: (errors: { [key: string]: string[] }) => void
      ) => {
        set({ isLoading: true });
        try {
          const XLSXModule = await import("xlsx");
          const XLSX = (XLSXModule as any).default ?? XLSXModule;
          const aoa = [preview.headers, ...preview.rows];
          const ws = XLSX.utils.aoa_to_sheet(aoa);
          const wb = { SheetNames: ["Sheet1"], Sheets: { Sheet1: ws } };
          const arrayBuffer = XLSX.write(wb, {
            bookType: "xlsx",
            type: "array",
          });
          const blob = new Blob([arrayBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          const file = new File([blob], "import_preview.xlsx", {
            type: blob.type,
          });
          const formData = new FormData();
          formData.append("FileName", file);
          const res = await axiosInstance.post(`/AppUser/import`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const body = res.data;
          const success = body?.success ?? body?.Success ?? false;
          if (success) {
            set({
              success: true,
              message: body?.message ?? "Import succeeded",
            });
            return body?.data ?? body;
          }
          const validation = body?.data ?? body?.Data ?? null;
          if (validation && typeof validation === "object") {
            onValidationError?.(validation);
            set({
              success: false,
              message: body?.message ?? "Validation failed",
            });
            return { success: false, data: validation };
          }
          set({ success: false, message: body?.message ?? "Import failed" });
          return body;
        } catch (err: any) {
          const resErr = err?.response?.data ?? err?.response;
          if (err?.response && err.response.status === 400) {
            const validation = resErr?.Data ?? resErr?.data ?? null;
            if (validation && typeof validation === "object") {
              onValidationError?.(validation);
              set({ success: false, message: "Validation failed" });
              return { success: false, data: validation };
            }
          }
          set({ success: false, message: axiosMessageErrorHandler(err) });
          console.error(err);
          return { success: false, message: axiosMessageErrorHandler(err) };
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "app-user-excel-store",
    }
  )
);

export default useAppUserExcelStore;
