import os
from PIL import Image

def clean_stray_line(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False
        
    img = Image.open(file_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    # We found that the stray line is Component 2 with bbox (849, 80, 992, 97) in logo_wide.png.
    # In other versions (if size is different), we can look for any non-transparent pixel in that relative area.
    # To be extremely safe and robust:
    # 1. We find the connected component that is isolated above Y < 100 in the X range [800, 1010].
    # Let's search for any non-transparent pixels in Y [70, 100] and X [840, 1000] and set them to transparent (0, 0, 0, 0).
    
    erased_count = 0
    for y in range(70, 102):
        for x in range(830, 1010):
            if y < height and x < width:
                if pixels[x, y][3] > 0:
                    pixels[x, y] = (0, 0, 0, 0)
                    erased_count += 1
                    
    img.save(file_path, "PNG")
    print(f"Successfully cleaned {file_path}: erased {erased_count} pixels.")
    return True

if __name__ == "__main__":
    logo_wide = r"c:\Users\USER\Desktop\JAMILY PAGINA\Projetoapp\Agenda-Inteligente.app-1\apps\web\public\images\logo_wide.png"
    logo_normal = r"c:\Users\USER\Desktop\JAMILY PAGINA\Projetoapp\Agenda-Inteligente.app-1\apps\web\public\images\logo.png"
    
    clean_stray_line(logo_wide)
    clean_stray_line(logo_normal)
