#!/usr/bin/env python3
import os
import sys
import time
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import fitz  # PyMuPDF

SCRIPT_DIR = Path(__file__).resolve().parent
WEB_DIR = SCRIPT_DIR.parent
ROOT_DIR = WEB_DIR.parent

PDF_PATH = ROOT_DIR / "The Official cambridge guide to IELTS.PDF"
AUDIO_SRC = ROOT_DIR / "Official Cambridge Guide to IELTS"
PAGES_OUT = WEB_DIR / "public" / "pages"
AUDIO_OUT = WEB_DIR / "public" / "audio"

def render_page(args):
    pdf_path_str, page_idx, out_path_str = args
    if os.path.exists(out_path_str):
        return page_idx, True, 0
    
    doc = fitz.open(pdf_path_str)
    page = doc.load_page(page_idx)
    # dpi=135 gives sharp text at ~1100x1550 resolution
    pix = page.get_pixmap(dpi=135)
    pix.save(out_path_str, jpg_quality=82)
    size = os.path.getsize(out_path_str)
    return page_idx, False, size

def main():
    print(f"📖 PDF source: {PDF_PATH}")
    if not PDF_PATH.exists():
        print(f"❌ Error: PDF not found at {PDF_PATH}")
        sys.exit(1)

    # 1. Setup public directories
    PAGES_OUT.mkdir(parents=True, exist_ok=True)
    
    # 2. Setup audio symlink
    if AUDIO_SRC.exists():
        if AUDIO_OUT.is_symlink() or AUDIO_OUT.exists():
            if AUDIO_OUT.is_symlink() and not AUDIO_OUT.resolve().exists():
                AUDIO_OUT.unlink()
        if not AUDIO_OUT.exists():
            try:
                AUDIO_OUT.symlink_to(AUDIO_SRC, target_is_directory=True)
                print(f"🎵 Symlinked audio directory to {AUDIO_OUT}")
            except Exception as e:
                print(f"⚠️ Could not symlink audio: {e}")
    else:
        print(f"⚠️ Audio source directory not found at {AUDIO_SRC}")

    # 3. Open PDF to get page count
    doc = fitz.open(str(PDF_PATH))
    total_pages = len(doc)
    doc.close()
    print(f"📄 Total pages in book: {total_pages}")

    tasks = []
    already_rendered = 0
    for i in range(total_pages):
        page_num = i + 1
        out_file = PAGES_OUT / f"page_{page_num}.jpg"
        if out_file.exists():
            already_rendered += 1
        tasks.append((str(PDF_PATH), i, str(out_file)))

    if already_rendered == total_pages:
        print(f"✅ All {total_pages} pages are already rendered!")
        return

    workers = max(1, os.cpu_count() or 4)
    print(f"⚡ Rendering pages with {workers} parallel processes...")
    t0 = time.time()
    
    total_bytes = 0
    rendered_count = 0
    with ProcessPoolExecutor(max_workers=workers) as executor:
        for idx, cached, size in executor.map(render_page, tasks):
            if not cached:
                rendered_count += 1
                total_bytes += size
                if rendered_count % 40 == 0 or rendered_count == total_pages:
                    print(f"  -> Rendered {rendered_count} pages... ({(time.time()-t0):.1f}s)")

    duration = time.time() - t0
    mb = total_bytes / (1024 * 1024)
    print(f"✨ Finished rendering {rendered_count} pages in {duration:.2f}s ({mb:.1f} MB total)")

if __name__ == "__main__":
    main()
