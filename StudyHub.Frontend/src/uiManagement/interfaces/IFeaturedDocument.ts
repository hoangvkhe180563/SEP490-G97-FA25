export interface IFeaturedDocument {
  type: "textbook" | "reference",
  image: string,
  id: number,
  name: string,
  subject: string,
  grade: number
}