// TODO figure out a good strategy for throwing errors versus returning results

import * as tsc from 'typescript';

type ICFunctionType = 'Query' | 'Update';

export function compileJSToRust(
    jsPath: string,
    js: string
): string {
    // TODO first we probably want to compile the file with the TypeScript compiler
    // TODO then we want to grab all functions with @query or @update decorators
    // TODO we want to take the compiled JS and shove it into the Rust code
    // TODO we want to walk the AST and create and expose the Rust query and update functions
    // TODO for now I am going to use JavaScript/TypeScript to do all of this...consider if it would
    // TODO be more appropriate to use a Rust macro

    const program = tsc.createProgram(
        [jsPath],
        {}
    );
    const sourceFiles = program.getSourceFiles();
    // const sourceFile = tsc.createSourceFile();


        // TODO remove the comments if you can to save space
    // TODO we might want to minify as well to save space

    // TODO we might need to use transpile to get all imports
    const compiledJs = tsc.transpileModule(
        js,
        {
            // compilerOptions: {
            //     module: tsc.ModuleKind.AMD
            // }
        }
    ).outputText;

    const rustQueryFunctions = generateRustFunctionsFromSourceFiles(
        sourceFiles,
        compiledJs,
        'Query'
    );

    const rustUpdateFunctions = generateRustFunctionsFromSourceFiles(
        sourceFiles,
        compiledJs,
        'Update'
    );

    return `
        // This code is automatically generated by Azle

        thread_local! {
            static IC: std::cell::RefCell<boa::object::JsObject> = std::cell::RefCell::new(boa::object::JsObject::default());
        }

        fn custom_getrandom(_buf: &mut [u8]) -> Result<(), getrandom::Error> { Ok(()) }

        getrandom::register_custom_getrandom!(custom_getrandom);
        
        ${rustQueryFunctions.join('\n')}

        ${rustUpdateFunctions.join('\n')}
    `;
}

function generateRustFunctionsFromSourceFiles(
    sourceFiles: ReadonlyArray<tsc.SourceFile>,
    compiledJs: string,
    icFunctionType: ICFunctionType
): ReadonlyArray<string> {
    const rustFunctions = sourceFiles.reduce((result: ReadonlyArray<string>, sourceFile) => {
        return [
            ...result,
            ...generateRustFunctionsFromNodes(
                sourceFile,
                sourceFile.getChildren(),
                compiledJs,
                icFunctionType
            )
        ];
    }, []);

    return rustFunctions;
}

function generateRustFunctionsFromNodes(
    sourceFile: tsc.SourceFile,
    nodes: ReadonlyArray<tsc.Node>,
    compiledJs: string,
    icFunctionType: ICFunctionType
): ReadonlyArray<string> {
    if (nodes.length === 0) {
        return [];
    }

    return nodes.reduce((result: ReadonlyArray<string>, node) => {
        const rustFunction = generateRustFunctionFromNode(
            node,
            compiledJs,
            icFunctionType
        );

        return [
            ...result,
            ...(rustFunction === null ? [] : [rustFunction]),
            ...generateRustFunctionsFromNodes(
                sourceFile,
                node.getChildren(sourceFile),
                compiledJs,
                icFunctionType
            )
        ];
    }, []);
}

// function generateRustQueryFunctionsFromSourceFiles(
//     sourceFiles: ReadonlyArray<tsc.SourceFile>,
//     compiledJs: string
// ): ReadonlyArray<string> {
//     const queryFunctions = sourceFiles.reduce((result: ReadonlyArray<string>, sourceFile) => {
//         return [
//             ...result,
//             ...generateRustQueryFunctionsFromNodes(
//                 sourceFile,
//                 sourceFile.getChildren(),
//                 compiledJs
//             )
//         ];
//     }, []);

//     return queryFunctions;
// }

// function generateRustQueryFunctionsFromNodes(
//     sourceFile: tsc.SourceFile,
//     nodes: ReadonlyArray<tsc.Node>,
//     compiledJs: string
// ): ReadonlyArray<string> {
//     if (nodes.length === 0) {
//         return [];
//     }

//     return nodes.reduce((result: ReadonlyArray<string>, node) => {
//         const rustQueryFunction = generateRustQueryFunctionFromNode(
//             node,
//             compiledJs
//         );

