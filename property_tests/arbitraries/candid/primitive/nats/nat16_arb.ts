import { CandidMetaArb } from '../../candid_arb';
import { numberToSrcLiteral } from '../../to_src_literal/number';
import { UNumberArb } from './index';

export const Nat16Arb = CandidMetaArb(
    UNumberArb(16),
    'nat16',
    numberToSrcLiteral
);
