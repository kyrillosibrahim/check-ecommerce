"""
Script لتحويل خطوط KO Sans من OTF → WOFF2 (أصغر بـ ~40%)
التشغيل:
  pip install fonttools brotli
  python convert-fonts.py
"""

import os
import sys

try:
    from fontTools.ttLib import TTFont
except ImportError:
    print("ERROR: fonttools غير مثبّت. شغّل: pip install fonttools brotli")
    sys.exit(1)

FONT_DIR = os.path.join('src', 'assets', 'fonts', 'ko-sans')

if not os.path.isdir(FONT_DIR):
    print(f"ERROR: المجلد غير موجود: {FONT_DIR}")
    sys.exit(1)

converted = 0
for fname in sorted(os.listdir(FONT_DIR)):
    if not fname.lower().endswith('.otf'):
        continue

    src = os.path.join(FONT_DIR, fname)
    dst = os.path.join(FONT_DIR, fname[:-4] + '.woff2')

    if os.path.exists(dst):
        print(f'  موجود مسبقاً: {os.path.basename(dst)}')
        continue

    try:
        tt = TTFont(src)
        tt.flavor = 'woff2'
        tt.save(dst)
        before = os.path.getsize(src)
        after  = os.path.getsize(dst)
        saving = round((1 - after / before) * 100)
        print(f'  ✓ {fname} → {os.path.basename(dst)} ({before//1024}KB → {after//1024}KB، وفر {saving}%)')
        converted += 1
    except Exception as e:
        print(f'  ✗ فشل تحويل {fname}: {e}')

print(f'\nاكتمل: {converted} ملف جديد.')
print('بعد التحويل شغّل: npm run build')
