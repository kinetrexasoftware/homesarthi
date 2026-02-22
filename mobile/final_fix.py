from PIL import Image
import os

def final_resize(input_path, output_path, logo_scale=0.9):
    img = Image.open(input_path).convert('RGBA')
    
    # 1. More aggressive cropping (anything not white-ish)
    datas = img.getdata()
    newData = []
    for item in datas:
        # If any channel is < 230, it's part of the logo
        if item[0] < 235 or item[1] < 235 or item[2] < 235:
            newData.append(item)
        else:
            newData.append((255, 255, 255, 0))
    img.putdata(newData)
    
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    
    # 2. Resize to 85% of 1024
    target_size = (1024, 1024)
    max_dim = int(1024 * logo_scale)
    
    # Maintain aspect ratio
    w, h = img.size
    ratio = min(max_dim/w, max_dim/h)
    new_size = (int(w * ratio), int(h * ratio))
    img = img.resize(new_size, Image.Resampling.LANCZOS)
    
    # 3. Paste on WhiteSmoke
    bg = Image.new('RGBA', target_size, (245, 245, 245, 255))
    offset = ((1024 - new_size[0]) // 2, (1024 - new_size[1]) // 2)
    bg.paste(img, offset, img)
    
    bg.convert('RGB').save(output_path, 'PNG')
    print(f"Saved {output_path} with scale {logo_scale}")

if __name__ == "__main__":
    assets_dir = "assets"
    # We use adaptive-icon as temporary input if icon.png is already shrunken
    # Actually, they are all the same. Let's just run it once.
    final_resize(os.path.join(assets_dir, "icon.png"), os.path.join(assets_dir, "icon.png"), logo_scale=0.88)
    final_resize(os.path.join(assets_dir, "icon.png"), os.path.join(assets_dir, "adaptive-icon.png"), logo_scale=0.88)
    final_resize(os.path.join(assets_dir, "icon.png"), os.path.join(assets_dir, "splash-icon.png"), logo_scale=0.75)
