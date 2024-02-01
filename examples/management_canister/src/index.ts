// TODO once the Bitcoin integration is live, add the methods and tests

import {
    blob,
    bool,
    Canister,
    ic,
    nat,
    None,
    Opt,
    Principal,
    query,
    serialize,
    Some,
    update
} from 'azle';
import {
    CanisterInfoArgs,
    CanisterInfoResult,
    CanisterStatusArgs,
    CanisterStatusResult,
    CreateCanisterResult,
    managementCanister,
    ProvisionalCreateCanisterWithCyclesResult
} from 'azle/canisters/management';

type State = {
    createdCanisterId: Principal;
};

let state: State = {
    createdCanisterId: Principal.fromText('aaaaa-aa')
};

export default Canister({
    executeCreateCanister: update([], CreateCanisterResult, async () => {
        const createCanisterResult = await createCanister();

        state.createdCanisterId = createCanisterResult.canister_id;

        return createCanisterResult;
    }),
    executeUpdateSettings: update([Principal], bool, async (canisterId) => {
        if (process.env.AZLE_TEST_FETCH === 'true' || false) {
            await fetch(`icp://aaaaa-aa/update_settings`, {
                body: serialize({
                    candidPath: '/candid/management.did',
                    args: [
                        {
                            canister_id: canisterId,
                            settings: {
                                controllers: [],
                                compute_allocation: [1n],
                                memory_allocation: [3_000_000n],
                                freezing_threshold: [2_000_000n],
                                reserved_cycles_limit: []
                            },
                            sender_canister_version: []
                        }
                    ]
                })
            });
        } else {
            await ic.call(managementCanister.update_settings, {
                args: [
                    {
                        canister_id: canisterId,
                        settings: {
                            controllers: None,
                            compute_allocation: Some(1n),
                            memory_allocation: Some(3_000_000n),
                            freezing_threshold: Some(2_000_000n),
                            reserved_cycles_limit: None
                        },
                        sender_canister_version: None
                    }
                ]
            });
        }

        return true;
    }),
    executeInstallCode: update(
        [Principal, blob],
        bool,
        async (canisterId, wasmModule) => {
            if (process.env.AZLE_TEST_FETCH === 'true') {
                await fetch(`icp://aaaaa-aa/install_code`, {
                    body: serialize({
                        candidPath: '/candid/management.did',
                        args: [
                            {
                                mode: {
                                    install: null
                                },
                                canister_id: canisterId,
                                wasm_module: wasmModule,
                                arg: Uint8Array.from([]),
                                sender_canister_version: []
                            }
                        ],
                        cycles: 100_000_000_000n
                    })
                });
            } else {
                await ic.call(managementCanister.install_code, {
                    args: [
                        {
                            mode: {
                                install: null
                            },
                            canister_id: canisterId,
                            wasm_module: wasmModule,
                            arg: Uint8Array.from([]),
                            sender_canister_version: None
                        }
                    ],
                    cycles: 100_000_000_000n
                });
            }

            return true;
        }
    ),
    executeUninstallCode: update([Principal], bool, async (canisterId) => {
        if (process.env.AZLE_TEST_FETCH === 'true') {
            await fetch(`icp://aaaaa-aa/uninstall_code`, {
                body: serialize({
                    candidPath: '/candid/management.did',
                    args: [
                        {
                            canister_id: canisterId,
                            sender_canister_version: []
                        }
                    ]
                })
            });
        } else {
            await ic.call(managementCanister.uninstall_code, {
                args: [
                    {
                        canister_id: canisterId,
                        sender_canister_version: None
                    }
                ]
            });
        }

        return true;
    }),
    executeStartCanister: update([Principal], bool, async (canisterId) => {
        if (process.env.AZLE_TEST_FETCH === 'true') {
            await fetch(`icp://aaaaa-aa/start_canister`, {
                body: serialize({
                    candidPath: '/candid/management.did',
                    args: [{ canister_id: canisterId }]
                })
            });
        } else {
            await ic.call(managementCanister.start_canister, {
                args: [
                    {
                        canister_id: canisterId
                    }
                ]
            });
        }
        return true;
    }),
    executeStopCanister: update([Principal], bool, async (canisterId) => {
        if (process.env.AZLE_TEST_FETCH === 'true') {
            await fetch(`icp://aaaaa-aa/stop_canister`, {
                body: serialize({
                    candidPath: '/candid/management.did',
                    args: [{ canister_id: canisterId }]
                })
            });
        } else {
            await ic.call(managementCanister.stop_canister, {
                args: [
                    {
                        canister_id: canisterId
                    }
                ]
            });
        }

        return true;
    }),
    getCanisterInfo: update(
        [CanisterInfoArgs],
        CanisterInfoResult,
        async (args) => {
            if (process.env.AZLE_TEST_FETCH === 'true') {
                const { canister_id, num_requested_changes } = args;
                const infoArgs = {
                    canister_id,
                    num_requested_changes: azleOptToAgentOpt(
                        num_requested_changes
                    )
                };
                const response = await fetch(`icp://aaaaa-aa/canister_info`, {
                    body: serialize({
                        candidPath: '/candid/management.did',
                        args: [infoArgs]
                    })
                });
                return await response.json();
            } else {
                return await ic.call(managementCanister.canister_info, {
                    args: [args]
                });
            }
        }
    ),
    getCanisterStatus: update(
        [CanisterStatusArgs],
        CanisterStatusResult,
        async (args) => {
            if (process.env.AZLE_TEST_FETCH === 'true') {
                const response = await fetch(`icp://aaaaa-aa/canister_status`, {
                    body: serialize({
                        candidPath: '/candid/management.did',
                        args: [args]
                    })
                });
                return await response.json();
            } else {
                return await ic.call(managementCanister.canister_status, {
                    args: [args]
                });
            }
        }
    ),
    executeDeleteCanister: update([Principal], bool, async (canisterId) => {
        if (process.env.AZLE_TEST_FETCH === 'true') {
            await fetch(`icp://aaaaa-aa/delete_canister`, {
                body: serialize({
                    candidPath: '/candid/management.did',
                    args: [{ canister_id: canisterId }]
                })
            });
        } else {
            await ic.call(managementCanister.delete_canister, {
                args: [
                    {
                        canister_id: canisterId
                    }
                ]
            });
        }

        return true;
    }),
    executeDepositCycles: update([Principal], bool, async (canisterId) => {
        if (process.env.AZLE_TEST_FETCH === 'true') {
            await fetch(`icp://aaaaa-aa/deposit_cycles`, {
                body: serialize({
                    candidPath: '/candid/management.did',
                    args: [{ canister_id: canisterId }],
                    cycles: 10_000_000n
                })
            });
        } else {
            await ic.call(managementCanister.deposit_cycles, {
                args: [
                    {
                        canister_id: canisterId
                    }
                ],
                cycles: 10_000_000n
            });
        }

        return true;
    }),
    getRawRand: update([], blob, async () => {
        if (process.env.AZLE_TEST_FETCH === 'true') {
            const response = await fetch(`icp://aaaaa-aa/raw_rand`, {
                body: serialize({
                    candidPath: '/candid/management.did'
                })
            });
            return await response.json();
        } else {
            return await ic.call(managementCanister.raw_rand);
        }
    }),
    // TODO we should test this like we test depositCycles
    provisionalCreateCanisterWithCycles: update(
        [],
        ProvisionalCreateCanisterWithCyclesResult,
        async () => {
            if (process.env.AZLE_TEST_FETCH === 'true') {
                const response = await fetch(
                    `icp://aaaaa-aa/provisional_create_canister_with_cycles`,
                    {
                        body: serialize({
                            candidPath: '/candid/management.did',
                            args: [
                                {
                                    amount: [],
                                    settings: [],
                                    sender_canister_version: [],
                                    specified_id: []
                                }
                            ]
                        })
                    }
                );
                return await response.json();
            } else {
                return await ic.call(
                    managementCanister.provisional_create_canister_with_cycles,
                    {
                        args: [
                            {
                                amount: None,
                                settings: None,
                                sender_canister_version: None,
                                specified_id: None
                            }
                        ]
                    }
                );
            }
        }
    ),
    // TODO we should test this like we test depositCycles
    provisionalTopUpCanister: update(
        [Principal, nat],
        bool,
        async (canisterId, amount) => {
            if (process.env.AZLE_TEST_FETCH === 'true') {
                await fetch(`icp://aaaaa-aa/provisional_top_up_canister`, {
                    body: serialize({
                        candidPath: '/candid/management.did',
                        args: [{ canister_id: canisterId, amount }],
                        cycles: 10_000_000n
                    })
                });
            } else {
                await ic.call(managementCanister.provisional_top_up_canister, {
                    args: [
                        {
                            canister_id: canisterId,
                            amount
                        }
                    ]
                });
            }

            return true;
        }
    ),
    getCreatedCanisterId: query([], Principal, () => {
        return state.createdCanisterId;
    })
});

async function createCanister() {
    if (process.env.AZLE_TEST_FETCH === 'true') {
        const response = await fetch(`icp://aaaaa-aa/create_canister`, {
            body: serialize({
                candidPath: '/candid/management.did',
                args: [{ settings: [], sender_canister_version: [] }],
                cycles: 50_000_000_000_000n
            })
        });
        return await response.json();
    } else {
        return await ic.call(managementCanister.create_canister, {
            args: [{ settings: None, sender_canister_version: None }],
            cycles: 50_000_000_000_000n
        });
    }
}

function azleOptToAgentOpt<T>(opt: Opt<T>): [T] | [] {
    if ('None' in opt) {
        return [];
    } else {
        return [opt.Some];
    }
}
