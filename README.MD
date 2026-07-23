# 🦊 ROK Tauri YouTube Downloader ⚡🤖

Cliente de escritorio ultra elegante y de alto rendimiento para descargar videos y audio de YouTube. Desarrollado con la velocidad de **Rust (Tauri v2)**, un **sidecar de Python** personalizado y una interfaz web moderna y responsiva.

Este proyecto utiliza el patrón seguro **Sidecar** de Tauri para delegar las tareas pesadas de extracción y procesamiento de video a un backend local de Python compilado, manteniendo la aplicación principal sumamente ligera y rápida.

---

## 📐 Arquitectura y Funcionamiento

```
┌──────────────────────────────────────┐
│          Frontend (HTML/CSS/JS)      │  <-- Interfaz Cyberpunk con estilo
└──────────────────┬───────────────────┘
                   │  (Tauri IPC / Comandos)
┌──────────────────▼───────────────────┐
│          Backend en Rust (Tauri)     │  <-- Orquestador y Gestor de Ventanas Nativo
└──────────────────┬───────────────────┘
                   │  (Ejecución del Sidecar mediante std::process)
┌──────────────────▼───────────────────┐
│     Binario Sidecar de Python (ELF)  │  <-- Extractor y descargador compilado
└──────────────────┬───────────────────┘
                   │  (Llamadas a Subprocesos)
┌──────────────────▼───────────────────┐
│         FFmpeg y FFprobe             │  <-- Mezclado de flujos de Audio/Video (Muxing)
└──────────────────────────────────────┘
```

---

## 🛠️ Requisitos del Sistema

Antes de compilar o ejecutar el proyecto en modo de desarrollo, asegúrate de tener instalado lo siguiente en tu sistema:

