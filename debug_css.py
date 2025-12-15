
FILE = '/Users/hateemjamshaid/Downloads/RUN-Remix/client/src/index.css'

def debug_comment():
    with open(FILE, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    commenting = False
    
    for i, line in enumerate(lines):
        # Comment out lines 120 to 146 inclusive (approx)
        # We look for @keyframes accordion-down to start
        if '@keyframes accordion-down' in line:
            commenting = True
            new_lines.append("/* DEBUG COMMENT START\n")
            
        if commenting:
            new_lines.append("// " + line)
            if line.strip() == '}' and lines[i+1].strip() == '}':
                # This seems to be the end of the keyframes (line 146 in viewer)
                commenting = False
                new_lines.append("DEBUG COMMENT END */\n")
        else:
            new_lines.append(line)

    with open(FILE, 'w') as f:
        f.writelines(new_lines)
    
    print("Commented out keyframes.")

if __name__ == "__main__":
    debug_comment()
