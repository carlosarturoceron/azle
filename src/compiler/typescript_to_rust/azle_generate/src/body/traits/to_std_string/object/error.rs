use proc_macro2::TokenStream;
use quote::quote;

pub fn generate() -> TokenStream {
    quote! {
        fn js_error_object_to_string(
            js_object: &boa_engine::JsObject,
            nesting_level: usize,
            context: &mut boa_engine::Context,
        ) -> String {
            try_js_error_object_to_string(js_object, nesting_level, context).unwrap_or_else(
                |js_error| {
                    let cause = js_error.to_std_string(0, &mut *context);

                    format!(
                        "InternalError: Encountered an error while serializing an error\n  \
                        [cause]: {cause}"
                    )
                },
            )
        }

        fn try_js_error_object_to_string(
            js_object: &boa_engine::JsObject,
            nesting_level: usize,
            context: &mut boa_engine::Context,
        ) -> Result<String, boa_engine::JsError> {
            let error_name = get_js_error_name(js_object, context)?;
            let error_message = get_js_error_message(js_object, context)?;
            let cause_opt = get_js_error_cause(js_object, context)?;

            let error_string = match cause_opt {
                Some(cause) => {
                    let indent = "  ".repeat(nesting_level + 1);

                    format!("{error_name}: {error_message}\n{indent}[cause]: {cause}")
                }
                None => format!("{error_name}: {error_message}"),
            };

            Ok(error_string)
        }

        fn get_js_error_name(
            js_object: &boa_engine::JsObject,
            context: &mut boa_engine::Context,
        ) -> Result<String, boa_engine::JsError> {
            match js_object.prototype() {
                Some(prototype_js_object) => prototype_js_object
                    .get("name", &mut *context)?
                    .try_from_vm_value(&mut *context),
                None => Ok("Error".to_string()),
            }
        }

        fn get_js_error_message(
            js_object: &boa_engine::JsObject,
            context: &mut boa_engine::Context,
        ) -> Result<String, boa_engine::JsError> {
            js_object
                .get("message", &mut *context)?
                .try_from_vm_value(&mut *context)
        }

        fn get_js_error_cause(
            js_object: &boa_engine::JsObject,
            context: &mut boa_engine::Context,
        ) -> Result<Option<String>, boa_engine::JsError> {
            match js_object.get("cause", &mut *context) {
                Ok(cause_js_value) => {
                    if cause_js_value.is_undefined() {
                        Ok(None)
                    } else {
                        Ok(Some(cause_js_value.to_std_string(0, &mut *context)))
                    }
                }
                Err(js_error) => Err(js_error),
            }
        }
    }
}