import { axiosInstance } from "@/lib/axios";

export type CreateTransactionRequest = {
  userId: string;
  amount: number;
  type: string; // "Withdraw" | "Refund"
  courseId?: number | null;
  accountNumber?: string | null;
  description?: string | null;
  qrcodeUrl?: string | null;
};

export type TransactionDto = {
  id: number;
  userId: string;
  amount: number;
  type: string;
  courseId?: number | null;
  description?: string | null;
  status: string;
  transactionCode?: string | null;
  createdAt: string;
  processedAt?: string | null;
  qrcodeUrl?: string | null;
  accountNumber?: string | null;
};

export const transactionService = {
  requestTransaction: async (req: CreateTransactionRequest) => {
    const resp = await axiosInstance.post<TransactionDto>(
      "/transaction/request",
      req,
      { withCredentials: true }
    );
    return resp.data;
  },

  getUserTransactions: async (userId: string) => {
    const resp = await axiosInstance.get<TransactionDto[]>(
      `/transaction/user/${userId}`,
      { withCredentials: true }
    );
    return resp.data;
  },

  adminApprove: async (id: number, body: Partial<TransactionDto>) => {
    const resp = await axiosInstance.post(`/transaction/${id}/approve`, body, {
      withCredentials: true,
    });
    return resp.data;
  },

  adminReject: async (id: number, body: Partial<TransactionDto>) => {
    const resp = await axiosInstance.post(`/transaction/${id}/reject`, body, {
      withCredentials: true,
    });
    return resp.data;
  },

  uploadProof: async (file: File) => {
    const fd = new FormData();
    fd.append("File", file);
    const resp = await axiosInstance.post<{ url: string }>(
      "/transaction/upload-proof",
      fd,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return resp.data?.url ?? null;
  },

  getPendingTransactions: async (
    page = 1,
    pageSize = 5,
    type?: string | null,
    status?: string | null
  ) => {
    const params = new URLSearchParams();
    params.append("pageNumber", String(page));
    params.append("pageSize", String(pageSize));
    if (type) params.append("type", type);
    if (status) params.append("status", status);

    const resp = await axiosInstance.get<{ success: boolean; data: any }>(
      `/transaction/pending?${params.toString()}`,
      { withCredentials: true }
    );

    // backend returns { success: true, data: PagedResult<TransactionDto> }
    return (
      resp.data?.data ?? { Items: [], Total: 0, Page: page, Limit: pageSize }
    );
  },

  exportCsv: async (
    type?: string | null,
    status?: string | null,
    userId?: string | null
  ) => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    if (userId) params.append("userId", userId);
    const resp = await axiosInstance.get(
      `/transaction/export/csv?${params.toString()}`,
      {
        responseType: "blob",
        withCredentials: true,
      }
    );
    return resp.data as Blob;
  },

  exportDoc: async (
    type?: string | null,
    status?: string | null,
    userId?: string | null
  ) => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    if (userId) params.append("userId", userId);
    const resp = await axiosInstance.get(
      `/transaction/export/doc?${params.toString()}`,
      {
        responseType: "blob",
        withCredentials: true,
      }
    );
    return resp.data as Blob;
  },
  // Revenue-specific exports (delegated to backend report generator)
  exportRevenueCsv: async (opts: {
    from?: string | null;
    to?: string | null;
    courseId?: string | null;
    teacherId?: string | null;
    mode?: string | null;
  }) => {
    const params = new URLSearchParams();
    if (opts.from) params.append("from", opts.from);
    if (opts.to) params.append("to", opts.to);
    if (opts.courseId) params.append("courseId", opts.courseId);
    if (opts.teacherId) params.append("teacherId", opts.teacherId);
    if (opts.mode) params.append("mode", opts.mode);
    const resp = await axiosInstance.get(
      `/transaction/export/revenue/csv?${params.toString()}`,
      {
        responseType: "blob",
        withCredentials: true,
      }
    );
    return resp.data as Blob;
  },

  exportRevenuePdf: async (opts: {
    from?: string | null;
    to?: string | null;
    courseId?: string | null;
    teacherId?: string | null;
    mode?: string | null;
  }) => {
    const params = new URLSearchParams();
    if (opts.from) params.append("from", opts.from);
    if (opts.to) params.append("to", opts.to);
    if (opts.courseId) params.append("courseId", opts.courseId);
    if (opts.teacherId) params.append("teacherId", opts.teacherId);
    if (opts.mode) params.append("mode", opts.mode);
    const resp = await axiosInstance.get(
      `/transaction/export/revenue/pdf?${params.toString()}`,
      {
        responseType: "blob",
        withCredentials: true,
      }
    );
    return resp.data as Blob;
  },
  exportRevenueDoc: async (opts: {
    from?: string | null;
    to?: string | null;
    courseId?: string | null;
    teacherId?: string | null;
    mode?: string | null;
  }) => {
    const params = new URLSearchParams();
    if (opts.from) params.append("from", opts.from);
    if (opts.to) params.append("to", opts.to);
    if (opts.courseId) params.append("courseId", opts.courseId);
    if (opts.teacherId) params.append("teacherId", opts.teacherId);
    if (opts.mode) params.append("mode", opts.mode);
    const resp = await axiosInstance.get(
      `/transaction/export/revenue/doc?${params.toString()}`,
      {
        responseType: "blob",
        withCredentials: true,
      }
    );
    return resp.data as Blob;
  },
};
