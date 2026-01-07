import os
import re
import time

# Konfigurasi
ROOT_DIR = "."  # Root directory proyek (relatif dari posisi script dijalankan)
EXTENSIONS = ['.css', '.js'] # Tipe file yang akan di-update versinya
IGNORE_DIRS = ['.git', 'node_modules', '.gemini']

def get_timestamp():
    """Mengembalikan timestamp saat ini dalam detik."""
    return str(int(time.time()))

def update_html_files(timestamp):
    """
    Memindai semua file HTML dan memperbarui parameter versi (?v=...) 
    pada link CSS dan JS lokal.
    """
    html_files_count = 0
    updated_count = 0

    print(f"🔄 Memulai Cache Busting... (Versi baru: {timestamp})")

    for root, dirs, files in os.walk(ROOT_DIR):
        # Filter folder yang diabaikan
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            if file.endswith(".html"):
                html_files_count += 1
                filepath = os.path.join(root, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Regex untuk menemukan src="..." atau href="..." yang berakhiran .css atau .js
                # Group 1: Awal tag sampai nama file (misal: href="/css/style.css)
                # Group 2: Query string lama jika ada (misal: ?v=123), atau kosong
                # Group 3: Penutup kutip (")
                
                # Pattern penjelasan:
                # (href="|src=") -> Menangkap atribut pembuka
                # ([^"']+\.(?:css|js)) -> Menangkap path file yang berakhir .css atau .js
                # (\?v=[0-9a-zA-Z\.]*)? -> Menangkap query string versi lama (opsional)
                # ("|') -> Menangkap tanda kutip penutup
                
                pattern = r'(href="|src=")([^"\\]+\.(?:css|js))(\?v=[0-9a-zA-Z\.]*)?("|")'
                
                # Fungsi pengganti regex
                def replacement(match):
                    prefix = match.group(1)
                    filename = match.group(2)
                    # Skip jika link eksternal (http/https)
                    if filename.startswith('http') or filename.startswith('//'):
                        return match.group(0)
                    
                    quote = match.group(4)
                    return f'{prefix}{filename}?v={timestamp}{quote}'

                new_content = re.sub(pattern, replacement, content)

                if new_content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"✅ Updated: {filepath}")
                    updated_count += 1

    print(f"\nSelesai! {updated_count} dari {html_files_count} file HTML telah diperbarui.")

if __name__ == "__main__":
    # Script diasumsikan dijalankan dari root folder proyek, 
    # atau sesuaikan ROOT_DIR jika dijalankan dari dalam folder scripts/
    
    # Jika script dijalankan dari folder scripts/, naik satu level ke root
    if os.path.basename(os.getcwd()) == "scripts":
        os.chdir("..")
        
    update_html_files(get_timestamp())
