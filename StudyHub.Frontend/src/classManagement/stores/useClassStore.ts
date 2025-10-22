import  { type Post, type PostComment } from "@/classManagement/components/ui/postcard";

import { create } from "zustand";
import type { ClassState, GetClassesResponse, ClassListDto, ClassMemberDto, ClassInfo, ClassDetailResponse } from "../interfaces/class";
import { axiosInstance } from "@/lib/axios";
const defaultClassInfo: ClassInfo = {
  id: 0,
  name: "",
  subjectId: 0,
  description: "",
  createdAt: new Date().toISOString(),
};
export const useClassStore = create<ClassState>((set) => ({
  classes: [],
  subjects: [], 
  isLoading: false,
  success: false,
  message: "",
  meta: null,
  currentClass: {
    success: false,
    message: "",
    data: { 
    classInfo: defaultClassInfo,
    teacher: null,
    students: [],
    parents: [],
    notifications: [],
  },
},

  getClasses: async (query: string) => {
    set({ isLoading: true, success: false, message: "" });
    
    try {
      const response = await axiosInstance.get<GetClassesResponse>(`/Class?${query}`);
      const data = response.data; 
      console.log("API trả về số lớp:", data.classes.length);

      const mappedClasses: ClassListDto[] = data.classes.map(c => ({
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
      // 6. Kết thúc tải
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
    createdBy: "2" // hoặc lấy từ user login
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
  updateClass: async (payload: { 
  id: number; 
  title: string; 
  subject: number; 
  description?: string 
}) => {
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
  try {
    const res = await axiosInstance.get(`/Class/${id}/detail`);
    const raw = res.data;

    if (!raw?.success) return null;

    const data = raw.data;

    const mapped: ClassDetailResponse = {
      success: raw.success,
      message: raw.message,
      data: {
        classInfo: {
          id: data.id,
          name: data.name,
          subjectId: data.subjectId,
          description: data.description,
          createdAt: data.createdAt,
        },
        teacher: data.members?.find((m: ClassMemberDto) =>
          m.roles?.includes("Teacher")
        ) ?? null,
        students:
          data.members?.filter((m: ClassMemberDto) =>
            m.roles?.includes("Student")
          ) ?? [],
        parents:
          data.members?.filter((m: ClassMemberDto) =>
            m.roles?.includes("Parent")
          ) ?? [],
        notifications: data.notifications?.map((n: Post) => ({
          id: n.id,
          classId: n.classId,
          title: n.title,
          description: n.description,
          createdBy: n.createdBy,
          createdAt: n.createdAt,
          files: n.files ?? [],
          comments: n.comments?.map((c: PostComment) => ({
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

    // 🔥 Lưu state vào store
    useClassStore.setState({ currentClass: mapped, isLoading: false });

    return mapped;
  } catch (error) {
    console.error("❌ Error when fetching class detail:", error);
    useClassStore.setState({ isLoading: false });
    return null;
  }
},




}));