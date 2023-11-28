import { IDL } from '@dfinity/candid';

import { decode } from '../../../serde/decode';
import { encode } from '../../../serde/encode';

export class AzleNat8 {
    _azleKind: 'AzleNat8' = 'AzleNat8';
    static _azleKind: 'AzleNat8' = 'AzleNat8';

    static toBytes(data: any) {
        return encode(this, data);
    }

    static fromBytes(bytes: Uint8Array) {
        return decode(this, bytes);
    }

    static getIdl() {
        return IDL.Nat8;
    }
}

export const nat8 = AzleNat8;
export type nat8 = number & { _azleKind?: 'AzleNat8' };
