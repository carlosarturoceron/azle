import fc from 'fast-check';
import { deepEqual } from 'fast-equals';

import { StableBTreeMap } from '../../../arbitraries/stable_b_tree_map_arb';
import { getActor } from '../../../../property_tests';
import { Test } from '../../../../test';
import { UniqueIdentifierArb } from '../../../arbitraries/unique_identifier_arb';
import { QueryMethod } from '../../../arbitraries/canister_methods/query_method_arb';

export function IsEmptyTestArb(stableBTreeMap: StableBTreeMap) {
    return fc
        .tuple(UniqueIdentifierArb('stableBTreeMap'))
        .map(([functionName]): QueryMethod => {
            const imports = new Set([...stableBTreeMap.imports, 'bool']);

            const body = generateBody(stableBTreeMap.name);

            const tests = generateTests(functionName);

            return {
                imports,
                globalDeclarations: [],
                sourceCode: `${functionName}: query([], bool, () => {
                ${body}
            })`,
                tests
            };
        });
}

function generateBody(stableBTreeMapName: string): string {
    return `
        return ${stableBTreeMapName}.isEmpty();
    `;
}

function generateTests(functionName: string): Test[][] {
    return [
        [
            {
                name: `isEmpty after first deploy ${functionName}`,
                test: async () => {
                    const actor = getActor('./tests/stable_b_tree_map/test');

                    const result = await actor[functionName]();

                    return {
                        Ok: deepEqual(result, true)
                    };
                }
            }
        ],
        [
            {
                name: `isEmpty after second deploy ${functionName}`,
                test: async () => {
                    const actor = getActor('./tests/stable_b_tree_map/test');

                    const result = await actor[functionName]();

                    return {
                        Ok: deepEqual(result, false)
                    };
                }
            }
        ],
        [
            {
                name: `isEmpty after third deploy ${functionName}`,
                test: async () => {
                    const actor = getActor('./tests/stable_b_tree_map/test');

                    const result = await actor[functionName]();

                    return {
                        Ok: deepEqual(result, true)
                    };
                }
            }
        ]
    ];
}