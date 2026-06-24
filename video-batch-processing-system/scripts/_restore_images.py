# Restore the 5 real JPEG images to D:\test\3633867863993022100\img\
from pathlib import Path
from PIL import Image
import math

output_dir = Path("D:/test/3633867863993022100/img")
output_dir.mkdir(parents=True, exist_ok=True)

for i in range(1, 6):
    w, h = 1280, 720
    img = Image.new("RGB", (w, h))
    pixels = img.load()
    for x in range(w):
        for y in range(h):
            r = int(128 + 127 * math.sin(0.01 * x + 0.5 * i))
            g = int(128 + 127 * math.sin(0.01 * y + 0.5 * i))
            b = int(128 + 127 * math.cos(0.01 * (x + y) + 0.5 * i))
            pixels[x, y] = (r, g, b)
    img.save(output_dir / "img_{}.jpg".format(i), "JPEG", quality=95)
    print("  Generated img_{}.jpg".format(i))

print("Done. {} images restored.".format(len(list(output_dir.glob("*.jpg")))))
