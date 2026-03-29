import json
import csv
import os
from datetime import datetime

# Load the JSON data (assuming passing from previous step or re-running)
# For this script, I'll re-implement the scan + classify logic to be self-contained

ROOT_DIR = "/Users/hateemjamshaid/Documents/RUN-Remix"
EXCLUDE_DIRS = {'node_modules', 'dist', 'build', 'test-results', 'coverage', '.git', '.cache'}
EXTENSIONS = {'.md', '.sh', '.json', '.yaml', '.yml', '.env.example'}

def classify_file(file_data):
    path = file_data['path']
    content = file_data.get('content', '').lower()
    
    # Defaults
    category = "CRITICAL"
    risk = 0
    recommendation = "Keep"
    impact = "High"

    # Specific File Rules
    if path.endswith("package.json") or path.endswith("tsconfig.json") or path == "README.md":
        return "CRITICAL", 0, "Keep", "High"
    
    if path.startswith(".agent/"):
        return "CRITICAL", 0, "Keep (Agent Context)", "High"

    # Keywords check
    keywords = file_data.get('keywords', {})
    if 'outdated' in keywords:
        category = "OUTDATED"
        risk = 5
        recommendation = "Update"
        impact = "Medium"
    
    # Deprecated tech in config files
    if 'cra' in content or 'react-scripts' in content:
        if path.endswith('.yml') or path.endswith('.yaml'):
            category = "OUTDATED"
            risk = 6
            recommendation = "Update"
            impact = "Medium"

    # Logic for specific paths based on user prompt context
    if "docs/old" in path or "deprecated" in path:
        category = "LEGACY"
        risk = 2
        recommendation = "Archive"
        impact = "Low"

    return category, risk, recommendation, impact

def get_git_info(filepath):
    try:
        import subprocess
        cmd = ['git', 'log', '-1', '--format=%h|%cd', '--date=iso', filepath]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT_DIR)
        if result.returncode == 0 and result.stdout.strip():
            parts = result.stdout.strip().split('|')
            return parts[0], parts[1]
    except:
        pass
    return "unknown", "unknown"

def scan_and_generate_csv():
    results = []
    
    files_to_scan = []
    for root, dirs, files in os.walk(ROOT_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            if any(file.endswith(ext) for ext in EXTENSIONS):
                 if file == 'package-lock.json': continue
                 files_to_scan.append(os.path.join(root, file))

    output_csv = os.path.join(ROOT_DIR, "file-inventory.csv")
    
    with open(output_csv, 'w', newline='') as csvfile:
        fieldnames = ['FilePath', 'Category', 'RiskScore', 'LastModified', 'FileSize_KB', 'LineCount', 'Recommendation', 'ImpactLevel', 'Justification']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for filepath in files_to_scan:
            try:
                rel_path = filepath.replace(ROOT_DIR + "/", "")
                stats = os.stat(filepath)
                size_kb = round(stats.st_size / 1024, 2)
                
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                line_count = len(content.splitlines())
                last_commit, last_modified = get_git_info(filepath)
                
                # Check keywords for classification
                keywords = {}
                if 'webpack' in content.lower() or 'heroku' in content.lower():
                    keywords['outdated'] = True
                
                file_data = {
                    'path': rel_path,
                    'content': content,
                    'keywords': keywords
                }
                
                category, risk, recommendation, impact = classify_file(file_data)
                
                # Refine justification
                justification = "Core file" if category == "CRITICAL" else ""
                if 'outdated' in keywords:
                    justification = "Contains references to outdated tools (webpack/heroku)"
                
                writer.writerow({
                    'FilePath': rel_path,
                    'Category': category,
                    'RiskScore': risk,
                    'LastModified': last_modified,
                    'FileSize_KB': size_kb,
                    'LineCount': line_count,
                    'Recommendation': recommendation,
                    'ImpactLevel': impact,
                    'Justification': justification
                })
                
            except Exception as e:
                print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    scan_and_generate_csv()
