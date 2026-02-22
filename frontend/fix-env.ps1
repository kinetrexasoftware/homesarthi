$envContent = @"
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBcPcf5PbBd0X-Kkx8KPMrKODaxU5RwdxI
"@

$envContent | Out-File -FilePath "c:\Users\HRIDESH KUMAR\OneDrive\Desktop\ROOMATE\frontend\.env" -Encoding UTF8 -NoNewline
Write-Host "Frontend .env file fixed!" -ForegroundColor Green
