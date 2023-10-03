import { blob } from '../candid/types/constructed/blob';

/**
 * Returns the argument data as bytes.
 * @returns the argument data
 */
export function argDataRaw(): Uint8Array {
    return new Uint8Array(globalThis._azleIc.argDataRaw());
}
