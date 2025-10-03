// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Child};
use std::sync::Mutex;
use tauri::Manager;

struct AppState {
    server: Mutex<Option<Child>>,
}

fn start_server(resource_dir: &std::path::PathBuf) -> Result<Child, std::io::Error> {
    #[cfg(target_os = "macos")]
    let node_path = "/Users/makkuragatama/.nvm/versions/node/v20.19.5/bin/node";
    
    #[cfg(target_os = "windows")]
    let node_path = "node";
    
    #[cfg(target_os = "linux")]
    let node_path = "node";

    println!("Resource directory: {:?}", resource_dir);
    println!("Starting Node.js server with path: {}", node_path);
    
    let child = Command::new(node_path)
        .arg("server-standalone.js")
        .current_dir(resource_dir)
        .env("PORT", "3006")
        .env("NODE_ENV", "production")
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()?;

    Ok(child)
}

fn main() {
    let state = AppState {
        server: Mutex::new(None),
    };

    tauri::Builder::default()
        .manage(state)
        .setup(|app| {
            let state = app.state::<AppState>();
            let mut resource_path = app.path().resource_dir().expect("failed to get resource dir");
            resource_path.push("_up_");
            
            println!("App resource path: {:?}", resource_path);
            
            if !resource_path.exists() {
                eprintln!("Resource path does not exist: {:?}", resource_path);
                return Err("Resource path not found".into());
            }
            
            match start_server(&resource_path) {
                Ok(child) => {
                    println!("Server started on port 3006");
                    *state.server.lock().unwrap() = Some(child);
                    
                    std::thread::sleep(std::time::Duration::from_secs(5));
                }
                Err(e) => {
                    eprintln!("Failed to start server: {}", e);
                    return Err(e.into());
                }
            }
            
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<AppState>() {
                    if let Ok(mut server) = state.server.lock() {
                        if let Some(mut child) = server.take() {
                            let _ = child.kill();
                            println!("Server stopped");
                        }
                    }
                }
            }
        });
}