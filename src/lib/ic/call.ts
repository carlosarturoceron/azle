import { callRaw } from './call_raw';
import { ArgsType, ReturnTypeOf } from './types';

/**
 * Performs an asynchronous call to another canister.
 *
 * Note that the asynchronous call must be awaited in order for the
 * inter-canister call to be made using the System API.
 *
 * @param method
 * @param config
 * @returns
 */
export function call<T extends (...args: any[]) => any>(
    method: T,
    config?: {
        args?: ArgsType<T>;
        cycles?: bigint;
    }
): ReturnTypeOf<T> {
    // TODO probably get rid of .crossCanisterCallback
    return method.crossCanisterCallback(
        '_AZLE_CROSS_CANISTER_CALL',
        false,
        callRaw,
        config?.cycles ?? 0n,
        ...(config?.args ?? [])
    );
}
