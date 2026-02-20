"""Wrapper to monkey-patch pyarrow (backwards compatibility) then run the
existing training script. Use this instead of running `train_text_full.py`
directly if you hit: "module 'pyarrow' has no attribute 'PyExtensionType'".
"""
import sys
import pyarrow as pa

# Ensure compatibility for libraries expecting pa.PyExtensionType
if not hasattr(pa, "PyExtensionType"):
    pa.PyExtensionType = getattr(pa, "ExtensionType", None)

import runpy

if __name__ == "__main__":
    # Pass through any CLI args to the training script
    args = sys.argv[1:]
    sys.argv = [sys.argv[0]] + args
    runpy.run_path("ml/train_text_full.py", run_name="__main__")