//         return [
//             ...result,
//             ...(rustQueryFunction === null ? [] : [rustQueryFunction]),
//             ...generateRustQueryFunctionsFromNodes(
//                 sourceFile,
//                 node.getChildren(sourceFile),
//                 compiledJs
//             )
//         ];
//     }, []);
// }

function generateRustFunctionFromNode(
    node: tsc.Node,
    compiledJs: string,
    icFunctionType: ICFunctionType
): string | null {
    if (isNodeAFunctionDeclaration(
        node,
        icFunctionType
    ) === false) {
        return null;
    }

    const functionDeclaration = node as tsc.FunctionDeclaration;
    const functionName = functionDeclaration.name?.escapedText.toString() || 'NO_FUNCTION_NAME' as string;
    const functionReturnType = getFunctionReturnType(
        functionDeclaration,
        icFunctionType
    );
    const functionParameters = getFunctionParameters(functionDeclaration);
    const functionParametersString = stringifyFunctionParameters(functionParameters);

    // TODO these number conversions are horrendous
    const returnValueConversionCode = {
        'bool': 'return_value.to_boolean()',
        'String': 'return_value.as_string().unwrap().to_string()',
        'isize': 'return_value.as_number().unwrap().to_string().parse::<isize>().unwrap()',
        'i128': 'return_value.as_number().unwrap().to_string().parse::<i128>().unwrap()',
        'i64': 'return_value.as_number().unwrap().to_string().parse::<i64>().unwrap()',
        'i32': 'return_value.as_number().unwrap().to_string().parse::<i32>().unwrap()',
        'i16': 'return_value.as_number().unwrap().to_string().parse::<i16>().unwrap()',
        'i8': 'return_value.as_number().unwrap().to_string().parse::<i8>().unwrap()',
        'usize': '',
        'u128': '',
        'u64': '',
        'u32': '',
        'u16': '',
        'u8': ''
    }[functionReturnType];

    if (icFunctionType === 'Query') {
        return generateRustQueryFunction(
            functionName,
            functionParametersString,
            functionReturnType,
            functionParameters,
            compiledJs,
            returnValueConversionCode
        );
    }
    
    if (icFunctionType === 'Update') {
        return generateRustUpdateFunction(
            functionName,
            functionParametersString,
            functionReturnType,
            functionParameters,
            compiledJs,
            returnValueConversionCode
        );
    }

    return null;
}

function generateRustQueryFunction(
    functionName: string,
    functionParametersString: string,
    functionReturnType: RustType,
    functionParameters: ReadonlyArray<RustParameter>,
    compiledJs: string,
    returnValueConversionCode: string
): string {
// TODO Figure out a more elegant way to define the exports object than the string replace below
    return `
        #[ic_cdk_macros::query]
        fn ${functionName}(${functionParametersString}) -> ${functionReturnType} {
            IC.with(|ic_ref_cell| {
                let ic = ic_ref_cell.borrow().clone();

                ic_cdk::println!("ic: {:#?}", ic);
                
                let mut context = boa::Context::new();

                context.register_global_property(
                    "ic",
                    ic,
                    boa::property::Attribute::all()
                );
            
                let return_value = context.eval(format!(
                    "
                        {compiled_js}
    
                        ${functionName}(${functionParameters.map((functionParameter) => {
                            if (functionParameter.type === 'String') {
                                return `\\"{${functionParameter.name}}\\"`;
                            }
    
                            return `{${functionParameter.name}}`;
                        }).join(',')});
                    ",
                    compiled_js = r#"${compiledJs}"#,
                    ${functionParameters.map((functionParameter) => {
                        return `${functionParameter.name} = ${functionParameter.name}`;
                    }).join(',')}
                ).replace("Object.defineProperty", "let exports = {}; Object.defineProperty")).unwrap();
            
                ic_cdk::println!("return_value: {:#?}", return_value);
    
                ${returnValueConversionCode}
            })
        }
    `;
}

