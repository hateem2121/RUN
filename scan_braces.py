
import os
import glob

DIR = '/Users/hateemjamshaid/Downloads/RUN-Remix/client/src/styles'

def scan_braces():
    files = glob.glob(os.path.join(DIR, '*.css'))
    
    for fpath in files:
        with open(fpath, 'r') as f:
            content = f.read()
        
        open_count = content.count('{')
        close_count = content.count('}')
        
        print(f"File: {os.path.basename(fpath)}")
        print(f"  {{ count: {open_count}")
        print(f"  }} count: {close_count}")
        
        if open_count != close_count:
            print("  MISSING BRACE DETECTED!")
        
        # Also check for likely "Missing opening {" patterns
        # Identify lines that look like selectors but end with something other than { or ,
        lines = content.split('\n')
        for i, line in enumerate(lines):
            s = line.strip()
            if not s: continue
            if s.startswith('/*') or s.startswith('*'): continue
            if s.startswith('@import'): continue
            if s.endswith(';') or s.endswith(',') or s.endswith('{') or s.endswith('}'):
                continue
            # Logic: If line doesn't end in ; , { } it might be a broken selector
            # But it could be a property continuation.
            # However, usually properties end in ;
            # Selectors end in { or ,
            # So if it ends in "property: value" without ; -> Missing ;
            # If it ends in "selector" without { -> Missing opening {
            
            # Simple heuristic: If it has ':' it's a property. Check for ;
            if ':' in s and not s.endswith(';') and not s.endswith('{'):
                 # Could be multi-line value
                 pass
            elif ':' not in s and not s.endswith('{') and not s.endswith(','):
                 print(f"  POSSIBLE SYNTAX ERROR at line {i+1}: {s}")

if __name__ == "__main__":
    scan_braces()
