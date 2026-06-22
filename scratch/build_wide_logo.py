import os
from PIL import Image

def generate_wide_logo():
    # Paths
    input_path = r"C:\Users\USER\.gemini\antigravity-ide\brain\bb341182-b125-431f-b1db-7b25ca74be04\media__1782082115260.jpg"
    pub_images_dir = r"c:\Users\USER\Desktop\JAMILY PAGINA\Projetoapp\Agenda-Inteligente.app-1\apps\web\public\images"
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return
        
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    bg_color = (251, 242, 235)
    tolerance = 35
    transition = 15
    
    # 1. Background removal to create clean transparent RGBA base
    clean_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    clean_pixels = clean_img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            dist = ((r - bg_color[0])**2 + (g - bg_color[1])**2 + (b - bg_color[2])**2)**0.5
            if dist < tolerance:
                clean_pixels[x, y] = (r, g, b, 0)
            elif dist < tolerance + transition:
                alpha = int((dist - tolerance) / transition * 255)
                clean_pixels[x, y] = (r, g, b, alpha)
            else:
                clean_pixels[x, y] = (r, g, b, 255)
                
    # Bounding boxes
    # Let's crop the symbol (top part of the image, up to 63% height)
    symbol_region = clean_img.crop((0, 0, width, int(height * 0.63)))
    symbol_bbox = symbol_region.getbbox()
    print("Symbol bounding box:", symbol_bbox)
    
    # Let's crop the text (bottom part of the image, from 63% height down to 100%)
    text_region = clean_img.crop((0, int(height * 0.61), width, height))
    text_bbox = text_region.getbbox()
    print("Text bounding box (relative):", text_bbox)
    
    if not symbol_bbox or not text_bbox:
        print("Error: Could not crop symbol or text.")
        return
        
    symbol_cropped = symbol_region.crop(symbol_bbox)
    
    # Adjust text_bbox back to original image space to crop correctly
    text_bbox_abs = (
        text_bbox[0], 
        text_bbox[1] + int(height * 0.61), 
        text_bbox[2], 
        text_bbox[3] + int(height * 0.61)
    )
    text_cropped = clean_img.crop(text_bbox_abs)
    
    # 2. Assemble horizontal logo (logo_wide.png)
    # Target size: symbol on the left, text on the right
    # Let's define the canvas height as 400px.
    canvas_h = 400
    
    # Resizing symbol: height 400px, proportional width
    w_sym, h_sym = symbol_cropped.size
    new_h_sym = 360
    new_w_sym = int(w_sym * (new_h_sym / h_sym))
    symbol_resized = symbol_cropped.resize((new_w_sym, new_h_sym), Image.Resampling.LANCZOS)
    
    # Resizing text: height 240px (to align nicely next to the symbol), proportional width
    w_txt, h_txt = text_cropped.size
    new_h_txt = 240
    new_w_txt = int(w_txt * (new_h_txt / h_txt))
    text_resized = text_cropped.resize((new_w_txt, new_h_txt), Image.Resampling.LANCZOS)
    
    # Spacing and canvas width
    spacing = 60
    padding_x = 40
    canvas_w = new_w_sym + spacing + new_w_txt + (padding_x * 2)
    
    # Create the wide canvas
    wide_canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    
    # Paste symbol (centered vertically)
    y_sym_offset = (canvas_h - new_h_sym) // 2
    wide_canvas.paste(symbol_resized, (padding_x, y_sym_offset), symbol_resized)
    
    # Paste text (centered vertically)
    y_txt_offset = (canvas_h - new_h_txt) // 2
    x_txt_offset = padding_x + new_w_sym + spacing
    wide_canvas.paste(text_resized, (x_txt_offset, y_txt_offset), text_resized)
    
    # Save the wide logo
    wide_logo_path = os.path.join(pub_images_dir, "logo_wide.png")
    wide_canvas.save(wide_logo_path, "PNG")
    print(f"Successfully generated wide horizontal logo at: {wide_logo_path}")
    print(f"Canvas size: {canvas_w}x{canvas_h}")

if __name__ == "__main__":
    generate_wide_logo()
