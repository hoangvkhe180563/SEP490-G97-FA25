import { create } from "zustand";
import dobUtils from "@/user/interfaces/dob";

type DobState = {
  isValidDisplayDob: (s?: string | null) => boolean;
  displayToIso: (s?: string | null) => string | null;
  isoToDisplay: (s?: string | null) => string | null;
};

export const useDobStore = create<DobState>(() => ({
  isValidDisplayDob: dobUtils.isValidDisplayDob,
  displayToIso: dobUtils.displayToIso,
  isoToDisplay: dobUtils.isoToDisplay,
}));

export default useDobStore;
