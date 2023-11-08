import fc from 'fast-check';
import { deepEqual } from 'fast-equals';

import { CanisterArb } from '../../../arbitraries/canister_arb';
import { NatArb } from '../../../arbitraries/candid/primitive/nats/nat_arb';
import { JsFunctionNameArb } from '../../../arbitraries/js_function_name_arb';
import { QueryMethodBlueprint } from '../../../arbitraries/test_sample_arb';
import { createUniquePrimitiveArb } from '../../../arbitraries/unique_primitive_arb';
import { getActor, runPropTests } from '../../../../property_tests';
import { CandidMeta } from '../../../arbitraries/candid/candid_arb';
import { Test } from '../../../../test';
import { areParamsCorrectlyOrdered } from '../../../are_params_correctly_ordered';

const NatTestArb = fc
    .tuple(
        createUniquePrimitiveArb(JsFunctionNameArb),
        fc.array(NatArb),
        NatArb
    )
    .map(
        ([functionName, paramNats, defaultReturnNat]): QueryMethodBlueprint => {
            const imports = defaultReturnNat.src.imports;

            const paramNames = paramNats.map((_, index) => `param${index}`);
            const paramCandidTypes = paramNats
                .map((nat) => nat.src.candidType)
                .join(', ');

            const returnCandidType = defaultReturnNat.src.candidType;

            const body = generateBody(paramNames, paramNats, defaultReturnNat);

            const tests = [
                generateTest(functionName, paramNats, defaultReturnNat)
            ];

            return {
                imports,
                functionName,
                paramCandidTypes,
                returnCandidType,
                paramNames,
                body,
                tests
            };
        }
    );

runPropTests(CanisterArb(NatTestArb));

function generateBody(
    paramNames: string[],
    paramNats: CandidMeta<bigint>[],
    returnNat: CandidMeta<bigint>
): string {
    const paramsAreBigInts = paramNames
        .map((paramName) => {
            return `if (typeof ${paramName} !== 'bigint') throw new Error('${paramName} must be a bigint');`;
        })
        .join('\n');

    const sum = paramNames.reduce((acc, paramName) => {
        return `${acc} + ${paramName}`;
    }, returnNat.src.valueLiteral);

    const paramsCorrectlyOrdered = areParamsCorrectlyOrdered(
        paramNames,
        paramNats
    );

    return `
        ${paramsCorrectlyOrdered}

        ${paramsAreBigInts}

        return ${sum};
    `;
}

function generateTest(
    functionName: string,
    paramNats: CandidMeta<bigint>[],
    returnNat: CandidMeta<bigint>
): Test {
    const expectedResult = paramNats.reduce(
        (acc, nat) => acc + nat.value,
        returnNat.value
    );
    const paramValues = paramNats.map((sample) => sample.value);

    return {
        name: `nat ${functionName}`,
        test: async () => {
            const actor = getActor('./tests/nat/test');

            const result = await actor[functionName](...paramValues);

            return {
                Ok: deepEqual(result, expectedResult)
            };
        }
    };
}
