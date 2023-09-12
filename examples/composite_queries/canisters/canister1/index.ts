import { ic, Manual, nat, Principal, query, Service, text, update } from 'azle';
import Canister2 from '../canister2';

// Composite query calling a query
class Canister1 extends Service {
    canister2 = new Canister2(
        Principal.fromText(
            process.env.CANISTER2_PRINCIPAL ??
                ic.trap('process.env.CANISTER2_PRINCIPAL is undefined')
        )
    );

    counter: nat = 0n;

    @query([], text)
    async simpleCompositeQuery(): Promise<text> {
        return await ic.call(this.canister2.simpleQuery);
    }

    // Composite query calling a manual query
    @query([], text)
    async manualQuery(): Promise<text> {
        return await ic.call(this.canister2.manualQuery);
    }

    // Manual composite query calling a manual query
    @query([], text, { manual: true })
    async totallyManualQuery(): Promise<Manual<text>> {
        ic.reply(await ic.call(this.canister2.manualQuery), text);
    }

    // Composite query calling another composite query
    @query([], text)
    async deepQuery(): Promise<text> {
        return await ic.call(this.canister2.deepQuery);
    }

    // Composite query calling an update method. SHOULDN'T WORK
    @query([], text)
    async updateQuery(): Promise<text> {
        return await ic.call(this.canister2.updateQuery);
    }

    // Composite query being called by a query method. SHOULDN'T WORK
    @query([], text)
    async simpleQuery(): Promise<text> {
        return await ic.call(this.canister2.simpleQuery);
    }

    // Composite query being called by an update method. SHOULDN'T WORK
    @update([], text)
    async simpleUpdate(): Promise<text> {
        return await ic.call(this.canister2.deepQuery);
    }

    // Composite query that modifies the state. Should revert after the call is done
    @query([], nat)
    async incCounter(): Promise<nat> {
        this.counter += 1n;

        return this.counter;
    }

    // Composite query calling queries on the same canister
    @query([], nat)
    async incCanister1(): Promise<nat> {
        this.counter += 1n;

        const canister1AResult = await ic.call(this.incCounter);

        const canister1BResult = await ic.call(this.incCounter);

        return this.counter + canister1AResult + canister1BResult;
    }

    // Composite query calling queries that modify the state
    @query([], nat)
    async incCanister2(): Promise<nat> {
        this.counter += 1n;

        const canister2AResult = await ic.call(this.canister2.incCounter);

        const canister2BResult = await ic.call(this.canister2.incCounter);

        return this.counter + canister2AResult + canister2BResult;
    }
}

export default Canister1;
