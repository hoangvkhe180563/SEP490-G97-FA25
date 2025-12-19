import { formatISO } from "date-fns";
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
import type { Exam } from "../interfaces/Exam";

const defaultClassInfo: ClassInfo = {
  id: 0,
  name: "",
  description: "",
  grade: 1,
  createdAt: formatISO(new Date()),
};
const defaultCurrentClass: ClassDetailResponse = {
  success: false,
  message: "",
  data: {
    classInfo: defaultClassInfo,
    teachers: [],
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
      documentsByClass: {},
      getClasses: async (query?: string, memberId?: string) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          const base = "/Class";
          const params = new URLSearchParams();

          if (query && query.trim().length > 0) {
            const incoming = new URLSearchParams(query);
            incoming.forEach((v, k) => {
              if (
                k.toLowerCase() === "memberid" ||
                k.toLowerCase() === "memberuserid"
              ) {
                params.set("memberid", v);
              } else {
                params.append(k, v);
              }
            });
          }

          if (memberId && !params.has("memberid")) {
            params.append("memberid", memberId);
          }

          const url = params.toString() ? `${base}?${params.toString()}` : base;

          const response = await axiosInstance.get<GetClassesResponse>(url);
          const data = response?.data ?? null;

          const classesArray: any[] = (data?.classes ??
            data?.classes ??
            data) as any[];

          const mappedClasses: ClassListDto[] = (
            Array.isArray(classesArray) ? classesArray : []
          ).map((c: any) => ({
            id: c.id,
            name: c.name,
            subjectName: c.subjectName ?? "",
            instructorName: c.instructorName ?? "",
            description: c.description,
            grade: c.grade ?? 1,
            subjectId: c.subjectId,
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
        grade: number;
        createdBy?: string;
      }) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          const url = "/Class";

          const createdBy = payload.createdBy;

          const body = {
            name: payload.title,
            description: payload.description ?? "",
            grade: payload.grade,
            createdBy: createdBy,
          };

          const res = await axiosInstance.post(url, body);
          const created = res?.data ?? null;

          const createdObj =
            created && created.data
              ? created.data
              : created && created.success !== undefined
              ? created.data ?? null
              : created;

          const mapped: ClassListDto | null = createdObj
            ? {
                id: createdObj.id ?? 0,
                name: createdObj.name ?? payload.title,
                instructorName:
                  createdObj.instructorName ?? createdObj.instructor ?? "",
                description:
                  createdObj.description ?? payload.description ?? "",
                grade: createdObj.grade ?? payload.grade,
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

      // This is the updateClass function inside your class store (updated)
      updateClass: async (payload: {
        id: number;
        title: string;
        description?: string;
        grade: number;
        updatedBy?: string;
        createdBy?: string;
      }) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          const body: Record<string, any> = {
            name: payload.title,
            description: payload.description ?? "",
            // only include updatedBy if provided (avoid sending sentinel)
            ...(payload.updatedBy ? { updatedBy: payload.updatedBy } : {}),
            grade: payload.grade,
            // include createdBy only when provided
            createBy: payload.createdBy,
          };

          const endpoints = [`/Class/${encodeURIComponent(payload.id)}`];

          let res: any = null;
          let lastError: any = null;

          for (const ep of endpoints) {
            try {
              res = await axiosInstance.put(ep, body, {
                headers: { "Content-Type": "application/json" },
              });
              break;
            } catch (err: any) {
              lastError = err;
              const status = err?.response?.status;
              if (status === 400) break;
            }
          }

          if (!res) {
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
            id: updatedObj.id ?? payload.id,
            name: updatedObj.name ?? payload.title,
            subjectId: updatedObj.subjectId,
            subjectName: updatedObj.subjectName,
            description: updatedObj.description ?? payload.description ?? "",
            grade: updatedObj.grade ?? payload.grade,
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

          const members: ClassMemberDto[] = (
            Array.isArray(membersRaw) ? membersRaw : []
          ).map((m: any) => {
            return {
              userId: m.userId ?? "",
              fullname: m.fullname ?? "",
              roles: normalizeRoles(m.roles),
              joinDate: m.joinDate ?? "",
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
              schoolId: m.schoolId,
              schoolName: m.schoolName,
              address: m.address,
              communes: m.communes,
              communeId: m.communeId,
              phoneNumber: m.phoneNumber,
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
            members.filter((mm) => hasRole(mm.roles, /teacher/i)) ?? null;
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
                  teachers: teacherMember,
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
      importMembers: async (classId: number, formData: FormData) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          const endpoints = `/ClassMember/invite-excel?classId=${encodeURIComponent(
            classId
          )}`;

          let res: any = null;
          let lastError: any = null;

          try {
            // Do NOT set Content-Type manually; axios/browser will set multipart boundary
            res = await axiosInstance.post(endpoints, formData);
          } catch (err: any) {
            lastError = err;
            console.error(`[importMembers] POST ${endpoints} failed:`, {
              message: err?.message,
              status: err?.response?.status,
              responseData: err?.response?.data,
            });
            // If 404, try next variant; otherwise break and return error info
          }

          if (!res) {
            const serverMsg =
              lastError?.response?.data?.message ??
              lastError?.message ??
              "Failed to import invites";
            // return structured error for UI to show
            return {
              success: false,
              message: serverMsg,
              rawError: lastError?.response?.data ?? lastError,
            };
          }

          const raw = res?.data ?? null;
          if (raw && raw.success === false) {
            return {
              success: false,
              message: raw?.message ?? "Failed to import invites",
              data: raw,
            };
          }

          const success = raw?.success ?? true;
          const message = raw?.message ?? "Import completed";
          const data = raw?.data ?? raw;

          // return payload to caller
          return { success, message, data, raw };
        } catch (error: any) {
          console.error("importMembers unexpected error:", error);
          const msg = error?.message ?? "Failed to import invites";
          return { success: false, message: msg, rawError: error };
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

          // prepare body
          const body = {
            emails,
            role: role ?? "Student",
          };

          const endpoints = [
            `/ClassMember/invite?classId=${encodeURIComponent(classId)}`,
          ];

          let res: any = null;
          let lastError: any = null;

          for (const ep of endpoints) {
            try {
              res = await axiosInstance.post(ep, body, {
                headers: { "Content-Type": "application/json" },
              });
              break; // success
            } catch (err: any) {
              lastError = err;
              // If server says 404, try next endpoint
              if (err?.response?.status === 404) continue;
              // For other server responses (400/500) break and surface that error
              if (err?.response) break;
              // network errors - try next
            }
          }

          if (!res) {
            console.error(
              "inviteMembers error (no successful endpoint)",
              lastError
            );
            const serverMsg =
              lastError?.response?.data?.message ??
              lastError?.message ??
              "Failed to send invites";
            set({
              isLoading: false,
              success: false,
              message: serverMsg,
            });
            return { success: false, message: serverMsg };
          }

          const raw = res?.data ?? null;

          if (raw && raw.success === false) {
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

          // Normalize positive responses:
          const success = raw?.success ?? true;
          const message = raw?.message ?? "Invitations sent";
          const data = raw?.data ?? raw;

          set({
            isLoading: false,
            success,
            message,
          });

          // Refresh members list for the class if possible
          try {
            await get().getClassMembers(classId);
          } catch {
            // ignore refresh errors
          }

          return { success, message, data };
        } catch (error) {
          console.error("inviteMembers error:", error);
          set({
            isLoading: false,
            success: false,
            message: "Failed to send invites",
          });
          return { success: false, message: "Failed to send invites" };
        } finally {
          set({ isLoading: false });
        }
      },

      confirmMember: async (
        classId: number,
        userId: string
      ): Promise<boolean | null> => {
        set({ isLoading: true, success: false, message: "" });
        try {
          if (!classId || !userId) {
            set({
              isLoading: false,
              success: false,
              message: "classId or userId is required",
            });
            return null;
          }

          // Try both endpoint variants in case axiosInstance.baseURL already contains /api
          const endpoints = [
            `/ClassMember/${encodeURIComponent(
              userId
            )}/confirm?classId=${encodeURIComponent(classId)}`,
          ];

          let res: any = null;
          let lastError: any = null;

          for (const ep of endpoints) {
            try {
              // POST with empty body (controller reads classId from query)
              res = await axiosInstance.post(ep);
              break;
            } catch (err: any) {
              lastError = err;
              // If 404 try next endpoint; for other errors break and surface server response
              if (err?.response?.status === 404) continue;
              if (err?.response) break;
            }
          }

          if (!res) {
            console.error(
              "confirmMember error (no successful endpoint)",
              lastError
            );
            set({
              isLoading: false,
              success: false,
              message:
                lastError?.response?.data?.message ??
                lastError?.message ??
                "Failed to confirm member",
            });
            return false;
          }

          const raw = res?.data ?? null;

          // Controller returns { success = true/false, message = "..." }
          if (!raw || raw.success === false) {
            set({
              isLoading: false,
              success: false,
              message: raw?.message ?? "Failed to confirm member",
            });
            return false;
          }

          // Refresh members for the class to reflect the confirmed status
          try {
            await get().getClassMembers(classId);
          } catch {
            // ignore refresh errors
          }

          set({
            isLoading: false,
            success: true,
            message: raw.message ?? "Thành viên đã được xác nhận",
          });
          return true;
        } catch (err) {
          console.error("confirmMember error:", err);
          set({
            isLoading: false,
            success: false,
            message: "Failed to confirm member",
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      getClassWorks: async (classId: number): Promise<ClassWork[] | null> => {
        set({ isLoading: true });
        try {
          // Prefer the Classwork/class endpoint shown in your API docs/screenshot.
          const endpoints = [`/Classwork/class/${classId}`];

          let res: any = null;
          let raw: any = null;
          for (const ep of endpoints) {
            try {
              res = await axiosInstance.get(ep);
              raw = res?.data ?? null;
              if (raw !== null) break;
            } catch (e) {
              // try next endpoint
              console.debug(
                "[useClassStore] getClassWorks: request failed for",
                ep,
                e
              );
            }
          }

          if (!raw) {
            set({ isLoading: false });
            return null;
          }

          let arr: any[] = [];
          if (Array.isArray(raw.classes)) arr = raw.classes;
          else if (Array.isArray(raw.data)) arr = raw.data;
          else if (raw.data && Array.isArray(raw.data.classes))
            arr = raw.data.classes;
          else if (Array.isArray(raw)) arr = raw;
          else {
            const maybeArray = Object.values(raw).find((v) =>
              Array.isArray(v)
            ) as any[] | undefined;
            if (maybeArray) arr = maybeArray;
          }

          // Map/normalize each work and include files if present
          const works: ClassWork[] = (Array.isArray(arr) ? arr : []).map(
            (w: any) => {
              // normalize files from many possible shapes on each work item
              const filesRaw = (w as any).files ?? [];

              const files = Array.isArray(filesRaw)
                ? filesRaw.map((f: any) => ({
                    id: f.id,
                    fileName: f.fileName,
                    fileUrl: f.fileUrl,
                    thumbnail: f.thumbnail,
                    fileType: (f.fileType ?? f.contentType ?? "")
                      .toString()
                      .toLowerCase(),
                    raw: f,
                  }))
                : [];

              return {
                id: w.id,
                classId: w.classId,
                title: w.title,
                description: w.description,
                deadline: w.deadline,
                maxScore: w.maxScore,
                allowSubmission:
                  w.allowSubmission ??
                  w.allow_submission ??
                  w.allow_submit ??
                  true,
                files, // attach normalized files array here
                raw: w,
                // preserve all original fields for compatibility
                ...w,
              } as ClassWork;
            }
          );

          // Store works in currentClass.data.works (preserve other class state)
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

          console.debug(
            "[useClassStore] getClassWorks: loaded works count",
            works.length
          );
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
          if (!raw || !raw.success) {
            set({ isLoading: false });
            return null;
          }
          const data = raw.data;

          // Normalize notifications so UI can rely on consistent keys:
          const notifications = (data.notifications ?? []).map((n: any) => {
            const topAvatar = n.avatar;
            const createdBy = n.createdBy;
            const createdAt = n.createdAt
              ? formatISO(new Date(n.createdAt))
              : undefined;
            const comments = (n.comments ?? []).map((c: any) => ({
              id: c.id,
              notificationId: c.notificationId ?? n.id,
              userId: c.userId ?? c.appUserId ?? c.user_id ?? null,
              userFullname: c.userFullname ?? c.fullname ?? c.name ?? "",
              content: c.content ?? c.text ?? "",
              createdAt: c.createdAt
                ? formatISO(new Date(c.createdAt))
                : undefined,
              avatarUrl: c.imageUrl ?? c.avatar ?? c.avatarUrl ?? null,
              raw: c,
            }));

            return {
              id: n.id,
              classId: n.classId,
              title: n.title,
              description: n.description,

              createdBy,
              createdAt,
              files: n.files,
              avatarUrl: topAvatar,
              avatarImage: topAvatar, // keep both forms used elsewhere
              authorName: n.arthur,
              comments,
              raw: n,
            } as ClassNotification;
          });

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
                    grade: data.grade,
                    createdAt: formatISO(data.createdAt),
                  },
                  notifications,
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
                createdAt: formatISO(data.createdAt),
                grade: data.grade,
              },
              teachers: get().currentClass.data.teachers ?? null,
              students: get().currentClass.data.students ?? [],
              parents: get().currentClass.data.parents ?? [],
              notifications,
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

      getMemberCount: async (classId: number): Promise<number | null> => {
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
        } finally {
          set({ isLoading: false });
        }
      },
      getMemberClassCount: async (classId: number): Promise<number | null> => {
        try {
          if (!classId) return null;
          const res = await axiosInstance.get(
            `/Classwork/classmembercount/${classId}`
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
        } finally {
          set({ isLoading: false });
        }
      },
      getDocumentsByClassId: async (
        classId: number
      ): Promise<DocumentDto[] | null> => {
        try {
          if (!classId) return null;

          const cached = get().documentsByClass?.[classId];
          if (Array.isArray(cached) && cached.length > 0) {
            return cached as DocumentDto[];
          }

          const endpoints = [`/Document/GetAllDocumentByClassId/${classId}`];

          let res: any = null;
          let raw: any = null;
          let success = false;
          for (const ep of endpoints) {
            try {
              res = await axiosInstance.get(ep);
              raw = res?.data ?? null;
              if (raw !== null) {
                success = true;
                break;
              }
            } catch (e) {
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
                name: d.name,
                documentUrl: d.documentUrl,
                thumbnail,
                description: d.description ?? null,
                fileType: fileType,
                uploaderName: d.uploaderName,
                createdAt: formatISO(d.createdAt)
                  ? formatISO(d.createdAt)
                  : null,
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
        } finally {
          set({ isLoading: false });
        }
      },

      addComment: async (payload) => {
        try {
          const body = {
            content: payload.content ?? "",
            createdBy: payload.userId ?? "d4e5f6a7-b8c9-0123-4567-890abcdef014",
          };

          const url = `/ClassNotification/${payload.notificationId}/comments`;
          const res = await axiosInstance.post(url, body);
          const raw = res?.data ?? null;

          if (!raw || raw.success === false) {
            // don't set store flags; return null and let caller handle UI
            return null;
          }

          const created = raw.data ?? raw;
          const mapped = {
            id: created.id ?? Date.now(),
            notificationId: created.notificationId,
            userId: created.userId,
            userFullname: created.userFullname ?? "Bạn",
            content: created.content,
            avatarUrl: created.avatarUrl,
            createdAt: formatISO(created.createdAt ?? new Date()),
          };

          return mapped;
        } catch (err) {
          console.error("addComment error:", err);
          return null;
        }
      },

      createClasswork: async (payload: any) => {
        set({ isLoading: true, message: "" });

        try {
          // If caller already passed a FormData, post it directly to /Classwork
          if (typeof FormData !== "undefined" && payload instanceof FormData) {
            try {
              console.debug(
                "createClasswork: posting provided FormData to /Classwork"
              );
              const res = await axiosInstance.post(
                "/api/ClassNotification",
                payload
              );
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
              // fallback try alternate candidate
              try {
                const res2 = await axiosInstance.post(
                  "/ClassNotification",
                  payload
                );
                const raw2 = res2?.data ?? null;
                if (!raw2 || raw2.success === false) {
                  set({
                    isLoading: false,
                    success: false,
                    message: raw2?.message ?? "Tạo bài tập thất bại",
                  });
                  return null;
                }
                set({
                  isLoading: false,
                  success: true,
                  message: raw2.message ?? "Tạo bài tập thành công",
                });
                return raw2.data ?? raw2;
              } catch (err2) {
                console.error(
                  "createClasswork FormData post failed for both candidates",
                  err2
                );
                set({
                  isLoading: false,
                  success: false,
                  message: "Tạo bài tập thất bại",
                });
                return null;
              }
            }
          }

          // Build FormData similarly to editClasswork for consistency
          const form = new FormData();

          // Basic fields
          if (payload.classId !== undefined && payload.classId !== null) {
            form.append("ClassId", String(payload.classId));
          }
          // Type default to "classwork" unless provided
          form.append("Type", payload.type ?? "classwork");
          form.append("Title", payload.title ?? "");
          if (payload.description !== undefined)
            form.append("Description", payload.description ?? "");
          if (payload.createdBy !== undefined)
            form.append("CreatedBy", String(payload.createdBy));
          if (payload.deadline !== undefined && payload.deadline !== null) {
            try {
              const d = new Date(payload.deadline);
              form.append(
                "Deadline",
                !isNaN(d.getTime()) ? d.toISOString() : String(payload.deadline)
              );
            } catch {
              form.append("Deadline", String(payload.deadline));
            }
          }
          if (payload.maxScore !== undefined && payload.maxScore !== null)
            form.append("MaxScore", String(payload.maxScore));
          if (payload.gradeType !== undefined && payload.gradeType !== null)
            form.append("GradeType", payload.gradeType);
          if (
            payload.allowSubmission !== undefined &&
            payload.allowSubmission !== null
          )
            form.append(
              "AllowSubmission",
              payload.allowSubmission ? "true" : "false"
            );
          if (
            payload.instructionsHtml !== undefined &&
            payload.instructionsHtml !== null
          )
            form.append("InstructionsHtml", payload.instructionsHtml);

          // Links as JSON
          if (
            payload.links &&
            Array.isArray(payload.links) &&
            payload.links.length > 0
          ) {
            try {
              form.append("LinksJson", JSON.stringify(payload.links));
            } catch {
              // ignore
            }
          }

          // Files (new uploads)
          if (
            payload.files &&
            Array.isArray(payload.files) &&
            payload.files.length > 0
          ) {
            for (const f of payload.files) {
              if (!f) continue;
              form.append("Files", f, f.name);
            }
          }

          const keptIds = Array.isArray(payload.keptExistingFileIds)
            ? payload.keptExistingFileIds
            : Array.isArray(payload.keptFileIds)
            ? payload.keptFileIds
            : null;
          if (Array.isArray(keptIds) && keptIds.length > 0) {
            for (const fid of keptIds) {
              form.append("KeptFileIds", String(fid));
            }
          }

          // Debug print FormData entries (safe)
          try {
            for (const pair of (form as any).entries()) {
              const [k, v] = pair as [string, any];
              if (v instanceof File) {
                console.debug(
                  "createClasswork FormData:",
                  k,
                  "=> File:",
                  v.name,
                  v.size,
                  v.type
                );
              } else {
                console.debug("createClasswork FormData:", k, "=>", v);
              }
            }
          } catch (dbgErr) {
            console.debug(
              "Failed to iterate createClasswork FormData for debug",
              dbgErr
            );
          }

          // Try POST to candidate endpoints (POST /api/Classwork, then /Classwork)
          const candidates = ["/api/ClassNotification", "/ClassNotification"];
          let lastError: any = null;
          for (const url of candidates) {
            try {
              const res = await axiosInstance.post(url, form);
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
            } catch (err: any) {
              lastError = err;
              const status = err?.response?.status;
              console.warn(
                `createClasswork attempt to ${url} failed:`,
                status,
                err?.response?.data ?? err?.message
              );
              if (status === 404) continue; // try next candidate
              // for other errors, surface response if available
              if (err?.response?.data) {
                console.error("Server response data:", err.response.data);
              } else {
                console.error("Error message:", err.message);
              }
              set({
                isLoading: false,
                success: false,
                message: "Tạo bài tập thất bại",
              });
              return null;
            }
          }

          // All candidates failed
          console.error(
            "createClasswork: all URL candidates failed",
            lastError
          );
          if (lastError?.response?.data)
            console.error("Last server response:", lastError.response.data);
          set({
            isLoading: false,
            success: false,
            message: "Tạo bài tập thất bại (route not found)",
          });
          return null;
        } catch (err: any) {
          console.error("createClasswork error:", err);
          const resp = err?.response;
          if (resp?.data) {
            const msg =
              resp.data?.title ??
              (resp.data?.errors
                ? Object.values(resp.data.errors).flat().join("; ")
                : "Tạo bài tập thất bại");
            set({ isLoading: false, success: false, message: String(msg) });
            return null;
          }
          set({
            isLoading: false,
            success: false,
            message: "Tạo bài tập thất bại",
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      editClasswork: async (payload: {
        id: number;
        classId?: number;
        title: string;
        description?: string;
        deadline?: string | null;
        maxScore?: number | null;
        gradeType?: string | null;
        allowSubmission?: boolean | null;
        instructionsHtml?: string | null;
        files?: File[] | null;
        links?: Array<{ url: string; title?: string }> | null;
        keptExistingFileIds?: Array<number | string> | null;
      }) => {
        set({ isLoading: true, message: "" });
        try {
          const keptIdsToUse = Array.isArray(payload.keptExistingFileIds)
            ? payload.keptExistingFileIds
                .map((x) => Number(x))
                .filter((x) => Number.isFinite(x))
            : [];

          const form = new FormData();
          form.append("Type", "classwork");
          if (payload.classId !== undefined && payload.classId !== null) {
            form.append("ClassId", String(payload.classId));
          }

          form.append("Title", payload.title ?? "");
          if (payload.description !== undefined)
            form.append("Description", payload.description ?? "");
          if (payload.deadline !== undefined && payload.deadline !== null) {
            try {
              const d = new Date(payload.deadline);
              form.append(
                "Deadline",
                !isNaN(d.getTime()) ? d.toISOString() : String(payload.deadline)
              );
            } catch {
              form.append("Deadline", String(payload.deadline));
            }
          }
          if (payload.maxScore !== undefined && payload.maxScore !== null)
            form.append("MaxScore", String(payload.maxScore));
          if (payload.gradeType !== undefined && payload.gradeType !== null)
            form.append("GradeType", payload.gradeType);
          if (
            payload.allowSubmission !== undefined &&
            payload.allowSubmission !== null
          )
            form.append(
              "AllowSubmission",
              payload.allowSubmission ? "true" : "false"
            );
          if (
            payload.instructionsHtml !== undefined &&
            payload.instructionsHtml !== null
          )
            form.append("InstructionsHtml", payload.instructionsHtml);

          if (
            payload.links &&
            Array.isArray(payload.links) &&
            payload.links.length > 0
          ) {
            try {
              form.append("LinksJson", JSON.stringify(payload.links));
              // eslint-disable-next-line no-empty
            } catch {}
          }
          if (Array.isArray(payload.files) && payload.files.length > 0) {
            for (const f of payload.files) {
              if (!f) continue;
              form.append("Files", f, f.name);
            }
          }

          // CHỈ append KeptFileIds khi có giá trị hợp lệ
          if (keptIdsToUse.length > 0) {
            for (const fid of keptIdsToUse) {
              form.append("KeptFileIds", String(fid));
            }
          }

          // Debug log để xem FormData gửi đi
          console.log("[editClasswork] Sending FormData:");
          for (const [key, val] of (form as any).entries()) {
            if (val instanceof File) {
              console.log(
                `  ${key}: File(${val.name}, ${val.size} bytes, ${val.type})`
              );
            } else {
              console.log(`  ${key}: ${val}`);
            }
          }

          const url = `/Classwork/${payload.id}`;
          const res = await axiosInstance.put(url, form);
          const raw = res?.data ?? null;

          if (!raw || raw.success === false) {
            set({
              isLoading: false,
              success: false,
              message: raw?.message ?? raw?.title ?? "Sửa bài tập thất bại",
            });
            return null;
          }

          set({
            isLoading: false,
            success: true,
            message: raw.message ?? "Sửa bài tập thành công",
          });
          return raw.data ?? raw;
        } catch (err: any) {
          console.error(
            "[editClasswork] error response data:",
            err?.response?.data
          );
          console.error("[editClasswork] error full:", err);
          set({
            isLoading: false,
            success: false,
            message:
              err?.response?.data?.message ??
              err?.response?.data?.title ??
              "Sửa bài tập thất bại",
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },
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
            fd.append("LinksJson", JSON.stringify(links));
          }

          const endpoints = [
            `/Classwork/${classworkId}/submit`,
            `/ClassNotification/${classworkId}/submit`,
          ];

          let res: any = null;
          let lastError: any = null;
          for (const ep of endpoints) {
            try {
              res = await axiosInstance.post(ep, fd);
              break;
            } catch (err: any) {
              lastError = err;
              if (err?.response?.status === 404) continue;
              if (err?.response) break;
            }
          }

          if (!res) {
            console.error("submitClasswork error (no endpoint)", lastError);
            set({
              isLoading: false,
              success: false,
              message: lastError?.message ?? "Nộp bài thất bại",
            });
            return null;
          }

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
          console.error("submitClasswork error", err);
          set({
            isLoading: false,
            success: false,
            message: "Nộp bài thất bại",
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      getClassworkSubmissions: async (
        classworkId: number
      ): Promise<ClassworkSubmission[] | null> => {
        set({ isLoading: true });
        try {
          const endpoints = [`/Classwork/${classworkId}/submissions`];
          let res: any = null;
          let raw: any = null;
          for (const ep of endpoints) {
            try {
              res = await axiosInstance.get(ep);
              raw = res?.data ?? null;
              if (raw !== null) break;
            } catch (e) {
              // try next
            }
          }
          if (!raw || raw.success === false) {
            set({ isLoading: false });
            return null;
          }

          const arr = raw.data;
          const subs: ClassworkSubmission[] = (
            Array.isArray(arr) ? arr : []
          ).map((s: any) => ({
            id: s.id,
            classworkId: s.classworkId,
            appUserId: s.appUserId,
            firstSubmissionTime: s.firstSubmissionTime,
            latestSubmissionTime: s.latestSubmissionTime,
            files: (s.files ?? s.submissionFiles ?? []).map((f: any) => ({
              id: f.id,
              fileName: f.fileName,
              fileUrl: f.fileUrl,
            })),
            score: s.score,
            submissionStatus: s.submissionStatus,
            // include raw for debugging
            raw: s,
          }));

          set({ isLoading: false });
          return subs;
        } catch (err) {
          console.error("getClassworkSubmissions error:", err);
          set({ isLoading: false });
          return null;
        }
      },

      // replace current getClassworkDetail implementation with this
      getClassworkDetail: async (id: number) => {
        set({ isLoading: true });
        try {
          if (!id) {
            set({ isLoading: false });
            return null;
          }

          const endpoints = [`/Classwork/${id}/detail`];

          let res: any = null;
          let raw: any = null;
          for (const ep of endpoints) {
            try {
              res = await axiosInstance.get(ep);
              raw = res?.data ?? null;
              if (raw !== null) break;
            } catch (e) {
              // try next endpoint
            }
          }

          if (!raw) {
            set({ isLoading: false });
            return null;
          }

          // normalize known shapes
          const data = raw.data ?? raw ?? {};
          const submissions = raw.submissions;
          const filesRaw = raw.files;

          const files = Array.isArray(filesRaw)
            ? filesRaw.map((f: any) => ({
                id: f.id,
                fileName: f.fileName,
                fileUrl: f.fileUrl,
                thumbnail: f.thumbnail,
                isExternal: !!(f.isExternal ?? (f.url && !f.fileName)),
                raw: f,
              }))
            : [];

          const result = {
            success: raw.success ?? true,
            data,
            submissions,
            files,
            raw,
          };

          // MERGE files into currentClass.data.works if present
          set((state) => {
            const cur = state.currentClass ?? defaultCurrentClass;
            const oldWorks = Array.isArray(cur.data?.works)
              ? cur.data!.works
              : [];
            let found = false;
            const works = oldWorks.map((wk: any) => {
              if (String(wk.id) === String(id)) {
                found = true;
                // preserve existing fields but set normalized files
                return {
                  ...wk,
                  files,
                  raw: { ...(wk.raw ?? {}), ...(raw ?? {}) },
                };
              }
              return wk;
            });
            // optional: if work not present, append a minimal entry so UI can read it
            if (!found) {
              works.push({
                id,
                title: data?.title,
                description: data?.description,
                deadline: data?.deadline,
                files,
                raw: data,
              });
            }

            return {
              currentClass: {
                ...cur,
                data: {
                  ...cur.data,
                  works,
                },
                success: cur.success ?? true,
              },
            };
          });

          set({ isLoading: false });
          return result;
        } catch (err) {
          console.error("getClassworkDetail error:", err);
          set({ isLoading: false });
          return null;
        }
      },

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
          const endpoints = [
            `/Classwork/submission?classworkID=${encodeURIComponent(
              classworkId
            )}&userid=${encodeURIComponent(appUserId)}`,
          ];

          let res: any = null;
          let raw: any = null;
          for (const ep of endpoints) {
            try {
              res = await axiosInstance.get(ep);
              raw = res?.data ?? null;
              if (raw !== null) break;
            } catch (e) {
              // try next
            }
          }

          if (!raw || raw.success === false) {
            set({ isLoading: false });
            return null;
          }

          const d = raw.data ?? raw;

          const files = (d.submissionFiles ?? d.files ?? []).map((f: any) => ({
            id: f.id,
            fileName: f.fileName ?? f.file_name ?? f.name,
            fileUrl: f.fileUrl ?? f.file_url ?? f.url,
          }));

          const candidateClassworkId = d.classworkId;

          // Normalize graded/feedback fields (support multiple possible names)
          const feedback = d.feedback;

          const gradedAt = d.gradedAt;

          const gradedBy = d.gradedBy;

          // map grade-by-name (support multiple possible field names)
          const gradeByName = d.gradeByName;

          const submission: ClassworkSubmission = {
            id: d.id,
            classworkId: Number(candidateClassworkId ?? classworkId),
            appUserId: d.appUserId,
            firstSubmissionTime: d.firstSubmissionTime,
            latestSubmissionTime: d.latestSubmissionTime,
            files,
            score: d.score,
            submissionStatus: d.submissionStatus,
            // new fields:
            feedback: feedback ?? null,
            gradedAt: gradedAt ?? null,
            gradedBy: gradedBy ?? null,
            gradeByName: gradeByName ?? null,
            raw: d,
          } as any; // cast as any if your ClassworkSubmission type doesn't yet declare the new optional fields

          set({ isLoading: false });
          return submission;
        } catch (err) {
          console.error("getSubmissionByUserAndClasswork error:", err);
          set({ isLoading: false });
          return null;
        }
      },

      gradeSubmission: async (
        notificationId: number,
        submissionId: number,
        score: number,
        feedback?: string,
        gradedBy?: string
      ): Promise<{ success: boolean; message?: string; raw?: any } | null> => {
        set({ isLoading: true, success: false, message: "" });
        try {
          if (
            !notificationId ||
            !submissionId ||
            score === undefined ||
            score === null
          ) {
            const msg = "Invalid parameters";
            set({ isLoading: false, success: false, message: msg });
            return { success: false, message: msg };
          }

          const body = {
            score,
            feedback: feedback ?? "",
            gradedBy: gradedBy ?? "00000000-0000-0000-0000-000000000000",
          };

          const relativeEndpoints = [
            `/ClassNotification/${encodeURIComponent(
              notificationId
            )}/submissions/${encodeURIComponent(submissionId)}/grade`,
          ];
          const prefixed = relativeEndpoints.map((e) => `/api${e}`);
          const allCandidates = [...relativeEndpoints, ...prefixed];

          let res: any = null;
          let used: string | null = null;

          for (const ep of allCandidates) {
            try {
              console.debug("[gradeSubmission] try:", ep, "body:", body);
              res = await axiosInstance.post(ep, body, {
                headers: { "Content-Type": "application/json" },
              });
              used = ep;
              break;
            } catch (err: any) {
              console.warn(
                "[gradeSubmission] endpoint failed:",
                ep,
                "status:",
                err?.response?.status,
                "data:",
                err?.response?.data
              );
            }
          }

          if (!res) {
            try {
              const abs = `${
                window.location.origin
              }/ClassNotification/${encodeURIComponent(
                notificationId
              )}/submissions/${encodeURIComponent(submissionId)}/grade`;
              console.debug(
                "[gradeSubmission] try absolute URL:",
                abs,
                "body:",
                body
              );
              res = await fetch(abs, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
              const status = (res as any).status ?? 0;
              const text = await (res as any).text();
              let parsed = null;
              try {
                parsed = text ? JSON.parse(text) : null;
              } catch {
                parsed = text;
              }
              if (status < 200 || status >= 300) {
                console.error(
                  "[gradeSubmission] absolute URL failed",
                  status,
                  parsed
                );
                set({
                  isLoading: false,
                  success: false,
                  message: `Grading failed: ${status} ${JSON.stringify(
                    parsed
                  )}`,
                });
                return {
                  success: false,
                  message: `Grading failed: ${status} ${JSON.stringify(
                    parsed
                  )}`,
                  raw: parsed,
                };
              }
              used = abs;
              const raw = parsed;
              try {
                await get().getClassworkSubmissions(notificationId);
              } catch {
                /* empty */
              }
              set({
                isLoading: false,
                success: true,
                message: raw?.message ?? "Graded",
              });
              return { success: true, message: raw?.message ?? "Graded", raw };
            } catch (err) {
              console.error("[gradeSubmission] absolute attempt error", err);
              set({
                isLoading: false,
                success: false,
                message: "Grading failed (absolute attempt)",
              });
              return {
                success: false,
                message: "Grading failed (absolute attempt)",
                raw: err,
              };
            }
          }

          const raw = res?.data ?? res;
          console.debug("[gradeSubmission] used:", used, "response:", raw);
          if (!raw || raw.success === false) {
            const serverMsg = raw?.message ?? JSON.stringify(raw ?? {});
            set({
              isLoading: false,
              success: false,
              message: `Grading failed: ${serverMsg}`,
            });
            return {
              success: false,
              message: `Grading failed: ${serverMsg}`,
              raw,
            };
          }

          try {
            await get().getClassworkSubmissions(notificationId);
          } catch (e) {
            console.debug("[gradeSubmission] refresh failed", e);
          }

          set({
            isLoading: false,
            success: true,
            message: raw.message ?? "Graded",
          });
          return { success: true, message: raw.message ?? "Graded", raw };
        } catch (err) {
          console.error("[gradeSubmission] unexpected error", err);
          set({
            isLoading: false,
            success: false,
            message: "Failed to grade submission (unexpected error)",
          });
          return {
            success: false,
            message: "Failed to grade submission (unexpected error)",
            raw: err,
          };
        } finally {
          set({ isLoading: false });
        }
      },

      getSubmissionCount: async (
        classworkId: number
      ): Promise<number | null> => {
        try {
          if (!classworkId) return null;

          const endpoints = [
            `/Classwork/submissioncount/${encodeURIComponent(classworkId)}`,
          ];

          for (const ep of endpoints) {
            try {
              const res = await axiosInstance.get(ep);
              const raw = res?.data ?? null;
              if (raw === null) continue;

              if (typeof raw === "number") return raw;
              if (typeof raw?.data === "number") return raw.data;
              if (typeof raw?.count === "number") return raw.count;
              if (typeof raw?.submissionCount === "number")
                return raw.submissionCount;
              if (typeof raw?.submission_count === "number")
                return raw.submission_count;
              if (raw?.result != null && typeof raw.result === "number")
                return raw.result;
            } catch (err) {
              // quietly try next endpoint
            }
          }

          const subs = await get().getClassworkSubmissions(classworkId);
          if (!subs) return 0;
          const unique = new Set<string>();
          subs.forEach((s) => {
            const uid = String(s.appUserId ?? (s as any).userId ?? "");
            if (uid) unique.add(uid);
          });
          return unique.size;
        } catch (err) {
          console.error("getSubmissionCount error:", err);
          return null;
        }
      },

      deleteNotification: async (notificationId) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          const url = `/ClassNotification/${notificationId}`;
          const res = await axiosInstance.delete(url);
          const raw = res?.data ?? null;

          if (!raw || raw.success === false) {
            set({
              isLoading: false,
              success: false,
              message: raw?.message ?? "Failed to delete notification",
            });
            return false;
          }

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
          console.log("createNotification - links appended:", payload.links);
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

          try {
            const entries: string[] = [];
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

          const endpoints = ["/ClassNotification"];
          let res: any = null;
          let lastError: any = null;

          for (const ep of endpoints) {
            try {
              res = await axiosInstance.post(ep, fd);
              break;
            } catch (err: any) {
              lastError = err;
              if (err?.response?.status === 404) {
                continue;
              }
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
            classId: created.classId,
            title: created.title,
            description: created.description,
            createdBy: String(created.createdBy ?? createdByValue),
            createdAt: formatISO(created.createdAt) ?? formatISO(new Date()),
            files: (created.files ?? []).map((f: any, idx: number) => ({
              id: f.id ?? `${Date.now()}-${idx}`,
              fileName: f.fileName,
              fileUrl: f.fileUrl,
              thumbnail: f.thumbnail ?? undefined,
              isExternal: !!(f.isExternal ?? (f.url && !f.fileName)),
            })) as ClassNotificationFile[],
            comments:
              (created.comments ?? []).map((c: any) => ({
                id: c.id,
                notificationId: c.notificationId,
                userId: c.userId,
                userFullname: c.userFullname ?? "Bạn",
                content: c.content ?? "",
                avatarUrl: c.avatarUrl,
                createdAt: formatISO(c.createdAt) ?? formatISO(new Date()),
              })) ?? [],
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

      declineMember: async (
        classId: number,
        userId: string
      ): Promise<boolean | null> => {
        set({ isLoading: true, success: false, message: "" });
        try {
          if (!classId || !userId) {
            set({
              isLoading: false,
              success: false,
              message: "classId or userId is required",
            });
            return null;
          }

          // candidate endpoints (POST preference, fallback to DELETE)
          const postEndpoints = [
            `/ClassMember/${encodeURIComponent(
              userId
            )}/decline?classId=${encodeURIComponent(classId)}`,
          ];

          let res: any = null;
          let lastError: any = null;

          // Try POST-style endpoints first
          for (const ep of postEndpoints) {
            try {
              res = await axiosInstance.post(ep);
              break;
            } catch (err: any) {
              lastError = err;
              if (err?.response?.status === 404) continue;
              if (err?.response) break;
            }
          }

          if (!res) {
            const deleteEndpoints = [
              `/Class/${encodeURIComponent(
                classId
              )}/members/${encodeURIComponent(userId)}`,
            ];
            for (const dep of deleteEndpoints) {
              try {
                res = await axiosInstance.delete(dep);
                break;
              } catch (err: any) {
                lastError = err;
                if (err?.response?.status === 404) continue;
                if (err?.response) break;
              }
            }
          }

          if (!res) {
            console.error(
              "declineMember error (no successful endpoint)",
              lastError
            );
            set({
              isLoading: false,
              success: false,
              message:
                lastError?.response?.data?.message ??
                lastError?.message ??
                "Failed to decline invitation",
            });
            return false;
          }

          const raw = res?.data ?? null;

          // If server returned { success: false } treat as failure.
          if (raw && raw.success === false) {
            set({
              isLoading: false,
              success: false,
              message: raw?.message ?? "Failed to decline invitation",
            });
            return false;
          }

          // Refresh members for the class (invitation removed)
          try {
            await get().getClassMembers(classId);
          } catch {
            // ignore refresh errors
          }

          set({
            isLoading: false,
            success: true,
            message: raw?.message ?? "Bạn đã từ chối lời mời",
          });
          return true;
        } catch (err) {
          console.error("declineMember error:", err);
          set({
            isLoading: false,
            success: false,
            message: "Failed to decline invitation",
          });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      getClassExams: async (classId: string): Promise<Exam[]> => {
        try {
          const res = await axiosInstance.get("/exam/class/" + classId);
          if (res.status === 200) {
            return res.data.map((item: any) => {
              return {
                id: item.id,
                title: item.title,
                description: item.description,
                duration: item.duration,
                createdBy: item.createdBy,
                totalQuestions: item.totalQuestions,
              };
            });
          } else {
            throw new Error(`Status: ${res.status}`);
          }
        } catch (error) {
          console.error("Error getClassExams: ", error);
        }
        return [];
      },
      getStudentClassExams: async (studentId: string): Promise<Exam[]> => {
        try {
          const res = await axiosInstance.get(
            "/exam/class/by-student/" + studentId
          );
          if (res.status === 200) {
            return res.data.map((item: any) => {
              return {
                id: item.id,
                title: item.title,
                description: item.description,
                openTime: item.openTime,
                closeTime: item.closeTime,
                duration: item.duration,
                createdBy: item.createdBy,
                showAnswers: item.showAnswers,
                showCorrectAnswers: item.showCorrectAnswers,
                isMultipleAttempts: item.isMultipleAttempts,
                totalQuestions: item.totalQuestions,
              };
            });
          } else {
            throw new Error(`Status: ${res.status}`);
          }
        } catch (error) {
          console.error("Error getStudentClassExams: ", error);
        }
        return [];
      },
      // Replace or update the getUnreadCount function in your store with the code below.

      getUnreadCount: async (
        classId: number,
        type?: string,
        userId?: string
      ): Promise<number> => {
        if (!classId) return 0;

        try {
          // Prefer explicit userId param (API requires userId). If not provided, log a warning.
          if (
            !userId ||
            typeof userId !== "string" ||
            userId.trim().length === 0
          ) {
            console.warn(
              "[useClassStore] getUnreadCount called without userId. The API requires userId; result may be 401."
            );
          }

          const params = new URLSearchParams();
          if (userId && userId.trim().length > 0)
            params.append("userId", userId.trim());
          if (type && type.trim().length > 0)
            params.append("type", type.trim());
          const qs = params.toString() ? `?${params.toString()}` : "";

          const endpoints = [
            `/ClassNotification/class/${encodeURIComponent(
              classId
            )}/unread-count${qs}`,
          ];

          let res: any = null;
          for (const ep of endpoints) {
            try {
              res = await axiosInstance.get(ep);
              if (res && res.data !== undefined && res.data !== null) break;
            } catch (err) {
              // try next endpoint variant (and log)
              console.debug(
                "[useClassStore] getUnreadCount request failed for",
                ep,
                err
              );
            }
          }

          const raw = res?.data ?? null;
          if (!raw) return 0;

          const maybeUnread =
            raw?.data?.data?.unread ??
            raw?.data?.unread ??
            raw?.data?.unreadCount ??
            raw?.unread ??
            raw?.data ??
            raw;

          const val = Number(maybeUnread ?? 0);
          return Number.isFinite(val) ? val : 0;
        } catch (err) {
          console.error("getUnreadCount error", err);
          return 0;
        }
      },
    }),
    { name: "class-storage" }
  )
);

export default useClassStore;
