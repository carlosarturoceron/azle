use swc_common::SourceMap;
use swc_ecma_ast::TsArrayType;

use crate::{
    cdk_act::ToActDataType,
    ts_ast::{source_map::GetSourceFileInfo, GetDependencies, ToDisplayString},
};

#[derive(Clone)]
pub struct AzleArrayType<'a> {
    pub ts_array_type: TsArrayType,
    pub source_map: &'a SourceMap,
}

impl GetDependencies for AzleArrayType<'_> {
    fn get_dependent_types(
        &self,
        type_alias_lookup: &std::collections::HashMap<String, crate::ts_ast::AzleTypeAliasDecl>,
        found_type_names: &std::collections::HashSet<String>,
    ) -> std::collections::HashSet<String> {
        self.ts_array_type
            .get_dependent_types(type_alias_lookup, found_type_names)
    }
}

impl ToDisplayString for AzleArrayType<'_> {
    fn to_display_string(&self) -> String {
        self.source_map.get_span_text(self.ts_array_type.span)
    }
}

impl ToActDataType for AzleArrayType<'_> {
    fn to_act_data_type(&self, alias_name: &Option<&String>) -> crate::cdk_act::ActDataType {
        todo!()
    }
}
