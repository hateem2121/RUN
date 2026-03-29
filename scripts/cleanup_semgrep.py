import json
import os

FILES_TO_CLEAN = [
    ".config/.semgrep/semgrep_rules.json",
    ".config/replit/.semgrep/semgrep_rules.json"
]

KEYWORDS_TO_REMOVE = ["webpack", "heroku"]

def clean_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        original_count = len(data.get("rules", []))
        
        cleaned_rules = []
        removed_count = 0
        
        for rule in data.get("rules", []):
            rule_str = json.dumps(rule).lower()
            if any(k in rule_str for k in KEYWORDS_TO_REMOVE):
                removed_count += 1
                continue
            cleaned_rules.append(rule)
            
        data["rules"] = cleaned_rules
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
            
        print(f"Cleaned {filepath}: Removed {removed_count} rules (Original: {original_count}, New: {len(cleaned_rules)})")
        
    except Exception as e:
        print(f"Error cleaning {filepath}: {e}")

if __name__ == "__main__":
    for f in FILES_TO_CLEAN:
        clean_file(os.path.join(os.getcwd(), f))
