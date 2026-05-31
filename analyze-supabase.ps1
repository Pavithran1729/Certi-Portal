$anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU'
$base = 'https://boymejjlnrlbfizavzgn.supabase.co'
$h = @{
    'apikey' = $anon
    'Authorization' = "Bearer $anon"
    'Content-Type' = 'application/json'
}

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host " LIVE SUPABASE PROJECT ANALYSIS" -ForegroundColor Cyan
Write-Host " Project: boymejjlnrlbfizavzgn" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# ─── 1. Auth Settings ─────────────────────────────────────────────────────────
Write-Host "`n[1] AUTH SETTINGS" -ForegroundColor Yellow
try {
    $auth = Invoke-RestMethod -Uri "$base/auth/v1/settings" -Headers $h -Method GET
    $auth | Select-Object external_email_enabled, external_phone_enabled, 
        disable_signup, mailer_autoconfirm, sms_autoconfirm | Format-List
} catch { Write-Host "  Error: $_" -ForegroundColor Red }

# ─── 2. Storage Buckets ───────────────────────────────────────────────────────
Write-Host "`n[2] STORAGE BUCKETS" -ForegroundColor Yellow
try {
    $buckets = Invoke-RestMethod -Uri "$base/storage/v1/bucket" -Headers $h -Method GET
    if ($buckets) {
        foreach ($b in $buckets) {
            $vis = if ($b.public) { "PUBLIC" } else { "PRIVATE" }
            Write-Host "  [$vis] $($b.name) | size_limit: $($b.file_size_limit) | mime: $($b.allowed_mime_types -join ', ')"
        }
    } else { Write-Host "  No buckets found or access denied" }
} catch { Write-Host "  Error: $_" -ForegroundColor Red }

# ─── 3. Tables (row counts) ───────────────────────────────────────────────────
Write-Host "`n[3] TABLE ROW COUNTS (anon access)" -ForegroundColor Yellow
$tables = @('profiles','certificates','certificate_templates','template_fields',
            'custom_certificate_applications','admin_notifications','user_roles')
foreach ($table in $tables) {
    try {
        $hCount = $h.Clone()
        $hCount['Prefer'] = 'count=exact'
        $resp = Invoke-WebRequest -Uri "$base/rest/v1/$table`?select=*&limit=1" -Headers $hCount -Method GET
        $count = $resp.Headers['Content-Range']
        Write-Host "  OK  $table | range: $count"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "  $code BLOCKED  $table"
    }
}

# ─── 4. Certificate Templates (live data) ─────────────────────────────────────
Write-Host "`n[4] CERTIFICATE TEMPLATES (live)" -ForegroundColor Yellow
try {
    $templates = Invoke-RestMethod -Uri "$base/rest/v1/certificate_templates?select=*" -Headers $h -Method GET
    if ($templates) {
        foreach ($t in $templates) {
            Write-Host "  • $($t.template_name) | type: $($t.certificate_type) | active: $($t.is_active) | url: $($t.template_url)"
        }
    } else { Write-Host "  No templates or access denied" }
} catch { Write-Host "  Error: $_" -ForegroundColor Red }

# ─── 5. Edge Functions (deployed check) ───────────────────────────────────────
Write-Host "`n[5] EDGE FUNCTIONS (deployed status)" -ForegroundColor Yellow
$fns = @('approve-certificate','create-admin-user','generate-certificate','manage-authority')
foreach ($fn in $fns) {
    try {
        $resp = Invoke-WebRequest -Uri "$base/functions/v1/$fn" -Headers $h -Method GET -ErrorAction SilentlyContinue
        Write-Host "  OK  $fn | status: $($resp.StatusCode)"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -eq 400 -or $code -eq 401 -or $code -eq 405) {
            Write-Host "  DEPLOYED  $fn (returned $code — function exists)"
        } elseif ($code -eq 404) {
            Write-Host "  NOT FOUND  $fn"
        } else {
            Write-Host "  $code  $fn"
        }
    }
}

# ─── 6. Project Info via OpenAPI ──────────────────────────────────────────────
Write-Host "`n[6] REST API EXPOSED TABLES (OpenAPI)" -ForegroundColor Yellow
try {
    $openapi = Invoke-RestMethod -Uri "$base/rest/v1/" -Headers $h -Method GET
    $defs = $openapi.definitions.PSObject.Properties.Name
    Write-Host "  Exposed definitions: $($defs -join ', ')"
} catch { Write-Host "  Error: $_" -ForegroundColor Red }

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host " DONE" -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan
