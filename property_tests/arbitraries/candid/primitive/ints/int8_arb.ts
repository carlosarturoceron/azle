import { numberToSrcLiteral } from '../../to_src_literal/number';
import { CandidValueAndMetaArb } from '../../candid_value_and_meta_arb';
import { NumberArb } from './';

export const Int8Arb = CandidValueAndMetaArb(
    NumberArb(8),
    'int8',
    numberToSrcLiteral
);
