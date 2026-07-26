import os
import sys
import io

# Forzar UTF-8 en los canales estándar de Windows para evitar errores con emojis en Tauri
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

try:
    import yt_dlp
    from yt_dlp.utils import DownloadError
except ImportError:
    print("❌ Error: La biblioteca 'yt-dlp' no está instalada.")
    print("💡 Instálala ejecutando: pip install yt-dlp")
    sys.exit(1)

def mostrar_menu():
    print("=" * 50)
    print(" 🎬 YOUTUBE MEDIA DOWNLOADER & EXTRACTOR - ROK ")
    print("=" * 50)
    print("1. 🎵 Descargar solo AUDIO (Formato MP3 - Máxima Calidad)")
    print("2. 🎥 Descargar VIDEO Completo (Elegir Calidad)")
    print("3. ❌ Salir")
    print("-" * 50)

def elegir_calidad_video(opc_manual=None):
    # Si viene desde la interfaz gráfica de Tauri, ya tenemos la opción predefinida en opc_manual
    opc = opc_manual if opc_manual else input("Selecciona una calidad (1-3): ").strip()
    
    if opc == '2':
        return 'bestvideo[height<=720]+bestaudio/best'
    elif opc == '3':
        return 'bestvideo[height<=480]+bestaudio/best'
    else:
        return 'bestvideo+bestaudio/best'

def descargar_media(url, opcion, calidad_predefinida=None):
    # 🎯 LOCALIZADOR ABSOLUTO DE FFMPEG PARA ENTORNO TAURI
    ffmpeg_bin = None

    if getattr(sys, 'frozen', False):
        # 🤖 MODO TAURI COMPILADO / PRODUCCIÓN:
        directorio_real_exe = os.path.dirname(os.path.abspath(sys.executable))
        
        opciones_ruta = [
            os.path.join(directorio_real_exe, 'ffmpeg.exe'),      # Al lado de tu binario en src-tauri/binaries
            os.path.join(directorio_real_exe, '..', 'resources', 'ffmpeg.exe'), # Estructura instalada de producción
            os.path.join(directorio_real_exe, 'resources', 'ffmpeg.exe')
        ]
        for ruta in opciones_ruta:
            if os.path.exists(ruta):
                ffmpeg_bin = os.path.abspath(ruta)
                break
    else:
        # 💻 MODO MANUAL / ENTORNO DESARROLLO DE TAURI:
        directorio_script = os.path.dirname(os.path.abspath(__file__))
        opciones_ruta = [
            os.path.join(directorio_script, 'ffmpeg.exe'),
            os.path.join(directorio_script, 'src-tauri', 'binaries', 'ffmpeg.exe'),
            os.path.join(os.path.dirname(directorio_script), 'src-tauri', 'binaries', 'ffmpeg.exe')
        ]
        for ruta in opciones_ruta:
            if os.path.exists(ruta):
                ffmpeg_bin = os.path.abspath(ruta)
                break

    # Si por alguna razón no lo mapeó, dejamos 'ffmpeg' para que use el global de Windows si existe
    if not ffmpeg_bin:
        ffmpeg_bin = 'ffmpeg'

    # 📥 Ubicación nativa: Carpeta de descargas del usuario de Windows
    carpeta_descargas = os.path.join(os.environ['USERPROFILE'], 'Downloads')

    # Configuración base común para yt-dlp
    ydl_opts = {
        'outtmpl': os.path.join(carpeta_descargas, '%(title)s.%(ext)s'),
        'quiet': False,
        'no_warnings': True,
        'ffmpeg_location': ffmpeg_bin,  # Mapeo obligatorio del binario para conversiones y uniones
        'noplaylist': True,
        'playlist_items': '1',
        'extract_flat': 'discard_in_playlist',
    }

    # Evaluar la opción enviada por Tauri ('audio' o 'video') o por el menú manual ('1' o '2')
    if opcion in ['1', 'audio']:
        print(f"🎧 Configurando extracción de audio en MP3 usando: {ffmpeg_bin}")
        ydl_opts.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        })
    elif opcion in ['2', 'video']:
        # Mapeamos dinámicamente la calidad requerida
        formato_seleccionado = elegir_calidad_video(calidad_predefinida)
            
        print(f"📺 Configurando descarga de video con la resolución elegida usando: {ffmpeg_bin}")
        ydl_opts.update({
            'format': formato_seleccionado,
            'merge_output_format': 'mp4',
        })

    try:
        print("🚀 Iniciando descarga desde YouTube... Por favor, espera.")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        print(f"\n✅ ¡Descarga completada con éxito!")
        print(f"📍 Ubicación: {carpeta_descargas}\n")
    except DownloadError as de:
        print(f"\n❌ Error de yt-dlp: {de}")
    except Exception as e:
        print(f"\n❌ Ocurrió un error crítico durante la descarga: {e}")

if __name__ == "__main__":
    # 🤖 INTERFAZ DE TAURI: Si Rust le inyecta argumentos por consola (URL, formato y opcionalmente calidad)
    if len(sys.argv) >= 3:
        url_argumento = sys.argv[1].strip()
        formato_argumento = sys.argv[2].strip()
        
        # Leemos el 4° argumento si existe (la calidad '1', '2' o '3')
        calidad_argumento = sys.argv[3].strip() if len(sys.argv) >= 4 else None
        
        descargar_media(url_argumento, formato_argumento, calidad_argumento)
        
    # 💻 USO MANUAL: Si abres el script directamente en la terminal
    else:
        while True:
            mostrar_menu()
            opcion = input("Selecciona una opción (1-3): ").strip()

            if opcion == '3':
                print("👋 Saliendo del descargador. ¡Hasta luego!")
                break

            if opcion in ['1', '2']:
                url = input("🔗 Pega el enlace del video de YouTube: ").strip()
                if not url:
                    print("❌ El enlace no puede estar vacío. Intenta de nuevo.\n")
                    continue
                
                # En modo manual el tercer parámetro se queda vacío para que pregunte por consola
                descargar_media(url, opcion)
            else:
                print("❌ Opción no reconocida. Por favor, digita 1, 2 o 3.\n")