// TODO time to figure out orthogonal persistence
// TODO we need to store some code in Rust
// TODO then we need to provide that to the IC environment
// TODO then we need to grab it after the script executes and store it again
function generateRustUpdateFunction(
    functionName: string,
    functionParametersString: string,
    functionReturnType: RustType,
    functionParameters: ReadonlyArray<RustParameter>,
    compiledJs: string,
    returnValueConversionCode: string
): string {
// TODO Figure out a more elegant way to define the exports object than the string replace below
    return `
        #[ic_cdk_macros::update]
        fn ${functionName}(${functionParametersString}) -> ${functionReturnType} {
            IC.with(|ic_ref_cell| {
                let ic = ic_ref_cell.borrow().clone();

                let mut context = boa::Context::new();
            
                context.register_global_property(
                    "ic",
                    ic,
                    boa::property::Attribute::all()
                );

                let return_value = context.eval(format!(
                    "
                        {compiled_js}
    
                        ${functionName}(${functionParameters.map((functionParameter) => {
                            if (functionParameter.type === 'String') {
                                return `\\"{${functionParameter.name}}\\"`;
                            }
    
                            return `{${functionParameter.name}}`;
                        }).join(',')});
                    ",
                    compiled_js = r#"${compiledJs}"#,
                    ${functionParameters.map((functionParameter) => {
                        return `${functionParameter.name} = ${functionParameter.name}`;
                    }).join(',')}
                ).replace("Object.defineProperty", "let exports = {}; Object.defineProperty")).unwrap();
            
                let ic = context
                    .global_object()
                    .get(
                        "ic",
                        &mut context
                    )
                    .unwrap()
                    .as_object()
                    .unwrap()
                    .clone();
    
                ic_cdk::println!("ic: {:#?}", ic);
    
                ic_ref_cell.replace(ic);
    
                ${returnValueConversionCode}
            })
        }
    `;
}

// function generateRustQueryFunctionFromNode(
//     node: tsc.Node,
//     compiledJs: string
// ): string | null {
//     if (isNodeAFunctionDeclaration(
//         node,
//         'Query'
//     ) === false) {
//         return null;
//     }

//     const functionDeclaration = node as tsc.FunctionDeclaration;
//     const functionName = functionDeclaration.name?.escapedText;
//     const functionReturnType = getFunctionReturnType(functionDeclaration);
//     const functionParameters = getFunctionParameters(functionDeclaration);
//     const functionParametersString = stringifyFunctionParameters(functionParameters);

//     // TODO these number conversions are horrendous
//     const returnValueConversionCode = {
//         'bool': 'return_value.to_boolean()',
//         'String': 'return_value.as_string().unwrap().to_string()',
//         'isize': 'return_value.as_number().unwrap().to_string().parse::<isize>().unwrap()',
//         'i128': 'return_value.as_number().unwrap().to_string().parse::<i128>().unwrap()',
//         'i64': 'return_value.as_number().unwrap().to_string().parse::<i64>().unwrap()',
//         'i32': 'return_value.as_number().unwrap().to_string().parse::<i32>().unwrap()',
//         'i16': 'return_value.as_number().unwrap().to_string().parse::<i16>().unwrap()',
//         'i8': 'return_value.as_number().unwrap().to_string().parse::<i8>().unwrap()',
//         'usize': '',
//         'u128': '',
//         'u64': '',
//         'u32': '',
//         'u16': '',
//         'u8': ''
//     }[functionReturnType];

//     // TODO Figure out a more elegant way to define the exports object than the string replace below
//     return `
//         #[ic_cdk_macros::query]
//         fn ${functionName}(${functionParametersString}) -> ${functionReturnType} {
//             let mut context = boa::Context::new();
        
//             let return_value = context.eval(format!(
//                 "
//                     {compiled_js}

//                     ${functionName}(${functionParameters.map((functionParameter) => {
//                         if (functionParameter.type === 'String') {
//                             return `\\"{${functionParameter.name}}\\"`;
//                         }

//                         return `{${functionParameter.name}}`;
//                     }).join(',')});
//                 ",
//                 compiled_js = r#"${compiledJs}"#,
//                 ${functionParameters.map((functionParameter) => {
//                     return `${functionParameter.name} = ${functionParameter.name}`;
//                 }).join(',')}
//             ).replace("Object.defineProperty", "let exports = {}; Object.defineProperty")).unwrap();
        
//             ic_cdk::println!("return_value: {:#?}", return_value);

//             ${returnValueConversionCode}
//         }
//     `;
// }

