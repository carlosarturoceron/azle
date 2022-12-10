pub fn generate_ic_object_function_clear_timer() -> proc_macro2::TokenStream {
    quote::quote! {
        fn _azle_ic_clear_timer(
            _this: &boa_engine::JsValue,
            _aargs: &[boa_engine::JsValue],
            _context: &mut boa_engine::Context
        ) -> boa_engine::JsResult<boa_engine::JsValue> {
            let timer_id_js_value: boa_engine::JsValue = _aargs.get(0).unwrap().clone();
            let timer_id: ic_cdk::timer::TimerId = timer_id_js_value.try_from_vm_value(&mut *_context).unwrap();

            Ok(ic_cdk::timer::clear_timer(timer_id).try_into_vm_value(_context).unwrap())
        }
    }
}
