import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { HubConnection } from "@microsoft/signalr";
import {
  paymentService,
  type PaymentInfoDto,
} from "../services/paymentService";
import { createPaymentConnection } from "@/lib/signalR";

type StartResult = {
  orderRef: string;
  qrUrl: string;
  checkoutUrl?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  transferNote?: string | null;
  // optional notification payload from backend when payment is received
  paymentNotification?: {
    transferId?: number;
    courseId?: number;
    balance?: number;
    reference?: string | null;
    gateway?: string | null;
    transactionDate?: string | null;
  } | null;
};

interface PaymentState {
  loading: boolean;
  result: StartResult | null;
  error: string | null;
  // SignalR related
  connection?: HubConnection | null;
  isPaymentConnected: boolean;
  startPaymentConnection: () => Promise<void>;
  stopPaymentConnection: () => Promise<void>;
  fetchPaymentInfo: (
    schoolId: string | number,
    amount: number,
    orderRef: string,
    transferNote?: string | null
  ) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>()(
  devtools(
    (set) => ({
      loading: false,
      result: null,
      error: null,
      connection: null,
      isPaymentConnected: false,

      // Start a module-level payment hub connection (lazy)
      startPaymentConnection: async () => {
        try {
          if ((window as any).__paymentConn) return;
          const conn: HubConnection = createPaymentConnection();
          (window as any).__paymentConn = conn;

          conn.on("PaymentReceived", (data: any) => {
            console.log("PaymentReceived", data);
            try {
              set((state) => {
                const ref = data?.reference ?? null;
                if (state.result && ref) {
                  const next: StartResult = {
                    ...state.result,
                    paymentNotification: {
                      transferId: data?.transferId,
                      courseId: data?.courseId,
                      balance: data?.balance,
                      reference: data?.reference ?? null,
                      gateway: data?.gateway ?? null,
                      transactionDate: data?.transactionDate ?? null,
                    },
                  };
                  console.log("PaymentReceived 2", next);
                  return { result: next } as Partial<PaymentState>;
                }
                return {} as Partial<PaymentState>;
              });
            } catch (err) {
              console.warn("payment received handler failed", err);
            }
          });

          await conn.start();
          set({ isPaymentConnected: true, connection: conn });

          // no initial invokes required: server groups users on connect (PaymentHub adds user to group)
        } catch (err) {
          console.error("payment hub start failed", err);
        }
      },

      stopPaymentConnection: async () => {
        try {
          const conn: HubConnection | undefined = (window as any).__paymentConn;
          if (conn) {
            await conn.stop();
            delete (window as any).__paymentConn;
          }
          set({ isPaymentConnected: false, connection: null });
        } catch (err) {
          console.error("payment hub stop failed", err);
        }
      },

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
    }),
    { name: "payment-store" }
  )
);
