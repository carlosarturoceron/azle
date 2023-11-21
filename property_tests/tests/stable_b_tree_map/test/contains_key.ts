import fc from 'fast-check';
import { deepEqual } from 'fast-equals';

import { StableBTreeMapArb } from '../../../arbitraries/stable_b_tree_map_arb';
import { TestSample } from '../../../arbitraries/test_sample_arb';
import { getActor } from '../../../../property_tests';
import { Test } from '../../../../test';
import { UniqueIdentifierArb } from '../../../arbitraries/unique_identifier_arb';

export const ContainsKeyTestArb = fc
    .tuple(UniqueIdentifierArb('stableBTreeMap'), StableBTreeMapArb)
    .map(([functionName, stableBTreeMap]): TestSample => {
        const imports = new Set([
            ...stableBTreeMap.param0.src.imports,
            ...stableBTreeMap.param1.src.imports,
            'bool',
            'stableJson',
            'StableBTreeMap'
        ]);

        const paramNames = ['param0', 'param1'];
        const paramCandidTypes = [
            stableBTreeMap.param0.src.candidType,
            stableBTreeMap.param1.src.candidType
        ].join(', ');

        const returnCandidType = `bool`;
        const body = generateBody(stableBTreeMap.name, stableBTreeMap.body);

        const test = generateTest(
            functionName,
            stableBTreeMap.param0.value,
            stableBTreeMap.param1.value
        );

        return {
            imports,
            functionName,
            paramNames,
            paramCandidTypes,
            returnCandidType,
            body,
            test
        };
    });

function generateBody(
    stableBTreeMapName: string,
    stableBTreeMapBody: string
): string {
    return `
        ${stableBTreeMapBody}

        ${stableBTreeMapName}.insert(param0, param1);

        return ${stableBTreeMapName}.containsKey(param0);
    `;
}

function generateTest(
    functionName: string,
    param0Value: any,
    param1Value: any
): Test {
    return {
        name: `containsKey ${functionName}`,
        test: async () => {
            const actor = getActor('./tests/stable_b_tree_map/test');

            const result = await actor[functionName](param0Value, param1Value);

            return {
                Ok: deepEqual(result, true)
            };
        }
    };
}
