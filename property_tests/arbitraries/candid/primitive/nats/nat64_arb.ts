import fc from 'fast-check';
import { SimpleCandidValueAndMetaArb } from '../../simple_type_arbs/value_and_meta_arb';
import { bigintToSrcLiteral } from '../../to_src_literal/bigint';
import { SimpleCandidDefinitionArb } from '../../simple_type_arbs/definition_arb';
import { SimpleCandidValuesArb } from '../../simple_type_arbs/values_arb';
import { ComplexCandidValueAndMetaArb } from '../../complex_value_and_meta_arb';

export const Nat64DefinitionArb = SimpleCandidDefinitionArb('nat64');

export const Nat64ValueArb = SimpleCandidValuesArb(
    fc.bigUintN(64),
    bigintToSrcLiteral
);

export const Nat64Arb = ComplexCandidValueAndMetaArb(
    Nat64DefinitionArb,
    () => Nat64ValueArb
);
