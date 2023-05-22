use std::io::Error;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnableToLoadFile {}
// UnableToLoadFile, // "Error: Unable to load file {}\n{}", ts_file_name, err),

impl UnableToLoadFile {
    pub fn from_error(error: Error) -> Self {
        Self {}
    }
}

impl From<UnableToLoadFile> for crate::Error {
    fn from(error: UnableToLoadFile) -> Self {
        Self::UnableToLoadFile(error)
    }
}

impl std::fmt::Display for UnableToLoadFile {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "TODO")
    }
}
