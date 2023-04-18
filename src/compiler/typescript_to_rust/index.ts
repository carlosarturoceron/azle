import { dirname, join } from 'path';
import * as ts from 'typescript';

import { compileTypeScriptToJavaScript } from './typescript_to_javascript';
import {
    generateLibCargoToml,
    generateWorkspaceCargoLock,
    generateWorkspaceCargoToml
} from './typescript_to_javascript/cargo_toml_files';
import { writeCodeToFileSystem } from './write_code_to_file_system';
import { generateRustCanister } from './generate_rust_canister';
import { Err, ok, unwrap } from '../utils/result';
import {
    AzleError,
    Plugin,
    Toml,
    TsCompilationError,
    TsSyntaxErrorLocation
} from '../utils/types';
import { time } from '../utils';
import { red, dim } from '../utils/colors';
import { readFileSync } from 'fs';

export function compileTypeScriptToRust(
    canisterName: string,
    canisterPath: string,
    rootPath: string,
    tsPath: string
): void | never {
    time('\n[1/3] 🔨 Compiling TypeScript...', 'inline', () => {
        const compilationResult = compileTypeScriptToJavaScript(tsPath);

        if (!ok(compilationResult)) {
            const azleErrorResult = compilationErrorToAzleErrorResult(
                compilationResult.err
            );
            unwrap(azleErrorResult);
        }

        const mainJs = compilationResult.ok;
        const workspaceCargoToml: Toml = generateWorkspaceCargoToml(rootPath);
        const workspaceCargoLock: Toml = generateWorkspaceCargoLock();

        const { fileNames, plugins } = getFileNamesAndPlugins(tsPath);

        const pluginsDependencies = plugins
            .map((plugin) => {
                const cargoTomlPath = join(plugin.path, 'Cargo.toml');

                // TODO Toml parser
                const cargoTomlString = readFileSync(cargoTomlPath)
                    .toString()
                    .replace('[dependencies]', '');

                return cargoTomlString;
            })
            .join('');

        const libCargoToml: Toml = generateLibCargoToml(
            canisterName,
            pluginsDependencies
        );

        writeCodeToFileSystem(
            rootPath,
            canisterPath,
            workspaceCargoToml,
            workspaceCargoLock,
            libCargoToml,
            mainJs as any
        );

        unwrap(
            generateRustCanister(fileNames, plugins, canisterPath, { rootPath })
        );

        if (isCompileOnlyMode()) {
            console.log('Compilation complete!');
            process.exit(0);
        }
    });
}

function isCompileOnlyMode(): boolean {
    return (
        process.argv.includes('--compile-only') || process.argv.includes('-c')
    );
}

function compilationErrorToAzleErrorResult(error: unknown): Err<AzleError> {
    if (isTsCompilationError(error)) {
        const firstError = error.errors[0];
        const codeSnippet = generateVisualDisplayOfErrorLocation(
            firstError.location
        );
        return Err({
            error: `There's something wrong in your TypeScript: ${firstError.text}`,
            suggestion: codeSnippet,
            exitCode: 5
        });
    } else {
        return Err({
            error: `Unable to compile TS to JS: ${error}`,
            exitCode: 6
        });
    }
}

function isTsCompilationError(error: unknown): error is TsCompilationError {
    if (
        error &&
        typeof error === 'object' &&
        'stack' in error &&
        'message' in error &&
        'errors' in error &&
        'warnings' in error
    ) {
        return true;
    }
    return false;
}

function generateVisualDisplayOfErrorLocation(
    location: TsSyntaxErrorLocation
): string {
    const { file, line, column, lineText } = location;
    const marker = red('^'.padStart(column + 1));
    const preciseLocation = dim(`${file}:${line}:${column}`);
    const previousLine =
        line > 1
            ? dim(`${(line - 1).toString().padStart(line.toString().length)}| `)
            : '';
    const offendingLine = `${dim(`${line}| `)}${lineText}`;
    const subsequentLine = `${dim(
        `${(line + 1).toString().padStart(line.toString().length)}| `
    )}${marker}`;
    return `${preciseLocation}\n${previousLine}\n${offendingLine}\n${subsequentLine}`;
}

function getFileNamesAndPlugins(tsPath: string): {
    fileNames: string[];
    plugins: Plugin[];
} {
    const program = ts.createProgram([tsPath], {});
    const sourceFiles = program.getSourceFiles();

    const fileNames = sourceFiles.map((sourceFile) => {
        if (!sourceFile.fileName.startsWith('/')) {
            return join(process.cwd(), sourceFile.fileName);
        } else {
            return sourceFile.fileName;
        }
    });

    const registerPlugins = findRegisterPlugins(sourceFiles);

    return {
        fileNames,
        plugins: registerPlugins.map((registerPlugin) => {
            return {
                path: dirname(registerPlugin.sourceFile.fileName),
                register_function: getRustRegisterFunctionName(
                    registerPlugin.node,
                    registerPlugin.sourceFile
                )
            };
        })
    };
}

type RegisterPluginNodeInfo = {
    node: ts.CallExpression;
    sourceFile: ts.SourceFile;
};

function findRegisterPlugins(
    sourceFiles: readonly ts.SourceFile[]
): RegisterPluginNodeInfo[] {
    return sourceFiles
        .filter((sourceFile) => !sourceFile.isDeclarationFile)
        .flatMap((sourceFile) => {
            const registerPluginNodes = findRegisterPlugin(
                sourceFile,
                sourceFile
            );
            return registerPluginNodes.map((node) => ({ node, sourceFile }));
        });
}

function findRegisterPlugin(
    node: ts.Node,
    sourceFile: ts.SourceFile
): ts.CallExpression[] {
    if (sourceFile === undefined) {
        return [];
    }

    const childNodes = node
        .getChildren(sourceFile)
        .map((child) => findRegisterPlugin(child, sourceFile))
        .reduce((acc, cur) => [...acc, ...cur], []);

    return ts.isCallExpression(node) &&
        node.expression.getText(sourceFile) === 'registerPlugin'
        ? [node, ...childNodes]
        : childNodes;
}

function getRustRegisterFunctionName(
    node: ts.CallExpression,
    sourceFile: ts.SourceFile
): string {
    const [arg] = node.arguments;
    if (ts.isObjectLiteralExpression(arg)) {
        const rustRegisterFunctionNameProperty = arg.properties.find(
            (property) =>
                ts.isPropertyAssignment(property) &&
                property.name.getText(sourceFile) === 'rustRegisterFunctionName'
        ) as ts.PropertyAssignment | undefined;

        if (
            rustRegisterFunctionNameProperty &&
            ts.isStringLiteralLike(rustRegisterFunctionNameProperty.initializer)
        ) {
            return rustRegisterFunctionNameProperty.initializer.text;
        }
    }

    throw new Error(
        'registerPlugin function must have a rustRegisterFunctionName property with a string literal value'
    );
}