// function generateRustUpdateFunctionFromNode(
//     node: tsc.Node,
//     compiledJs: string
// ): string | null {
//     if (isNodeAFunctionDeclaration(
//         node,
//         'Update'
//     ) === false) {
//         return null;
//     }

//     const functionDeclaration = node as tsc.FunctionDeclaration;
//     const functionName = functionDeclaration.name?.escapedText;
//     const functionReturnType = getFunctionReturnType(functionDeclaration);
//     const functionParameters = getFunctionParameters(functionDeclaration);
//     const functionParametersString = stringifyFunctionParameters(functionParameters);

//     // TODO these number conversions are horrendous
//     const returnValueConversionCode = {
//         'bool': 'return_value.to_boolean()',
//         'String': 'return_value.as_string().unwrap().to_string()',
//         'isize': 'return_value.as_number().unwrap().to_string().parse::<isize>().unwrap()',
//         'i128': 'return_value.as_number().unwrap().to_string().parse::<i128>().unwrap()',
//         'i64': 'return_value.as_number().unwrap().to_string().parse::<i64>().unwrap()',
//         'i32': 'return_value.as_number().unwrap().to_string().parse::<i32>().unwrap()',
//         'i16': 'return_value.as_number().unwrap().to_string().parse::<i16>().unwrap()',
//         'i8': 'return_value.as_number().unwrap().to_string().parse::<i8>().unwrap()',
//         'usize': '',
//         'u128': '',
//         'u64': '',
//         'u32': '',
//         'u16': '',
//         'u8': ''
//     }[functionReturnType];

//     // TODO Figure out a more elegant way to define the exports object than the string replace below
//     return `
//         #[ic_cdk_macros::update]
//         fn ${functionName}(${functionParametersString}) -> ${functionReturnType} {
//             let mut context = boa::Context::new();
        
//             let return_value = context.eval(format!(
//                 "
//                     {compiled_js}

//                     ${functionName}(${functionParameters.map((functionParameter) => {
//                         if (functionParameter.type === 'String') {
//                             return `\\"{${functionParameter.name}}\\"`;
//                         }

//                         return `{${functionParameter.name}}`;
//                     }).join(',')});
//                 ",
//                 compiled_js = r#"${compiledJs}"#,
//                 ${functionParameters.map((functionParameter) => {
//                     return `${functionParameter.name} = ${functionParameter.name}`;
//                 }).join(',')}
//             ).replace("Object.defineProperty", "let exports = {}; Object.defineProperty")).unwrap();
        
//             ic_cdk::println!("return_value: {:#?}", return_value);

//             ${returnValueConversionCode}
//         }
//     `;
// }

function isNodeAFunctionDeclaration(
    node: tsc.Node,
    icFunctionType: ICFunctionType
): boolean {
    if (tsc.isFunctionDeclaration(node) === false) {
        return false;
    }

    const functionDeclaration = node as tsc.FunctionDeclaration;

    if (functionDeclaration.type === undefined) {
        return false;
    }

    if (tsc.isTypeReferenceNode(functionDeclaration.type) === false) {
        return false;
    }

    const typeReferenceNode = functionDeclaration.type as tsc.TypeReferenceNode;

    if (tsc.isIdentifier(typeReferenceNode.typeName) === false) {
        return false;
    }

    const identifier = typeReferenceNode.typeName as tsc.Identifier;

    if (identifier.escapedText !== icFunctionType) {
        return false;
    }

    return true;
}

type RustType =
    'bool' |
    'String' |
    'isize' |
    'i128' |
    'i64' |
    'i32' |
    'i16' |
    'i8' |
    'usize' |
    'u128' |
    'u64' |
    'u32' |
    'u16' |
    'u8';

