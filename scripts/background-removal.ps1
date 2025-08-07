param(
    [Parameter(Mandatory=$true)]
    [string]$InputPath,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Model = "u2net",
    
    [Parameter(Mandatory=$false)]
    [int]$Quality = 95,
    
    [Parameter(Mandatory=$false)]
    [switch]$BatchMode,
    
    [Parameter(Mandatory=$false)]
    [string]$LogFile = ""
)

# Background Removal PowerShell Script
# This script processes images to remove backgrounds using AI models

# Set error action preference
$ErrorActionPreference = "Stop"

# Initialize logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    if ($LogFile -and $LogFile -ne "") {
        Add-Content -Path $LogFile -Value $logMessage
    }
    
    Write-Host $logMessage
}

# Check if Python and required packages are installed
function Test-Requirements {
    Write-Log "Checking system requirements..."
    
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Python is not installed or not in PATH"
        }
        Write-Log "Python found: $pythonVersion"
        
        # Check for required Python packages
        $packages = @("torch", "torchvision", "opencv-python", "Pillow", "numpy", "rembg")
        foreach ($package in $packages) {
            $result = python -c "import $package" 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Log "Installing $package..." "WARN"
                pip install $package
            } else {
                Write-Log "Package $package is available"
            }
        }
    }
    catch {
        Write-Log "Error checking requirements: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Download and setup AI model
function Initialize-Model {
    param([string]$ModelName)
    
    Write-Log "Initializing AI model: $ModelName"
    
    $modelScript = @"
import torch
from rembg import remove, new_session
import os

# Initialize the model session
session = new_session('$ModelName')
print(f"Model {session.model_name} initialized successfully")
"@
    
    try {
        $modelScript | python
        Write-Log "Model initialization completed"
    }
    catch {
        Write-Log "Error initializing model: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Process single image
function Process-Image {
    param(
        [string]$InputFile,
        [string]$OutputFile,
        [string]$ModelName,
        [int]$QualityLevel
    )
    
    Write-Log "Processing image: $InputFile"
    
    $pythonScript = @"
import cv2
import numpy as np
from rembg import remove, new_session
from PIL import Image
import os

def process_image(input_path, output_path, model_name, quality):
    try:
        # Load the image
        input_image = Image.open(input_path)
        
        # Initialize session with specified model
        session = new_session(model_name)
        
        # Remove background
        output_image = remove(input_image, session=session)
        
        # Save the result
        output_image.save(output_path, 'PNG', quality=quality, optimize=True)
        
        print(f"Successfully processed: {input_path} -> {output_path}")
        return True
        
    except Exception as e:
        print(f"Error processing {input_path}: {str(e)}")
        return False

# Process the image
success = process_image('$InputFile', '$OutputFile', '$ModelName', $QualityLevel)
if not success:
    exit(1)
"@
    
    try {
        $pythonScript | python
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Image processed successfully: $OutputFile"
            return $true
        } else {
            Write-Log "Failed to process image: $InputFile" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Error processing image: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Process batch of images
function Process-Batch {
    param(
        [string]$InputDirectory,
        [string]$OutputDirectory,
        [string]$ModelName,
        [int]$QualityLevel
    )
    
    Write-Log "Processing batch from: $InputDirectory"
    
    # Create output directory if it doesn't exist
    if (!(Test-Path $OutputDirectory)) {
        New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
    }
    
    # Get all image files
    $imageExtensions = @("*.jpg", "*.jpeg", "*.png", "*.bmp", "*.tiff", "*.tif")
    $imageFiles = @()
    
    foreach ($ext in $imageExtensions) {
        $imageFiles += Get-ChildItem -Path $InputDirectory -Filter $ext -Recurse
    }
    
    Write-Log "Found $($imageFiles.Count) images to process"
    
    $successCount = 0
    $totalCount = $imageFiles.Count
    
    foreach ($imageFile in $imageFiles) {
        $relativePath = $imageFile.FullName.Substring($InputDirectory.Length).TrimStart('\')
        $outputPath = Join-Path $OutputDirectory $relativePath
        $outputPath = [System.IO.Path]::ChangeExtension($outputPath, "png")
        
        # Create subdirectories if needed
        $outputDir = Split-Path $outputPath -Parent
        if (!(Test-Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        }
        
        if (Process-Image -InputFile $imageFile.FullName -OutputFile $outputPath -ModelName $ModelName -QualityLevel $QualityLevel) {
            $successCount++
        }
        
        # Progress update
        $progress = [math]::Round(($successCount / $totalCount) * 100, 2)
        Write-Log "Progress: $progress% ($successCount/$totalCount)"
    }
    
    Write-Log "Batch processing completed. Success: $successCount/$totalCount"
    return $successCount
}

# Main execution
try {
    Write-Log "Starting background removal process"
    Write-Log "Input Path: $InputPath"
    Write-Log "Output Path: $OutputPath"
    Write-Log "Model: $Model"
    Write-Log "Quality: $Quality"
    Write-Log "Batch Mode: $BatchMode"
    
    # Check requirements
    Test-Requirements
    
    # Initialize model
    Initialize-Model -ModelName $Model
    
    if ($BatchMode) {
        # Batch processing
        if (!(Test-Path $InputPath)) {
            throw "Input directory does not exist: $InputPath"
        }
        
        if ($OutputPath -eq "") {
            $OutputPath = Join-Path (Split-Path $InputPath -Parent) "processed_$(Split-Path $InputPath -Leaf)"
        }
        
        $successCount = Process-Batch -InputDirectory $InputPath -OutputDirectory $OutputPath -ModelName $Model -QualityLevel $Quality
        Write-Log "Batch processing completed with $successCount successful operations"
    } else {
        # Single file processing
        if (!(Test-Path $InputPath)) {
            throw "Input file does not exist: $InputPath"
        }
        
        if ($OutputPath -eq "") {
            $OutputPath = [System.IO.Path]::ChangeExtension($InputPath, "png")
        }
        
        $success = Process-Image -InputFile $InputPath -OutputFile $OutputPath -ModelName $Model -QualityLevel $Quality
        if ($success) {
            Write-Log "Single file processing completed successfully"
        } else {
            throw "Failed to process single file"
        }
    }
    
    Write-Log "Background removal process completed successfully"
}
catch {
    Write-Log "Fatal error: $($_.Exception.Message)" "ERROR"
    exit 1
}
