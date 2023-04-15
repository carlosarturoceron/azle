use std::path::Path;
use swc_common::{sync::Lrc, SourceMap};
use swc_ecma_ast::{Decl, ModuleDecl, ModuleItem, Program, Stmt, TsTypeAliasDecl};
use swc_ecma_parser::{lexer::Lexer, Parser, StringInput, Syntax, TsConfig};

use crate::ts_ast::source_map::SourceMapped;

pub use azle_type::AzleFnOrConstructorType;
pub use traits::{GetName, GetSourceText, GetTsType};

pub mod azle_type;
pub mod source_map;
pub mod traits;
pub mod ts_type;
pub mod ts_type_element;

pub struct AzleProgram {
    pub program: swc_ecma_ast::Program,
    pub source_map: SourceMap,
}

pub struct TsAst {
    pub azle_programs: Vec<AzleProgram>,
    pub main_js: String,
}

impl TsAst {
    pub fn new(ts_file_names: &Vec<&str>, main_js: String) -> Self {
        let azle_programs = ts_file_names
            .iter()
            .map(|ts_file_name| to_azle_program(ts_file_name))
            .collect();

        Self {
            azle_programs,
            main_js,
        }
    }

    // Note: Both module_items and decls seem like useful methods but we're not
    // currently using them so I just commented them out for now.

    // pub fn module_items(&self) -> Vec<SourceMapped<ModuleItem>> {
    //     self.azle_programs
    //         .iter()
    //         .fold(vec![], |mut acc, azle_program| {
    //             if let Program::Module(module) = &azle_program.program {
    //                 let source_mapped_module_items: Vec<_> = module
    //                     .body
    //                     .iter()
    //                     .map(|module_item| SourceMapped::new(module_item, &azle_program.source_map))
    //                     .collect();

    //                 acc.extend(source_mapped_module_items);
    //             }
    //             acc
    //         })
    // }

    // pub fn decls(&self) -> Vec<SourceMapped<Decl>> {
    //     self.azle_programs
    //         .iter()
    //         .fold(vec![], |mut acc, azle_program| {
    //             if let Program::Module(module) = &azle_program.program {
    //                 module
    //                     .body
    //                     .iter()
    //                     .for_each(|module_item| match module_item {
    //                         ModuleItem::ModuleDecl(decl) => match decl {
    //                             ModuleDecl::ExportDecl(export_decl) => {
    //                                 acc.push(SourceMapped::new(
    //                                     &export_decl.decl,
    //                                     &azle_program.source_map,
    //                                 ));
    //                             }
    //                             _ => (),
    //                         },
    //                         ModuleItem::Stmt(stmt) => match stmt {
    //                             Stmt::Decl(decl) => {
    //                                 acc.push(SourceMapped::new(decl, &azle_program.source_map));
    //                             }
    //                             _ => (),
    //                         },
    //                     })
    //             }
    //             acc
    //         })
    // }

    pub fn ts_type_alias_decls(&self) -> Vec<SourceMapped<TsTypeAliasDecl>> {
        self.azle_programs
            .iter()
            .fold(vec![], |mut acc, azle_program| {
                if let Program::Module(module) = &azle_program.program {
                    module
                        .body
                        .iter()
                        .for_each(|module_item| match module_item {
                            ModuleItem::ModuleDecl(decl) => match decl {
                                ModuleDecl::ExportDecl(export_decl) => {
                                    let decl = &export_decl.decl;
                                    if let Decl::TsTypeAlias(ts_type_alias_decl) = decl {
                                        acc.push(SourceMapped::new(
                                            ts_type_alias_decl,
                                            &azle_program.source_map,
                                        ));
                                    }
                                }
                                _ => (),
                            },
                            ModuleItem::Stmt(stmt) => match stmt {
                                Stmt::Decl(decl) => {
                                    if let Decl::TsTypeAlias(ts_type_alias_decl) = decl {
                                        // acc is mut because SourceMapped<FnDecl> can't be cloned, which is
                                        // necessary to do something like:
                                        // return vec![
                                        //     acc,
                                        //     vec![SourceMapped::new(
                                        //         ts_type_alias_decl,
                                        //         &azle_program.source_map,
                                        //     )],
                                        // ]
                                        // .concat();

                                        acc.push(SourceMapped::new(
                                            ts_type_alias_decl,
                                            &azle_program.source_map,
                                        ));
                                    }
                                }
                                _ => (),
                            },
                        })
                }
                acc
            })
    }
}

fn to_azle_program(ts_file_name: &str) -> AzleProgram {
    let filepath = Path::new(ts_file_name).to_path_buf();

    let cm: Lrc<SourceMap> = Default::default();

    let fm = match cm.load_file(&filepath) {
        Ok(rc_source_file) => rc_source_file,
        Err(err) => panic!("Error: Unable to load file {}\n{}", ts_file_name, err),
    };

    let lexer = Lexer::new(
        Syntax::Typescript(TsConfig {
            decorators: true,
            ..TsConfig::default()
        }),
        Default::default(),
        StringInput::from(&*fm),
        None,
    );

    let mut parser = Parser::new_from(lexer);

    let parse_result = parser.parse_program();
    match parse_result {
        Ok(program) => {
            if let Ok(source_map) = std::rc::Rc::try_unwrap(cm) {
                return AzleProgram {
                    program,
                    source_map,
                };
            };
            panic!("Unreachable");
        }
        Err(error) => panic!("{}: Syntax Error: {}", ts_file_name, error.kind().msg()),
    }
}
