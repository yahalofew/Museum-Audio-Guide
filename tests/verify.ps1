param(
    [string]$BaseUrl = 'http://localhost/project',
    [string]$PhpPath = 'C:\xampp\php\php.exe',
    [string]$NodePath = 'node',
    [switch]$RequireAuthenticatedAuth
)

$ErrorActionPreference = 'Stop'
$script:Passed = 0
$script:Failed = 0
$script:Skipped = 0

function Test-Check {
    param([string]$Name, [scriptblock]$Action)

    try {
        & $Action
        $script:Passed++
        Write-Host "[PASS] $Name" -ForegroundColor Green
    } catch {
        $script:Failed++
        Write-Host "[FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Skip-Check {
    param([string]$Name, [string]$Reason)

    $script:Skipped++
    Write-Host "[SKIP] $Name - $Reason" -ForegroundColor Yellow
}

function Assert-Equal {
    param($Actual, $Expected, [string]$Message)

    if ($Actual -ne $Expected) {
        throw "$Message (expected: $Expected, actual: $Actual)"
    }
}

function Assert-True {
    param([bool]$Condition, [string]$Message)

    if (-not $Condition) {
        throw $Message
    }
}

function Invoke-AppRequest {
    param(
        [string]$Path,
        [string]$Method = 'GET',
        [hashtable]$Body,
        [Microsoft.PowerShell.Commands.WebRequestSession]$WebSession,
        [int]$MaximumRedirection = 5
    )

    $request = @{
        Uri = "$($BaseUrl.TrimEnd('/'))/$($Path.TrimStart('/'))"
        Method = $Method
        SkipHttpErrorCheck = $true
        MaximumRedirection = $MaximumRedirection
    }
    if ($null -ne $Body) {
        $request.Body = $Body
    }
    if ($null -ne $WebSession) {
        $request.WebSession = $WebSession
    }

    Invoke-WebRequest @request
}

function Convert-JsonResponse {
    param($Response)

    try {
        $Response.Content | ConvertFrom-Json
    } catch {
        throw 'Response is not valid JSON'
    }
}

Write-Host 'Museum Audio Guide verification'
Write-Host "Base URL: $BaseUrl"
Write-Host ''

$visitorPage = $null
$adminLoginPage = $null
$adminListPage = $null
$tracks = @()
$playableTrack = $null

Test-Check 'Visitor page is available' {
    $script:visitorPage = Invoke-AppRequest -Path 'index.html'
    Assert-Equal $script:visitorPage.StatusCode 200 'Visitor page status'
    Assert-True ($script:visitorPage.Content.Contains('class="main-song"')) 'Visitor audio element is missing'
    Assert-True ($script:visitorPage.Content.Contains('class="number-buttons"')) 'Visitor keypad is missing'
}

Test-Check 'Admin login page is available' {
    $script:adminLoginPage = Invoke-AppRequest -Path 'admin/admin.html'
    Assert-Equal $script:adminLoginPage.StatusCode 200 'Admin login page status'
    Assert-True ($script:adminLoginPage.Content.Contains('id="loginForm"')) 'Admin login form is missing'
}

Test-Check 'Admin audio list page is available' {
    $script:adminListPage = Invoke-AppRequest -Path 'admin/viewall.html'
    Assert-Equal $script:adminListPage.StatusCode 200 'Admin list page status'
    Assert-True ($script:adminListPage.Content.Contains('id="myTable"')) 'Admin audio table is missing'
    Assert-True ($script:adminListPage.Content.Contains('id="recordCount"')) 'Admin record count is missing'
}

Test-Check 'Public music API returns an array' {
    $response = Invoke-AppRequest -Path 'api/read_data.php'
    Assert-Equal $response.StatusCode 200 'Music API status'
    $contentType = [string]$response.Headers['Content-Type']
    Assert-True ([bool]($contentType -like 'application/json*')) 'Music API content type'
    $script:tracks = @(Convert-JsonResponse $response)
    Assert-True ($script:tracks.Count -gt 0) 'Music API returned no records'
    $script:playableTrack = $script:tracks |
        Where-Object { $_.media_status -ne 'missing' } |
        Select-Object -First 1
    Assert-True ($null -ne $script:playableTrack) 'No playable record is available for regression checks'
}

Test-Check 'Read-one API preserves its success contract' {
    $number = [Uri]::EscapeDataString([string]$script:playableTrack.music_number)
    $response = Invoke-AppRequest -Path "api/read_one-data.php?music_number=$number"
    $payload = Convert-JsonResponse $response
    Assert-Equal $response.StatusCode 200 'Read-one status'
    Assert-True ($payload.result -eq $true) 'Read-one result must be true'
    Assert-Equal ([string]$payload.results[0].music_number) ([string]$script:playableTrack.music_number) 'Read-one music number'
}

Test-Check 'Read-one API preserves its not-found contract' {
    $response = Invoke-AppRequest -Path 'api/read_one-data.php?music_number=2147483647'
    $payload = Convert-JsonResponse $response
    Assert-Equal $response.StatusCode 200 'Read-one not-found status'
    Assert-True ($payload.result -eq $false) 'Read-one not-found result must be false'
}

Test-Check 'Read-by-id API success contract' {
    $id = [Uri]::EscapeDataString([string]$script:playableTrack.music_id)
    $response = Invoke-AppRequest -Path "api/read_data-id.php?music_id=$id"
    $payload = Convert-JsonResponse $response
    Assert-Equal $response.StatusCode 200 'Read-by-id status'
    Assert-True ($payload.success -eq $true) 'Read-by-id success must be true'
}

Test-Check 'Read-by-id API validation contract' {
    $response = Invoke-AppRequest -Path 'api/read_data-id.php?music_id=invalid'
    $payload = Convert-JsonResponse $response
    Assert-Equal $response.StatusCode 400 'Read-by-id invalid status'
    Assert-True ($payload.success -eq $false) 'Read-by-id invalid success must be false'
}

Test-Check 'Read-by-id API method guard' {
    $response = Invoke-AppRequest -Path 'api/read_data-id.php?music_id=1' -Method 'POST'
    $payload = Convert-JsonResponse $response
    Assert-Equal $response.StatusCode 405 'Read-by-id method status'
    Assert-Equal $payload.message 'Method Not Allowed' 'Read-by-id method message'
}

Test-Check 'Referenced audio and image are available' {
    $number = [Uri]::EscapeDataString([string]$script:playableTrack.music_number)
    $audioName = [Uri]::EscapeDataString([string]$script:playableTrack.music_audio)
    $imageName = [Uri]::EscapeDataString([string]$script:playableTrack.music_img)
    $audioResponse = Invoke-AppRequest -Path "music/$number/$audioName"
    $imageResponse = Invoke-AppRequest -Path "images/$number/$imageName"
    Assert-Equal $audioResponse.StatusCode 200 'Audio media status'
    Assert-Equal $imageResponse.StatusCode 200 'Image media status'
}

Test-Check 'QR deep-link valid contract is wired' {
    $number = [Uri]::EscapeDataString([string]$script:playableTrack.music_number)
    $response = Invoke-AppRequest -Path "index.html?music_number=$number"
    $scriptResponse = Invoke-AppRequest -Path 'js/script.js'
    Assert-Equal $response.StatusCode 200 'QR deep-link page status'
    Assert-True ($scriptResponse.Content.Contains("get('music_number')")) 'QR query handling is missing'
    Assert-True ($scriptResponse.Content.Contains('loadTrack(requestedTrack, false)')) 'QR track loading is missing'
}

Test-Check 'QR deep-link invalid contract is wired' {
    $response = Invoke-AppRequest -Path 'index.html?music_number=invalid'
    $scriptResponse = Invoke-AppRequest -Path 'js/script.js'
    Assert-Equal $response.StatusCode 200 'Invalid QR page status'
    Assert-True ($scriptResponse.Content.Contains('ลิงก์เสียงบรรยายไม่ถูกต้อง')) 'Invalid QR feedback is missing'
}

$protectedEndpoints = @(
    'api/add-sound.php',
    'api/add_users-admin.php',
    'api/delete_sound.php',
    'api/edit_folder.php',
    'api/edit_update-img.php',
    'api/edit_update-sound.php',
    'api/edit_update.php'
)

Test-Check 'Protected APIs reject unauthenticated requests' {
    foreach ($endpoint in $protectedEndpoints) {
        $response = Invoke-AppRequest -Path $endpoint -Method 'POST'
        $payload = Convert-JsonResponse $response
        Assert-Equal $response.StatusCode 401 "$endpoint unauthenticated status"
        Assert-True ($payload.success -eq $false) "$endpoint unauthenticated payload"
    }
}

Test-Check 'Login rejects invalid credentials without revealing account state' {
    $response = Invoke-AppRequest -Path 'api/Login.php' -Method 'POST' -Body @{
        username = "verification_$([Guid]::NewGuid().ToString('N'))"
        password = [Guid]::NewGuid().ToString('N')
    }
    $payload = Convert-JsonResponse $response
    Assert-Equal $response.StatusCode 401 'Invalid login status'
    Assert-True ($payload.success -eq $false) 'Invalid login success must be false'
}

$adminUsername = $env:MUSEUM_ADMIN_USERNAME
$adminPassword = $env:MUSEUM_ADMIN_PASSWORD
if ($adminUsername -and $adminPassword) {
    Test-Check 'Authenticated login, protected API, logout flow' {
        $session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
        $login = Invoke-AppRequest -Path 'api/Login.php' -Method 'POST' -Body @{
            username = $adminUsername
            password = $adminPassword
        } -WebSession $session
        $loginPayload = Convert-JsonResponse $login
        Assert-Equal $login.StatusCode 200 'Authenticated login status'
        Assert-True ($loginPayload.success -eq $true) 'Authenticated login success must be true'

        $protected = Invoke-AppRequest -Path 'api/add_users-admin.php' -Method 'POST' -WebSession $session
        Assert-Equal $protected.StatusCode 400 'Authenticated protected API status'

        $null = Invoke-AppRequest -Path 'api/logout.php' -WebSession $session
        $afterLogout = Invoke-AppRequest -Path 'api/add_users-admin.php' -Method 'POST' -WebSession $session
        Assert-Equal $afterLogout.StatusCode 401 'Protected API status after logout'
    }
} elseif ($RequireAuthenticatedAuth) {
    Test-Check 'Authenticated login, protected API, logout flow' {
        throw 'Set MUSEUM_ADMIN_USERNAME and MUSEUM_ADMIN_PASSWORD before running'
    }
} else {
    Skip-Check 'Authenticated login, protected API, logout flow' 'admin environment variables are not set'
}

Test-Check 'All PHP API files pass syntax checks' {
    Assert-True (Test-Path -LiteralPath $PhpPath) "PHP executable not found: $PhpPath"
    Get-ChildItem (Join-Path $PSScriptRoot '..\api') -Filter '*.php' | ForEach-Object {
        $output = & $PhpPath -l $_.FullName 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "$($_.Name): $output"
        }
    }
}

Test-Check 'Visitor and Admin JavaScript pass syntax checks' {
    $nodeCommand = Get-Command $NodePath -ErrorAction SilentlyContinue
    Assert-True ($null -ne $nodeCommand) "Node executable not found: $NodePath"
    $javascriptFiles = @(
        (Join-Path $PSScriptRoot '..\js\playlist.js'),
        (Join-Path $PSScriptRoot '..\js\script.js')
    ) + @(Get-ChildItem (Join-Path $PSScriptRoot '..\admin') -Filter '*.js' | Select-Object -ExpandProperty FullName)

    foreach ($file in $javascriptFiles) {
        $output = & $NodePath --check $file 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "$($file): $output"
        }
    }
}

Write-Host ''
Write-Host "Result: $Passed passed, $Failed failed, $Skipped skipped"
if ($Failed -gt 0) {
    exit 1
}
