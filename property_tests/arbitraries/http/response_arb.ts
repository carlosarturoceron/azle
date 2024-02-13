import fc from 'fast-check';
import { HttpResponse, None } from '../../../src/lib';
import { HttpHeadersArb } from './headers_arb';
import { BodyArb } from './body_arb';
import { CandidValueAndMeta } from '../candid/candid_value_and_meta_arb';
import { CorrespondingJSType } from '../candid/corresponding_js_type';
import { blobToSrcLiteral } from '../candid/to_src_literal/blob';
import { stringToSrcLiteral } from '../candid/to_src_literal/string';

export type HttpResponseAgentResponseValue = {
    status: number;
    headers: [string, string][];
    body: string;
};

// The ic replica doesn't support returning status codes in the 1xx range.
const StatusCodeArb = fc
    .integer({ min: 200, max: 599 })
    .filter((status) => status !== 407); // TODO Node's fetch doesn't handle 407 the same as other status, so we're filtering it out until we can figure out why

export function HttpResponseValueArb<T>() {
    return fc
        .tuple(StatusCodeArb, HttpHeadersArb())
        .chain(([statusCode, headers]) => {
            return fc.tuple(
                fc.constant(statusCode),
                fc.constant(headers),
                hasBody(statusCode) ? BodyArb() : fc.constant(new Uint8Array())
            );
        })
        .map(([status_code, headers, body]): HttpResponse<T> => {
            return {
                status_code,
                headers,
                body,
                upgrade: None,
                streaming_strategy: None
            };
        });
}
export function HttpResponseArb<T extends CorrespondingJSType = any>(
    token: CandidValueAndMeta<CorrespondingJSType>
): fc.Arbitrary<
    CandidValueAndMeta<HttpResponse<T>, HttpResponseAgentResponseValue>
> {
    return HttpResponseValueArb<T>().map((response) => {
        const lowerCasedHeaders = response.headers.map<[string, string]>(
            ([name, value]) => [name.toLowerCase(), value]
        );

        const agentResponseValue = {
            status: response.status_code,
            headers: lowerCasedHeaders,
            body:
                response.status_code === 204 // No Content
                    ? ''
                    : new TextDecoder().decode(response.body)
        };

        const headerStrings = response.headers
            .map(
                ([name, value]) =>
                    `[${stringToSrcLiteral(name)},${stringToSrcLiteral(value)}]`
            )
            .join(',');

        const bodySrc = blobToSrcLiteral(response.body);

        return {
            value: {
                agentArgumentValue: response,
                agentResponseValue: agentResponseValue,
                runtimeCandidTypeObject: HttpResponse(
                    token.value.runtimeCandidTypeObject
                )
            },
            src: {
                candidTypeAnnotation: `HttpResponse<${token.src.candidTypeAnnotation}>`,
                candidTypeObject: `HttpResponse(${token.src.candidTypeObject})`,
                variableAliasDeclarations: token.src.variableAliasDeclarations,
                imports: new Set([
                    'HttpResponse',
                    'bool',
                    'None',
                    ...token.src.imports
                ]),
                valueLiteral: `{
                status_code: ${response.status_code},
                    headers: [${headerStrings}],
                    body: ${bodySrc},
                    upgrade: None,
                    streaming_strategy: None
                }`
            }
        };
    });
}
function hasBody(statusCode: number): boolean {
    // The following code must not have content according to the http spec
    // https://www.rfc-editor.org/rfc/rfc9110.html
    if (
        statusCode < 200 ||
        statusCode === 204 ||
        statusCode === 205 ||
        statusCode === 304
    ) {
        return false;
    } else {
        return true;
    }
}
