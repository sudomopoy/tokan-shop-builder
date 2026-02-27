from PIL import Image

def generate_thumbnail(image, size=(128, 128)):
    img = Image.open(image)
    img.convert('RGB')
    img.thumbnail(size)

    return img
