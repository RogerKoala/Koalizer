// Prevents an extra console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::{Arc, Mutex};
use tauri::RunEvent;
use std::process::Command;

use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandEvent};

fn main() {
    let backend_pid: Arc<Mutex<Option<u32>>> = Arc::new(Mutex::new(None));
    
    let backend_pid_clone = backend_pid.clone();

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {

            {
                let sidecar_command = app.shell().sidecar("backend-koalizer")
                    .expect("Failed to configure sidecar");

                let (mut rx, child) = sidecar_command
                    .spawn()
                    .expect("Failed to start sidecar");

                let pid = child.pid();
                println!("Sidecar started with PID: {}", pid);

                let mut lock = backend_pid_clone.lock().unwrap();
                *lock = Some(pid);

                tauri::async_runtime::spawn(async move {
                    while let Some(event) = rx.recv().await {
                        match event {
                            CommandEvent::Stdout(line_bytes) => {
                                let line = String::from_utf8_lossy(&line_bytes);
                                println!("[BACKEND]: {}", line);
                            }
                            CommandEvent::Stderr(line_bytes) => {
                                let line = String::from_utf8_lossy(&line_bytes);
                                eprintln!("[BACKEND ERROR]: {}", line);
                            }
                            _ => {}
                        }
                    }
                });
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("failed to build tauri app");

    app.run(move |_app_handle, event| {
        match event {
            RunEvent::ExitRequested { .. } => {
                println!("App closing, executing TASKKILL on sidecar...");
                
                let lock = backend_pid.lock().unwrap();
                if let Some(pid) = *lock {
                    let _ = Command::new("taskkill")
                        .args(["/F", "/T", "/PID", &pid.to_string()])
                        .output();
                        
                    println!("Taskkill command sent to PID {}", pid);
                }
            }
            _ => {}
        }
    });
}