import { IDL } from './index';
import { CandidClass, Parent, toCandidClass } from './utils';

export class AzleNat64 {
    _kind: 'AzleNat64' = 'AzleNat64';
    static getIDL() {
        return IDL.Nat64;
    }
}

export class AzleNat32 {
    _kind: 'AzleNat32' = 'AzleNat32';
    static getIDL() {
        return IDL.Nat32;
    }
}

export class AzleInt8 {
    _kind: 'AzleInt8' = 'AzleInt8';
    static getIDL() {
        return IDL.Int8;
    }
}

export class AzleFloat64 {
    _kind: 'AzleFloat64' = 'AzleFloat64';
    static getIDL() {
        return IDL.Float64;
    }
}

export class AzleBlob {
    _kind: 'AzleBlob' = 'AzleBlob';
    static getIDL() {
        return IDL.Vec(IDL.Nat8);
    }
}

export const bool = IDL.Bool;
export type bool = boolean;
export const blob: AzleBlob = AzleBlob as any;
export type blob = Uint8Array;
export const empty = IDL.Empty;
export type empty = never;
export const int = IDL.Int;
export type int = bigint;
export const int8: AzleInt8 = AzleInt8 as any;
export type int8 = number;
export const int16 = IDL.Int16;
export type int16 = number;
export const int32 = IDL.Int32;
export type int32 = number;
export const int64 = IDL.Int64;
export type int64 = bigint;
export const nat = IDL.Nat;
export type nat = bigint;
export const nat8 = IDL.Nat8;
export type nat8 = number;
export const nat16 = IDL.Nat16;
export type nat16 = number;
export const nat32: AzleNat32 = AzleNat32 as any;
export type nat32 = number;
export const nat64: AzleNat64 = AzleNat64 as any;
export type nat64 = bigint;
export const Null = IDL.Null;
export type Null = null;
export const reserved = IDL.Reserved;
export type reserved = any;
export const text = IDL.Text;
export type text = string;
export const float32 = IDL.Float32;
export type float32 = number;
export const float64: AzleFloat64 = AzleFloat64 as any;
export type float64 = number;
export const principal = IDL.Principal;
export { Principal } from '@dfinity/principal';
export type Vec<T> = T[];
export type Tuple<T> = T;

/**
 * Represents an optional value: every {@link Opt} is either `Some` and contains
 * a value, or `None` and does not.
 */
export type Opt<Value> = [Value] | [];
export const Void = [];
export type Void = void;

/**
 * Wraps the provided value in a `Some` {@link Opt}
 * @param value - the value to be wrapped
 * @returns a `Some` {@link Opt} containing the provided value
 */
export function Some<T>(value: T): [T] {
    return [value];
}

/** An {@link Opt} representing the absence of a value */
export const None: [] = [];

// TODO what happens if we pass something to Opt() that can't be converted to CandidClass?
export function Opt<T>(t: T): AzleOpt<T> {
    // return IDL.Opt(toCandidClass(t));
    return new AzleOpt(t);
}

export class AzleOpt<T> {
    constructor(t: any) {
        this._azleType = t;
    }
    _azleType: any;
    getIDL(parents: Parent[]) {
        return IDL.Opt(toCandidClass(this._azleType, []));
    }
}

export class AzleVec<T> {
    constructor(t: any) {
        this._azleType = t;
    }
    _azleType: any;
    getIDL(parents: Parent[]) {
        return IDL.Vec(toCandidClass(this._azleType, []));
    }
}

export class AzleTuple {
    constructor(t: any[]) {
        this._azleTypes = t;
    }
    _azleTypes: any[];
    getIDL(parents: Parent[]) {
        const candidTypes = this._azleTypes.map((value) => {
            return toCandidClass(value, parents);
        });
        return IDL.Tuple(...candidTypes);
    }
}

export function Vec<T>(t: T): AzleVec<T> {
    // return IDL.Vec(toCandidClass(t));
    return new AzleVec(t);
}

// TODO I am not sure of any of these types... but its working so...
export function Tuple<T extends any[]>(...types: T): AzleTuple {
    // const candidTypes = types.map((value) => {
    //     return toCandidClass(value);
    // });
    // return IDL.Tuple(...candidTypes);
    return new AzleTuple(types);
}
