
export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  origin: Point;
  size: Size;
}

export function bottomRight(rect: Rect): Point {
  return { x: rect.origin.x + rect.size.width, y: rect.origin.y + rect.size.height };
}
export function isIn(rect1: Rect, rect2: Rect): boolean {
  const topLeft1 = rect1.origin;
  const bottomRight1 = bottomRight(rect1);
  const topLeft2 = rect2.origin;
  const bottomRight2 = bottomRight(rect2);
  return topLeft1.x >= topLeft2.x && topLeft1.y >= topLeft2.y && bottomRight1.x <= bottomRight2.x && bottomRight1.y <= bottomRight2.y;
}

export function getCoords(rect: Rect, idx: number): Point {
  return { x: rect.origin.x + (idx % rect.size.width), y: rect.origin.y + Math.floor(idx / rect.size.width) };
}

export function getIdx(rect: Rect, coords: Point): number {
  return (coords.y - rect.origin.y) * rect.size.width + (coords.x - rect.origin.x);
}

export function area(size: Size): number {
  return size.width * size.height;
}