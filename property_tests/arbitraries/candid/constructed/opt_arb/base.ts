import fc from 'fast-check';
import { CandidValueAndMeta } from '../../value_and_meta_arb';
import { Opt } from './index';
import { CandidDefinition } from '../../definition_arb/types';
import { OptDefinitionArb } from './definition_arb';
import { OptValuesArb } from './values_arb';
import { ComplexCandidValueAndMetaArb } from '../../complex_value_and_meta_arb';

export function OptArb(
    candidDefinitionArb: fc.Arbitrary<CandidDefinition>
): fc.Arbitrary<CandidValueAndMeta<Opt>> {
    return ComplexCandidValueAndMetaArb(
        OptDefinitionArb(candidDefinitionArb),
        OptValuesArb
    );
}
