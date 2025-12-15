export interface City {
  id: number;
  name: string;
}

export interface Commune {
  id: number;
  name: string;
  cityId: number;
}