from PIL import Image
import os

# List of images to optimize
images = [
    'trust-verified-cartoon.png',
    'zero-brokerage-cartoon.png',
    'faq-help.png',
    'why-choose-us.png'
]

assets_dir = r'c:\Users\HRIDESH KUMAR\OneDrive\Desktop\ROOMATE\mobile\assets'

for img_name in images:
    img_path = os.path.join(assets_dir, img_name)
    
    try:
        # Open image
        img = Image.open(img_path)
        
        # Convert to RGB if necessary (remove alpha channel if not needed)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create a white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            if 'A' in img.mode:
                background.paste(img, mask=img.split()[-1])
            else:
                background.paste(img)
            img = background
        
        # Resize if too large (max 512x512 for icons/illustrations)
        max_size = (512, 512)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save optimized image
        img.save(img_path, 'PNG', optimize=True, quality=85)
        print(f"✅ Optimized: {img_name}")
        
    except Exception as e:
        print(f"❌ Error processing {img_name}: {str(e)}")

print("\n✅ All images optimized!")
