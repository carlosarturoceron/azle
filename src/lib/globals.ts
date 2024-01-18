import { ic } from './ic';
import { AzleIc } from './ic/types/azle_ic';
import { Buffer } from 'buffer';
import { replacer } from './stable_structures/stable_json';
import * as process from 'process';

declare global {
    var _azleInsideCanister: boolean;
    var _azleWasmtimeCandidEnvironment: boolean;
    var _azleIc: AzleIc | undefined;
    var _azleResolveIds: { [key: string]: (buf: ArrayBuffer) => void };
    var _azleRejectIds: { [key: string]: (err: any) => void };
    var _azleIcTimers: { [key: string]: string };
    var _azleTimerCallbacks: { [key: string]: () => void };
    var _azleGuardFunctions: { [key: string]: () => any };
}

globalThis._azleInsideCanister =
    globalThis._azleIc === undefined ? false : true;

if (globalThis._azleInsideCanister) {
    globalThis.console = {
        ...globalThis.console,
        log: (...args: any[]) => {
            const jsonStringifiedArgs = args
                .map((arg) => JSON.stringify(arg, replacer, 4))
                .join(' ');

            ic.print(jsonStringifiedArgs);
        }
    };

    const originalSetTimeout = setTimeout;

    (globalThis as any).setTimeout = (
        handler: TimerHandler,
        timeout?: number
    ) => {
        if (timeout === undefined || timeout === 0) {
            return originalSetTimeout(handler, 0);
        }

        // TODO change this to throw once errors throw and show up properly
        ic.trap(`setTimeout cannot be called with milliseconds above 0`);
    };
}

globalThis.TextDecoder = require('text-encoding').TextDecoder;
globalThis.TextEncoder = require('text-encoding').TextEncoder;
globalThis._azleIcTimers = {};
globalThis._azleResolveIds = {};
globalThis._azleRejectIds = {};
globalThis._azleTimerCallbacks = {};
globalThis._azleGuardFunctions = {};

// TODO be careful we are using a random seed of 0 I think
// TODO the randomness is predictable
globalThis.crypto = {
    ...globalThis.crypto,
    getRandomValues: (() => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }) as any
};

globalThis.Buffer = Buffer;

globalThis.process = process;
