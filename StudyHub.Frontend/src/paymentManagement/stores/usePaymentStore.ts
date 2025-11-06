import { create } from "zustand";
import {
  paymentService,
  type PaymentInfoDto,
} from "../services/paymentService";

type StartResult = {
  orderRef: string;
  qrUrl: string;
  checkoutUrl?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  transferNote?: string | null;
};

interface PaymentState {
  loading: boolean;
  result: StartResult | null;
  error: string | null;
  fetchPaymentInfo: (
    schoolId: string | number,
    amount: number,
    orderRef: string,
    transferNote?: string | null
  ) => Promise<void>;
  checkStatus: (txRef: string) => Promise<string | null>;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  loading: false,
  result: null,
  error: null,

  fetchPaymentInfo: async (schoolId, amount, orderRef, transferNote) => {
    set({ loading: true, error: null });
    try {
      const info: PaymentInfoDto = await paymentService.getPaymentInfo(
        schoolId
      );
      const qrUrl = paymentService.buildSepayQrUrl({
        amount: amount || 0,
        accountNumber: info.accountNumber,
        bank: info.accountBank,
        description: transferNote ?? orderRef,
      });

      const data: StartResult = {
        orderRef,
        qrUrl,
        checkoutUrl: info.qrCodeUrl || null,
        accountNumber: info.accountNumber || null,
        accountName: info.accountName || null,
        transferNote: transferNote ?? orderRef,
      };
      set({ result: data, loading: false });
    } catch (e: any) {
      set({ error: e?.message ?? String(e), loading: false });
    }
  },
  checkStatus: async (txRef: string) => {
    try {
      const res = await paymentService.getStatus(txRef);
      return res?.status ?? null;
    } catch (e) {
      console.error("checkStatus failed", e);
      return null;
    }
  },
}));
