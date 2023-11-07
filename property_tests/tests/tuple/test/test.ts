import fc from 'fast-check';
import { deepEqual } from 'fast-equals';

import {
    TupleArb,
    Tuple
} from '../../../arbitraries/candid/constructed/tuple_arb';
import { TestSample } from '../../../arbitraries/test_sample_arb';
import { UniqueIdentifierArb } from '../../../arbitraries/unique_identifier_arb';
import { getActor, runPropTests } from '../../..';
import { Test } from '../../../../test';
import { CandidMeta } from '../../../arbitraries/candid/candid_arb';

const TupleTestArb = fc
    .tuple(
        UniqueIdentifierArb('canisterMethod'),
        fc.uniqueArray(TupleArb, {
            selector: (entry) => entry.src.candidType
        }),
        TupleArb
    )
    .map(([functionName, paramTuples, defaultReturnTuple]): TestSample => {
        const imports = new Set([
            ...paramTuples.flatMap((tuple) => [...tuple.src.imports]),
            ...defaultReturnTuple.src.imports
        ]);

        const candidTypeDeclarations = [
            ...paramTuples.map((tuple) => tuple.src.typeDeclaration ?? ''),
            defaultReturnTuple.src.typeDeclaration ?? ''
        ];

        const paramNames = paramTuples.map((_, index) => `param${index}`);

        const paramCandidTypes = paramTuples
            .map((tuple) => tuple.src.candidType)
            .join(', ');

        const returnTuple =
            paramTuples.length === 0 ? defaultReturnTuple : paramTuples[0];
        const returnCandidType = returnTuple.src.candidType;

        const body = generateBody(paramTuples, returnTuple);

        const test = generateTest(functionName, paramTuples, returnTuple);

        return {
            functionName,
            imports,
            candidTypeDeclarations,
            paramNames,
            paramCandidTypes,
            returnCandidType,
            body,
            test
        };
    });

runPropTests(TupleTestArb);

function generateBody(
    paramTuples: CandidMeta<Tuple>[],
    returnTuple: CandidMeta<Tuple>
): string {
    const paramsAreTuples = paramTuples
        .map((tuple, index) => {
            const paramName = `param${index}`;
            const fieldsCount = tuple.value.length;

            const paramIsArray = `Array.isArray(${paramName})`;
            const paramHasCorrectNumberOfFields = `${paramName}.length === ${fieldsCount}`;
            const throwError = `throw new Error('${paramName} must be a Tuple');`;

            return `if (!(${paramIsArray} && ${paramHasCorrectNumberOfFields})) ${throwError}`;
        })
        .join('\n');

    const paramsCorrectlyOrdered = paramTuples
        .map((tuple, paramIndex): string => {
            const paramName = `param${paramIndex}`;

            const paramIsCorrectValue = `${paramName}.toString() === ${tuple.src.valueLiteral}.toString()`;

            const throwError = `throw new Error('${paramName} is incorrectly ordered.')`;

            return `if (!(${paramIsCorrectValue})) ${throwError}`;
        })
        .join('\n');

    const returnStatement =
        paramTuples.length === 0 ? returnTuple.src.valueLiteral : `param0`;

    return `
        ${paramsAreTuples}

        ${paramsCorrectlyOrdered}

        return ${returnStatement};
    `;
}

function generateTest(
    functionName: string,
    paramTuples: CandidMeta<Tuple>[],
    returnTuple: CandidMeta<Tuple>
): Test {
    const expectedResult = returnTuple.value;

    return {
        name: `tuple ${functionName}`,
        test: async () => {
            const actor = getActor('./tests/tuple/test');

            const result = await actor[functionName](
                ...paramTuples.map((tuple) => tuple.value)
            );

            return { Ok: deepEqual(result, expectedResult) };
        }
    };
}
