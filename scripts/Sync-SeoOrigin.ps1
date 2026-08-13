[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$config = Import-PowerShellDataFile -LiteralPath (Join-Path $projectRoot 'site.config.psd1')
$siteOrigin = [string]$config.SITE_ORIGIN
$normalizedOrigin = ([Uri]$siteOrigin).GetLeftPart([System.UriPartial]::Authority)

if ($siteOrigin -ne $normalizedOrigin) {
    throw "SITE_ORIGIN must be an origin without a trailing slash: $normalizedOrigin"
}

$htmlFiles = @(Get-ChildItem -LiteralPath $projectRoot -File -Filter '*.html')
$sitemapFiles = @(Get-ChildItem -LiteralPath $projectRoot -File -Filter 'sitemap*.xml')
$publicFiles = @($htmlFiles) + @($sitemapFiles) + @(Get-Item -LiteralPath (Join-Path $projectRoot 'robots.txt'))
$fileContents = @{}
$fileHasUtf8Bom = @{}

foreach ($file in $publicFiles) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $fileHasUtf8Bom[$file.FullName] = $bytes.Length -ge 3 -and
        $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
    $fileContents[$file.FullName] = [System.IO.File]::ReadAllText($file.FullName)
}

# Canonicals reveal the previously generated origin. Changing SITE_ORIGIN and
# running this script migrates every site-owned absolute URL, preserving paths.
$canonicalPattern = '<link\b[^>]*\brel=["'']canonical["''][^>]*\bhref=["'']([^"'']+)["''][^>]*>'
$previousOrigins = New-Object 'System.Collections.Generic.HashSet[string]'

foreach ($file in $htmlFiles) {
    foreach ($match in [regex]::Matches($fileContents[$file.FullName], $canonicalPattern, 'IgnoreCase')) {
        $null = $previousOrigins.Add(([Uri]$match.Groups[1].Value).GetLeftPart([System.UriPartial]::Authority))
    }
}

if ($previousOrigins.Count -eq 0) {
    throw 'No canonical URLs found; SEO origin was not updated.'
}

function Set-SiteOrigin([string]$url) {
    $uri = [Uri]$url
    return "$siteOrigin$($uri.PathAndQuery)$($uri.Fragment)"
}

foreach ($file in $publicFiles) {
    $originalContent = $fileContents[$file.FullName]
    $content = $originalContent

    foreach ($previousOrigin in $previousOrigins) {
        $content = $content.Replace($previousOrigin, $siteOrigin)
    }

    if ($file.Name -like 'sitemap*.xml') {
        $content = [regex]::Replace(
            $content,
            '(<loc>\s*)(https?://[^<\s]+)(\s*</loc>)',
            { param($match) $match.Groups[1].Value + (Set-SiteOrigin $match.Groups[2].Value) + $match.Groups[3].Value },
            'IgnoreCase'
        )
    }

    if ($file.Name -eq 'robots.txt') {
        $content = [regex]::Replace(
            $content,
            '^(Sitemap:\s*)(https?://\S+)',
            { param($match) $match.Groups[1].Value + (Set-SiteOrigin $match.Groups[2].Value) },
            'IgnoreCase, Multiline'
        )
    }

    if ($content -ne $originalContent) {
        $utf8 = New-Object System.Text.UTF8Encoding($fileHasUtf8Bom[$file.FullName])
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8)
    }
}

foreach ($file in $htmlFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    foreach ($match in [regex]::Matches($content, $canonicalPattern, 'IgnoreCase')) {
        $canonicalOrigin = ([Uri]$match.Groups[1].Value).GetLeftPart([System.UriPartial]::Authority)
        if ($canonicalOrigin -ne $siteOrigin) {
            throw "$($file.Name) has a canonical outside SITE_ORIGIN: $($match.Groups[1].Value)"
        }
    }
}

foreach ($file in $sitemapFiles) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    foreach ($match in [regex]::Matches($content, '<loc>\s*(https?://[^<\s]+)\s*</loc>', 'IgnoreCase')) {
        $urlOrigin = ([Uri]$match.Groups[1].Value).GetLeftPart([System.UriPartial]::Authority)
        if ($urlOrigin -ne $siteOrigin) {
            throw "$($file.Name) contains a URL outside SITE_ORIGIN: $($match.Groups[1].Value)"
        }
    }
}

Write-Output "SEO URLs synchronized with $siteOrigin."
