use tauri::{AppHandle, Emitter};
use std::time::Duration;

pub fn start_background_sync(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(30)).await;
            
            let _ = app.emit("trigger-sync", ());
        }
    });
}
