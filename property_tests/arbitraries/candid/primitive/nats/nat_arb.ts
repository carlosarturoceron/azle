import fc from 'fast-check';

import { CandidMetaArb } from '../../candid_arb';
import { bigintToSrcLiteral } from '../../to_src_literal/bigint';

export const NatArb = CandidMetaArb(fc.bigUint(), 'nat', bigintToSrcLiteral);
