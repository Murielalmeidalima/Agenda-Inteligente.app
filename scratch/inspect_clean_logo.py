import os
from PIL import Image

logo_path = r"c:\Users\USER\Desktop\JAMILY PAGINA\Projetoapp\Agenda-Inteligente.app-1\apps\web\public\images\logo_wide.png"

if not os.path.exists(logo_path):
    print("Error: logo_wide.png not found at path")
    exit(1)

img = Image.open(logo_path).convert("RGBA")
width, height = img.size
print(f"Dimensions of logo_wide.png: {width}x{height}")

# Let's inspect the pixels in the top area of the image.
# Usually, the stroke is right above the letter "E" in "AGENDA", which is in the upper part of the image, middle-right.
# Let's locate where the stroke is. Let's dump transparency/colors to see where pixels are.
# Alternatively, we can clear a box of pixels in the top area where the stray line is.
# Let's look at the user's circle: the circle is above "E" in "AGENDA".
# In "logo_wide.png", let's inspect the bounding box of non-transparent pixels.
# Let's save a copy with the top-center golden pixels cleared.
# Let's write a script to detect any separate component or clear Y coordinate range [0 to height*0.25] for the middle part.

pixels = img.load()
for y in range(height):
    row_pixels = []
    for x in range(width):
        r, g, b, a = pixels[x, y]
        if a > 0:
            row_pixels.append(x)
    if row_pixels:
        print(f"Row {y} has non-transparent pixels from X {min(row_pixels)} to {max(row_pixels)}: count={len(row_pixels)}")
