import { IDL } from '@dfinity/candid';

import { CandidType } from '../../candid_type';
import { decode } from '../../serde/decode';
import { encode } from '../../serde/encode';
import { Parent, toIdl } from '../../to_idl';
import { TypeMapping } from '../../type_mapping';

export class AzleVec<T> {
    constructor(t: any) {
        this.innerType = t;
    }

    innerType: CandidType;

    _azleKind = 'AzleVec' as const;
    static _azleKind = 'AzleVec' as const;

    toBytes(data: any) {
        return encode(this, data);
    }

    fromBytes(bytes: Uint8Array) {
        return decode(this, bytes);
    }

    getIdl(parents: Parent[]) {
        return IDL.Vec(toIdl(this.innerType, parents));
    }
}

export type Vec<T> = TypeMapping<AzleVec<T>>;
export function Vec<T>(t: T): AzleVec<T> {
    return new AzleVec(t);
}
