import { numberToSrcLiteral } from '../../to_src_literal/number';
import { PrimitiveCandidValueAndMetaArb } from '../../candid_value_and_meta_arb';
import { NumberArb } from './';

export const Int16Arb = PrimitiveCandidValueAndMetaArb(
    NumberArb(16),
    'int16',
    numberToSrcLiteral
);
