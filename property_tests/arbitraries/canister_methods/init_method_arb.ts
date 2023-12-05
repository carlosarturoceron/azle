import fc from 'fast-check';

import { CandidValueAndMeta } from '../candid/candid_value_and_meta_arb';
import { CorrespondingJSType } from '../candid/corresponding_js_type';
import { UniqueIdentifierArb } from '../unique_identifier_arb';
import { Named } from '../..';
import {
    BodyGenerator,
    TestsGenerator,
    CallbackLocation,
    isDefined,
    generateCallback
} from '.';
import { Test } from '../../../test';

export type InitMethod<
    ParamAgentArgumentValue extends CorrespondingJSType,
    ParamAgentResponseValue
> = {
    imports: Set<string>;
    globalDeclarations: string[];
    params: Named<
        CandidValueAndMeta<ParamAgentArgumentValue, ParamAgentResponseValue>
    >[];
    sourceCode: string;
    tests: Test[];
};

export function InitMethodArb<
    ParamAgentArgumentValue extends CorrespondingJSType,
    ParamAgentResponseValue,
    ReturnTypeAgentArgumentValue extends CorrespondingJSType,
    ReturnTypeAgentResponseValue
>(
    paramTypeArrayArb: fc.Arbitrary<
        CandidValueAndMeta<ParamAgentArgumentValue, ParamAgentResponseValue>[]
    >,
    constraints: {
        generateBody: BodyGenerator<
            ParamAgentArgumentValue,
            ParamAgentResponseValue,
            ReturnTypeAgentArgumentValue,
            ReturnTypeAgentResponseValue
        >;
        generateTests: TestsGenerator<
            ParamAgentArgumentValue,
            ParamAgentResponseValue,
            ReturnTypeAgentArgumentValue,
            ReturnTypeAgentResponseValue
        >;
        callbackLocation?: CallbackLocation;
    }
) {
    return fc
        .tuple(
            UniqueIdentifierArb('canisterMethod'),
            paramTypeArrayArb,
            fc.constantFrom(
                'INLINE',
                'STANDALONE'
            ) as fc.Arbitrary<CallbackLocation>,
            UniqueIdentifierArb('typeDeclaration')
            // TODO: This unique id would be better named globalScope or something
            // But needs to match the same scope as typeDeclarations so I'm using
            // that for now.
        )
        .map(
            ([
                functionName,
                paramTypes,
                defaultCallbackLocation,
                callbackName
            ]) => {
                // TODO: Update this to return an InitMethod<Something, Something>
                const callbackLocation =
                    constraints.callbackLocation ?? defaultCallbackLocation;

                const imports = new Set([
                    'init',
                    ...paramTypes.flatMap((param) => [...param.src.imports])
                ]);

                const namedParams = paramTypes.map(
                    <T>(param: T, index: number): Named<T> => ({
                        name: `param${index}`,
                        el: param
                    })
                );

                const callback = generateCallback(
                    namedParams,
                    undefined,
                    constraints.generateBody,
                    callbackLocation,
                    callbackName
                );

                const candidTypeDeclarations = paramTypes
                    .flatMap((param) => param.src.typeAliasDeclarations)
                    .filter(isDefined);

                const globalDeclarations =
                    callbackLocation === 'STANDALONE'
                        ? [...candidTypeDeclarations, callback]
                        : candidTypeDeclarations;

                const sourceCode = generateSourceCode(
                    functionName,
                    paramTypes,
                    callbackLocation === 'STANDALONE' ? callbackName : callback
                );

                const tests = constraints.generateTests(
                    functionName,
                    namedParams,
                    undefined
                );

                return {
                    imports,
                    globalDeclarations,
                    params: namedParams,
                    sourceCode,
                    tests
                };
            }
        );
}

function generateSourceCode<
    ParamType extends CorrespondingJSType,
    ParamAgentType
>(
    functionName: string,
    paramTypes: CandidValueAndMeta<ParamType, ParamAgentType>[],
    callback: string
): string {
    const paramCandidTypes = paramTypes
        .map((param) => param.src.typeAnnotation)
        .join(', ');

    return `${functionName}: init([${paramCandidTypes}], ${callback})`;
}