import * as swc from '@swc/core';
import { buildSync } from 'esbuild';
import { JSCanisterConfig, JavaScript, TypeScript } from './utils/types';
import { Result } from './utils/result';
import { join } from 'path';

export function compileTypeScriptToJavaScript(
    main: string,
    canisterConfig: JSCanisterConfig
): Result<JavaScript, unknown> {
    try {
        const globalThisProcess = `
            globalThis.process = {
                env: {
                    ${(canisterConfig.env ?? [])
                        .map((envVarName) => {
                            return `'${envVarName}': '${process.env[envVarName]}'`;
                        })
                        .join(',')}
                },
                version: 'v0.10'
            };
        `;

        const imports = `
            // Trying to make sure that all globalThis dependencies are defined
            // Before the developer imports azle on their own
            import 'azle';
            import { ic } from 'azle';
            export { Principal } from '@dfinity/principal';
            export * from './${main}';
            import CanisterMethods from './${main}';

            export const canisterMethods = CanisterMethods();

        `;

        const bundledJavaScript = bundleAndTranspileJs(`
            ${globalThisProcess}
            ${imports}
`);

        return {
            ok: bundledJavaScript
        };
    } catch (err) {
        return { err };
    }
}

export function bundleAndTranspileJs(ts: TypeScript): JavaScript {
    const jsBundled: JavaScript = bundleFromString(ts);
    const jsTranspiled: JavaScript = transpile(jsBundled);

    // TODO enabling strict mode is causing lots of issues
    // TODO it would be nice if I could remove strict mode code in esbuild or swc
    // TODO look into the implications of this, but since we are trying to transpile to es3 to cope with missing features in boa, I do not think we need strict mode
    const jsStrictModeRemoved: JavaScript = jsTranspiled.replace(
        /"use strict";/g,
        ''
    );

    return jsStrictModeRemoved;
}

// TODO there is a lot of minification/transpiling etc we could do with esbuild or with swc
// TODO we need to decide which to use for what
export function bundleFromString(ts: TypeScript): JavaScript {
    // console.log(process.cwd());
    // console.log(__dirname);
    // console.log(require('azle').resolveDir);

    // TODO tree-shaking does not seem to work with stdin. I have learned this from sad experience
    const buildResult = buildSync({
        stdin: {
            contents: ts,
            resolveDir: process.cwd()
        },
        format: 'esm',
        bundle: true,
        treeShaking: true,
        write: false,
        logLevel: 'silent',
        alias: {
            // TODO this is how you overwrite libraries
            crypto: 'crypto-browserify',
            fs: 'memory-fs',
            zlib: 'pako'
            // fs: 'memory-fs',
            // fs: join(__dirname, '../polyfills/fs'),
            // http: join(__dirname, '../polyfills/http.js'),
            // https: join(__dirname, '../polyfills/https'),
            // _http_agent: join(__dirname, '../polyfills/_http_agent.js'),
            // _http_client: join(__dirname, '../polyfills/_http_client.js'),
            // _http_common: join(__dirname, '../polyfills/_http_common.js'),
            // _http_outgoing: join(__dirname, '../polyfills/_http_outgoing.js'),
            // _http_incoming: join(__dirname, '../polyfills/_http_incoming.js'),
            // _http_server: join(__dirname, '../polyfills/_http_server.js'),
            // zlib: join(__dirname, '../polyfills/zlib.js'),
            // internal: join(__dirname, '../polyfills/internal'),
            // timers: join(__dirname, '../polyfills/timers/promises.js'),
            // util: join(__dirname, '../polyfills/util'),
            // 'node:util': join(__dirname, '../polyfills/util'),
            // v8: join(__dirname, '../polyfills/v8.js'),
            // assert: join(__dirname, '../polyfills/assert.js'),
            // path: join(__dirname, '../polyfills/path.js'),
            // net: join(__dirname, '../polyfills/net.js'),
            // events: join(__dirname, '../polyfills/events'),
            // 'node:events': join(__dirname, '../polyfills/events'),
            // async_hooks: join(__dirname, '../polyfills/async_hooks.js'),
            // diagnostics_channel: join(
            //     __dirname,
            //     '../polyfills/diagnostics_channel.js'
            // ),
            // stream: join(__dirname, '../polyfills/stream'),
            // 'node:stream': join(__dirname, '../polyfills/stream'),
            // querystring: join(__dirname, '../polyfills/querystring'),
            // worker_threads: join(__dirname, '../polyfills/worker_threads'),
            // perf_hooks: join(__dirname, '../polyfills/perf_hooks'),
            // tls: join(__dirname, '../polyfills/tls'),
            // dns: join(__dirname, '../polyfills/dns'),
            // child_process: join(__dirname, '../polyfills/child_process'),
            // dgram: join(__dirname, '../polyfills/dgram'),
            // cluster: join(__dirname, '../polyfills/cluster'),
            // vm: join(__dirname, '../polyfills/vm'),
            // _tls_wrap: join(__dirname, '../polyfills/_tls_wrap'),
            // _tls_common: join(__dirname, '../polyfills/_tls_common'),
            // os: join(__dirname, '../polyfills/os')
        }
        // TODO tsconfig was here to attempt to set importsNotUsedAsValues to true to force Principal to always be bundled
        // TODO now we always bundle Principal for all code, but I am keeping this here in case we run into the problem elsewhere
        // tsconfig: path.join( __dirname, './esbuild-tsconfig.json') // TODO this path resolution may cause problems on non-Linux systems, beware...might not be necessary now that we are using stdin
    });

    const bundleArray = buildResult.outputFiles[0].contents;
    const bundleString = Buffer.from(bundleArray).toString('utf-8');

    return bundleString;
}

// TODO I have left the code for bundleFromPath
// TODO We might run into the situation again where we need to use bundleFromPath
// TODO there are some issues with tree-shaking and possibly some others in bundleFromString, so I will just leave the code here for now until the project is more mature
// function bundleFromPath(tsPath: string): JavaScript {
//     const buildResult = buildSync({
//         entryPoints: [tsPath],
//         format: 'esm',
//         bundle: true,
//         treeShaking: true,
//         write: false,
//         logLevel: 'silent',
//         // TODO tsconfig was here to attempt to set importsNotUsedAsValues to true to force Principal to always be bundled
//         // TODO now we always bundle Principal for all code, but I am keeping this here in case we run into the problem elsewhere
//         // tsconfig: path.join( __dirname, './esbuild-tsconfig.json') // TODO this path resolution may cause problems on non-Linux systems, beware...might not be necessary now that we are using stdin
//     });

//     const bundleArray = buildResult.outputFiles[0].contents;
//     const bundleString = Buffer.from(bundleArray).toString('utf-8');

//     return bundleString;
// }

// TODO there is a lot of minification/transpiling etc we could do with esbuild or with swc
// TODO we need to decide which to use for what
function transpile(js: JavaScript): JavaScript {
    return swc.transformSync(js, {
        module: {
            type: 'commonjs'
        },
        jsc: {
            parser: {
                syntax: 'ecmascript'
            },
            target: 'es2017', // TODO had to change this to get generator objects natively...not sure what else will break now
            experimental: {
                cacheRoot: '/dev/null'
            },
            loose: true
        },
        minify: false // TODO keeping this off for now, enable once the project is more stable
    }).code;
}
