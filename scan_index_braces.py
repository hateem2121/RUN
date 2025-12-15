
import os

FILE = '/Users/hateemjamshaid/Downloads/RUN-Remix/client/src/index.css'

def scan():
    with open(FILE, 'r') as f:
        content = f.read()
    
    open_count = content.count('{')
    close_count = content.count('}')
    
    print(f"File: index.css")
    print(f"  {{ count: {open_count}")
    print(f"  }} count: {close_count}")
    
    if open_count != close_count:
        print("  MISSING BRACE DETECTED!")
        
        # Binary search for the mismatch location?
        # Or just linear scan counting balance
        balance = 0
        lines = content.split('\n')
        for i, line in enumerate(lines):
            balance += line.count('{')
            balance -= line.count('}')
            if balance < 0:
                print(f"  Negative balance at line {i+1}: {line.strip()}")
                return
        
        if balance > 0:
            print(f"  Final balance is {balance} (Unclosed braces)")

if __name__ == "__main__":
    scan()
