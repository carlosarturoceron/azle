import { IDL } from '@dfinity/candid';

import { decode } from '../../serde/decode';
import { encode } from '../../serde/encode';

export class AzleEmpty {
    _azleKind: 'AzleEmpty' = 'AzleEmpty';
    static _azleKind: 'AzleEmpty' = 'AzleEmpty';

    static toBytes(data: any) {
        return encode(this, data);
    }

    static fromBytes(bytes: Uint8Array) {
        return decode(this, bytes);
    }

    static getIdl() {
        return IDL.Empty;
    }
}

export const empty = AzleEmpty;
export type empty = never;
