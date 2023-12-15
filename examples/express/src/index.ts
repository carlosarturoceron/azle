import {
    Canister,
    nat32,
    nat64,
    query,
    text,
    postUpgrade,
    Record,
    blob,
    Opt,
    Func,
    Variant,
    Tuple,
    nat16,
    Vec,
    bool,
    None
} from 'azle';
import express from '../lib/express';

// TODO apparently hasOwn is quite new, maybe ES2022, so QuickJS doesn't have it
// TODO another reason we might want to move to SpiderMonkey...though not sure why
// TODO our compilers don't catch this
Object.hasOwn = (obj, key) => {
    return obj.hasOwnProperty(key);
};

const Token = Record({
    // add whatever fields you'd like
    arbitrary_data: text
});

const StreamingCallbackHttpResponse = Record({
    body: blob,
    token: Opt(Token)
});

export const Callback = Func([text], StreamingCallbackHttpResponse, 'query');

const CallbackStrategy = Record({
    callback: Callback,
    token: Token
});

const StreamingStrategy = Variant({
    Callback: CallbackStrategy
});

type HeaderField = [text, text];
const HeaderField = Tuple(text, text);

const HttpResponse = Record({
    status_code: nat16,
    headers: Vec(HeaderField),
    body: blob,
    streaming_strategy: Opt(StreamingStrategy),
    upgrade: Opt(bool)
});

const HttpRequest = Record({
    method: text,
    url: text,
    headers: Vec(HeaderField),
    body: blob,
    certificate_version: Opt(nat16)
});

export default Canister({
    http_request: query([HttpRequest], HttpResponse, (httpRequest) => {
        const app = express();

        app.get('/', (req, res) => {
            // res.send('Hello World!');
            console.log('wow');
        });

        console.log('httpRequest.method', httpRequest.method);

        app.handle(
            {
                url: httpRequest.url,
                method: httpRequest.method
            },
            {},
            () => {}
        );

        return {
            status_code: 200,
            headers: [],
            body: Buffer.from('hello world\n'),
            streaming_strategy: None,
            upgrade: None
        };
    })
});