*   **Rust (MSRV 1.75+)**: Instalado a través de [rustup](https://rustup.rs/).
*   **Python 3.10+**: Necesario únicamente para compilar el script descargador.
*   **Dependencias de compilación de Tauri para Linux**: `build-essential`, `pkg-config`, `libwebkit2gtk-4.1-dev`, `libssl-dev`, `libgtk-3-dev`, `librsvg2-dev` (los nombres exactos varían según tu distribución: Debian/Ubuntu usan `apt`, Fedora usa `dnf`, Arch usa `pacman`).
*   **FFmpeg**: Instalado a través del gestor de paquetes de tu sistema (ver sección de configuración más abajo).

> Este proyecto se compila y ejecuta enteramente con **Cargo**, sin depender de Node.js ni npm.

---

## 🚀 Cómo Generar los Ejecutables

Por motivos de seguridad, optimización de peso y para respetar el límite de almacenamiento, los archivos ejecutables binarios se encuentran excluidos del repositorio de Git. Debes generarlos o colocarlos manualmente en sus respectivas rutas antes de compilar la aplicación.

### 1. Compilar el Sidecar de Python (`descargador-yt.py`)

Tauri requiere que los binarios externos (sidecars) sigan una convención de nomenclatura estricta que incluya la "triple diana" del sistema objetivo (por ejemplo, `x86_64-unknown-linux-gnu` para Linux de 64 bits).

Para compilar tu script de Python en un ejecutable independiente:

1.  Abre la terminal en la carpeta raíz del proyecto.
2.  Instala **PyInstaller** si aún no lo tienes:
    ```bash
    pip install pyinstaller
    ```
3.  Navega a la carpeta de binarios y ejecuta PyInstaller:
    ```bash
    cd src-tauri/binaries
    pyinstaller --onefile --name descargador-yt-x86_64-unknown-linux-gnu descargador-yt.py
    ```
4.  Una vez finalizada la compilación:
    *   Ve a la carpeta temporal `src-tauri/binaries/dist/`.
    *   Mueve el archivo generado `descargador-yt-x86_64-unknown-linux-gnu` directamente a la carpeta raíz de binarios: `src-tauri/binaries/`.
    *   Dale permisos de ejecución al binario:
        ```bash
        chmod +x src-tauri/binaries/descargador-yt-x86_64-unknown-linux-gnu
        ```
    *   Puedes borrar con total seguridad las carpetas temporales `build/`, `dist/` y el archivo `.spec` creados por PyInstaller.

### 2. Configurar FFmpeg y FFprobe

Para poder unir flujos de video de alta calidad (1080p, 4K) con sus respectivas pistas de audio sin perder definición, la aplicación necesita las herramientas de **FFmpeg**.

En Linux, en lugar de empaquetar binarios estáticos, la aplicación consume el comando global `ffmpeg`/`ffprobe` ya instalado en el sistema. Instálalo con el gestor de paquetes de tu distribución:

```bash
# Debian / Ubuntu
sudo apt install ffmpeg

# Fedora
sudo dnf install ffmpeg

# Arch Linux
sudo pacman -S ffmpeg
```

Verifica que ambos binarios estén disponibles en tu `PATH`:

```bash
ffmpeg -version
ffprobe -version
```

---

## 💻 Desarrollo y Compilación

Una vez que tengas todos los binarios necesarios en sus carpetas correspondientes, puedes ejecutar la aplicación de forma local o empaquetarla para su distribución usando **Cargo**.

### Ejecutar en Modo de Desarrollo

```bash
# Iniciar Tauri en modo de desarrollo con recarga en vivo
cargo tauri dev
```

### Compilar para Distribución

```bash
# Compila todo el código en un paquete optimizado y ligero (.deb / .AppImage)
cargo tauri build
```

---

## 🔮 Ruta de Desarrollo Futuro (Expansión Multiplataforma)

Para transformar esta herramienta local en un software compatible con múltiples sistemas operativos, se han planteado los siguientes objetivos de desarrollo:

### 🪟 1. Compatibilidad con Windows

*   **Compilación de Sidecars**: Compilar el sidecar de Python dentro de un entorno Windows usando PyInstaller para apuntar al objetivo `x86_64-pc-windows-msvc`:
    ```bash
    pyinstaller --onefile --noconsole --name descargador-yt-x86_64-pc-windows-msvc descargador-yt.py
    ```
*   **Dependencias del Sistema**: Empaquetar los binarios estáticos de `ffmpeg.exe` y `ffprobe.exe` dentro de `src-tauri/resources/`, ya que Windows no cuenta con un gestor de paquetes estándar equivalente.
*   **Empaquetado**: Generar instaladores nativos como archivos `.msi` o `.exe`.

### 🤖 2. Adaptación a Android (Tauri v2 Mobile)

*   **Cambio Arquitectónico**: Los dispositivos móviles Android no pueden ejecutar directamente binarios de escritorio. La lógica de extracción escrita en Python se migrará hacia:
    *   Un módulo embebido en **Rust** usando bindings nativos (como la librería `pyo3` si se requiere conservar Python estrictamente).
    *   O bien, reescribir toda la lógica de obtención directamente en **módulos nativos de Rust** (utilizando librerías de red y concurrencia como `tokio` y procesadores de HTTP personalizados).
*   **Integración del NDK de Android**: Compilar el motor de procesamiento multimedia adaptando los targets nativos de Android (`aarch64-linux-android`, `armv7-linux-androideabi`).
*   **Optimización de Interfaz**: Adaptar el panel de control Cyberpunk para que sea completamente responsivo y cómodo en pantallas táctiles y móviles.

---

## 📜 Licencia e Intención

Desarrollado como una aplicación de escritorio local, rápida y segura. Bajo una optimización constante guiada por un enfoque de desarrollo activo y libre, disfrutando de la creación pura de software sin límites.

## 🔄 Mantenimiento y Actualizaciones

Debido a que **YouTube** modifica constantemente su plataforma, APIs y algoritmos de firma digital para evitar las descargas, es completamente normal que las herramientas de extracción dejen de funcionar de vez en cuando. 

Para garantizar que **DESCARGADOR-YT-ROK** siga funcionando a la perfección, este proyecto se mantendrá y actualizará de manera continua a través de este repositorio de GitHub.

### 🛠️ ¿Cómo mantener tu app al día?
Si notas que un video da error o que la descarga se interrumpe de la nada:

1. **Revisa la pestaña de Releases:** Dirígete a la sección de *Releases* en este repositorio.
2. **Descarga la última versión:** Bájate el paquete `.deb` o `.AppImage` más reciente.
3. **Instala sin miedo:** Instala el nuevo paquete sobre el anterior. Esto actualizará el motor interno de descargas (`yt-dlp`) sin que tengas que configurar nada de nuevo.

> 💡 **Próximamente:** Estamos planificando la integración del actualizador automático nativo (*Tauri Updater*). En futuras versiones, la app se conectará a este repositorio al iniciar y te avisará si hay una actualización lista para instalar con un solo clic.

*Creado por Roberto Ricardo Araujo Ari - ROK.*