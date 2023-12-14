import { Canister, nat32, nat64, query, text, postUpgrade } from 'azle';
import express from '../lib/express';

// TODO apparently hasOwn is quite new, maybe ES2022, so QuickJS doesn't have it
// TODO another reason we might want to move to SpiderMonkey...though not sure why
// TODO our compilers don't catch this
Object.hasOwn = (obj, key) => {
    return obj.hasOwnProperty(key);
};

export default Canister({
    postUpgrade: postUpgrade([], () => {
        const app = express();

        app.get('/', (req, res) => {
            res.send('Hello World!');
        });
    }),
    test: query([], text, () => {
        return 'yes';
    })
});
