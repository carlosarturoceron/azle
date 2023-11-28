import { IDL } from '@dfinity/candid';

import { decode } from '../../serde/decode';
import { encode } from '../../serde/encode';

export class AzleBlob {
    _azleKind: 'AzleBlob' = 'AzleBlob';
    static _azleKind: 'AzleBlob' = 'AzleBlob';

    static toBytes(data: any) {
        return encode(this, data);
    }

    static fromBytes(bytes: Uint8Array) {
        return decode(this, bytes);
    }

    static getIdl() {
        return IDL.Vec(IDL.Nat8);
    }
}

export const blob = AzleBlob;
export type blob = Uint8Array;
