param(
    [string]$Workbook = (Join-Path $PSScriptRoot '..\basement_gym_exercise_library.xlsx'),
    [string]$Output = (Join-Path $PSScriptRoot '..\exercise-data.js')
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

$resolvedWorkbook = (Resolve-Path -LiteralPath $Workbook).Path
$zip = [System.IO.Compression.ZipFile]::OpenRead($resolvedWorkbook)

function Read-ZipEntry([string]$Name) {
    $entry = $zip.GetEntry($Name)
    if ($null -eq $entry) {
        throw "Workbook entry not found: $Name"
    }

    $reader = [System.IO.StreamReader]::new($entry.Open())
    try {
        return $reader.ReadToEnd()
    }
    finally {
        $reader.Dispose()
    }
}

try {
    [xml]$sharedXml = Read-ZipEntry 'xl/sharedStrings.xml'
    $sharedStrings = @()
    foreach ($item in $sharedXml.sst.si) {
        if ($null -ne $item.t) {
            $sharedStrings += [string]$item.t
        }
        else {
            $sharedStrings += (($item.r | ForEach-Object { [string]$_.t }) -join '')
        }
    }

    [xml]$sheet = Read-ZipEntry 'xl/worksheets/sheet1.xml'
    [xml]$relationships = Read-ZipEntry 'xl/worksheets/_rels/sheet1.xml.rels'

    $relationshipTargets = @{}
    foreach ($relationship in $relationships.Relationships.Relationship) {
        $relationshipTargets[[string]$relationship.Id] = [string]$relationship.Target
    }

    $links = @{}
    foreach ($hyperlink in $sheet.worksheet.hyperlinks.hyperlink) {
        $relationshipId = $hyperlink.GetAttribute(
            'id',
            'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
        )
        $links[[string]$hyperlink.ref] = $relationshipTargets[$relationshipId]
    }

    $category = $null
    $records = @()
    foreach ($row in $sheet.worksheet.sheetData.row) {
        $cells = @{}
        foreach ($cell in $row.c) {
            $value = [string]$cell.v
            if ([string]$cell.t -eq 's' -and $value -ne '') {
                $value = $sharedStrings[[int]$value]
            }

            $column = ([string]$cell.r) -replace '\d', ''
            $cells[$column] = $value
        }

        $name = [string]$cells['A']
        $equipment = [string]$cells['C']
        $link = [string]$links["B$($row.r)"]

        if ($name -and -not $equipment -and -not $link -and $name -notmatch '^Basement|^Practical') {
            $category = $name
            continue
        }

        if ($name -and $equipment -and $link -and $name -ne 'Exercise') {
            $records += [ordered]@{
                name = $name
                category = $category
                equipment = $equipment
                instructionUrl = $link
                sourceRow = [int]$row.r
            }
        }
    }

    $json = $records | ConvertTo-Json -Depth 4
    $contents = @"
// Generated from basement_gym_exercise_library.xlsx by scripts/export-exercise-data.ps1.
// Keep this as a classic script (rather than an ES module) so the app works from file://.
window.EXERCISE_SOURCE = $json;
"@

    Set-Content -LiteralPath $Output -Value $contents -Encoding utf8
    Write-Output "Exported $($records.Count) exercises to $Output"
}
finally {
    $zip.Dispose()
}
