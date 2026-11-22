param(
    [string]$PrismRoot = (Join-Path $env:APPDATA 'PrismLauncher')
)
$ErrorActionPreference = 'Stop'
$jdk = Get-ChildItem -LiteralPath (Join-Path $PrismRoot 'java') -Recurse -Filter 'javac.exe' |
    Where-Object FullName -match 'jdk-21' | Select-Object -First 1
$client = Get-ChildItem -LiteralPath (Join-Path $PrismRoot 'libraries/net/minecraft/client/1.21.1-20240808.144430') -Filter '*-srg.jar' |
    Select-Object -First 1
$mixin = Get-ChildItem -LiteralPath (Join-Path $PrismRoot 'libraries') -Recurse -Filter 'sponge-mixin-*.jar' |
    Sort-Object Name -Descending | Select-Object -First 1
if (!$jdk -or !$client -or !$mixin) { throw 'Prism JDK 21 and the NeoForge 1.21.1 client libraries are required.' }

$classes = Join-Path $env:TEMP ('nxterra-crafting-classes-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $classes | Out-Null
$classpath = $client.FullName + [IO.Path]::PathSeparator + $mixin.FullName
$source = Join-Path $PSScriptRoot 'src/com/nxterra/crafting/HandsOnVanillaMixin.java'
& $jdk.FullName -proc:none --release 21 -classpath $classpath -d $classes $source
if ($LASTEXITCODE -ne 0) { throw 'Crafting mixin compilation failed.' }

$resources = Join-Path $PSScriptRoot 'resources'
$outputFile = Join-Path $PSScriptRoot '../../extras/nxterra/mods/nxterra_vanilla_crafting-1.0.0.jar'
$jar = Join-Path $jdk.DirectoryName 'jar.exe'
& $jar --create --file $outputFile --date=2026-11-21T00:00:00Z -C $classes . -C $resources .
if ($LASTEXITCODE -ne 0) { throw 'Crafting mixin packaging failed.' }
Get-FileHash -LiteralPath $outputFile -Algorithm SHA256
