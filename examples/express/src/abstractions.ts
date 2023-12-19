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
    None,
    Manual,
    ic,
    init
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

export const HttpResponse = Record({
    status_code: nat16,
    headers: Vec(HeaderField),
    body: blob,
    streaming_strategy: Opt(StreamingStrategy),
    upgrade: Opt(bool)
});

globalThis.HttpResponse = HttpResponse;
globalThis.None = None;
globalThis.ic = ic;

export const HttpRequest = Record({
    method: text,
    url: text,
    headers: Vec(HeaderField),
    body: blob,
    certificate_version: Opt(nat16)
});

import { Express } from 'express';

const app = express() as Express;

export function Server(callback: (app: Express) => any) {
    return Canister({
        init: init([], () => {
            callback(app);
        }),
        postUpgrade: postUpgrade([], () => {
            callback(app);
        }),
        http_request: query(
            [HttpRequest],
            Manual(HttpResponse),
            (httpRequest) => {
                let req = Object.create(app.request);

                req.url = httpRequest.url;
                req.method = httpRequest.method;

                let res = Object.create(app.response);

                res.req = req;

                app.handle(req, res, () => {});
            },
            {
                manual: true
            }
        )
    });
}
