#!/usr/bin/env python3
import os
import sys
import time
import json
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

SCRIPT_DIR = Path(__file__).resolve().parent
WEB_DIR = SCRIPT_DIR.parent
PAGES_DIR = WEB_DIR / "public" / "pages"
TEXTS_DIR = WEB_DIR / "public" / "page-texts"

TESSERACT_BIN = "/opt/homebrew/bin/tesseract"
if not os.path.exists(TESSERACT_BIN):
    # Try finding in PATH
    import shutil
    TESSERACT_BIN = shutil.which("tesseract") or "tesseract"

def ocr_single_page(page_num: int) -> tuple[int, bool, int]:
    out_file = TEXTS_DIR / f"page_{page_num}.txt"
    if out_file.exists() and out_file.stat().st_size > 50:
        return page_num, True, out_file.stat().st_size

    img_file = PAGES_DIR / f"page_{page_num}.jpg"
    if not img_file.exists():
        return page_num, False, 0

    try:
        cmd = [TESSERACT_BIN, str(img_file), "stdout", "--oem", "1", "-l", "eng"]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        text = res.stdout.strip()
        
        # Clean up empty lines excess
        cleaned_lines = []
        consecutive_empty = 0
        for line in text.split("\n"):
            line_str = line.strip()
            if not line_str:
                consecutive_empty += 1
                if consecutive_empty <= 1:
                    cleaned_lines.append("")
            else:
                consecutive_empty = 0
                cleaned_lines.append(line_str)
        cleaned_text = "\n".join(cleaned_lines)

        out_file.write_text(cleaned_text, encoding="utf-8")
        return page_num, False, len(cleaned_text)
    except Exception as e:
        print(f"Error on page {page_num}: {e}", file=sys.stderr)
        return page_num, False, 0

def run_extraction():
    if not PAGES_DIR.exists():
        print(f"Error: {PAGES_DIR} not found", file=sys.stderr)
        sys.exit(1)

    TEXTS_DIR.mkdir(parents=True, exist_ok=True)

    # Define page priorities:
    # 1. Listening units (14 to 50)
    # 2. Scripts (330 to 362)
    # 3. Answer keys (363 to 394)
    # 4. Speaking units (135 to 154)
    # 5. Writing units (101 to 134)
    # 6. Reading units (51 to 100)
    # 7. Practice tests (155 to 329)
    # 8. Remaining (1 to 13, 395 to 398)
    
    priority_order = (
        list(range(14, 51)) +
        list(range(330, 363)) +
        list(range(363, 395)) +
        list(range(135, 155)) +
        list(range(101, 135)) +
        list(range(51, 101)) +
        list(range(155, 330)) +
        list(range(1, 14)) +
        list(range(395, 399))
    )
    # deduplicate while preserving order
    seen = set()
    ordered_pages = [p for p in priority_order if not (p in seen or seen.add(p))]

    print(f"Starting OCR text extraction for {len(ordered_pages)} pages...")
    print(f"Output directory: {TEXTS_DIR}")
    t0 = time.time()

    workers = 8
    done_count = 0
    cached_count = 0

    with ThreadPoolExecutor(max_workers=workers) as executor:
        for page_num, was_cached, char_count in executor.map(ocr_single_page, ordered_pages):
            done_count += 1
            if was_cached:
                cached_count += 1
            if done_count % 20 == 0 or done_count == len(ordered_pages):
                elapsed = time.time() - t0
                print(f"  -> Processed {done_count}/{len(ordered_pages)} pages (new: {done_count - cached_count}, cached: {cached_count}) in {elapsed:.1f}s")

    elapsed = time.time() - t0
    print(f"All done in {elapsed:.1f}s! Generating search index...")

    # Build index summary
    index_data = {}
    for p in range(1, 399):
        f = TEXTS_DIR / f"page_{p}.txt"
        if f.exists():
            text = f.read_text(encoding="utf-8")
            index_data[p] = {
                "length": len(text),
                "excerpt": text[:150].replace("\n", " ").strip()
            }
    
    (TEXTS_DIR / "index.json").write_text(json.dumps(index_data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Index created at {TEXTS_DIR / 'index.json'} with {len(index_data)} pages.")

if __name__ == "__main__":
    run_extraction()
