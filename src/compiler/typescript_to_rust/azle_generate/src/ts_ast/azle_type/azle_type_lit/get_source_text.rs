use crate::ts_ast::{source_map::GetSourceFileInfo, GetSourceText};

use super::AzleTypeLit;

impl GetSourceText for AzleTypeLit<'_> {
    fn get_source_text(&self) -> String {
        self.source_map.get_source(self.ts_type_lit.span)
    }
}
