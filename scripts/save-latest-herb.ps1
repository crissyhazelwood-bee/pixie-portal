param([Parameter(Mandatory=$true)][string]$Id)
$latest = Get-ChildItem "$env:USERPROFILE\.codex\generated_images" -Recurse -File -Include *.png,*.jpg,*.jpeg,*.webp | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $latest) { throw "No generated image found" }
$src = $latest.FullName
$out = Join-Path (Resolve-Path "public\assets\herbs") ($Id + ".webp")
@"
from PIL import Image
from pathlib import Path
src = Path(r'''$src''')
out = Path(r'''$out''')
im = Image.open(src).convert('RGB')
im.save(out, 'WEBP', quality=94, method=6)
print(f'{out.name} {out.stat().st_size} bytes from {src.name}')
"@ | python -
