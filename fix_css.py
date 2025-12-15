
import re
import os

INPUT_FILE = '/Users/hateemjamshaid/Downloads/RUN-Remix/client/src/index.css'
OUTPUT_FILE = '/Users/hateemjamshaid/Downloads/RUN-Remix/client/src/index_fixed.css'

def clean_value(val):
    val = val.strip().rstrip(';')
    # Remove hsl( ... ) wrapper if strictly wrapping the numbers
    # But be careful not to break hsl(var(...)) or other valid Css
    # Our target is "hsl(43, 13%, 99%)" -> "43 13% 99%"
    # But NOT "0 0% 100%" -> "0 0% 100%"
    match = re.match(r'hsl\((.*)\)', val)
    if match:
        content = match.group(1)
        # If content contains commas, replace with spaces for v4 alpha composition support
        content = content.replace(',', ' ')
        return content
    return val

def parse_css():
    with open(INPUT_FILE, 'r') as f:
        lines = f.readlines()
    
    imports = []
    theme_block = []
    root_vars = {}
    dark_vars = {}
    
    # Track lines to exclude from the "Rest of File"
    exclude_indices = set()
    
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # 1. Capture Imports (Top of file)
        if stripped.startswith('@import') or stripped.startswith('@plugin') or stripped.startswith('@source'):
            # Special case: Don't capture standard imports if we are gonna write them manually
            # But DO capture the custom file imports
            # We will manually write the tailwind directives, so skip them here to avoid duplicates
            if "tailwindcss" not in stripped and "@source" not in stripped:
                imports.append(line)
            exclude_indices.add(i)
            i += 1
            continue
            
        # 2. Capture :root blocks
        if stripped.startswith(':root {'):
            start_i = i
            exclude_indices.add(i)
            i += 1
            while i < len(lines) and lines[i].strip() != '}':
                subline = lines[i].strip()
                if subline.startswith('--'):
                    parts = subline.split(':', 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        val = clean_value(parts[1])
                        root_vars[key] = val
                exclude_indices.add(i)
                i += 1
            if i < len(lines): exclude_indices.add(i) # The closing brace
            i += 1
            print(f"Captured :root block starting at {start_i}")
            continue

        # 3. Capture @theme block
        if stripped.startswith('@theme {'):
            # We want to keep the theme block contents but maybe clean them?
            # Actually, the theme block references variables. We should keep it.
            # But we need to move it to the top.
            start_i = i
            theme_block.append(line)
            exclude_indices.add(i)
            i += 1
            while i < len(lines) and lines[i].strip() != '}':
                theme_block.append(lines[i])
                exclude_indices.add(i)
                i += 1
            if i < len(lines):
                theme_block.append(lines[i]) # Closing brace
                exclude_indices.add(i)
            i += 1
            print(f"Captured @theme block starting at {start_i}")
            continue

        # 4. Capture .dark block (the Main one)
        # Note: There might be other .dark classes, we only want the one defining variables
        if stripped.startswith('.dark {'):
            # Check if it looks like a variable block
            is_var_block = False
            lookahead = i + 1
            while lookahead < len(lines) and lookahead < i + 5:
                if lines[lookahead].strip().startswith('--'):
                    is_var_block = True
                    break
                lookahead += 1
            
            if is_var_block:
                start_i = i
                exclude_indices.add(i)
                i += 1
                while i < len(lines) and lines[i].strip() != '}':
                    subline = lines[i].strip()
                    if subline.startswith('--'):
                        parts = subline.split(':', 1)
                        if len(parts) == 2:
                            key = parts[0].strip()
                            val = clean_value(parts[1])
                            dark_vars[key] = val
                    exclude_indices.add(i)
                    i += 1
                if i < len(lines): exclude_indices.add(i)
                i += 1
                print(f"Captured .dark block starting at {start_i}")
                continue

        i += 1

    # Construct New File
    new_content = []
    
    # A. Header
    new_content.append("/* consolidated imports */\n")
    new_content.append('@import "tailwindcss";\n')
    new_content.append('@plugin "tailwindcss-animate";\n')
    new_content.append('@plugin "@tailwindcss/typography";\n')
    new_content.append('@plugin "@tailwindcss/container-queries";\n')
    new_content.append('@source "../src/**/*.{ts,tsx}";\n\n')
    
    # B. External Imports
    new_content.extend(imports)
    new_content.append('\n')

    # C. Theme
    new_content.append("/* @theme config */\n")
    new_content.extend(theme_block)
    new_content.append('\n')

    # D. Layer Base (Variables)
    new_content.append("@layer base {\n")
    new_content.append("  :root {\n")
    for k, v in root_vars.items():
        new_content.append(f"    {k}: {v};\n")
    new_content.append("  }\n")
    
    new_content.append("\n  .dark {\n")
    for k, v in dark_vars.items():
        new_content.append(f"    {k}: {v};\n")
    
    # Ensure standard colors have dark overrides even if missing from original .dark
    # Basic mapping for safety
    if '--background' in root_vars and '--background' not in dark_vars:
        new_content.append("    /* Auto-generated dark fallback */\n")
        new_content.append("    --background: 222 84% 5%;\n")
        new_content.append("    --foreground: 210 40% 98%;\n")
    
    new_content.append("  }\n")
    
    # Reset
    new_content.append("\n  * {\n    @apply border-border;\n  }\n")
    new_content.append("  html, body {\n    @apply bg-background text-foreground;\n  }\n")
    new_content.append("}\n\n")
    
    # E. Rest of File
    new_content.append("/* === LEGACY / COMPONENT STYLES === */\n")
    for j in range(len(lines)):
        if j not in exclude_indices:
            new_content.append(lines[j])
            
    with open(OUTPUT_FILE, 'w') as f:
        f.writelines(new_content)
    
    print(f"Successfully processed {len(lines)} lines.")
    print(f"Extracted {len(root_vars)} root variables.")
    print(f"Extracted {len(dark_vars)} dark variables.")

if __name__ == "__main__":
    parse_css()
