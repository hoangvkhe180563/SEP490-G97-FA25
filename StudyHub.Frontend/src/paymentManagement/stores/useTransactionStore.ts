import { create } from "zustand";
import { transactionService } from "@/paymentManagement/services/transactionService";
import type {
  CreateTransactionRequest,
  TransactionDto,
} from "@/paymentManagement/services/transactionService";

type TransactionState = {
  loading: boolean;
  transactions: TransactionDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  error: string | null;
  fetchUserTransactions: (userId: string) => Promise<void>;
  fetchPendingTransactions: (
    page?: number,
    pageSize?: number,
    type?: string | null,
    status?: string | null
  ) => Promise<void>;
  requestWithdraw: (
    req: CreateTransactionRequest
  ) => Promise<TransactionDto | null>;
  uploadProof: (file: File) => Promise<string | null>;
  adminApprove: (
    id: number,
    body?: Partial<TransactionDto>
  ) => Promise<boolean>;
  adminReject: (id: number, body?: Partial<TransactionDto>) => Promise<boolean>;
  exportCsv: (
    type?: string | null,
    status?: string | null,
    userId?: string | null
  ) => Promise<Blob | null>;
  exportDoc: (
    type?: string | null,
    status?: string | null,
    userId?: string | null
  ) => Promise<Blob | null>;
  exportRevenueCsv: (opts: {
    from?: string | null;
    to?: string | null;
    courseId?: string | null;
    teacherId?: string | null;
    mode?: string | null;
  }) => Promise<Blob | null>;
  exportRevenuePdf: (opts: {
    from?: string | null;
    to?: string | null;
    courseId?: string | null;
    teacherId?: string | null;
    mode?: string | null;
  }) => Promise<Blob | null>;
  exportRevenueDoc: (opts: {
    from?: string | null;
    to?: string | null;
    courseId?: string | null;
    teacherId?: string | null;
    mode?: string | null;
  }) => Promise<Blob | null>;
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  loading: false,
  transactions: [],
  page: 1,
  limit: 5,
  total: 0,
  totalPages: 0,
  error: null,

  fetchUserTransactions: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const list = await transactionService.getUserTransactions(userId);
      set({ transactions: list, loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
    }
  },

  fetchPendingTransactions: async (
    page = 1,
    pageSize = 50,
    type?: string | null,
    status?: string | null
  ) => {
    set({ loading: true, error: null });
    try {
      const paged = await transactionService.getPendingTransactions(
        page,
        pageSize,
        type,
        status
      );
      // Support multiple backend shapes: Items vs items, Total vs total, etc.
      const anyPaged: any = paged ?? {};
      const items: TransactionDto[] = Array.isArray(anyPaged.items)
        ? anyPaged.items
        : Array.isArray(anyPaged.Items)
        ? anyPaged.Items
        : [];

      const pageNum: number = anyPaged.page ?? anyPaged.Page ?? page ?? 1;
      const limitNum: number =
        anyPaged.limit ?? anyPaged.Limit ?? pageSize ?? 50;
      const totalNum: number = anyPaged.total ?? anyPaged.Total ?? 0;
      const totalPagesNum: number =
        anyPaged.totalPages ?? anyPaged.TotalPages ?? 0;

      set({
        transactions: items,
        page: pageNum,
        limit: limitNum,
        total: totalNum,
        totalPages: totalPagesNum,
        loading: false,
      });
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
    }
  },

  requestWithdraw: async (req: CreateTransactionRequest) => {
    set({ loading: true, error: null });
    try {
      const tx = await transactionService.requestTransaction(req);
      // refresh user's tx list
      await get().fetchUserTransactions(req.userId);
      set({ loading: false });
      return tx;
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
      return null;
    }
  },

  uploadProof: async (file: File) => {
    set({ loading: true, error: null });
    try {
      const url = await transactionService.uploadProof(file);
      set({ loading: false });
      return url;
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
      return null;
    }
  },

  adminApprove: async (id: number, body?: Partial<TransactionDto>) => {
    set({ loading: true, error: null });
    try {
      await transactionService.adminApprove(id, body ?? {});
      set({ loading: false });
      return true;
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
      return false;
    }
  },

  adminReject: async (id: number, body?: Partial<TransactionDto>) => {
    set({ loading: true, error: null });
    try {
      await transactionService.adminReject(id, body ?? {});
      set({ loading: false });
      return true;
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
      return false;
    }
  },
  exportCsv: async (
    type?: string | null,
    status?: string | null,
    userId?: string | null
  ) => {
    set({ loading: true, error: null });
    try {
      const blob = await transactionService.exportCsv(type, status, userId);
      set({ loading: false });
      return blob;
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
      return null;
    }
  },
  exportDoc: async (
    type?: string | null,
    status?: string | null,
    userId?: string | null
  ) => {
    set({ loading: true, error: null });
    try {
      const blob = await transactionService.exportDoc(type, status, userId);
      set({ loading: false });
      return blob;
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
      return null;
    }
  },
  exportRevenueCsv: async (opts: {
    from?: string | null;
    to?: string | null;
    courseId?: string | null;
    teacherId?: string | null;
    mode?: string | null;
  }) => {
    set({ loading: true, error: null });
    try {
      const blob = await transactionService.exportRevenueCsv(opts);
      set({ loading: false });
      return blob;
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
      return null;
    }
  },

  exportRevenuePdf: async (opts: {
    from?: string | null;
    to?: string | null;
    courseId?: string | null;
    teacherId?: string | null;
    mode?: string | null;
  }) => {
    set({ loading: true, error: null });
    try {
      const blob = await transactionService.exportRevenuePdf(opts);
      set({ loading: false });
      return blob;
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
      return null;
    }
  },
  exportRevenueDoc: async (opts: {
    from?: string | null;
    to?: string | null;
    courseId?: string | null;
    teacherId?: string | null;
    mode?: string | null;
  }) => {
    set({ loading: true, error: null });
    try {
      const blob = await transactionService.exportRevenueDoc(opts);
      set({ loading: false });
      return blob;
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
      return null;
    }
  },
}));
