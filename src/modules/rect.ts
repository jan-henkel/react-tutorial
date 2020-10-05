
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

export function area(size: Size) {
    return size.width * size.height;
}