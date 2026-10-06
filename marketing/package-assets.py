"""Package final assets and the editable source using an explicit local whitelist."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent
common = ["README.md", "ART-PROMPTS.json", "CREATIVE-BRIEF.md", "ASSET-MANIFEST.json"]
upload = common + [
    "play-store/app-icon-512.png", "play-store/feature-graphic-1024x500.png",
    "play-store/screenshots-contact-sheet.png",
    "trailer/README.md", "trailer/public/fonts/Cinzel-OFL.txt",
    "trailer/public/fonts/Manrope-OFL.txt",
    "trailer/out/AshenVow-StoreTrailer-1080x1920.mp4",
    "trailer/out/trailer-poster.png", "trailer/out/trailer-storyboard.png",
] + [f"play-store/screenshots/{i:02}.png" for i in range(1, 9)]
editable = common + [
    "trailer/package.json", "trailer/package-lock.json", "trailer/tsconfig.json",
    "trailer/remotion.config.ts", "trailer/eslint.config.mjs", "trailer/README.md",
    "trailer/.gitignore", "package-assets.py",
]
for folder in ("trailer/src", "trailer/scripts", "trailer/public", "masters"):
    editable.extend(p.relative_to(root).as_posix() for p in (root / folder).rglob("*") if p.is_file())
editable.extend(p.relative_to(root).as_posix() for p in (root / "captures").glob("*.jpg"))

packages = []
for name, files in (("AshenVow-PlayStore-Upload.zip", upload), ("AshenVow-Remotion-Editable.zip", editable)):
    files = sorted(set(files))
    destination = root / name
    sources = []
    for relative in files:
        source = (root / relative).resolve(strict=True)
        if not source.is_relative_to(root) or any(part in ("node_modules", ".git", "dist") for part in source.relative_to(root).parts):
            raise ValueError(f"File outside package whitelist: {relative}")
        sources.append((relative, source))
    with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for relative, source in sources:
            archive.write(source, "marketing/" + relative)
    with zipfile.ZipFile(destination) as archive:
        if archive.testzip() is not None:
            raise ValueError(f"Archive integrity check failed: {name}")
        names = archive.namelist()
        if any(n.startswith("/") or ".." in Path(n).parts for n in names):
            raise ValueError("Unsafe archive entry")
        if name.endswith("PlayStore-Upload.zip"):
            screenshots = [n for n in names if n.startswith("marketing/play-store/screenshots/")]
            if len(screenshots) != 8:
                raise ValueError("Upload archive must contain exactly eight screenshots")
    packages.append({"file": name, "bytes": destination.stat().st_size, "entries": len(files),
                     "sha256": hashlib.sha256(destination.read_bytes()).hexdigest(), "integrity": "Passed"})
(root / "PACKAGES.json").write_text(json.dumps(packages, indent=2) + "\n", encoding="utf-8")
print(json.dumps(packages, indent=2))
