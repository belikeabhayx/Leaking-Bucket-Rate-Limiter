export type Ok<T> = {
    readonly success: true;
    readonly value: T;
};
export type Err<E> = {
    readonly success: false;
    readonly error: E;
};

export type Result<T, E> = Ok<T> | Err<E>;
//         Result<T,E>
//        /           \
//    Ok<T>         Err<E>


export function ok<T>(value: T): Ok<T> {
    return { success: true, value };
}
export function err<E>(error: E): Err<E> {
    return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
    return result.success === true;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
    return result.success === false;
}

export function map<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => U,
): Result<U, E> {
    return isOk(result) ? ok(fn(result.value)) : result;
}

export function mapErr<T, E, F>(
    result: Result<T, E>,
    fn: (error: E) => F,
): Result<T, F> {
    return isErr(result) ? err(fn(result.error)) : result;
}

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
    return isOk(result) ? result.value : fallback;
}