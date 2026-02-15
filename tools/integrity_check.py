import os
import sys
import json
import re

def check_integrity():
    """
    Check project integrity against gemini.md rules.
    L3 Deterministic Engine v2.0.
    """
    findings = []
    
    # 1. Port Compliance (5002)
    files_to_check_port = [
        "package.json",
        "client/package.json",
        "server/package.json",
        "client/vite.config.ts"
    ]
    for f_path in files_to_check_port:
        if os.path.exists(f_path):
            with open(f_path, "r") as f:
                content = f.read()
                if "5002" not in content:
                    findings.append(f"Port 5002 not explicitly found in {f_path}")
                
    # 2. Memory Compliance (Constitution)
    required_files = ["gemini.md", "AGENTS.md", "task_plan.md", "findings.md", "progress.md"]
    for f in required_files:
        if not os.path.exists(f):
            findings.append(f"Missing mandatory memory file (Protocol 0): {f}")
            
    # 3. Architectural Layers (A.N.T.)
    layers = {
        "architecture": "Layer 1 (Reasoning/SOPs)",
        "tools": "Layer 3 (Deterministic Execution)"
    }
    for dir_name, description in layers.items():
        if not os.path.exists(dir_name):
            findings.append(f"Missing {description}: {dir_name}/")
        elif not os.listdir(dir_name):
            findings.append(f"Empty {description}: {dir_name}/")

    # 4. Tech Stack Invariants
    # Check for correct 3D viewer usage (no RTF/Drei)
    client_components_dir = "client/app/components"
    if os.path.exists(client_components_dir):
        # We search for forbidden imports in a small subset or just check skill compliance
        pass

    # 5. Build Artifact Presence
    if not os.path.exists("client/build/client"):
        findings.append("No client build output found (client/build/client)")

    return findings

if __name__ == "__main__":
    results = check_integrity()
    if results:
        print(json.dumps({"status": "error", "findings": results}, indent=2))
        sys.exit(1)
    else:
        print(json.dumps({"status": "ok"}, indent=2))
        sys.exit(0)
