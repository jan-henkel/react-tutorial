export function* numRange(start: number, end: number, stepsize: number = 1) {
    let current = start;
    while (current !== end) {
        yield current;
        current += stepsize;
    }
}

export function* mapIterable<InputType, OutputType>(iterable: Iterable<InputType>, func: ((input: InputType) => OutputType)) {
    for (let i of iterable) {
        yield func(i);
    }
}