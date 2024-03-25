import * as dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { Test } from 'azle/test';
import { createAuthenticatedAgent, getCanisterId } from 'azle/dfx';
import { execSync } from 'child_process';
import { Actor, ActorSubclass } from '@dfinity/agent';
import { hashFile } from 'azle/scripts/hash_file';
import { join } from 'path';
import { rm } from 'fs/promises';
import { generateTestFileOfSize } from './generateTestFiles';

export function getTests(canisterId: string): Test[] {
    const origin = `http://${canisterId}.localhost:8000`;

    return [
        // Permanent Assets
        generateTest(
            origin,
            'photos/people/george-washington.tif',
            'permanent'
        ),
        generateTest(origin, 'photos/places/dinosaurNM.jpg', 'permanent'),
        generateTest(origin, 'photos/places/slc.jpg', 'permanent'),
        generateTest(origin, 'photos/things/book.jpg', 'permanent'),
        generateTest(origin, 'photos/things/utah-teapot.jpg', 'permanent'),
        generateTest(
            origin,
            'text/subfolder/deep-sub-folder/deep.txt',
            'permanent'
        ),
        generateTest(
            origin,
            'text/subfolder/sibling-deep-sub-folder/deep.txt',
            'permanent'
        ),
        generateTest(origin, 'text/subfolder/other-thing.txt', 'permanent'),
        generateTest(origin, 'text/thing.txt', 'permanent'),
        generateTest(origin, 'text/thing.txt', 'permanent'),
        generateTest(origin, 'text/single.txt', undefined, 'single_asset.txt'),

        // Auto Generated Assets
        //      Edge Cases
        generateTest(origin, 'test0B', 'auto'),
        generateTest(origin, 'test1B', 'auto'),
        generateTest(origin, `test${120 * 1024 * 1024 + 1}B`, 'auto'),
        generateTest(origin, 'test2000001B', 'auto'),
        //      General Cases
        generateTest(origin, 'test1KiB', 'auto'),
        generateTest(origin, 'test10KiB', 'auto'),
        generateTest(origin, 'test100KiB', 'auto'),
        generateTest(origin, 'test1MiB', 'auto'),
        generateTest(origin, 'test10MiB', 'auto'),
        generateTest(origin, 'test100MiB', 'auto'),
        generateTest(origin, 'test250MiB', 'auto'),
        generateTest(origin, 'test1GiB', 'auto'),
        // Manual Upload
        {
            name: 'test manual upload',
            test: async () => {
                execSync(
                    `npx azle upload-files backend assets/manual/test150MiB assets/test150MiB`,
                    {
                        stdio: 'inherit'
                    }
                );

                const response = await fetch(
                    `${origin}/exists?path=assets/test150MiB`
                );

                return { Ok: (await response.json()) === true };
            }
        },
        generateTest(origin, 'test150MiB', 'manual'),
        {
            name: 'deploy',
            prep: async () => {
                await rm(join('assets', 'auto'), {
                    recursive: true,
                    force: true
                });
                await generateTestFileOfSize(2, 'GiB');
                execSync(`dfx deploy --upgrade-unchanged`, {
                    stdio: 'inherit'
                });
            }
        },
        generateTest(origin, 'test2GiB', 'auto')
    ];
}

/**
 * Generate a test for file uploading. Hashes the local file and compares it to
 * the hash of the uploaded file. Assumes that all of the files both on the
 * canister and local side are in a directory called "assets". The parameter
 * localDir allows for difference between the canisterPath and localPath and
 * will be inserted between "assets" and the rest of the file path to the local
 * asset. If localPath is defined it will be used for the localPath. Otherwise
 * it will be assumed that the canisterPath is the same as the localPath.
 * @param origin
 * @param canisterPath
 * @param localDir
 * @param localPath
 * @returns
 */
function generateTest(
    origin: string,
    canisterPath: string,
    localDir?: string,
    localPath?: string
): Test {
    return {
        name: `upload: ${canisterPath}`,
        test: async () => {
            const canisterFilePath = join('assets', canisterPath);
            const localFilePath = join(
                'assets',
                localDir ?? '',
                localPath ?? canisterPath
            );

            const actor = await createGetFileHashActor(
                getCanisterId('backend')
            );

            const expectedHash = (await hashFile(localFilePath)).toString(
                'hex'
            );

            const response = await fetch(
                `${origin}/exists?path=${canisterFilePath}`
            );
            const exists = await response.json();

            if (exists === false) {
                return {
                    Err: `File ${canisterFilePath} failed to upload`
                };
            }

            const hash = (await actor.get_file_hash(canisterFilePath)) as
                | []
                | [string];

            if (hash.length === 1) {
                return { Ok: hash[0] === expectedHash };
            }
            return { Err: `File not found on canister` };
        }
    };
}

async function createGetFileHashActor(
    canisterId: string
): Promise<ActorSubclass> {
    const agent = await createAuthenticatedAgent();

    return Actor.createActor(
        ({ IDL }) => {
            return IDL.Service({
                get_file_hash: IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], [])
            });
        },
        {
            agent,
            canisterId
        }
    );
}
