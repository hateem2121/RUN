
import os

FILE = '/Users/hateemjamshaid/Downloads/RUN-Remix/client/src/index.css'

def rescue():
    with open(FILE, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    fixed = False
    
    for i, line in enumerate(lines):
        new_lines.append(line)
        
        # Look for the specific truncation point
        # In the broken file:
        # 121:     from {
        # 122:       height: 0;
        # 123:     }
        # 124: 
        # 125: @layer base {
        
        if line.strip() == 'height: 0;' and lines[i+1].strip() == '}':
            # Identify if this is the broken accordion-down
            # Check context a few lines back
            if 'keyframes accordion-down' in lines[i-2]:
                print("Found truncation point at line", i)
                # We append the '}' (already done by new_lines.append(line))
                # Now we need to append the REST of the theme block
                
                # We wait until after the next line (which is '}')
                continue
        
        if line.strip() == '}' and not fixed:
             # Check if previous line was height: 0;
             if i > 0 and lines[i-1].strip() == 'height: 0;':
                 # Check if next line is @layer base (ignoring empty lines)
                 # Scan forward
                 k = i + 1
                 while k < len(lines) and not lines[k].strip():
                     k += 1
                 
                 if k < len(lines) and lines[k].strip().startswith('@layer base'):
                     print("Injecting missing theme content...")
                     # Inject the missing parts
                     
                     # 1. Close accordion-down
                     new_lines.append("    to {\n")
                     new_lines.append("      height: var(--radix-accordion-content-height);\n")
                     new_lines.append("    }\n")
                     new_lines.append("  }\n")
                     
                     # 2. accordion-up
                     new_lines.append("  @keyframes accordion-up {\n")
                     new_lines.append("    from {\n")
                     new_lines.append("      height: var(--radix-accordion-content-height);\n")
                     new_lines.append("    }\n")
                     new_lines.append("    to {\n")
                     new_lines.append("      height: 0;\n")
                     new_lines.append("    }\n")
                     new_lines.append("  }\n")
                     
                     # 3. gradient
                     new_lines.append("  @keyframes gradient {\n")
                     new_lines.append("    0% {\n")
                     new_lines.append("      background-position: 0% 50%;\n")
                     new_lines.append("    }\n")
                     new_lines.append("    50% {\n")
                     new_lines.append("      background-position: 100% 50%;\n")
                     new_lines.append("    }\n")
                     new_lines.append("    100% {\n")
                     new_lines.append("      background-position: 0% 50%;\n")
                     new_lines.append("    }\n")
                     new_lines.append("  }\n")
                     
                     # 4. Close @theme
                     new_lines.append("}\n\n")
                     fixed = True

    with open(FILE, 'w') as f:
        f.writelines(new_lines)
    
    if fixed:
        print("Successfully repaired index.css")
    else:
        print("Could not find truncation point. file might be already fixed or different than expected.")

if __name__ == "__main__":
    rescue()
