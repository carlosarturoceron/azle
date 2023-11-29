import fc from 'fast-check';
import { PrimitiveCandidValueAndMetaArb } from '../candid_value_and_meta_arb';
import { nullToSrcLiteral } from '../to_src_literal/null';
import { CandidClass } from '../candid_meta_arb';

export const NullArb = PrimitiveCandidValueAndMetaArb(
    fc.constant(null),
    CandidClass.Null,
    nullToSrcLiteral
);
