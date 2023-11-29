import fc from 'fast-check';
import { PrimitiveCandidValueAndMetaArb } from '../../candid_value_and_meta_arb';
import { bigintToSrcLiteral } from '../../to_src_literal/bigint';

export const NatArb = PrimitiveCandidValueAndMetaArb(
    fc.bigUint(),
    'nat',
    bigintToSrcLiteral
);
