
FILE = '/Users/hateemjamshaid/Downloads/RUN-Remix/client/src/index.css'

def cleanup():
    with open(FILE, 'r') as f:
        lines = f.readlines()
    
    # We want to remove lines 353 to 376 (1-based indices).
    # In 0-based list, that is index 352 to 375.
    
    # Verification:
    # Line 353 (index 352) should contain "to {"
    # Line 376 (index 375) should contain "}"
    
    if "to {" not in lines[352]:
        print(f"WARNING: Line 353 does not look like start of orphan: {lines[352]}")
        return
    
    if "}" not in lines[375]:
        print(f"WARNING: Line 376 does not look like end of orphan: {lines[375]}")
        return
        
    print("Deleting orphaned lines 353-376...")
    del lines[352:376] # Deletes indices 352 up to (but not including) 376? 
    # Python slice deletion [start:end] deletes start..end-1
    # So to delete index 375, we need [352:376].
    
    with open(FILE, 'w') as f:
        f.writelines(lines)
    
    print("Cleanup complete.")

if __name__ == "__main__":
    cleanup()
