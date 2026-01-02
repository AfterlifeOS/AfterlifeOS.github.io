import json
import urllib.request
import urllib.error
import time

# Configuration
REPO_OWNER = "AfterlifeOS"
REPO_NAME = "device_afterlife_ota"
BRANCH = "16"
OUTPUT_FILE = "ota/devices.json" # Adjust path relative to where you run it, or absolute path
GITHUB_API_TREE_URL = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/git/trees/{BRANCH}?recursive=1"
RAW_BASE_URL = f"https://raw.githubusercontent.com/{REPO_OWNER}/{REPO_NAME}/{BRANCH}"
EXISTING_DEVICES_JSON = f"{RAW_BASE_URL}/devices.json"

IGNORED_FOLDERS = ['templates', '.git']

def get_json(url):
    """Helper to fetch JSON from a URL."""
    try:
        req = urllib.request.Request(url)
        # Add User-Agent to avoid generic blocking
        req.add_header('User-Agent', 'Python-Script') 
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error fetching {url}: {e.code}")
        return None
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def main():
    print(f"1. Fetching repository tree from {GITHUB_API_TREE_URL}...")
    tree_data = get_json(GITHUB_API_TREE_URL)
    
    if not tree_data or "tree" not in tree_data:
        print("Failed to fetch repository tree. GitHub API rate limit might be exceeded.")
        return

    print("2. Fetching existing metadata (devices.json)...")
    existing_metadata_json = get_json(EXISTING_DEVICES_JSON)
    existing_metadata = {}
    if existing_metadata_json and "devices" in existing_metadata_json:
        for d in existing_metadata_json["devices"]:
            if "codename" in d:
                existing_metadata[d["codename"].lower()] = d

    devices_list = []
    
    # Identify directories containing updates.json
    print("3. Scanning for updates.json files...")
    for item in tree_data["tree"]:
        path = item["path"]
        
        # We look for 'codename/updates.json'
        # Skip if deeper nested or in root
        parts = path.split('/')
        if len(parts) == 2 and parts[1] == "updates.json":
            codename = parts[0]
            
            if codename in IGNORED_FOLDERS or codename.startswith('.'):
                continue
                
            print(f"   Found device: {codename}. Fetching updates.json...")
            
            # Fetch the updates.json content
            update_url = f"{RAW_BASE_URL}/{path}"
            update_data = get_json(update_url)
            
            if update_data and "response" in update_data and len(update_data["response"]) > 0:
                info = update_data["response"][0]
                
                # Merge Data
                # Priority: Local updates.json > Existing Metadata
                
                meta = existing_metadata.get(codename.lower(), {})
                
                entry = {
                    "name": info.get("device", meta.get("name", "Unknown")),
                    "codename": codename,
                    "brand": info.get("oem", meta.get("brand", "Unknown")),
                    "maintainer": info.get("maintainer", meta.get("maintainer", "Unknown")),
                    "github_username": info.get("github_username") or meta.get("github_username", ""),
                    "image_url": info.get("image_url") or meta.get("image_url", ""),
                    "pling_id": info.get("pling_id") or meta.get("pling_id", ""),
                    "status": "Active"
                }
                devices_list.append(entry)
                
                # Sleep briefly to be nice to GitHub API if running many requests
                # time.sleep(0.1) 
            else:
                print(f"   Warning: Invalid/Empty updates.json for {codename}")

    # Sort
    devices_list.sort(key=lambda x: (x['brand'], x['name']))

    # Write Output
    # Save to 'devices.json' in the current working directory
    output_path = "devices.json"
    
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({"devices": devices_list}, f, indent=4, ensure_ascii=False)
        print(f"\nSuccess! Generated {output_path} with {len(devices_list)} devices.")
    except Exception as e:
        print(f"Error writing output file: {e}")

if __name__ == "__main__":
    main()