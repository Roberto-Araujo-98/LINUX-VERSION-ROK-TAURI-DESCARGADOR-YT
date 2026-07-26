from PIL import Image

# 1. Abrir la imagen del zorro
img = Image.open("fox_github.png")
ancho, alto = img.size

# 2. Calcular el tamaño del cuadrado perfecto basado en el lado más corto
nuevo_lado = min(ancho, alto)

# 3. Recortar centrado
izq = (ancho - nuevo_lado) / 2
arriba = (alto - nuevo_lado) / 2
der = (ancho + nuevo_lado) / 2
abajo = (alto + nuevo_lado) / 2

img_cuadrada = img.crop((izq, arriba, der, abajo))

# 4. Redimensionar a una excelente resolución base para Tauri
img_final = img_cuadrada.resize((1024, 1024), Image.LANCZOS)

# 5. Guardar como PNG de alta calidad
img_final.save("app_icon.png")
print("¡Imagen cuadrada 'app_icon.png' generada con éxito!")