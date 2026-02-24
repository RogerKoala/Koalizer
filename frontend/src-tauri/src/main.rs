// Prevents an extra console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::sync::{Arc, Mutex};
use tauri::RunEvent;

#[cfg(not(debug_assertions))]
use tauri_plugin_shell::process::CommandEvent;
#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn main() {
    #[cfg(not(debug_assertions))]
    let backend_pid: Arc<Mutex<Option<u32>>> = Arc::new(Mutex::new(None));

    #[cfg(not(debug_assertions))]
    let backend_pid_clone = backend_pid.clone();

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(move |_app| {
            #[cfg(not(debug_assertions))]
            {
                let sidecar_command = _app
                    .shell()
                    .sidecar("Server")
                    .expect("Failed to configure sidecar");

                let (mut rx, child) = sidecar_command.spawn().expect("Failed to start sidecar");

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

            #[cfg(debug_assertions)]
            {
                println!("--- DEV MODE ---");
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("failed to build tauri app");

    app.run(move |_app_handle, event| match event {
        RunEvent::ExitRequested { .. } => {
            #[cfg(not(debug_assertions))]
            {
                println!("App closing, killing backend process tree...");

                let lock = backend_pid.lock().unwrap();
                if let Some(pid) = *lock {
                    #[cfg(target_os = "windows")]
                    let _ = Command::new("taskkill")
                        .args(["/F", "/T", "/PID", &pid.to_string()])
                        .creation_flags(CREATE_NO_WINDOW)
                        .output();

                    println!("Backend process tree terminated (PID {}).", pid);
                }
            }
        }
        _ => {}
    });
}