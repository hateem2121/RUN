
FILE = '/Users/hateemjamshaid/Downloads/RUN-Remix/client/src/index.css'

def patch():
    with open(FILE, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    in_dark_block = False
    luxury_bg_defined_in_dark = False
    
    for i, line in enumerate(lines):
        # 1. Detect .dark block start/end
        if line.strip().startswith('.dark {'):
            in_dark_block = True
            
        if in_dark_block and line.strip() == '}':
            if not luxury_bg_defined_in_dark:
                 # Inject variable before closing
                 new_lines.append("    --luxury-background: 222 84% 5%;\n")
                 new_lines.append("    --luxury-surface: 222 84% 5%;\n") 
                 # Also update surface to match dark card
                 luxury_bg_defined_in_dark = True
            in_dark_block = False
            
        if in_dark_block and '--luxury-background:' in line:
            luxury_bg_defined_in_dark = True
            
        # 2. Remove problematic legacy overrides
        # Match lines 2590 and 2606 (approx)
        # Content: "background: var(--luxury-background);"
        # Context: Inside html, body or #root
        
        if 'background: var(--luxury-background);' in line:
            # Check indentation and context
            # We want to remove it IF it's inside body/html/root
            # We can just comment it out globally? 
            # But .bg-luxury-gradient needs it.
            # So check if previous line contains "bg-luxury"
            prev = lines[i-1] if i > 0 else ""
            if "bg-luxury" not in prev and "gradient" not in prev:
                 # Likely the body/root one
                 new_lines.append(f"/* REMOVED override: {line.strip()} */\n")
                 continue
                 
        new_lines.append(line)

    with open(FILE, 'w') as f:
        f.writelines(new_lines)
    
    print("Patched index.css for dark mode.")

if __name__ == "__main__":
    patch()
