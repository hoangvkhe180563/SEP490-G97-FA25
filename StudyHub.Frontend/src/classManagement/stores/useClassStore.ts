// Updated mapping to include all member fields returned by the API (address, communeId, phoneNumber, wallet, gender, schoolId, ...)
// plus new method getSubmissionByUserAndClasswork and getDocumentsByClassId

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
  ClassWork,
  ClassworkSubmission,
  DocumentDto,
} from "../interfaces/class";
import { axiosInstance } from "@/lib/axios";

const defaultClassInfo: ClassInfo = {
  id: 0,
  name: "",
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
      topics: [],
      classworks: [],
      isLoading: false,
      success: false,
      message: "",
      meta: null,
      currentClass: defaultCurrentClass,
      // store documents per class to avoid repeated calls
      documentsByClass: {},

      getClasses: async (query?: string, memberId?: string) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          // Build URL and query parameters safely.
          const base = "/Class";
          const params = new URLSearchParams();

          // If caller provided a query string (e.g. "page=1&limit=6&query=abc"), merge it into params
          if (query && query.trim().length > 0) {
            // Accept either a raw query string or already-encoded; URLSearchParams handles both.
            const incoming = new URLSearchParams(query);
            incoming.forEach((v, k) => {
              // don't overwrite an explicit memberid from query (caller might already include it)
              if (
                k.toLowerCase() === "memberid" ||
                k.toLowerCase() === "memberuserid"
              ) {
                // normalize to memberid if caller provided memberUserId key previously
                params.set("memberid", v);
              } else {
                // append other params (page, limit, query, subject,...)
                params.append(k, v);
              }
            });
          }

          // Add memberId param only if not already present
          if (memberId && !params.has("memberid")) {
            params.append("memberid", memberId);
          }

          const url = params.toString() ? `${base}?${params.toString()}` : base;

          const response = await axiosInstance.get<GetClassesResponse>(url);
          // some backends return data directly or wrapped in .data - prefer response.data
          const data = response?.data ?? null;

          const classesArray: any[] = (data?.classes ??
            data?.classes ??
            data) as any[];

          const mappedClasses: ClassListDto[] = (
            Array.isArray(classesArray) ? classesArray : []
          ).map((c: any) => ({
            id: c.id,
            name: c.name,
            subjectName:
              c.subjectName ?? c.subject_name ?? c.subject?.name ?? "",
            instructorName:
              c.instructorName ?? c.instructor_name ?? c.instructor ?? "",
            description: c.description,
            subjectId:
              c.subjectId ??
              c.subject_id ??
              (c.subject ? c.subject.id ?? 0 : 0),
          }));

          set({
            classes: mappedClasses,
            meta: data?.meta ?? null,
            success: data?.success ?? true,
            message: data?.message ?? "",
          });

          return data;
        } catch (error) {
          console.error("getClasses error", error);
          set({
            success: false,
            message: "Failed to fetch classes (Lỗi khi tải danh sách lớp)",
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      addClass: async (payload: {
        title: string;
        description?: string;
        createdBy?: string;
      }) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          // Use the API path shown in the screenshot
          const url = "/Class";

          // createdBy should be a GUID string. prefer payload.createdBy if caller provides it.
          const createdBy =
            payload.createdBy ?? "3fa85f64-5717-4562-b3fc-2c963f66afa6"; // <- replace with current user id in real app

          const body = {
            name: payload.title,
            description: payload.description ?? "",
            createdBy: createdBy,
          };

          // send JSON body (axios does this by default)
          const res = await axiosInstance.post(url, body);
          const created = res?.data ?? null;

          // The backend may return the created Class domain entity or a wrapped response.
          // Support both shapes: direct object or { success, message, data }
          const createdObj =
            created && created.data
              ? created.data
              : created && created.success !== undefined
              ? created.data ?? null
              : created;

          const mapped: ClassListDto | null = createdObj
            ? {
                id: createdObj.id ?? createdObj.classId ?? 0,
                name: createdObj.name ?? payload.title,
                instructorName:
                  createdObj.instructorName ?? createdObj.instructor ?? "",
                description:
                  createdObj.description ?? payload.description ?? "",
              }
            : null;

          if (mapped) {
            set((state) => ({
              classes: [mapped, ...state.classes],
              meta: state.meta
                ? { ...state.meta, total: (state.meta.total ?? 0) + 1 }
                : state.meta,
              success: true,
              message:
                (created && created.message) ?? "Create class successful",
            }));
          } else {
            set({ success: false, message: "Create returned empty response" });
          }

          return created;
        } catch (error) {
          console.error("addClass error", error);
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

      updateClass: async (payload: {
        id: number;
        title: string;
        description?: string;
        updatedBy?: string;
      }) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          // Prepare payload using proper field names the API expects
          const body: Record<string, any> = {
            name: payload.title,
            description: payload.description ?? "",
            // backend expects GUID for updatedBy; prefer caller-provided value
            updatedBy:
              payload.updatedBy ?? "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          };

          // Try both route variants in case axiosInstance.baseURL already contains /api
          const endpoints = [
            `/Class/${encodeURIComponent(payload.id)}`,
            `/api/Class/${encodeURIComponent(payload.id)}`,
          ];

          let res: any = null;
          let lastError: any = null;

          for (const ep of endpoints) {
            try {
              res = await axiosInstance.put(ep, body, {
                headers: { "Content-Type": "application/json" },
              });
              // success -> break out
              break;
            } catch (err: any) {
              lastError = err;
              // If server returned 400 (validation), stop trying alternatives and surface message
              const status = err?.response?.status;
              if (status === 400) break;
              // otherwise continue to try next endpoint (e.g. 404 due to double /api)
            }
          }

          if (!res) {
            // All attempts failed (or 400 returned)
            console.error(
              "updateClass error (no successful response)",
              lastError
            );
            const serverMsg =
              lastError?.response?.data?.message ??
              lastError?.message ??
              "Failed to update class";
            set({ success: false, message: serverMsg });
            return null;
          }

          const raw = res?.data ?? null;

          // Normalize response shapes: support direct entity or { success, message, data: {...} }
          const updatedObj =
            raw && raw.data
              ? raw.data
              : raw && raw.success !== undefined
              ? raw.data ?? null
              : raw;

          if (!updatedObj) {
            set({ success: false, message: "Update returned empty response" });
            return null;
          }

          // Map updated object to ClassListDto shape and update store
          const mapped = {
            id: updatedObj.id ?? updatedObj.classId ?? payload.id,
            name: updatedObj.name ?? payload.title,
            subjectId: updatedObj.subjectId ?? updatedObj.subject_id ?? 0,
            subjectName:
              updatedObj.subjectName ?? updatedObj.subject_name ?? null,
            description: updatedObj.description ?? payload.description ?? "",
            instructorName:
              updatedObj.instructorName ?? updatedObj.instructor ?? "",
            ...updatedObj,
          } as ClassListDto;

          set((state) => ({
            classes: state.classes.map((cls) =>
              cls.id === mapped.id ? { ...cls, ...mapped } : cls
            ),
            success: true,
            message: raw?.message ?? "Update class successful",
          }));

          return updatedObj;
        } catch (error) {
          console.error("❌ Failed to update class", error);
          const err: any = error;
          const serverMsg =
            err?.response?.data?.message ??
            err?.message ??
            "Failed to update class";
          set({ success: false, message: serverMsg });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },
      getClassMembers: async (id: number): Promise<ClassMemberDto[] | null> => {
        set({ isLoading: true });
        try {
          // call the API endpoint exactly as requested
          const url = `/ClassMember?classId=${encodeURIComponent(id)}`;
          const res = await axiosInstance.get(url);
          const raw = res?.data ?? null;

          if (!raw || raw.success === false) {
            console.warn(
              "getClassMembers: API returned success=false",
              raw?.message
            );
            return null;
          }

          const membersRaw = raw.data ?? [];

          const normalizeRoles = (r: any): string[] => {
            if (!r) return [];
            if (Array.isArray(r)) return r.map(String);
            if (typeof r === "string") {
              try {
                const parsed = JSON.parse(r);
                if (Array.isArray(parsed)) return parsed.map(String);
              } catch {
                // not JSON — treat as single role string
              }
              return [r];
            }
            return [];
          };

          const toBoolean = (v: any): boolean | undefined => {
            if (v === undefined || v === null) return undefined;
            if (typeof v === "boolean") return v;
            const s = String(v).toLowerCase();
            if (s === "true" || s === "1") return true;
            if (s === "false" || s === "0") return false;
            return undefined;
          };

          const members: ClassMemberDto[] = (
            Array.isArray(membersRaw) ? membersRaw : []
          ).map((m: any) => {
            return {
              userId: m.userId ?? m.id ?? "",
              fullname: m.fullname ?? m.fullName ?? m.name ?? "",
              roles: normalizeRoles(m.roles),
              joinDate: m.joinDate ?? m.joinedAt ?? m.createdAt ?? "",
              // new/extended fields (use null when absent to match your type)
              email: m.email ?? null,
              gender: ((): boolean | number | string | undefined => {
                // keep original types where possible, but normalize booleans
                if (m.gender === undefined) return undefined;
                if (typeof m.gender === "boolean") return m.gender;
                if (typeof m.gender === "number") return m.gender;
                if (typeof m.gender === "string") {
                  const low = m.gender.toLowerCase();
                  if (low === "true" || low === "false") return low === "true";
                  const num = Number(m.gender);
                  return Number.isNaN(num) ? m.gender : num;
                }
                return undefined;
              })(),
              schoolId:
                m.schoolId ??
                m.school_id ??
                (m.school ? m.school.id ?? null : null) ??
                null,
              schoolName:
                m.schoolName ??
                m.school_name ??
                (m.school ? m.school.name ?? null : null) ??
                null,
              address: m.address ?? m.addr ?? null,
              communes: m.communes ?? m.communeName ?? null,
              communeId: m.communeId ?? m.commune_id ?? null,
              phoneNumber: m.phoneNumber ?? m.phone ?? m.phone_number ?? null,
              wallet:
                typeof m.wallet === "number" ? m.wallet : Number(m.wallet ?? 0),
              avatarUrl: m.avatarUrl ?? m.avatar ?? m.imageUrl ?? null,
              // include any extra fields returned by backend
              ...m,
            } as ClassMemberDto;
          });

          const hasRole = (memberRoles: string[], pattern: RegExp) =>
            (memberRoles ?? []).some((r) => pattern.test(String(r)));

          const teacherMember =
            members.find((mm) => hasRole(mm.roles, /teacher/i)) ?? null;
          const parentMembers = members.filter((mm) =>
            hasRole(mm.roles, /parent/i)
          );
          const studentMembers = members.filter(
            (mm) =>
              (mm.roles ?? []).length === 0 || hasRole(mm.roles, /student/i)
          );

          // update store currentClass with categorized members
          set((state) => {
            const cur = state.currentClass ?? defaultCurrentClass;
            return {
              currentClass: {
                ...cur,
                data: {
                  ...cur.data,
                  teacher: teacherMember,
                  students: studentMembers,
                  parents: parentMembers,
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
      inviteMembers: async (
        classId: number,
        emails: string[],
        role?: string
      ) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          if (!emails || emails.length === 0) {
            set({
              isLoading: false,
              success: false,
              message: "No emails to invite",
            });
            return { success: false, message: "No emails to invite" };
          }

          // prepare body; backend contract may differ — update if needed
          const body = {
            emails,
            role: role ?? "Student", // default role; change if UI provides role selection
          };

          // Example endpoint; change if your API is different.
          const url = `/ClassMember/invite/${classId}`;
          const res = await axiosInstance.post(url, body);
          const raw = res?.data ?? null;

          if (!raw || raw.success === false) {
            set({
              isLoading: false,
              success: false,
              message: raw?.message ?? "Failed to send invites",
            });
            return {
              success: false,
              message: raw?.message ?? "Failed to send invites",
            };
          }

          set({
            isLoading: false,
            success: true,
            message: raw.message ?? "Invitations sent",
          });

          try {
            await get().getClassMembers(classId);
          } catch {
            // ignore refresh errors
          }

          return {
            success: true,
            message: raw.message ?? "Invitations sent",
            data: raw.data ?? null,
          };
        } catch (error) {
          console.error("inviteMembers error:", error);
          set({
            isLoading: false,
            success: false,
            message: "Failed to send invites",
          });
          return { success: false, message: "Failed to send invites" };
        }
      },
      getClassWorks: async (classId: number): Promise<ClassWork[] | null> => {
        set({ isLoading: true });
        try {
          const res = await axiosInstance.get(`/Classwork/class/${classId}`);
          const raw = res?.data ?? null;

          if (!raw) {
            console.warn("getClassWorks: no response data");
            set({ isLoading: false });
            return null;
          }

          let arr: any[] = [];
          if (Array.isArray(raw.classes)) arr = raw.classes;
          else if (raw.data && Array.isArray(raw.data.classes))
            arr = raw.data.classes;
          else if (raw.data && Array.isArray(raw.data)) arr = raw.data;
          else if (Array.isArray(raw)) arr = raw;

          const works: ClassWork[] = arr.map((w: any) => ({
            id: w.id ?? w.workId ?? 0,
            classId: w.classId ?? classId,
            title: w.title ?? w.name ?? "",
            description: w.description ?? w.desc ?? "",
            deadline: w.deadline ?? w.dueDate ?? null,
            ...w,
          }));

          set((state) => {
            const cur = state.currentClass ?? defaultCurrentClass;
            return {
              currentClass: {
                ...cur,
                data: {
                  ...cur.data,
                  works: works,
                },
                success: true,
              },
            };
          });

          return works;
        } catch (err) {
          console.error("getClassWorks error:", err);
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

      // NEW: lấy số thành viên của lớp (trả về number | null)
      getMemberCount: async (classId: number): Promise<number | null> => {
        // do not spam global isLoading for quick count calls; set local flag if needed
        try {
          if (!classId) return null;
          const res = await axiosInstance.get(
            `/Classwork/membercount/${classId}`
          );
          const raw = res?.data ?? null;
          let count: number | null = null;
          if (raw !== null) {
            if (typeof raw === "number") count = raw;
            else if (typeof raw?.data === "number") count = raw.data;
            else if (typeof raw?.count === "number") count = raw.count;
          }
          return count;
        } catch (err) {
          console.error("getMemberCount error:", err);
          return null;
        }
      },

      // NEW: Lấy documents theo classId và lưu vào store.documentsByClass[classId]
      getDocumentsByClassId: async (
        classId: number
      ): Promise<DocumentDto[] | null> => {
        try {
          if (!classId) return null;

          // Return cached value if available to avoid unnecessary network calls
          const cached = get().documentsByClass?.[classId];
          if (Array.isArray(cached) && cached.length > 0) {
            return cached as DocumentDto[];
          }

          // Try primary endpoint first. If backend baseURL/config differs, fallback to /api prefix.
          const endpoints = [
            `/Document/GetAllDocumentByClassId/${classId}`,
            `/api/Document/GetAllDocumentByClassId/${classId}`,
          ];

          let res: any = null;
          let raw: any = null;
          let success = false;
          for (const ep of endpoints) {
            try {
              res = await axiosInstance.get(ep);
              raw = res?.data ?? null;
              // if got something plausible, stop trying other endpoints
              if (raw !== null) {
                success = true;
                break;
              }
            } catch (e) {
              // try next endpoint
              // only log debug-level to avoid noisy errors
              console.debug(
                `getDocumentsByClassId: endpoint ${ep} failed, trying next if any`,
                e
              );
            }
          }

          if (!success || !raw) return null;

          const arr = raw.data ?? raw?.documents ?? raw ?? [];
          const docs: DocumentDto[] = (Array.isArray(arr) ? arr : []).map(
            (d: any) => {
              const fileType =
                (d.fileType ?? "").toString().toLowerCase() || null;
              // If thumbnail not provided and it's an image, use documentUrl as thumbnail
              let thumbnail = d.thumbnail ?? null;
              if (
                !thumbnail &&
                fileType &&
                /jpg|jpeg|png|gif|bmp|webp/i.test(fileType)
              ) {
                thumbnail = d.documentUrl ?? null;
              }

              return {
                id: d.id,
                name: d.name ?? d.title ?? "Tài liệu",
                documentUrl: d.documentUrl ?? d.fileUrl ?? d.url ?? "",
                thumbnail,
                description: d.description ?? null,
                fileType: fileType,
                uploaderName: d.uploaderName ?? d.uploaderFullname ?? null,
                createdAt: d.createdAt ?? null,
                classes: Array.isArray(d.classes)
                  ? d.classes.map((c: any) => ({
                      id: c.id,
                      name: c.name ?? null,
                      subjectName: c.subjectName ?? null,
                      instructorName: c.instructorName ?? null,
                      description: c.description ?? null,
                      subjectId: c.subjectId ?? null,
                    }))
                  : undefined,
                raw: d,
              } as DocumentDto;
            }
          );

          // sort newest first if createdAt available
          docs.sort((a, b) => {
            const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tb - ta;
          });

          // cache into store.documentsByClass
          set((state) => ({
            documentsByClass: {
              ...(state.documentsByClass ?? {}),
              [classId]: docs,
            },
          }));

          return docs;
        } catch (err) {
          console.error("getDocumentsByClassId error:", err);
          return null;
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

          const url = `/ClassNotification/${payload.notificationId}/comments`;
          const res = await axiosInstance.post(url, body);
          const raw = res?.data ?? null;

          if (!raw || raw.success === false) {
            set({
              isLoading: false,
              success: false,
              message: raw?.message ?? "Failed to add comment",
            });
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
            const updatedNotifications = (cur.data?.notifications ?? []).map(
              (n) => {
                if (String(n.id) === String(payload.notificationId)) {
                  const comments = (n.comments ?? []).concat([mapped]);
                  return { ...n, comments };
                }
                return n;
              }
            );

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
          set({
            isLoading: false,
            success: false,
            message: "Failed to add comment",
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },
      createClasswork: async (payload: {
        classId: number;
        title: string;
        description?: string;
        deadline?: string;
      }) => {
        set({ isLoading: true, message: "" });
        try {
          const body = {
            classId: payload.classId,
            title: payload.title,
            description: payload.description ?? "",
            deadline: payload.deadline ?? null,
          };
          const res = await axiosInstance.post(`/Classwork`, body);
          const raw = res?.data ?? null;
          if (!raw || raw.success === false) {
            set({
              isLoading: false,
              success: false,
              message: raw?.message ?? "Tạo bài tập thất bại",
            });
            return null;
          }
          set({
            isLoading: false,
            success: true,
            message: raw.message ?? "Tạo bài tập thành công",
          });
          return raw.data ?? raw;
        } catch (err) {
          set({
            isLoading: false,
            success: false,
            message: "Tạo bài tập thất bại",
          });
          return null;
        }
      },

      // Sửa bài tập
      editClasswork: async (payload: {
        id: number;
        classId: number;
        title: string;
        description?: string;
        deadline?: string;
      }) => {
        set({ isLoading: true, message: "" });
        try {
          const body = {
            classId: payload.classId,
            title: payload.title,
            description: payload.description ?? "",
            deadline: payload.deadline ?? null,
          };
          const res = await axiosInstance.put(`/Classwork/${payload.id}`, body);
          const raw = res?.data ?? null;
          if (!raw || raw.success === false) {
            set({
              isLoading: false,
              success: false,
              message: raw?.message ?? "Sửa bài tập thất bại",
            });
            return null;
          }
          set({
            isLoading: false,
            success: true,
            message: raw.message ?? "Sửa bài tập thành công",
          });
          return raw.data ?? raw;
        } catch (err) {
          set({
            isLoading: false,
            success: false,
            message: "Sửa bài tập thất bại",
          });
          return null;
        }
      },

      // Nộp bài tập: submitClasswork
      submitClasswork: async (
        classworkId: number,
        appUserId: string,
        files: File[],
        links?: LinkPayload[]
      ) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          const fd = new FormData();
          fd.append("AppUserId", appUserId);
          for (let i = 0; i < files.length; i++) {
            fd.append("Files", files[i], files[i].name);
          }
          if (links && links.length > 0) {
            // append LinksJson so backend can parse
            fd.append("LinksJson", JSON.stringify(links));
          }

          const res = await axiosInstance.post(
            `/Classwork/${classworkId}/submit`,
            fd,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          const raw = res?.data ?? null;
          if (!raw || raw.success === false) {
            set({
              isLoading: false,
              success: false,
              message: raw?.message ?? "Nộp bài thất bại",
            });
            return null;
          }
          set({
            isLoading: false,
            success: true,
            message: raw.message ?? "Nộp bài thành công",
          });
          return raw.data ?? raw;
        } catch (err) {
          set({
            isLoading: false,
            success: false,
            message: "Nộp bài thất bại",
          });
          console.error("submitClasswork error", err);
          return null;
        }
      },

      // Lấy danh sách các bài nộp cho một bài tập
      getClassworkSubmissions: async (
        classworkId: number
      ): Promise<ClassworkSubmission[] | null> => {
        set({ isLoading: true });
        try {
          const res = await axiosInstance.get(
            `/Classwork/${classworkId}/submissions`
          );
          const raw = res?.data ?? null;
          if (!raw || raw.success === false) {
            set({ isLoading: false });
            return null;
          }
          const subs: ClassworkSubmission[] = (
            raw.data ??
            raw.submissions ??
            []
          ).map((s: any) => ({
            id: s.id,
            classworkId: s.classworkId,
            appUserId: s.appUserId,
            firstSubmissionTime: s.firstSubmissionTime,
            latestSubmissionTime: s.latestSubmissionTime,
            files: (s.files ?? []).map((f: any) => ({
              id: f.id,
              fileName: f.fileName,
              fileUrl: f.fileUrl,
            })),
          }));
          set({ isLoading: false });
          return subs;
        } catch (err) {
          set({ isLoading: false });
          return null;
        }
      },

      // NEW: Lấy 1 submission của 1 user cho 1 classwork
      getSubmissionByUserAndClasswork: async (
        classworkId: number,
        appUserId: string
      ): Promise<ClassworkSubmission | null> => {
        set({ isLoading: true });
        try {
          if (!classworkId || !appUserId) {
            set({ isLoading: false });
            return null;
          }
          const url = `/Classwork/submission?classworkID=${encodeURIComponent(
            classworkId
          )}&userid=${encodeURIComponent(appUserId)}`;
          const res = await axiosInstance.get(url);
          const raw = res?.data ?? null;
          if (!raw || raw.success === false) {
            set({ isLoading: false });
            return null;
          }
          const d = raw.data ?? raw;
          const files = (d.submissionFiles ?? []).map((f: any) => ({
            id: f.id,
            fileName: f.fileName,
            fileUrl: f.fileUrl,
          }));
          const submission: ClassworkSubmission = {
            id: d.id,
            classworkId: d.classworkId,
            appUserId: d.appUserId,
            firstSubmissionTime: d.firstSubmissionTime,
            latestSubmissionTime: d.latestSubmissionTime,
            files,
            score: 50, // default score if not provided
          };
          set({ isLoading: false });
          return submission;
        } catch (err) {
          console.error("getSubmissionByUserAndClasswork error", err);
          set({ isLoading: false });
          return null;
        }
      },

      deleteNotification: async (notificationId) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          const url = `/ClassNotification/${notificationId}`;
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
          set({
            isLoading: false,
            success: false,
            message: "Failed to delete notification",
          });
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
          const createdByValue =
            payload.createdBy ?? "d4e5f6a7-b8c9-0123-4567-890abcdef014";
          fd.append("CreatedBy", createdByValue);

          if (payload.files && payload.files.length > 0) {
            for (let i = 0; i < payload.files.length; i++) {
              fd.append("Files", payload.files[i], payload.files[i].name);
            }
          }

          if (payload.links && payload.links.length > 0) {
            const sanitizedLinks: LinkPayload[] = payload.links
              .filter(
                (l) => l && typeof l.url === "string" && l.url.trim().length > 0
              )
              .map((l) => {
                let normalized = l.url;
                try {
                  normalized = new URL(l.url, window.location.href).href;
                } catch {
                  console.warn(
                    "Invalid URL in notification link, skipping normalization:",
                    l.url
                  );
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

          // Debug logging (optional)
          try {
            const entries: string[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const e of (fd as any).entries()) {
              const val = e[1];
              if (val instanceof File) {
                entries.push(`${e[0]}: File(${val.name}, ${val.type})`);
              } else {
                entries.push(`${e[0]}: ${String(val)}`);
              }
            }
            console.debug(
              "createNotification - FormData entries:",
              entries.join(" | ")
            );
          } catch {
            console.debug("createNotification - FormData (debugging failed)");
          }

          // Try endpoint variants so we don't break when axiosInstance.baseURL already contains /api
          const endpoints = ["/ClassNotification", "/api/ClassNotification"];
          let res: any = null;
          let lastError: any = null;

          for (const ep of endpoints) {
            try {
              // Do NOT set Content-Type header; let axios/browser set the correct boundary
              res = await axiosInstance.post(ep, fd);
              // success
              break;
            } catch (err: any) {
              lastError = err;
              // if 404 try next endpoint; for other errors continue trying but remember lastError
              if (err?.response?.status === 404) {
                continue;
              }
              // For 400/500 we also break and surface error (server responded)
              if (err?.response) break;
            }
          }

          if (!res) {
            console.error(
              "createNotification error (no successful endpoint)",
              lastError
            );
            set({
              isLoading: false,
              success: false,
              message:
                lastError?.response?.data?.message ??
                lastError?.message ??
                "Failed to create notification",
            });
            return null;
          }

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
            const newNotifications = [
              mapped,
              ...(cur.data?.notifications ?? []),
            ];
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
          set({
            success: false,
            message: "Failed to create notification",
            isLoading: false,
          });
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
