import fc from 'fast-check';

import { NatArb } from '../../../arbitraries/candid/primitive/nats/nat_arb';
import { JsFunctionNameArb } from '../../../arbitraries/js_function_name_arb';
import { TestSample } from '../../../arbitraries/test_sample_arb';
import { createUniquePrimitiveArb } from '../../../arbitraries/unique_primitive_arb';
import { getActor, runPropTests } from '../../../../property_tests';
import { Candid } from '../../../arbitraries/candid';
import { Test } from '../../../../test';

const NatTestArb = fc
    .tuple(
        createUniquePrimitiveArb(JsFunctionNameArb),
        fc.array(NatArb),
        NatArb
    )
    .map(([functionName, paramNats, defaultReturnNat]): TestSample => {
        const imports = defaultReturnNat.src.imports;

        const paramNames = paramNats.map((_, index) => `param${index}`);
        const paramCandidTypes = paramNats
            .map((nat) => nat.src.candidType)
            .join(', ');

        const returnCandidType = defaultReturnNat.src.candidType;

        const body = generateBody(paramNames, paramNats, defaultReturnNat);

        const test = generateTest(functionName, paramNats, defaultReturnNat);

        return {
            imports,
            functionName,
            paramCandidTypes,
            returnCandidType,
            paramNames,
            body,
            test
        };
    });

runPropTests(NatTestArb);

function generateBody(
    paramNames: string[],
    paramNats: Candid<bigint>[],
    returnNat: Candid<bigint>
): string {
    const paramsAreBigInts = paramNames
        .map((paramName) => {
            return `if (typeof ${paramName} !== 'bigint') throw new Error('${paramName} must be a bigint');`;
        })
        .join('\n');

    const sum = paramNames.reduce((acc, paramName) => {
        return `${acc} + ${paramName}`;
    }, `${returnNat.value}`);

    const paramValues = paramNats.map((sample) => sample.value);

    const paramsCorrectlyOrdered = paramNames
        .map((paramName, index) => {
            return `if (${paramName} !== ${paramValues[index]}n) throw new Error('${paramName} is incorrectly ordered')`;
        })
        .join('\n');
    return `
        ${paramsCorrectlyOrdered}

        ${paramsAreBigInts}

        return ${sum};
    `;
}

function generateTest(
    functionName: string,
    paramNats: Candid<bigint>[],
    returnNat: Candid<bigint>
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
                Ok: result === expectedResult
            };
        }
    };
}
