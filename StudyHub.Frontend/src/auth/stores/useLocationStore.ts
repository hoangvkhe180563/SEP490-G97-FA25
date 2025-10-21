import { create } from "zustand";
import type { LocationState } from "../interfaces/stores";
import { axiosInstance } from "@/lib/axios";
import type { City } from "../interfaces/city";
import type { Province } from "../interfaces/province";
import type { Commune } from "../interfaces/commune";
import type { School } from "../interfaces/school";
const useLocationStore = create<LocationState>((set) => ({
  isLoading: false,
  cities: [],
  fetchCities: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get("/Location/cities");
      const { data } = response;
      // backend returns array of cities
      set({ cities: data });
    } catch (error) {
      console.log(error);
    } finally {
      set({ isLoading: false });
    }
  },
  provinces: [],
  fetchProvinces: async (id: number) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get(
        `/Location/provinces?cityId=${id}`
      );
      const { data } = response;
      set({ provinces: data });
    } catch (error) {
      console.log(error);
    } finally {
      set({ isLoading: false });
    }
  },
  communes: [],
  fetchCommunes: async (id: number) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get(
        `/Location/communes?provinceId=${id}`
      );
      const { data } = response;
      set({ communes: data });
    } catch (error) {
      console.log(error);
    } finally {
      set({ isLoading: false });
    }
  },
  schools: [],
  fetchSchools: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get("/Location/schools");
      const { data } = response;
      set({ schools: data });
    } catch (error) {
      console.log(error);
    } finally {
      set({ isLoading: false });
    }
  },
  selectedCity: null,
  selectedProvince: null,
  selectedCommune: null,
  selectedSchool: null,
  setSelectedCity: (city: City) => set({ selectedCity: city }),
  setSelectedProvince: (province: Province) =>
    set({ selectedProvince: province }),
  setSelectedCommune: (commune: Commune) => set({ selectedCommune: commune }),
  setSelectedSchool: (school: School) => set({ selectedSchool: school }),
}));

export { useLocationStore };
