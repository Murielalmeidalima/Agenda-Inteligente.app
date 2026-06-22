import os
from PIL import Image

logo_path = r"c:\Users\USER\Desktop\JAMILY PAGINA\Projetoapp\Agenda-Inteligente.app-1\apps\web\public\images\logo_wide.png"

if not os.path.exists(logo_path):
    print("Error: logo_wide.png not found")
    exit(1)

img = Image.open(logo_path).convert("RGBA")
width, height = img.size
pixels = img.load()

found_pixels = 0
for y in range(70, 102):
    for x in range(830, 1010):
        if y < height and x < width:
            if pixels[x, y][3] > 0:
                found_pixels += 1

print(f"Check results: found {found_pixels} non-transparent pixels in the stray line region.")
comp_ys = []
comp_xs = []
for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        # Let's see if there is any other stray pixels around Y < 100 in the center/right area X > 450
        if y < 103 and x > 450 and a > 0:
            comp_ys.append(y)
            comp_xs.append(x)

if comp_ys:
    print(f"Stray pixels still exist! Y range: [{min(comp_ys)}, {max(comp_ys)}], X range: [{min(comp_xs)}, {max(comp_xs)}]. Total count: {len(comp_ys)}")
else:
    print("No stray pixels found in the Y < 103, X > 450 region!")
