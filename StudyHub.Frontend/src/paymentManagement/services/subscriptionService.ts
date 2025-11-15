import { axiosInstance } from "@/lib/axios";

export type SubscribeRequest = {
  packageName?: string;
  months?: number;
  price: number;
};

export type SubscriptionDto = {
  id: number;
  appUserId: string;
  packageName?: string;
  price: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  createdAt: string;
};

export const subscriptionService = {
  getActive: async () => {
    const res = await axiosInstance.get(`/subscription/active`);
    return res.data;
  },

  subscribe: async (req: SubscribeRequest) => {
    const res = await axiosInstance.post(`/subscription/subscribe`, req);
    return res.data;
  },
};
