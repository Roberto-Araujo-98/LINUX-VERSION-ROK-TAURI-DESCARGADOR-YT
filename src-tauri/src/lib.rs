use tauri_plugin_shell::ShellExt;
use tauri::Manager; 

// Este es el comando que llamaremos desde el frontend (JavaScript)
#[tauri::command]
async fn ejecutar_descarga( // 👈 1. Añadimos "async" aquí
    app_handle: tauri::AppHandle, 
    url: String, 
    formato: String, 
    calidad: String 
) -> Result<String, String> {
    
    // 1. Obtener la ruta absoluta de la carpeta de recursos de Tauri
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| format!("No se pudo encontrar la ruta de recursos: {}", e))?;
    
    // Convertimos la ruta a un String legible
    let resource_str = resource_path.to_string_lossy().to_string();

    // 2. Obtener el PATH actual del sistema operativo para no romperlo
    let current_path = std::env::var("PATH").unwrap_or_default();
    
    // Unimos tu carpeta de recursos con el PATH actual usando el separador correcto según el OS
    let separador = if cfg!(windows) { ";" } else { ":" };
    let nuevo_path = format!("{}{}{}", resource_str, separador, current_path);

    // 3. Invocar el binario externo (Sidecar) registrado como "descargador-yt"
    let sidecar_command = app_handle
        .shell()
        .sidecar("descargador-yt")
        .map_err(|e| e.to_string())?;

    // 4. Pasar los argumentos y configurar el entorno INYECTANDO EL NUEVO PATH
    let sidecar_command = sidecar_command
        .env("PYTHONIOENCODING", "utf-8")
        .env("PATH", nuevo_path) 
        .args([url, formato, calidad]); 

    // 5. ¡LA MAGIA ASÍNCRONA! 🚀 
    // Ejecutamos directamente con `.await` sin usar block_on.
    // Esto mantiene el hilo de la interfaz de usuario libre y libre de congelamientos.
    let output = sidecar_command
        .output()
        .await 
        .map_err(|e| format!("Error al ejecutar el descargador: {}", e))?;

    // 6. Validar si el script de Python terminó con éxito o con errores
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(format!("Error en el script de Python: {}", stderr))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init()) // Inicializamos el plugin de Shell
        .invoke_handler(tauri::generate_handler![ejecutar_descarga]) // Registramos el comando
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}