use std::collections::{HashMap, HashSet};
use swc_ecma_ast::TsArrayType;

use crate::cdk_act::{
    nodes::data_type_nodes::{ActArray, ActArrayLiteral, ActArrayTypeAlias, LiteralOrTypeAlias},
    ActDataType, ToActDataType,
};

use super::{ast_traits::ToDisplayString, AzleTypeAliasDecl, GetDependencies};

impl GetDependencies for TsArrayType {
    fn get_dependent_types(
        &self,
        type_alias_lookup: &HashMap<String, AzleTypeAliasDecl>,
        found_type_names: &HashSet<String>,
    ) -> HashSet<String> {
        self.elem_type
            .get_dependent_types(type_alias_lookup, found_type_names)
    }
}

impl ToActDataType for TsArrayType {
    fn to_act_data_type(&self, name: &Option<&String>) -> crate::cdk_act::ActDataType {
        let elem_ts_type = self.elem_type.clone();
        let act_elem = elem_ts_type.to_act_data_type(&None);
        match name {
            Some(name) => ActDataType::Array(ActArray {
                act_type: LiteralOrTypeAlias::TypeAlias(ActArrayTypeAlias {
                    name: name.clone().clone(),
                    enclosed_type: Box::from(act_elem.clone()),
                }),
            }),
            None => ActDataType::Array(ActArray {
                act_type: LiteralOrTypeAlias::Literal(ActArrayLiteral {
                    enclosed_type: Box::from(act_elem.clone()),
                }),
            }),
        }
    }
}

impl ToDisplayString for TsArrayType {
    fn to_display_string(&self) -> String {
        format!("{}[]", self.elem_type.to_display_string())
    }
}
