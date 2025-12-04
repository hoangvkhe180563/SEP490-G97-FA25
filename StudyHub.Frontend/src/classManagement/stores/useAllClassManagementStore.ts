import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance } from "@/lib/axios";

export type ClassManagementDto = {
  id: number;
  name: string;
  subjectName?: string | null;
  grade?: number | null;
  instructorName?: string | null;
  createdAt: string;
  description?: string | null;
  subjectId?: number | null;
  raw?: any;
};

type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} | null;

type AllClassManagementState = {
  classes: ClassManagementDto[];
  meta: Meta;
  isLoading: boolean;
  success: boolean;
  message: string | null;
  error: string | null;

  reset: () => void;
  fetchAllClasses: (query?: string) => Promise<{ classes: ClassManagementDto[]; meta: Meta } | null>;
  deleteClass: (id: number, query?: string) => Promise<boolean>;
};

export const useAllClassManagementStore = create<AllClassManagementState>()(
  devtools((set, get) => {
    const base = "/ClassManagement";

    const handleError = (err: any) => {
      let msg = "Unknown error";
      if (err && err.response && err.response.data && err.response.data.message) {
        msg = String(err.response.data.message);
      } else if (err && err.message) {
        msg = String(err.message);
      }
      set({ error: msg, isLoading: false, success: false, message: msg });
    };

    return {
      classes: [],
      meta: null,
      isLoading: false,
      success: true,
      message: null,
      error: null,

      reset: () => {
        set({
          classes: [],
          meta: null,
          isLoading: false,
          success: true,
          message: null,
          error: null,
        });
      },

      fetchAllClasses: async (query?: string) => {
        set({ isLoading: true, error: null, success: true, message: null });
        try {
          const qs = query && query.trim().length > 0 ? `?${query.trim()}` : "";
          const res = await axiosInstance.get<any>(`${base}/get-all-class${qs}`);
          const raw = res && res.data ? res.data : null;

          if (!raw) {
            set({ classes: [], meta: null, isLoading: false });
            return { classes: [], meta: null };
          }

          // normalize classes array (response shape has classes array)
          const arr = Array.isArray(raw.classes) ? raw.classes : Array.isArray(raw) ? raw : [];
          const mapped = (arr || []).map((c: any) => ({
            id: typeof c.id === "number" ? c.id : Number(c.Id ?? 0),
            name: String(c.name ),
            subjectName: c.subjectName ,
            createdAt: String(c.createAt ),
            grade: typeof c.grade === "number" ? c.grade : (c.Grade !== undefined ? Number(c.Grade) : null),
            instructorName: c.instructorName,
            description: c.description ,
            raw: c,
          })) as ClassManagementDto[];

          const meta = raw.meta
            ? {
                total: typeof raw.meta.total === "number" ? raw.meta.total : Number(raw.meta.total ?? 0),
                page: typeof raw.meta.page === "number" ? raw.meta.page : Number(raw.meta.page ?? 1),
                limit: typeof raw.meta.limit === "number" ? raw.meta.limit : Number(raw.meta.limit ?? 10),
                totalPages: typeof raw.meta.totalPages === "number" ? raw.meta.totalPages : Number(raw.meta.totalPages ?? 1),
              }
            : null;

          set({
            classes: mapped,
            meta,
            isLoading: false,
            success: true,
            message: String(raw.message ?? "Loaded"),
            error: null,
          });

          return { classes: mapped, meta };
        } catch (err) {
          handleError(err);
          return null;
        }
      },

      // New: delete class (soft delete). Optionally refresh list by passing query.
      deleteClass: async (id: number, query?: string) => {
        set({ isLoading: true, error: null, message: null });
        try {
          // API: DELETE /Class/{id}
          await axiosInstance.delete(`/Class/${encodeURIComponent(String(id))}`);
          // If caller provided current query, refresh list to reflect deletion
          if (query !== undefined) {
            await get().fetchAllClasses(query);
          } else {
            // otherwise just remove locally if present
            set((state) => ({
              classes: state.classes.filter((c) => c.id !== id),
              isLoading: false,
              success: true,
              message: "Deleted",
            }));
          }
          return true;
        } catch (err) {
          handleError(err);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
    };
  }, { name: "all-class-management-store" })
);

export default useAllClassManagementStore;