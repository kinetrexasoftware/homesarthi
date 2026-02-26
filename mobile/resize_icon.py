from PIL import Image, ImageOps
import os

def resize_and_center_icon(input_path, output_path, target_size=(1024, 1024), logo_scale=0.85, bg_color=(245, 245, 245)):
    # Open the original image
    img = Image.open(input_path)
    
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Detect the background color (F5F5F5 is approx 245, 245, 245)
    datas = img.getdata()
    newData = []
    for item in datas:
        # If pixel is very light (background), make it transparent
        # Using a threshold to account for compression/anti-aliasing
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    
    # Get bounding box of the actual logo
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    else:
        print("Warning: No bounding box found, using original image.")
    
    # 2. Calculate new logo size
    new_width = int(target_size[0] * logo_scale)
    new_height = int(target_size[1] * logo_scale)
    
    # Resize keeping aspect ratio
    img.thumbnail((new_width, new_height), Image.Resampling.LANCZOS)
    
    # 3. Create new background
    new_img = Image.new('RGBA', target_size, bg_color + (255,))
    
    # Center position
    offset = ((target_size[0] - img.size[0]) // 2, (target_size[1] - img.size[1]) // 2)
    
    # Paste logo
    new_img.paste(img, offset, img)
    
    # Save as PNG
    new_img.convert('RGB').save(output_path, 'PNG')
    print(f"Successfully saved resized icon to {output_path}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(script_dir, "assets")
    input_file = os.path.join(assets_dir, "icon.png")
    
    # We update both icon and adaptive icon
    resize_and_center_icon(input_file, os.path.join(assets_dir, "icon.png"), logo_scale=0.85)
    resize_and_center_icon(input_file, os.path.join(assets_dir, "adaptive-icon.png"), logo_scale=0.85)
    resize_and_center_icon(input_file, os.path.join(assets_dir, "splash-icon.png"), logo_scale=0.7)
