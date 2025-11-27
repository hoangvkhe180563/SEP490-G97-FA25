import { formatISO, parseISO } from "date-fns";
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
  createdAt: formatISO(new Date()),
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

// --- helper: normalize server datetime into ISO UTC string ---
// Accepts numbers, ISO strings (with/without Z), "/Date(...)/" MS format, and common date strings.
// Returns ISO string in UTC (new Date(...).toISOString()) or fallback to current time ISO.

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
          const endpoints = [`/Class/${encodeURIComponent(payload.id)}`];

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
      importMembers: async (classId: number, formData: FormData) => {
        set({ isLoading: true, success: false, message: "" });
        try {
          const endpoints = [
            `/ClassMember/invite-excel?classId=${encodeURIComponent(classId)}`,
            `/ClassMember/invite/excel?classId=${encodeURIComponent(classId)}`,
          ];

          let res: any = null;
          let lastError: any = null;

          for (const ep of endpoints) {
            try {
              res = await axiosInstance.post(ep, formData, {
                headers: {
                  /* Don't set Content-Type; browser will set multipart boundary */
                },
              });
              break;
            } catch (err: any) {
              lastError = err;
              if (err?.response?.status === 404) continue;
              if (err?.response) break;
            }
          }

          if (!res) {
            const serverMsg =
              lastError?.response?.data?.message ??
              lastError?.message ??
              "Failed to import invites";
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
              message: raw?.message ?? "Failed to import invites",
            });
            return {
              success: false,
              message: raw?.message ?? "Failed to import invites",
            };
          }

          const success = raw?.success ?? true;
          const message = raw?.message ?? "Import completed";
          const data = raw?.data ?? raw;

          set({
            isLoading: false,
            success,
            message,
          });

          try {
            await get().getClassMembers(classId);
          } catch { /* empty */ }

          return { success, message, data };
        } catch (error) {
          console.error("importMembers error:", error);
          set({
            isLoading: false,
            success: false,
            message: "Failed to import invites",
          });
          return { success: false, message: "Failed to import invites" };
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

          // prepare body
          const body = {
            emails,
            role: role ?? "Student",
          };

          // Try several endpoint variants so we match your backend which expects:
          // POST /api/ClassMember/invite?classId=1
          // Also try without /api prefix or with classId path segment as fallback.
          const endpoints = [
            `/ClassMember/invite?classId=${encodeURIComponent(classId)}`,
            `/ClassMember/invite/${encodeURIComponent(classId)}`,
            `/Class/${encodeURIComponent(classId)}/members/invite`,
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

          // Support various backend shapes:
          // 1) { success: true/false, message, data }
          // 2) direct payload (array/object)
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
              // If 404 try next endpoint; for other errors break to surface server response
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
          const endpoints = [
            `/Classwork/class/${classId}`,
            // keep legacy fallbacks if needed
            `/ClassNotification/class/${classId}`,
          ];

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

          // Normalize possible response shapes to an array of work objects
          let arr: any[] = [];
          if (Array.isArray(raw.classes)) arr = raw.classes;
          else if (Array.isArray(raw.data)) arr = raw.data;
          else if (raw.data && Array.isArray(raw.data.classes))
            arr = raw.data.classes;
          else if (Array.isArray(raw)) arr = raw;
          else {
            // If the API returned a wrapper like { success:true, classes: [...] } we've already handled classes above.
            // Fallback: try to find an array field on the payload
            const maybeArray = Object.values(raw).find((v) =>
              Array.isArray(v)
            ) as any[] | undefined;
            if (maybeArray) arr = maybeArray;
          }

          // Map/normalize each work and include files if present
          const works: ClassWork[] = (Array.isArray(arr) ? arr : []).map(
            (w: any) => {
              // normalize files from many possible shapes on each work item
              const filesRaw =
                (w as any).files ??
                (w as any).attachments ??
                (w as any).documents ??
                (w as any).fileList ??
                (w as any).raw?.files ??
                [];

              const files = Array.isArray(filesRaw)
                ? filesRaw.map((f: any, idx: number) => ({
                    id: f.id ?? `${w.id ?? w.workId ?? "work"}-file-${idx}`,
                    fileName:
                      f.fileName ?? f.name ?? f.title ?? f.file_name ?? "",
                    fileUrl:
                      f.fileUrl ?? f.url ?? f.file_url ?? f.documentUrl ?? "",
                    thumbnail: f.thumbnail ?? f.thumb ?? undefined,
                    fileType: (f.fileType ?? f.contentType ?? "")
                      .toString()
                      .toLowerCase(),
                    raw: f,
                  }))
                : [];

              return {
                id: w.id ?? w.workId ?? 0,
                classId: w.classId ?? classId,
                title: w.title ?? w.name ?? "",
                description: w.description ?? w.desc ?? "",
                deadline: w.deadline ?? w.dueDate ?? null,
                maxScore: w.maxScore ?? w.max_score ?? null,
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
              createdAt: formatISO(n.createdAt),
              files: n.files ?? [],
              comments:
                (n.comments ?? []).map((c: any) => ({
                  id: c.id,
                  notificationId: c.notificationId,
                  userId: c.userId,
                  content: c.content,
                  createdAt: formatISO(c.createdAt),
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
                    createdAt: formatISO(data.createdAt),
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
                createdAt: formatISO(data.createdAt),
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
          const endpoints = [`/Document/GetAllDocumentByClassId/${classId}`];

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
            createdAt: formatISO(
              created.createdAt ?? created.createdAt ?? formatISO(new Date())
            ),
          };

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
      }) => {
        set({ isLoading: true, message: "" });
        try {
          // Build FormData to match EditClassworkDto ([FromForm])
          const form = new FormData();

          // Required/primary fields
          form.append("Title", payload.title ?? "");
          if (payload.description !== undefined)
            form.append("Description", payload.description ?? "");
          // Deadline: if null explicitly, append empty or omit; server will treat missing as no-change
          if (payload.deadline !== undefined && payload.deadline !== null) {
            // ensure ISO format if possible
            try {
              const d = new Date(payload.deadline);
              if (!isNaN(d.getTime())) form.append("Deadline", d.toISOString());
              else form.append("Deadline", String(payload.deadline));
            } catch {
              form.append("Deadline", String(payload.deadline));
            }
          }

          // Optional classwork-specific fields
          if (payload.maxScore !== undefined && payload.maxScore !== null) {
            form.append("MaxScore", String(payload.maxScore));
          }
          if (payload.gradeType !== undefined && payload.gradeType !== null) {
            form.append("GradeType", payload.gradeType);
          }
          if (
            payload.allowSubmission !== undefined &&
            payload.allowSubmission !== null
          ) {
            form.append(
              "AllowSubmission",
              payload.allowSubmission ? "true" : "false"
            );
          }
          if (
            payload.instructionsHtml !== undefined &&
            payload.instructionsHtml !== null
          ) {
            form.append("InstructionsHtml", payload.instructionsHtml);
          }

          // Links: server DTO exposes LinksJson which the DTO parses to Links.
          if (
            payload.links &&
            Array.isArray(payload.links) &&
            payload.links.length > 0
          ) {
            try {
              form.append("LinksJson", JSON.stringify(payload.links));
            } catch {
              // ignore / don't append if stringify fails
            }
          }

          // Files: append multiple files with the same field name "Files"
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

          // Note: if server expects additional form fields (e.g., ClassId), you can append here.
          if (payload.classId !== undefined && payload.classId !== null) {
            form.append("ClassId", String(payload.classId));
          }

          // Send PUT with FormData. Do NOT set Content-Type header explicitly so browser sets boundary.
          const res = await axiosInstance.put(`/Classwork/${payload.id}`, form);
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
          console.error("editClasswork error:", err);
          set({
            isLoading: false,
            success: false,
            message: "Sửa bài tập thất bại",
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
          const endpoints = [
            `/Classwork/${classworkId}/submissions`,
            `/ClassNotification/${classworkId}/submissions`,
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

          const arr =
            raw.data ?? raw.submissions ?? raw.submissionList ?? raw ?? [];
          const subs: ClassworkSubmission[] = (
            Array.isArray(arr) ? arr : []
          ).map((s: any) => ({
            id: s.id,
            classworkId: s.classworkId ?? s.notificationId ?? 0,
            appUserId: s.appUserId ?? s.app_user_id ?? s.userId ?? "",
            firstSubmissionTime:
              s.firstSubmissionTime ??
              s.first_submission_time ??
              s.firstSubmittedAt ??
              null,
            latestSubmissionTime:
              s.latestSubmissionTime ??
              s.latest_submission_time ??
              s.latestSubmittedAt ??
              null,
            files: (s.files ?? s.submissionFiles ?? []).map((f: any) => ({
              id: f.id,
              fileName: f.fileName ?? f.file_name ?? f.name,
              fileUrl: f.fileUrl ?? f.file_url ?? f.url,
            })),
            score: s.score ?? s.Score ?? null,
            submissionStatus: s.submissionStatus ?? s.status ?? null,
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

          const endpoints = [
            `/Classwork/${id}/detail`,
            `/Classwork/${id}/detail`,
          ];

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
          const submissions =
            raw.submissions ??
            raw.data?.submissions ??
            raw.submissionList ??
            raw.submissions ??
            [];
          const filesRaw =
            raw.files ??
            raw.data?.files ??
            raw.attachments ??
            raw.documents ??
            [];

          const files = Array.isArray(filesRaw)
            ? filesRaw.map((f: any, idx: number) => ({
                id: f.id ?? `${id}-file-${idx}`,
                fileName: f.fileName ?? f.name ?? f.title ?? f.file_name ?? "",
                fileUrl:
                  f.fileUrl ?? f.url ?? f.file_url ?? f.documentUrl ?? "",
                thumbnail: f.thumbnail ?? f.thumb ?? undefined,
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
                title: data?.title ?? data?.name ?? "",
                description: data?.description ?? data?.desc ?? "",
                deadline: data?.deadline ?? data?.dueDate ?? null,
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

      // Replace or update the getSubmissionByUserAndClasswork function in your store with the snippet below.

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
            `/Classwork/submission?classworkID=${encodeURIComponent(
              classworkId
            )}&userid=${encodeURIComponent(appUserId)}`,
            `/ClassNotification/submission?notificationId=${encodeURIComponent(
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

          // Normalize classwork/notification id from many possible names, fallback to function arg
          const candidateClassworkId =
            d.classworkId ??
            d.notificationId ??
            d.notification_id ??
            d.workId ??
            d.work_id ??
            classworkId;

          // Normalize graded/feedback fields (support multiple possible names)
          const feedback =
            d.feedback ??
            d.gradeFeedback ??
            d.graderFeedback ??
            d.teacherFeedback ??
            d.feedbackText ??
            null;

          const gradedAt =
            d.gradedAt ?? d.graded_at ?? d.gradedDate ?? d.graded_date ?? null;

          const gradedBy =
            d.gradedBy ?? d.graded_by ?? d.grader ?? d.graderId ?? null;

          // map grade-by-name (support multiple possible field names)
          const gradeByName =
            d.gradeByName ??
            d.graderName ??
            d.gradedByName ??
            d.graderFullname ??
            d.graderFullName ??
            null;

          const submission: ClassworkSubmission = {
            id: d.id,
            classworkId: Number(candidateClassworkId ?? classworkId),
            appUserId: d.appUserId ?? d.app_user_id ?? appUserId,
            firstSubmissionTime:
              d.firstSubmissionTime ??
              d.first_submission_time ??
              d.firstSubmittedAt ??
              null,
            latestSubmissionTime:
              d.latestSubmissionTime ??
              d.latest_submission_time ??
              d.latestSubmittedAt ??
              null,
            files,
            score: d.score ?? d.Score ?? null,
            submissionStatus: d.submissionStatus ?? d.status ?? null,
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
            `/Classwork/${encodeURIComponent(
              notificationId
            )}/submissions/${encodeURIComponent(submissionId)}/grade`,
            `/ClassNotification/${encodeURIComponent(notificationId)}/grade`,
            `/Classwork/${encodeURIComponent(notificationId)}/grade`,
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
            `/Classwork/${encodeURIComponent(classworkId)}/submissioncount`,
            `/ClassNotification/submissioncount/${encodeURIComponent(
              classworkId
            )}`,
            `/ClassNotification/${encodeURIComponent(
              classworkId
            )}/submissioncount`,
            `/Classwork/submissioncount?classworkId=${encodeURIComponent(
              classworkId
            )}`,
            `/ClassNotification/submissioncount?notificationId=${encodeURIComponent(
              classworkId
            )}`,
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
          const endpoints = ["/ClassNotification"];
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
            createdAt: formatISO(created.createdAt) ?? formatISO(new Date()),
            files: (created.files ?? []).map((f: any, idx: number) => ({
              id: f.id ?? `${Date.now()}-${idx}`,
              fileName: f.fileName ?? f.file_name ?? f.name ?? "file",
              fileUrl: f.fileUrl ?? f.url ?? f.file_url ?? "",
              thumbnail: f.thumbnail ?? undefined,
              isExternal: !!(f.isExternal ?? (f.url && !f.fileName)),
            })) as ClassNotificationFile[],
            comments:
              (created.comments ?? []).map((c: any) => ({
                id: c.id,
                notificationId: c.notificationId ?? mapped.id,
                userId: c.userId ?? c.createdBy ?? null,
                userFullname: c.userFullname ?? "Bạn",
                content: c.content ?? "",
                avatarUrl: c.avatarUrl ?? null,
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
            `/ClassMember/${encodeURIComponent(
              userId
            )}/reject?classId=${encodeURIComponent(classId)}`,
            `/Class/${encodeURIComponent(classId)}/members/${encodeURIComponent(
              userId
            )}/decline`,
            `/Class/${encodeURIComponent(classId)}/members/${encodeURIComponent(
              userId
            )}/decline`,
            `/Class/${encodeURIComponent(classId)}/members/${encodeURIComponent(
              userId
            )}/reject`,
            `/Class/${encodeURIComponent(classId)}/members/${encodeURIComponent(
              userId
            )}/reject`,
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

          // If no POST succeeded, try DELETE endpoints (some APIs use DELETE to remove invitation)
          if (!res) {
            const deleteEndpoints = [
              `/Class/${encodeURIComponent(
                classId
              )}/members/${encodeURIComponent(userId)}`,
              `/ClassMember?classId=${encodeURIComponent(
                classId
              )}&userId=${encodeURIComponent(userId)}`,
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
