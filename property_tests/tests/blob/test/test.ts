import fc from 'fast-check';
import { BlobArb } from '../../../arbitraries/candid/constructed/blob_arb';
import { getCanisterId } from '../../../../test';
import { createUniquePrimitiveArb } from '../../../arbitraries/unique_primitive_arb';
import { JsFunctionNameArb } from '../../../arbitraries/js_function_name_arb';
import { runPropTests } from '../../..';

const BlobTestArb = fc
    .tuple(
        createUniquePrimitiveArb(JsFunctionNameArb),
        fc.array(BlobArb),
        fc.oneof(fc.constant('blob'), fc.constant('Vec(nat8)'))
    )
    .map(([functionName, blobTuples, returnCandidType]) => {
        const paramCandidTypes = blobTuples.map((blobTuple) => blobTuple[1]);
        const paramNames = blobTuples.map((_, index) => `param${index}`);

        // TODO this ordering check is not perfect
        // TODO but turning the vec into a string seems a bit difficult...we need to figure out how to check perfecly for the values that we want
        // TODO maybe a global variable that we can write into and call would work
        const paramsCorrectlyOrdered = paramNames
            .map((paramName, index) => {
                return `if (${paramName}.length !== ${blobTuples[index][0].length}) throw new Error('${paramName} is incorrectly ordered')`;
            })
            .join('\n');

        // TODO these checks should be much more precise probably, imagine checking the elements inside of the arrays
        const paramsAreUint8Arrays = paramNames
            .map((paramName) => {
                return `if (!(${paramName} instanceof Uint8Array)) throw new Error('${paramName} must be a Uint8Array');`;
            })
            .join('\n');

        const returnStatement = `Uint8Array.from([${paramNames
            .map((paramName) => `...${paramName}`)
            .join(', ')}])`;

        const expectedResult = Uint8Array.from(
            blobTuples
                .map((blobTuple) => blobTuple[0])
                .reduce((acc, blob) => [...acc, ...blob], [] as number[])
        );

        return {
            functionName,
            imports: ['blob', 'nat8', 'Vec'],
            paramCandidTypes: paramCandidTypes.join(', '),
            returnCandidType,
            paramNames,
            body: `
            ${paramsCorrectlyOrdered}

            ${paramsAreUint8Arrays}

            return ${returnStatement};
        `,
            test: {
                name: `test ${functionName}`,
                test: async () => {
                    const resolvedPathIndex = require.resolve(
                        `./dfx_generated/canister/index.js`
                    );
                    const resolvedPathDid = require.resolve(
                        `./dfx_generated/canister/canister.did.js`
                    );

                    delete require.cache[resolvedPathIndex];
                    delete require.cache[resolvedPathDid];

                    const { createActor } = require(`./dfx_generated/canister`);

                    const actor: any = createActor(getCanisterId('canister'), {
                        agentOptions: {
                            host: 'http://127.0.0.1:8000'
                        }
                    });

                    const result = await actor[functionName](
                        ...blobTuples.map((blobTuple) => blobTuple[0])
                    );

                    return {
                        Ok: primitiveArraysAreEqual(result, expectedResult)
                    };
                }
            }
        };
    });

runPropTests(BlobTestArb);

function primitiveArraysAreEqual(arr1: any, arr2: any) {
    // Check if both arrays have the same length
    if (arr1.length !== arr2.length) {
        return false;
    }

    // Loop through each element to check for equality
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
}