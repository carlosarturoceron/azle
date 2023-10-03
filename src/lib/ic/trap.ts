import { empty } from '../candid/types/primitive/empty';
import { text } from '../candid/types/primitive/text';

/**
 * Stops execution and rejects the current request with a `CANISTER_ERROR`
 * (5) rejection code and the provided message
 * @param message the rejection message
 */
export const trap = (message: text) => empty;
