export interface Line {
  x1: number,
  x2: number,
  y1: number,
  y2: number
}

export interface PermanentLine extends Line {
  id: string
}