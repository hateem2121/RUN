
FILE = '/Users/hateemjamshaid/Downloads/RUN-Remix/client/src/index.css'

def undo_debug():
    with open(FILE, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    
    for line in lines:
        s = line.strip()
        if s.startswith('/* DEBUG COMMENT START'):
            continue
        if s.startswith('DEBUG COMMENT END */'):
            continue
        if s.startswith('//'):
            # Remove // and restore indentation
            # The line was "//   @keyframes..."
            # We want "  @keyframes..."
            # Find index of //
            idx = line.find('//')
            rest = line[idx+2:]
            # But wait, original line indentation was preserved?
            # debug_css.py: new_lines.append("// " + line)
            # So line starts with "// " then original indentation.
            # We just strip "// " from start.
            if line.startswith("// "):
                new_lines.append(line[3:])
            else:
                new_lines.append(line[2:]) # Fallback
        else:
            new_lines.append(line)

    with open(FILE, 'w') as f:
        f.writelines(new_lines)
    
    print("Reverted debug comments.")

if __name__ == "__main__":
    undo_debug()
