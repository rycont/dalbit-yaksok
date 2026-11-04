use zed_extension_api as zed;

struct MdTsLsp;

impl zed::Extension for MdTsLsp {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> zed::Result<zed::Command> {
        let root = worktree.root_path();
        Ok(zed::Command {
            command: format!("{root}/sidekick/md-ts-lsp/target/debug/md-ts-lsp"),
            args: vec![
                "--stdio".to_string(),
                "--worktree".to_string(),
                root.clone(),
                "--tsserver".to_string(),
                format!("{root}/sidekick/md-ts-lsp/bin/tsc"),
            ],
            env: Default::default(),
        })
    }
}

zed::register_extension!(MdTsLsp);
