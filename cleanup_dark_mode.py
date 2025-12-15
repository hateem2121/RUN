
FILE = '/Users/hateemjamshaid/Downloads/RUN-Remix/client/src/index.css'

def cleanup_dark():
    with open(FILE, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    
    # We want to remove blocks that start with specific selectors or comments
    # Targets:
    # "/* Enforce luxury light theme backgrounds globally ... */"
    # "body:not(.dark):not(.technology-page) .min-h-screen {"
    # ":not(.dark) .bg-gray-50 {"
    # ":not(.dark) .bg-neutral-900..."
    # ":not(.dark) .bg-gray-900..."
    
    # We will look for lines containing ":not(.dark)" AND "important" to be safe?
    # Or just block-delete sections.
    
    skip_mode = False
    
    for line in lines:
        s = line.strip()
        
        # Start skipping if we see specific signatures
        if "Enforce luxury light theme backgrounds globally" in s:
            new_lines.append("/* REMOVED: Enforce luxury light theme block */\n")
            skip_mode = True
            
        # Stop skipping ?
        # The block contains multiple rules.
        # It ends before "/* === LUXURY SHADOW UTILITIES === */" ? 
        # Or before "/* === LUXURY GRADIENT === */" ?
        # Let's check context from earlier "view_file".
        # 2663:   /* Enforce luxury light theme ... */
        # ...
        # 2684:   .bg-luxury-gradient {
        
        if skip_mode:
            if ".bg-luxury-gradient" in s:
                skip_mode = False
                new_lines.append(line) # Keep this line
                continue
            # Else skip
            continue
            
        new_lines.append(line)

    with open(FILE, 'w') as f:
        f.writelines(new_lines)
    
    print("Removed harmful light theme enforcements.")

if __name__ == "__main__":
    cleanup_dark()
