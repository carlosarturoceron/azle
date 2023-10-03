import { blob } from '../candid/types/constructed/blob';
import { None, Opt, Some } from '../candid/types/constructed/option';

/**
 * When called from a query call, returns the data certificate
 * authenticating `certifiedData` set by this canister. Otherwise returns
 * `None`.
 * @returns the data certificate or None
 */
export function dataCertificate(): Opt<blob> {
    const rawRustValue: ArrayBuffer | undefined =
        globalThis._azleIc.dataCertificate();

    return rawRustValue === undefined
        ? None
        : Some(new Uint8Array(rawRustValue));
}
