import { type Post, type PostComment } from "@/classManagement/components/ui/postcard";

import { create } from "zustand";
import type {
  ClassState,
  GetClassesResponse,
  ClassListDto,
  ClassMemberDto,
  ClassInfo,
  ClassDetailResponse,
  ClassNotification,
  ClassNotificationFile,
} from "../interfaces/class";
import { axiosInstance } from "@/lib/axios";

const defaultClassInfo: ClassInfo = {
  id: 0,
  name: "",
  subjectId: 0,
  description: "",
  createdAt: new Date().toISOString(),
};
export const getCurrentIsoUtc = (): string => {
  return new Date().toISOString(); // UTC, ends with "Z"
};

export const getCurrentIsoLocal = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hour = pad(d.getHours());
  const minute = pad(d.getMinutes());
  const second = pad(d.getSeconds());

  // timezone offset in minutes. e.g. for +07:00 offset = -420
  const tzMin = -d.getTimezoneOffset();
  const sign = tzMin >= 0 ? "+" : "-";
  const tzHour = pad(Math.floor(Math.abs(tzMin) / 60));
  const tzMinute = pad(Math.abs(tzMin) % 60);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${tzHour}:${tzMinute}`;
};
// default full currentClass shape to avoid nullable issues when updating
const defaultCurrentClass: ClassDetailResponse = {
  success: false,
  message: "",
  data: {
    classInfo: defaultClassInfo,
    teacher: null,
    students: [],
    parents: [],
    notifications: [],
  },
};

export const useClassStore = create<ClassState>((set, get) => ({
  classes: [],
  subjects: [],
  isLoading: false,
  success: false,
  message: "",
  meta: null,
  currentClass: defaultCurrentClass,

  getClasses: async (query: string) => {
    set({ isLoading: true, success: false, message: "" });

    try {
      const response = await axiosInstance.get<GetClassesResponse>(`/Class?${query}`);
      const data = response.data;
      console.log("API trả về số lớp:", data.classes.length);

      const mappedClasses: ClassListDto[] = data.classes.map((c) => ({
        id: c.id,
        name: c.name,
        subjectName: c.subjectName,
        instructorName: c.instructorName,
        description: c.description,
        subjectId: c.subjectId,
      }));

      set({
        classes: mappedClasses,
        meta: data.meta ?? null,
        success: data.success,
        message: data.message,
      });

      return data;
    } catch (error) {
      set({
        success: false,
        message: "Failed to fetch classes (Lỗi khi tải danh sách lớp)",
      });
      console.error(error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  addClass: async (payload: { title: string; subject: number; description?: string }) => {
    set({ isLoading: true, success: false, message: "" });
    try {
      const body = {
        name: payload.title,
        subjectId: payload.subject,
        description: payload.description,
        createdBy: "2", // hoặc lấy từ user login
      };

      const res = await axiosInstance.post("/Class", body);
      const created = res.data ?? null;

      const mapped: ClassListDto | null = created
        ? {
            id: created.id ?? created.classId,
            name: created.name ?? payload.title,
            subjectName: created.subjectName ?? payload.subject,
            instructorName: created.instructorName ?? "",
            description: created.description ?? payload.description,
            subjectId: created.subjectId ?? payload.subject,
          }
        : null;

      if (mapped) {
        set((state) => ({
          classes: [mapped, ...state.classes],
          meta: state.meta
            ? { ...state.meta, total: (state.meta.total ?? 0) + 1 }
            : state.meta,
          success: true,
          message: "Create class successful",
        }));
      } else {
        set({ success: false, message: "Create returned empty response" });
      }

      return created;
    } catch (error) {
      console.error(error);
      set({ success: false, message: "Failed to create class" });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  getAllSubjects: async () => {
    try {
      const res = await axiosInstance.get("/Class/Subject"); // tuỳ theo backend bạn trả về
      const subjects = res.data ?? [];
      set({ subjects });
      return subjects;
    } catch (error) {
      console.error("Failed to load subjects", error);
      set({ subjects: [] });
      return [];
    }
  },

  updateClass: async (payload: { id: number; title: string; subject: number; description?: string }) => {
    set({ isLoading: true, success: false, message: "" });

    try {
      const body = {
        name: payload.title,
        subjectId: payload.subject,
        description: payload.description,
        updatedBy: "2", // hoặc lấy từ user login
      };

      const res = await axiosInstance.put(`/Class/${payload.id}`, body);
      const updated = res.data ?? null;

      if (updated) {
        set((state) => ({
          classes: state.classes.map((cls) =>
            cls.id === updated.id
              ? {
                  ...cls,
                  name: updated.name,
                  subjectName: updated.subjectName, // BE trả về sẵn subjectName
                  description: updated.description,
                  subjectId: updated.subjectId,
                }
              : cls
          ),
          success: true,
          message: "Update class successful",
        }));
      } else {
        set({ success: false, message: "Update returned empty response" });
      }

      return updated;
    } catch (error) {
      console.error("❌ Failed to update class", error);
      set({ success: false, message: "Failed to update class" });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  getClassDetail: async (id: number): Promise<ClassDetailResponse | null> => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get(`/Class/${id}/detail`);
      const raw = res.data;

      if (!raw?.success) {
        // set currentClass to a failed state
        set({
          currentClass: {
            success: false,
            message: raw?.message ?? "Failed to load class detail",
            data: {
              classInfo: defaultClassInfo,
              teacher: null,
              students: [],
              parents: [],
              notifications: [],
            },
          },
          isLoading: false,
        });
        return null;
      }

      const data = raw.data;

      // Map members
      const members: ClassMemberDto[] = (data.members ?? []).map((m: any) => ({
        userId: m.userId,
        fullname: m.fullname,
        roles: m.roles ?? [],
        joinDate: m.joinDate,
      }));

      const mapped: ClassDetailResponse = {
        success: true,
        message: raw.message ?? "",
        data: {
          classInfo: {
            id: data.id,
            name: data.name,
            subjectId: data.subjectId,
            description: data.description,
            createdAt: data.createdAt,
          },
          // pick first teacher if multiple
          teacher: members.find((m) => m.roles?.includes("Teacher")) ?? null,
          students: members.filter((m) => m.roles?.includes("Student")) ?? [],
          parents: members.filter((m) => m.roles?.includes("Parent")) ?? [],
          notifications:
            (data.notifications ?? []).map((n: any) => ({
              id: n.id,
              classId: n.classId,
              title: n.title,
              description: n.description,
              createdBy: n.createdBy,
              createdAt: n.createdAt,
              files: n.files ?? [],
              comments:
                (n.comments ?? []).map((c: any) => ({
                  id: c.id,
                  notificationId: c.notificationId,
                  userId: c.userId,
                  content: c.content,
                  createdAt: c.createdAt,
                  userFullname: c.userFullname,
                })) ?? [],
            })) ?? [],
        },
      };

      // Save mapped result into store
      set({ currentClass: mapped, isLoading: false });

      return mapped;
    } catch (error) {
      console.error("❌ Error when fetching class detail:", error);
      set({ isLoading: false });
      return null;
    }
  },

  createNotification: async (payload: {
    classId: number;
    title: string;
    description?: string;
    createdBy: string; // GUID string
    createdAt?: string;
    files?: File[] | null;
  }): Promise<ClassNotification | null> => {
    set({ isLoading: true, success: false, message: "" });
    try {
      const fd = new FormData();
      fd.append("ClassId", String(payload.classId));
      fd.append("Title", payload.title ?? "");
      fd.append("Description", payload.description ?? "");

      // Nếu payload.createdBy có thì dùng, nếu không dùng GUID mặc định bạn yêu cầu
      const createdByValue =
        payload.createdBy ??
        "d4e5f6a7-b8c9-0123-4567-890abcdef014";
      fd.append("CreatedBy", createdByValue);

      

      // Append tất cả files (key "Files"). Backend phải chấp nhận nhiều file với cùng key.
      if (payload.files && payload.files.length > 0) {
        for (let i = 0; i < payload.files.length; i++) {
          fd.append("Files", payload.files[i], payload.files[i].name);
        }
      }

      const res = await axiosInstance.post("/Class/notifications", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Guard an toàn: res hoặc res.data có thể undefined nếu lỗi xảy ra
      const raw = res?.data ?? null;
      if (!raw || raw.success === false) {
        set({
          isLoading: false,
          success: false,
          message: raw?.message ?? "Failed to create notification",
        });
        return null;
      }

      // Backend trả { success, message, data } theo controller bạn đưa — nhưng nếu không, chấp nhận raw trực tiếp
      const created = raw.data ?? raw;

      // Build mapped object with safe fallbacks
      const mapped: ClassNotification = {
        id: created.id ?? Date.now(),
        classId: created.classId ?? payload.classId,
        title: created.title ?? payload.title,
        description: created.description ?? payload.description ?? "",
        createdBy: String(created.createdBy ?? createdByValue),
        createdAt: created.createdAt ?? createdByValue,
        files: created.files ?? [],
        comments: created.comments ?? [],
      };

      // Cập nhật state hiện tại một cách an toàn (nếu currentClass undefined thì dùng default)
      set((state) => {
        const cur = state.currentClass ?? {
          success: false,
          message: "",
          data: {
            classInfo: {
              id: 0,
              name: "",
              subjectId: 0,
              description: "",
              createdAt: new Date().toISOString(),
            },
            teacher: null,
            students: [],
            parents: [],
            notifications: [],
          },
        };

        const newNotifications = [mapped, ...(cur.data?.notifications ?? [])];

        return {
          currentClass: {
            ...cur,
            data: {
              ...cur.data,
              notifications: newNotifications,
            },
            success: true,
            message: cur.message,
          },
          success: true,
          message: raw.message ?? "Tạo thông báo thành công",
        };
      });

      return mapped;
    } catch (error) {
      console.error("❌ createNotification error:", error);
      set({ success: false, message: "Failed to create notification", isLoading: false });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  
  
 
}));