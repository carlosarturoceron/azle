use crate::{utils::fn_decls::{
    CanisterMethodType,
    get_canister_method_type_fn_decls,
}, generators::canister_methods::{functions::{generate_param_name_idents, generate_param_types, generate_params_token_stream}, method_body::generate_call_to_js_function}};
use quote::quote;
use crate::generators::ic_object::generate_ic_object;
use swc_ecma_ast::{
    Program,
    FnDecl
};

pub fn generate_canister_method_system_init(programs: &Vec<Program>) -> proc_macro2::TokenStream {
    let ic_object = generate_ic_object();

    let init_fn_decls = get_canister_method_type_fn_decls(programs, &CanisterMethodType::Init);

    if init_fn_decls.len() > 1 {
        panic!("Only one init function can be defined");
    }

    let init_fn_decl_option = init_fn_decls.get(0);

    let init_params = generate_init_params(&init_fn_decl_option);

    let call_to_init_js_function = generate_call_to_init_js_function(&init_fn_decl_option);

    quote! {
        #[ic_cdk_macros::init]
        fn _azle_init(#(#init_params),*) {
            unsafe {
                BOA_CONTEXT_OPTION = Some(boa_engine::Context::default());
                let mut _azle_boa_context = BOA_CONTEXT_OPTION.as_mut().unwrap();

                #ic_object

                _azle_boa_context.register_global_property(
                    "ic",
                    ic,
                    boa_engine::property::Attribute::all()
                );

                _azle_boa_context.eval(format!(
                    "let exports = {{}}; {compiled_js}",
                    compiled_js = MAIN_JS
                )).unwrap();

                #call_to_init_js_function
            }
        }
    }
}

fn generate_init_params(init_fn_decl_option: &Option<&FnDecl>) -> Vec<proc_macro2::TokenStream> {
    if let Some(init_fn_decl) = init_fn_decl_option {
        // TODO this part should be refactored to allow us to get a params data structure by just passing in a &FnDecl
        // TODO that params data structures can have the name, the type, and both strings and idents as necessary
        let param_name_idents = generate_param_name_idents(&init_fn_decl.function.params);
        let param_types = generate_param_types(&init_fn_decl.function.params);
        let params = generate_params_token_stream(&param_name_idents, &param_types);

        params
    }
    else {
        vec![]
    }
}

fn generate_call_to_init_js_function(init_fn_decl_option: &Option<&FnDecl>) -> proc_macro2::TokenStream {
    if let Some(init_fn_decl) = init_fn_decl_option {
        generate_call_to_js_function(init_fn_decl)
    }
    else {
        quote!()
    }
}
