import { TypeMapping } from '../../../index';
import { _AzleRecursiveFunction } from '../../../recursive';
import { Principal } from '../principal';
import { CanisterMethodInfo } from '../../../../canister_methods';
import { createCanisterFunction } from './canister_function';

type CanisterOptions = {
    [key: string]: CanisterMethodInfo<any, any>;
};

type CanisterReturn<T extends CanisterOptions> = {
    [EndpointName in keyof T]: T[EndpointName] extends CanisterMethodInfo<
        infer Params,
        infer Return
    >
        ? (
              ...args: { [K in keyof Params]: TypeMapping<Params[K]> }
          ) => Promise<TypeMapping<Return>>
        : never;
};

type CallableObject<T extends CanisterOptions> = {
    (principal: Principal): CallableObject<T>;
} & CanisterReturn<T>;

type _AzleCanisterReturnType = {
    (parentOrPrincipal: _AzleRecursiveFunction | Principal): void;
    _azleIsCanister?: boolean;
};

export function Canister<T extends CanisterOptions>(
    canisterOptions: T
): CallableObject<T> & { _azleCandidType?: '_azleCandidType' } {
    let result: _AzleCanisterReturnType = (parentOrPrincipal: any) => {
        const canisterFunction = createCanisterFunction(canisterOptions);

        if (parentOrPrincipal !== undefined && parentOrPrincipal._isPrincipal) {
            return canisterFunction(parentOrPrincipal);
        }

        return canisterFunction;
    };
    result._azleIsCanister = true;
    return result as any;
}