use swc_ecma_ast::ClassProp;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NamespaceQualifiedType {}

impl NamespaceQualifiedType {
    pub fn from_class_prop(class_prop: &ClassProp) -> Self {
        // Self::NamespaceQualifiedType => "Unsupported data type. Qualified types are not currently supported. Try importing the type directly.",
        Self {}
    }
}

impl From<NamespaceQualifiedType> for crate::Error {
    fn from(error: NamespaceQualifiedType) -> Self {
        Self::NamespaceQualifiedType(error)
    }
}

impl std::fmt::Display for NamespaceQualifiedType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "TODO")
    }
}
