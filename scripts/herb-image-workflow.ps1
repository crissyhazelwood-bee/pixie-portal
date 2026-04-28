# Herbology image generation workflow helper for Pixie Portal.
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\herb-image-workflow.ps1 status
#   powershell -ExecutionPolicy Bypass -File scripts\herb-image-workflow.ps1 prompt
#   powershell -ExecutionPolicy Bypass -File scripts\herb-image-workflow.ps1 save
#   powershell -ExecutionPolicy Bypass -File scripts\herb-image-workflow.ps1 sheet

param(
  [ValidateSet('status','prompt','save','skip','sheet')]
  [string]$Action = 'status'
)

$ErrorActionPreference = 'Stop'
$Repo = Split-Path -Parent $PSScriptRoot
$StatePath = Join-Path $PSScriptRoot 'herb-image-state.json'
$HerbDir = Join-Path $Repo 'public\assets\herbs'
$GeneratedRoot = Join-Path $env:USERPROFILE '.codex\generated_images'

$Queue = @(
  @{ id='licorice-root'; name='Licorice Root'; latin='Glycyrrhiza glabra'; subject='licorice root plant with soft green leaves and tan licorice roots visible beside the pot as botanical accents, not candy, not supplements' },
  @{ id='ginkgo'; name='Ginkgo'; latin='Ginkgo biloba'; subject='ginkgo plant with distinct fan-shaped golden-green ginkgo leaves' },
  @{ id='cranberry'; name='Cranberry'; latin='Vaccinium macrocarpon'; subject='cranberry plant with glossy red cranberries, small leaves, and trailing stems' },
  @{ id='mullein'; name='Mullein'; latin='Verbascum thapsus'; subject='mullein plant with soft woolly leaves and a tall yellow flower spike' },
  @{ id='clove'; name='Clove'; latin='Syzygium aromaticum'; subject='clove plant with glossy leaves and reddish-brown clove buds as botanical accents, not ground spice' }
)

function Load-State {
  if (Test-Path $StatePath) {
    try { return Get-Content $StatePath -Raw | ConvertFrom-Json } catch {}
  }
  [pscustomobject]@{ completed = @('lemon-balm','valerian','ashwagandha','elderberry','aloe','tea-tree','green-tea'); skipped = @() }
}

function Save-State($state) {
  $state | ConvertTo-Json -Depth 6 | Set-Content -Path $StatePath -Encoding UTF8
}

function Get-CompletedIds($state) {
  @($state.completed) + @($state.skipped)
}

function Get-NextHerb($state) {
  $done = Get-CompletedIds $state
  foreach ($item in $Queue) {
    if ($done -notcontains $item.id) { return $item }
  }
  return $null
}

function Get-Prompt($herb) {
@"
Stylized magical $($herb.name) plant ($($herb.latin)) in a small celestial ceramic pot, soft pastel watercolor style matching the approved lavender herbology card, delicate dreamy botanical illustration, $($herb.subject), subtle sparkles and floating light, faint moon and star motifs, gentle glow, warm calm atmosphere, clean centered composition, soft vignette background, collectible magical artifact feel, no text, no labels, no UI elements, no people, no hands, no medicine imagery, square 1:1 high resolution.
"@
}

function Save-LatestImage($herb) {
  $latest = Get-ChildItem $GeneratedRoot -Recurse -File -Include *.png,*.jpg,*.jpeg,*.webp | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $latest) { throw 'No generated image found.' }
  $out = Join-Path $HerbDir ($herb.id + '.webp')
  @"
from PIL import Image
from pathlib import Path
src = Path(r'''$($latest.FullName)''')
out = Path(r'''$out''')
im = Image.open(src).convert('RGB')
im.save(out, 'WEBP', quality=94, method=6)
print(f'{out.name} {out.stat().st_size} bytes from {src.name}')
"@ | python -
}

function Build-Sheet {
@"
from pathlib import Path
from PIL import Image, ImageDraw
base=Path(r'''$HerbDir''')
files=sorted([f for f in base.glob('*.webp') if not f.name.startswith('test-')])
cols=6; cellw=180; cellh=176
rows=(len(files)+cols-1)//cols
canvas=Image.new('RGB',(cols*cellw,rows*cellh),(18,10,30))
d=ImageDraw.Draw(canvas)
for idx,f in enumerate(files):
    im=Image.open(f).convert('RGB').resize((132,132))
    x=(idx%cols)*cellw+24; y=(idx//cols)*cellh+8
    canvas.paste(im,(x,y)); d.text((x,y+137),f.stem,fill=(245,225,255))
out=base/'herb-contact-sheet.jpg'
canvas.save(out,quality=90)
print(out.resolve(), len(files))
"@ | python -
}

$state = Load-State
$next = Get-NextHerb $state

switch ($Action) {
  'status' {
    Write-Host 'Completed:' (@($state.completed) -join ', ')
    Write-Host 'Remaining:' (($Queue | Where-Object { (Get-CompletedIds $state) -notcontains $_.id } | ForEach-Object id) -join ', ')
    if ($next) { Write-Host "Next: $($next.id)" } else { Write-Host 'Next: none' }
  }
  'prompt' {
    if (-not $next) { Write-Host 'All queued herbs complete.'; exit 0 }
    Write-Host "NEXT_ID=$($next.id)"
    Write-Host (Get-Prompt $next)
  }
  'save' {
    if (-not $next) { Write-Host 'All queued herbs complete.'; exit 0 }
    Save-LatestImage $next
    $completed = @($state.completed)
    if ($completed -notcontains $next.id) { $completed += $next.id }
    $state.completed = $completed
    Save-State $state
    $after = Get-NextHerb $state
    if ($after) { Write-Host "Saved $($next.id). Next: $($after.id)" } else { Write-Host "Saved $($next.id). Queue complete." }
  }
  'skip' {
    if (-not $next) { Write-Host 'All queued herbs complete.'; exit 0 }
    $skipped = @($state.skipped)
    if ($skipped -notcontains $next.id) { $skipped += $next.id }
    $state.skipped = $skipped
    Save-State $state
    Write-Host "Skipped $($next.id)."
  }
  'sheet' { Build-Sheet }
}
