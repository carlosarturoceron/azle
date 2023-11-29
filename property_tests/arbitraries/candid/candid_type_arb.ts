import fc from 'fast-check';
import { IntArb, IntDefinitionArb } from './primitive/ints/int_arb';
import { Int8Arb, Int8DefinitionArb } from './primitive/ints/int8_arb';
import { Int16Arb, Int16DefinitionArb } from './primitive/ints/int16_arb';
import { Int32Arb, Int32DefinitionArb } from './primitive/ints/int32_arb';
import { Int64Arb, Int64DefinitionArb } from './primitive/ints/int64_arb';
import { NatArb, NatDefinitionArb } from './primitive/nats/nat_arb';
import { Nat8Arb, Nat8DefinitionArb } from './primitive/nats/nat8_arb';
import { Nat16Arb, Nat16DefinitionArb } from './primitive/nats/nat16_arb';
import { Nat32Arb, Nat32DefinitionArb } from './primitive/nats/nat32_arb';
import { Nat64Arb, Nat64DefinitionArb } from './primitive/nats/nat64_arb';
import { NullArb, NullDefinitionArb } from './primitive/null';
import { BoolArb, BoolDefinitionArb } from './primitive/bool';
import { Principal } from '@dfinity/principal';
import { PrincipalArb } from './reference/principal_arb';
import {
    Float32Arb,
    Float32DefinitionArb
} from './primitive/floats/float32_arb';
import {
    Float64Arb,
    Float64DefinitionArb
} from './primitive/floats/float64_arb';
import { TextArb, TextDefinitionArb } from './primitive/text';
import { BlobArb } from './constructed/blob_arb';
import { CandidValueAndMeta } from './candid_value_and_meta';
import { Func } from './reference/func_arb';
import { Opt } from './constructed/opt_arb';
import { Variant } from './constructed/variant_arb';
import { BaseVariantArb } from './constructed/variant_arb/base';
import { Record } from './constructed/record_arb';
import { Tuple } from './constructed/tuple_arb';
import { RecordArb, RecordDefinitionArb } from './constructed/record_arb/base';
import { TupleArb } from './constructed/tuple_arb/base';
import { OptArb } from './constructed/opt_arb/base';
import { Vec } from './constructed/vec_arb';
import { VecArb, VecDefinitionArb } from './constructed/vec_arb/base';
import { FuncArb } from './reference/func_arb/base';
import {
    CandidDefinition,
    RecordCandidMeta,
    VecCandidMeta
} from './candid_meta_arb';

export type CorrespondingJSType =
    | number
    | bigint
    | null
    | boolean
    | Principal
    | Uint8Array
    | string
    | Func
    | Opt
    | Variant
    | Record
    | Tuple
    | undefined
    | Int16Array
    | Int32Array
    | Int8Array
    | BigInt64Array
    | Uint16Array
    | Uint32Array
    | Uint8Array
    | BigUint64Array
    | Vec;

export const CandidDefinitionArb: fc.Arbitrary<CandidDefinition> = fc.letrec(
    (tie) => ({
        CandidDefinition: fc.oneof(
            Float32DefinitionArb,
            Float64DefinitionArb,
            IntDefinitionArb,
            Int8DefinitionArb,
            Int16DefinitionArb,
            Int32DefinitionArb,
            Int64DefinitionArb,
            NatDefinitionArb,
            Nat8DefinitionArb,
            Nat16DefinitionArb,
            Nat32DefinitionArb,
            Nat64DefinitionArb,
            BoolDefinitionArb,
            // NullDefinitionArb, // Must be excluded until https://github.com/demergent-labs/azle/issues/1453 gets resolved
            TextDefinitionArb,
            tie('Record').map((sample) => sample as RecordCandidMeta),
            tie('Vec').map((sample) => sample as VecCandidMeta)
        ),
        Record: RecordDefinitionArb(
            tie('CandidDefinition') as fc.Arbitrary<CandidDefinition>
        ),
        Vec: VecDefinitionArb(
            tie('CandidDefinition') as fc.Arbitrary<CandidDefinition>
        )
    })
).CandidDefinition;

/**
 * An arbitrary representing all possible Candid types.
 *
 * **Note:** This currently only supports ints, nats, and null arbitraries
 */
export const CandidValueAndMetaArb: fc.Arbitrary<
    CandidValueAndMeta<CorrespondingJSType>
> = fc.letrec((tie) => ({
    CandidType: fc.oneof(
        BlobArb,
        tie('Opt').map((sample) => sample as CandidValueAndMeta<Opt>),
        tie('Record').map((sample) => sample as CandidValueAndMeta<Record>),
        tie('Tuple').map((sample) => sample as CandidValueAndMeta<Tuple>),
        tie('Variant').map((sample) => sample as CandidValueAndMeta<Variant>),
        tie('Vec').map((sample) => sample as CandidValueAndMeta<Vec>),
        Float32Arb,
        Float64Arb,
        IntArb,
        Int8Arb,
        Int16Arb,
        Int32Arb,
        Int64Arb,
        NatArb,
        Nat8Arb,
        Nat16Arb,
        Nat32Arb,
        Nat64Arb,
        BoolArb,
        NullArb,
        TextArb,
        tie('Func').map((sample) => sample as CandidValueAndMeta<Func>),
        PrincipalArb
    ),
    Func: FuncArb(
        tie('CandidType') as fc.Arbitrary<
            CandidValueAndMeta<CorrespondingJSType>
        >
    ),
    Vec: VecArb(CandidDefinitionArb),
    Opt: OptArb(
        tie('CandidType') as fc.Arbitrary<
            CandidValueAndMeta<CorrespondingJSType>
        >
    ),
    Variant: BaseVariantArb(
        tie('CandidType') as fc.Arbitrary<
            CandidValueAndMeta<CorrespondingJSType>
        >
    ),
    Tuple: TupleArb(
        tie('CandidType') as fc.Arbitrary<
            CandidValueAndMeta<CorrespondingJSType>
        >
    ),
    Record: RecordArb(CandidDefinitionArb)
})).CandidType;

// TODO: This needs to support service.
