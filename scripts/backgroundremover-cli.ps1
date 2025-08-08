param(
    [Parameter(Mandatory=$true)]
    [string]$InputPath,

    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "",

    [Parameter(Mandatory=$false)]
    [ValidateSet('u2net','u2netp','u2net_human_seg')]
    [string]$Model = 'u2net',

    [Parameter(Mandatory=$false)]
    [switch]$AlphaMatting,

    [Parameter(Mandatory=$false)]
    [int]$AlphaErode = 15,

    [Parameter(Mandatory=$false)]
    [switch]$BatchMode,

    [Parameter(Mandatory=$false)]
    [switch]$TransparentVideo, # -tv

    [Parameter(Mandatory=$false)]
    [int]$FrameRate,           # -fr

    [Parameter(Mandatory=$false)]
    [int]$FrameLimit,          # -fl

    [Parameter(Mandatory=$false)]
    [int]$GpuBatch = 1,        # -gb

    [Parameter(Mandatory=$false)]
    [int]$Workers = 1,         # -wn

    [Parameter(Mandatory=$false)]
    [string]$OverlayVideoPath, # -tov

    [Parameter(Mandatory=$false)]
    [string]$OverlayImagePath, # -toi

    [Parameter(Mandatory=$false)]
    [string]$LogFile = "",

    [Parameter(Mandatory=$false)]
    [string]$PythonPath = ""
)

# BackgroundRemover CLI wrapper
# Uses: python.exe -m backgroundremover.cmd.cli ...
# Docs: https://github.com/nadermx/backgroundremover

$ErrorActionPreference = 'Stop'

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$timestamp] [$Level] $Message"
    if ($LogFile) { Add-Content -Path $LogFile -Value $line }
    Write-Host $line
}

function Test-BackgroundRemover {
    try {
        $pythonExe = $PythonPath
        if (-not $pythonExe) { $pythonExe = 'python' }
        Write-Log "Checking Python installation... ($pythonExe)"
        $null = & $pythonExe --version 2>&1
        if ($LASTEXITCODE -ne 0) { throw 'Python not found in PATH' }

        Write-Log 'Checking BackgroundRemover module...'
        $null = & $pythonExe -c "import backgroundremover" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log 'backgroundremover not found. Installing via pip...' 'WARN'
            & $pythonExe -m pip install --upgrade pip | Out-Null
            & $pythonExe -m pip install backgroundremover | Out-Null
            if ($LASTEXITCODE -ne 0) { throw 'Failed to install backgroundremover via pip' }
        } else {
            Write-Log 'backgroundremover module available'
        }

        Write-Log 'Checking ffmpeg availability...'
        $null = & ffmpeg -version 2>&1
        if ($LASTEXITCODE -ne 0) { Write-Log 'ffmpeg not found; video operations may fail.' 'WARN' }
    } catch {
        Write-Log "Dependency check failed: $($_.Exception.Message)" 'ERROR'
        throw
    }
}

function Build-Args {
    $pythonArgs = @('-m','backgroundremover.cmd.cli')
    $cliArgs = @()

    if ($BatchMode) {
        $cliArgs += @('-if', $InputPath)
        if ($OutputPath) { $cliArgs += @('-of', $OutputPath) }
    } else {
        $cliArgs += @('-i', $InputPath)
        if ($OutputPath) { $cliArgs += @('-o', $OutputPath) }
    }

    if ($Model) { $cliArgs += @('-m', $Model) }
    if ($AlphaMatting) { $cliArgs += @('-a', '-ae', $AlphaErode) }

    if ($TransparentVideo) { $cliArgs += '-tv' }
    if ($FrameRate) { $cliArgs += @('-fr', $FrameRate) }
    if ($FrameLimit) { $cliArgs += @('-fl', $FrameLimit) }
    if ($GpuBatch -and $GpuBatch -gt 1) { $cliArgs += @('-gb', $GpuBatch) }
    if ($Workers -and $Workers -gt 1) { $cliArgs += @('-wn', $Workers) }

    if ($OverlayVideoPath) { $cliArgs += @('-tov', $OverlayVideoPath) }
    if ($OverlayImagePath) { $cliArgs += @('-toi', $OverlayImagePath) }

    return ,($pythonArgs + $cliArgs) # unary comma to force single array
}

try {
    Write-Log 'Starting BackgroundRemover CLI process'
    Write-Log "InputPath=$InputPath | OutputPath=$OutputPath | Model=$Model | Batch=$BatchMode | Alpha=$AlphaMatting"

    # Input validation
    if (-not (Test-Path $InputPath)) { throw "Input path not found: $InputPath" }
    if ($OutputPath -and -not (Test-Path (Split-Path $OutputPath -Parent))) {
        $outDir = (Split-Path $OutputPath -Parent)
        if ($outDir) {
            Write-Log "Creating output directory: $outDir"
            New-Item -ItemType Directory -Path $outDir -Force | Out-Null
        }
    }

    Test-BackgroundRemover

    $cliArgs = Build-Args

    $pythonExe = $PythonPath
    if (-not $pythonExe) { $pythonExe = 'python' }
    Write-Log ("Running: {0} {1}" -f $pythonExe, ($cliArgs -join ' '))

    & $pythonExe @cliArgs
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        Write-Log 'Background removal completed successfully'
        exit 0
    } else {
        Write-Log "BackgroundRemover exited with code $exitCode" 'ERROR'
        exit $exitCode
    }
} catch {
    Write-Log "Fatal error: $($_.Exception.Message)" 'ERROR'
    exit 1
}
