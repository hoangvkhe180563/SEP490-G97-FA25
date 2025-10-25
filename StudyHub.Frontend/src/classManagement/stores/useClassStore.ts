import { type Post, type PostComment } from "@/classManagement/components/ui/postcard";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
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
  return new Date().toISOString();
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

  const tzMin = -d.getTimezoneOffset();
  const sign = tzMin >= 0 ? "+" : "-";
  const tzHour = pad(Math.floor(Math.abs(tzMin) / 60));
  const tzMinute = pad(Math.abs(tzMin) % 60);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${tzHour}:${tzMinute}`;
};

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

export type LinkPayload = { url: string; title?: string; thumbnail?: string };

export const useClassStore = create<ClassState>()(
  devtools(
    (set, get) => ({
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
            createdBy: "2",
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
          const res = await axiosInstance.get("/Class/Subject");
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
            updatedBy: "2",
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
                      subjectName: updated.subjectName,
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

      getClassMembers: async (id: number): Promise<ClassMemberDto[] | null> => {
        set({ isLoading: true });
        try {
          const res = await axiosInstance.get(`/Class/${id}/members`);
          const raw = res?.data ?? null;

          if (!raw || raw.success === false) {
            console.warn("getClassMembers: API returned success=false", raw?.message);
            set({ isLoading: false });
            return null;
          }

          const membersRaw = raw.data ?? [];
          const members: ClassMemberDto[] = membersRaw.map((m: any) => ({
            userId: m.userId,
            fullname: m.fullname,
            roles: m.roles ?? [],
            joinDate: m.joinDate,
          }));

          set((state) => {
            const cur = state.currentClass ?? defaultCurrentClass;
            return {
              currentClass: {
                ...cur,
                data: {
                  ...cur.data,
                  teacher: members.find((m) => m.roles?.includes("Teacher")) ?? null,
                  students: members.filter((m) => m.roles?.includes("Student")) ?? [],
                  parents: members.filter((m) => m.roles?.includes("Parent")) ?? [],
                },
                success: true,
                message: raw.message ?? cur.message,
              },
            };
          });

          return members;
        } catch (error) {
          console.error("❌ getClassMembers error:", error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      getClassInfo: async (id: number): Promise<ClassDetailResponse | null> => {
        set({ isLoading: true });
        try {
          const res = await axiosInstance.get(`/Class/${id}/detail`);
          const raw = res?.data ?? null;

          if (!raw) {
            console.warn("getClassInfo: no response data");
            set({ isLoading: false });
            return null;
          }

          if (!raw.success) {
            set({
              currentClass: {
                success: false,
                message: raw.message ?? "Failed to load class info",
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

          const notifications =
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
                  imageUrl: c.imageUrl ?? null,
                })) ?? [],
            })) ?? [];

          set((state) => {
            const cur = state.currentClass ?? defaultCurrentClass;
            return {
              currentClass: {
                ...cur,
                success: true,
                message: raw.message ?? cur.message,
                data: {
                  ...cur.data,
                  classInfo: {
                    id: data.id,
                    name: data.name,
                    subjectId: data.subjectId,
                    description: data.description,
                    createdAt: data.createdAt,
                  },
                  notifications: notifications,
                },
              },
            };
          });

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
              teacher: get().currentClass.data.teacher ?? null,
              students: get().currentClass.data.students ?? [],
              parents: get().currentClass.data.parents ?? [],
              notifications: notifications,
            },
          };

          return mapped;
        } catch (error) {
          console.error("❌ getClassInfo error:", error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      // --- addComment: send comment HTML to backend and update state ---
      addComment: async (payload) => {
        // payload: { notificationId, content (HTML), createdBy? }
        set({ isLoading: true, success: false, message: "" });
        try {
          const body = {
            content: payload.content ?? "",
            createdBy: payload.userId ?? "d4e5f6a7-b8c9-0123-4567-890abcdef014",
          };

          const url = `/Class/notifications/${payload.notificationId}/comments`;
          const res = await axiosInstance.post(url, body);
          const raw = res?.data ?? null;

          if (!raw || raw.success === false) {
            set({ isLoading: false, success: false, message: raw?.message ?? "Failed to add comment" });
            return null;
          }

          const created = raw.data ?? raw;
          const mapped = {
            id: created.id ?? Date.now(),
            notificationId: created.notificationId ?? payload.notificationId,
            userId: created.userId ?? created.createdBy ?? body.createdBy,
            userFullname: created.userFullname ?? "Bạn",
            content: created.content ?? payload.content,
            avatarUrl: created.avatarUrl ?? null,
            createdAt: created.createdAt ?? new Date().toISOString(),
          };

          // update currentClass.notifications: append comment to matching notification
          set((state) => {
            const cur = state.currentClass ?? defaultCurrentClass;
            const updatedNotifications = (cur.data?.notifications ?? []).map((n) => {
              if (String(n.id) === String(payload.notificationId)) {
                const comments = (n.comments ?? []).concat([mapped]);
                return { ...n, comments };
              }
              return n;
            });

            // If the notification wasn't found (edge case), just leave state unchanged
            return {
              currentClass: {
                ...cur,
                data: {
                  ...cur.data,
                  notifications: updatedNotifications,
                },
                success: true,
              },
              success: true,
              message: raw.message ?? "Comment added",
            };
          });

          return mapped;
        } catch (err) {
          console.error("addComment error:", err);
          set({ isLoading: false, success: false, message: "Failed to add comment" });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },
        deleteNotification: async (notificationId) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          const url = `/Class/notifications/${notificationId}`;
          const res = await axiosInstance.delete(url);
          const raw = res?.data ?? null;

          // If API returns { success: false } or no data, treat as failure
          if (!raw || raw.success === false) {
            set({
              isLoading: false,
              success: false,
              message: raw?.message ?? "Failed to delete notification",
            });
            return false;
          }

          // On success, update store.notifications by filtering out deleted one
          set((state) => {
            const cur = state.currentClass ?? defaultCurrentClass;
            const updatedNotifications = (cur.data?.notifications ?? []).filter(
              (n) => String(n.id) !== String(notificationId)
            );

            return {
              currentClass: {
                ...cur,
                data: {
                  ...cur.data,
                  notifications: updatedNotifications,
                },
                success: true,
              },
              success: true,
              message: raw.message ?? "Deleted notification",
            };
          });

          return true;
        } catch (err) {
          console.error("deleteNotification error:", err);
          set({ isLoading: false, success: false, message: "Failed to delete notification" });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      createNotification: async (payload) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          const fd = new FormData();
          fd.append("ClassId", String(payload.classId));
          fd.append("Title", payload.title ?? "");
          fd.append("Description", payload.description ?? "");
          const createdByValue = payload.createdBy ?? "d4e5f6a7-b8c9-0123-4567-890abcdef014";
          fd.append("CreatedBy", createdByValue);

          // Append files (if any). payload.files should be an array of File objects.
          if (payload.files && payload.files.length > 0) {
            for (let i = 0; i < payload.files.length; i++) {
              // append under same key "Files" so server can bind to List<IFormFile>
              fd.append("Files", payload.files[i], payload.files[i].name);
            }
          }

          // If links array provided, also send LinksJson (server will parse it).
          // We intentionally send LinksJson for backward compatibility.
          if (payload.links && payload.links.length > 0) {
            const sanitizedLinks: LinkPayload[] = payload.links
              .filter((l) => l && typeof l.url === "string" && l.url.trim().length > 0)
              .map((l) => {
                let normalized = l.url;
                try {
                  normalized = new URL(l.url, window.location.href).href;
                } catch {
                  console.warn("Invalid URL in notification link, skipping normalization:", l.url);
                }
                return {
                  url: normalized,
                  title: l.title ?? undefined,
                  thumbnail: l.thumbnail ?? undefined,
                };
              });

            if (sanitizedLinks.length > 0) {
              fd.append("LinksJson", JSON.stringify(sanitizedLinks));
            }
          }

          // Debug: log FormData entries (can't stringify fd directly)
          try {
            const entries: string[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const e of (fd as any).entries()) {
              // entry[1] may be a File — show name and type
              const val = e[1];
              if (val instanceof File) {
                entries.push(`${e[0]}: File(${val.name}, ${val.type})`);
              } else {
                entries.push(`${e[0]}: ${String(val)}`);
              }
            }
            console.debug("createNotification - FormData entries:", entries.join(" | "));
          } catch {
            console.debug("createNotification - FormData (debugging failed)");
          }

          const res = await axiosInstance.post("/Class/notifications", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          const raw = res?.data ?? null;
          if (!raw || raw.success === false) {
            set({
              isLoading: false,
              success: false,
              message: raw?.message ?? "Failed to create notification",
            });
            return null;
          }

          const created = raw.data ?? raw;
          const mapped: ClassNotification = {
            id: created.id ?? Date.now(),
            classId: created.classId ?? payload.classId,
            title: created.title ?? payload.title,
            description: created.description ?? payload.description ?? "",
            createdBy: String(created.createdBy ?? createdByValue),
            createdAt: created.createdAt ?? new Date().toISOString(),
            files: (created.files ?? []).map((f: any, idx: number) => ({
              id: f.id ?? `${Date.now()}-${idx}`,
              fileName: f.fileName ?? f.file_name ?? f.name ?? "file",
              fileUrl: f.fileUrl ?? f.url ?? f.file_url ?? "",
              thumbnail: f.thumbnail ?? undefined,
              isExternal: !!(f.isExternal ?? (f.url && !f.fileName)),
            })) as ClassNotificationFile[],
            comments: created.comments ?? [],
          };

          set((state) => {
            const cur = state.currentClass ?? defaultCurrentClass;
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
    }),
    { name: "class-storage" }
  )
);

export default useClassStore;