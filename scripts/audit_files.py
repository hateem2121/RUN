import os
import time
import json
import re
import subprocess
from pathlib import Path

# Config
ROOT_DIR = "/Users/hateemjamshaid/Documents/RUN-Remix"
EXCLUDE_DIRS = {
    'node_modules', 'dist', 'build', 'test-results', 'coverage', '.git', '.cache'
}
EXTENSIONS = {
    '.md', '.sh', '.json', '.yaml', '.yml', '.env.example'
}

# Tech Stack Keywords to flag
KEYWORDS = {
    'outdated': ['webpack', 'parcel', 'create-react-app', 'cra', 'enzyme', 'mocha', 'chai', 'heroku', 'digitalocean', 'jenkins', 'travis', 'circleci'],
    'deprecated_react': ['class component', 'componentwillmount', 'componentdidmount', 'render()', 'forwardRef', 'useHistory', 'Switch'],
    'deprecated_styling': ['styled-components', 'emotion', 'css modules', 'sass', 'less'],
    'deprecated_3d': ['@react-three/fiber', '@react-three/drei', 'useGLTF', 'Canvas'], # Flagging to check usage
}

def get_git_info(filepath):
    try:
        # Get last commit hash and date
        cmd = ['git', 'log', '-1', '--format=%h|%cd', '--date=iso', filepath]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT_DIR)
        if result.returncode == 0 and result.stdout.strip():
            parts = result.stdout.strip().split('|')
            return parts[0], parts[1]
    except Exception:
        pass
    return "unknown", "unknown"

def analyze_file(filepath):
    try:
        path = Path(filepath)
        stats = path.stat()
        size_kb = round(stats.st_size / 1024, 2)
        
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        line_count = len(content.splitlines())
        
        # Check keywords
        found_keywords = {}
        for category, terms in KEYWORDS.items():
            found = [term for term in terms if term.lower() in content.lower()]
            if found:
                found_keywords[category] = found
        
        # Git info
        last_commit, last_modified_git = get_git_info(filepath)
        
        # Internal links (naive)
        # links = re.findall(r'\[.*?\]\((.*?)\)', content)
        
        return {
            "path": filepath.replace(ROOT_DIR + "/", ""),
            "size_kb": size_kb,
            "line_count": line_count,
            "last_commit": last_commit,
            "last_modified_git": last_modified_git,
            "found_keywords": found_keywords,
            "extension": path.suffix
        }
    except Exception as e:
        return {
            "path": filepath.replace(ROOT_DIR + "/", ""),
            "error": str(e)
        }

def main():
    results = []
    for root, dirs, files in os.walk(ROOT_DIR):
        # Filter directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            if any(file.endswith(ext) for ext in EXTENSIONS):
                 # Skip some noisy files if needed, but requirements say "All"
                 # Excluding package-lock.json explicitly as it's huge and not "documentation"
                 if file == 'package-lock.json': continue
                 
                 filepath = os.path.join(root, file)
                 results.append(analyze_file(filepath))
    
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
