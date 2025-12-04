import { axiosInstance } from "@/lib/axios";

export class AppUserService {
  async getTeachers(): Promise<any[]> {
    const res = await axiosInstance.get(`/AppUser/teachers`);
    // backend returns { Success: true, Data: [...] } or { Success, Data }
    const body = res.data;
    return body?.data ?? [];
  }
}

export default new AppUserService();
