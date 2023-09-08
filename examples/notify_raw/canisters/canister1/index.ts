import { ic, Principal, update, Void } from 'azle';

export default class {
    @update([], Void)
    sendNotification(): Void {
        return ic.notifyRaw(
            Principal.fromText(
                process.env.CANISTER2_PRINCIPAL ??
                    ic.trap('process.env.CANISTER2_PRINCIPAL is undefined')
            ),
            'receiveNotification',
            Uint8Array.from(ic.candidEncode('()')),
            0n
        );
    }
}