import os
from PIL import Image

logo_path = r"c:\Users\USER\Desktop\JAMILY PAGINA\Projetoapp\Agenda-Inteligente.app-1\apps\web\public\images\logo_wide.png"

if not os.path.exists(logo_path):
    print("Error: logo_wide.png not found")
    exit(1)

img = Image.open(logo_path).convert("RGBA")
width, height = img.size
pixels = img.load()

# Let's find connected components of non-transparent pixels (alpha > 0)
visited = set()

components = []

for y in range(height):
    for x in range(width):
        if (x, y) not in visited and pixels[x, y][3] > 0:
            # Start BFS to find the component
            comp = []
            queue = [(x, y)]
            visited.add((x, y))
            
            while queue:
                cx, cy = queue.pop(0)
                comp.append((cx, cy))
                
                # Check 8 neighbors
                for nx in [cx - 1, cx, cx + 1]:
                    for ny in [cy - 1, cy, cy + 1]:
                        if 0 <= nx < width and 0 <= ny < height:
                            if (nx, ny) not in visited and pixels[nx, ny][3] > 0:
                                visited.add((nx, ny))
                                queue.append((nx, ny))
            
            # Finished component
            xs = [p[0] for p in comp]
            ys = [p[1] for p in comp]
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
            components.append({
                "bbox": (min_x, min_y, max_x, max_y),
                "pixels": comp,
                "size": len(comp)
            })

print(f"Found {len(components)} connected components:")
for i, comp in enumerate(components):
    bbox = comp["bbox"]
    print(f"Component {i}: bbox={bbox}, size={comp['size']} pixels")
