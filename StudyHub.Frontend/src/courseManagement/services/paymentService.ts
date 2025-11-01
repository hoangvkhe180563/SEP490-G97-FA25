import { axiosInstance } from "@/lib/axios";

export type PaymentInfoDto = {
  schoolId: number;
  accountName: string;
  accountNumber: string;
  accountBank: string;
  exchangeRate: number;
  qrCodeUrl: string;
};

export const paymentService = {
  getPaymentInfo: async (schoolId: string | number) => {
    const sid = String(schoolId ?? "0");
    const resp = await axiosInstance.get<PaymentInfoDto>(
      `/paymentInfo/${sid}`,
      { withCredentials: true }
    );
    return resp.data;
  },

  // Build Sepay QR url from provided fields
  buildSepayQrUrl: (opts: {
    amount: number;
    accountNumber?: string | null;
    bank?: string | null;
    description?: string | null;
  }) => {
    const acc = encodeURIComponent(opts.accountNumber ?? "");
    const bank = encodeURIComponent(opts.bank ?? "");
    const amount = opts.amount ?? 0;
    const des = encodeURIComponent(opts.description ?? "");
    return `https://qr.sepay.vn/img?acc=${acc}&bank=${bank}&amount=${amount}&des=${des}&template=compact`;
  },
  getStatus: async (txRef: string) => {
    const resp = await axiosInstance.get<{ txRef: string; status: string }>(
      `/payment/status?txRef=${encodeURIComponent(txRef)}`
    );
    return resp.data;
  },
};
