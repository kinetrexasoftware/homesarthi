$envContent = @"
MONGO_URI=mongodb+srv://hirdeshkumarchaurasia_db_user:Hridesh%402005@cluster0.kmsdc9q.mongodb.net/
JWT_SECRET=GHFKFHJBFCNFHCHGB765Y7EWTDGHT5REYR
JWT_EXPIRE=7d
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
CLOUDINARY_NAME=dtzichr2m
CLOUDINARY_API_KEY=863229997757815
CLOUDINARY_API_SECRET=yThwYgJ4yOxZIB1TPPvoHbOCJmo
MAX_FILE_SIZE=5242880
"@

$envContent | Out-File -FilePath "c:\Users\HRIDESH KUMAR\OneDrive\Desktop\ROOMATE\backend\.env" -Encoding UTF8 -NoNewline
Write-Host "Backend .env file fixed!" -ForegroundColor Green
