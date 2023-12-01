import fc from 'fast-check';
import { deepEqual } from 'fast-equals';

import { StableBTreeMapArb } from '../../../arbitraries/stable_b_tree_map_arb';
import { TestSample } from '../../../arbitraries/test_sample_arb';
import { getActor } from '../../../../property_tests';
import { Test } from '../../../../test';
import { getArrayForCandidType, getArrayStringForCandidType } from './utils';
import { CandidMeta } from '../../../arbitraries/candid/candid_arb';
import { CandidType } from '../../../arbitraries/candid/candid_type_arb';
import { UniqueIdentifierArb } from '../../../arbitraries/unique_identifier_arb';

export const ValuesTestArb = fc
    .tuple(UniqueIdentifierArb('stableBTreeMap'), StableBTreeMapArb)
    .map(([functionName, stableBTreeMap]): TestSample => {
        const imports = new Set([
            ...stableBTreeMap.param0.src.imports,
            ...stableBTreeMap.param1.src.imports,
            'Vec',
            'stableJson',
            'StableBTreeMap'
        ]);

        const paramNames = ['param0', 'param1'];
        const paramCandidTypes = [
            stableBTreeMap.param0.src.candidTypeObject,
            stableBTreeMap.param1.src.candidTypeObject
        ].join(', ');

        const returnCandidType = `Vec(${stableBTreeMap.param1.src.candidTypeObject})`;
        const body = generateBody(
            stableBTreeMap.name,
            stableBTreeMap.param1.src.candidTypeObject,
            stableBTreeMap.body
        );

        const test = generateTest(
            functionName,
            stableBTreeMap.param0,
            stableBTreeMap.param1
        );

        return {
            imports,
            candidTypeDeclarations: [
                stableBTreeMap.param0.src.typeDeclaration ?? '',
                stableBTreeMap.param1.src.typeDeclaration ?? ''
            ],
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
    stableBTreeMapValueCandidType: string,
    stableBTreeMapBody: string
): string {
    return `
        ${stableBTreeMapBody}

        ${stableBTreeMapName}.insert(param0, param1);

        return ${getArrayStringForCandidType(
            stableBTreeMapValueCandidType
        )}(${stableBTreeMapName}.values());
    `;
}

function generateTest(
    functionName: string,
    param0: CandidMeta<CandidType>,
    param1: CandidMeta<CandidType>
): Test {
    return {
        name: `values ${functionName}`,
        test: async () => {
            const actor = getActor('./tests/stable_b_tree_map/test');

            const result = await actor[functionName](
                param0.agentArgumentValue,
                param1.agentArgumentValue
            );

            return {
                Ok: deepEqual(
                    getArrayForCandidType(param1.src.candidTypeObject).from(
                        result
                    ),
                    getArrayForCandidType(param1.src.candidTypeObject).from([
                        param1.agentArgumentValue
                    ])
                )
            };
        }
    };
}