function getFunctionReturnType(
    functionDeclaration: tsc.FunctionDeclaration,
    icFunctionType: ICFunctionType
): RustType {
    const functionReturnTypes: {
        [key: string]: RustType | undefined
    } = {
        'bool': 'bool',
        'String': 'String',
        'isize': 'isize',
        'i128': 'i128',
        'i64': 'i64',
        'i32': 'i32',
        'i16': 'i16',
        'i8': 'i8',
        'usize': 'usize',
        'u128': 'u128',
        'u64': 'u64',
        'u32': 'u32',
        'u16': 'u16',
        'u8': 'u8'
    };
    
    const functionName = functionDeclaration.name?.escapedText;

    if (functionDeclaration.type === undefined) {
        throw new Error(`Azle::compile::getFunctionReturnType: TypeScript query function ${functionName} must have a return type`);
    }

    // TODO this might be repeat code
    if (tsc.isTypeReferenceNode(functionDeclaration.type)) {
        const typeReferenceNode = functionDeclaration.type as tsc.TypeReferenceNode;
        
        if (
            tsc.isIdentifier(typeReferenceNode.typeName) &&
            typeReferenceNode.typeName.escapedText === icFunctionType &&
            typeReferenceNode.typeArguments !== undefined &&
            typeReferenceNode.typeArguments.length === 1
        ) {
            const typeArgument = typeReferenceNode.typeArguments[0];

            if (typeArgument.kind === tsc.SyntaxKind.StringKeyword) {
                return 'String';
            }
        
            if (typeArgument.kind === tsc.SyntaxKind.BooleanKeyword) {
                return 'bool';
            }

            if (
                tsc.isTypeReferenceNode(typeArgument) &&
                tsc.isIdentifier(typeArgument.typeName)
            ) {
                const functionReturnType = functionReturnTypes[typeArgument.typeName.escapedText as string];
        
                if (functionReturnType !== undefined) {
                    return functionReturnType;
                }
            }
        }
    }

    throw new Error(`Azle::compile::getFunctionReturnType: TypeScript query function ${functionName} return type not supported`);
}

type RustParameter = Readonly<{
    name: string;
    type: RustType;
}>;

function getFunctionParameters(functionDeclaration: tsc.FunctionDeclaration): ReadonlyArray<RustParameter> {
    return functionDeclaration.parameters.map((parameter) => {
        if (
            tsc.isIdentifier(parameter.name) &&
            parameter.type !== undefined
            // &&
            // tsc.isTypeReferenceNode(parameter.type)
        ) {
            const parameterName = parameter.name.escapedText.toString();
            // const rustType = transformTypeReferenceNodeToRustType(parameter.type);
            const rustType = transformTypeNodeToRustType(parameter.type);
            
            return {
                name: parameterName,
                type: rustType
            };
        }
        
        throw new Error();
    });
}

function stringifyFunctionParameters(functionParameters: ReadonlyArray<RustParameter>): string {
    return functionParameters.map((functionParameter) => {
        return `${functionParameter.name}: ${functionParameter.type}`;
    }).join(', ');
}

function transformTypeNodeToRustType(typeNode: tsc.TypeNode): RustType {
    const rustTypes: {
        [key: string]: RustType | undefined
    } = {
        'bool': 'bool',
        'String': 'String',
        'isize': 'isize',
        'i128': 'i128',
        'i64': 'i64',
        'i32': 'i32',
        'i16': 'i16',
        'i8': 'i8',
        'usize': 'usize',
        'u128': 'u128',
        'u64': 'u64',
        'u32': 'u32',
        'u16': 'u16',
        'u8': 'u8'
    };

    if (typeNode.kind === tsc.SyntaxKind.StringKeyword) {
        return 'String';
    }

    if (typeNode.kind === tsc.SyntaxKind.BooleanKeyword) {
        return 'bool';
    }

    if (
        tsc.isTypeReferenceNode(typeNode) &&
        tsc.isIdentifier(typeNode.typeName)
    ) {
        const rustType = rustTypes[typeNode.typeName.escapedText as string];

        if (rustType !== undefined) {
            return rustType;
        }
    }

    throw new Error('TypeScript type not supported');
}

// function transformTypeReferenceNodeToRustType(typeReferenceNode: tsc.TypeReferenceNode): RustType {
//     if (
//         tsc.isIdentifier(typeReferenceNode.typeName) &&
//         typeReferenceNode.typeName.escapedText === 'Query' &&
//         typeReferenceNode.typeArguments !== undefined &&
//         typeReferenceNode.typeArguments.length === 1
//     ) {
//         const typeArgument = typeReferenceNode.typeArguments[0];

//         return transformTypeNodeToRustType(typeArgument);
//     }

//     // return 'NOT_FOUND';
//     throw new Error('Type not supported'); // TODO make this more elegant
// }