
import re

FILE = '/Users/hateemjamshaid/Downloads/RUN-Remix/client/src/index.css'

def scan():
    with open(FILE, 'r') as f:
        lines = f.readlines()
    
    in_keyframes = False
    brace_count = 0
    keyframes_start = 0
    
    for i, line in enumerate(lines):
        line_s = line.strip()
        
        # Check for start of keyframes
        if '@keyframes' in line_s:
            in_keyframes = True
            brace_count = 0
            keyframes_start = i + 1
            print(f"DEBUG: Found keyframes at line {i+1}")
        
        if in_keyframes:
            brace_count += line_s.count('{')
            brace_count -= line_s.count('}')
            
            if '@apply' in line_s:
                print(f"FOUND INVALID @apply at line {i+1}: {line_s}")
                print(f"Inside @keyframes starting at line {keyframes_start}")
            
            if brace_count <= 0:
                in_keyframes = False

if __name__ == "__main__":
    scan()
