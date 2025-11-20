import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { subscriptionService } from "../services/subscriptionService";
import type {
  SubscribeRequest,
  SubscriptionDto,
} from "../services/subscriptionService";
import { axiosMessageErrorHandler } from "@/lib/axios";

type SubscriptionState = {
  active?: SubscriptionDto | null;
  isLoading: boolean;
  error?: string | null;
  fetchActive: () => Promise<SubscriptionDto | null>;
  subscribe: (req: SubscribeRequest) => Promise<any>;
};

export const useSubscriptionStore = create<SubscriptionState>()(
  devtools((set) => ({
    active: null,
    isLoading: false,
    error: null,
    fetchActive: async () => {
      set({ isLoading: true, error: null });
      try {
        const body = await subscriptionService.getActive();
        set({ active: body, isLoading: false });
        return body;
      } catch (err: any) {
        set({ error: axiosMessageErrorHandler(err), isLoading: false });
        return null;
      }
    },
    subscribe: async (req: SubscribeRequest) => {
      set({ isLoading: true, error: null });
      try {
        const body = await subscriptionService.subscribe(req);
        set({ active: body, isLoading: false });
        return body;
      } catch (err: any) {
        set({ error: axiosMessageErrorHandler(err), isLoading: false });
        return null;
      }
    },
  }))
);
