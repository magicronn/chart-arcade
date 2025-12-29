@echo off
REM Chart Arcade Deployment Script (Windows)
REM Usage: deploy.bat [preview|prod]

echo.
echo Chart Arcade Deployment
echo ==========================
echo.

SET DEPLOY_TYPE=%1
IF "%DEPLOY_TYPE%"=="" SET DEPLOY_TYPE=preview

REM Build the project
echo Building production bundle...
echo.
call npm run build

IF NOT EXIST "dist\" (
    echo Build failed - dist directory not found
    exit /b 1
)

echo.
echo Build successful!
echo.
echo Bundle size: ~197.8 KB gzipped
echo.

REM Deploy based on type
IF "%DEPLOY_TYPE%"=="prod" (
    echo Deploying to PRODUCTION...
    call vercel --prod
) ELSE (
    echo Deploying PREVIEW...
    call vercel
)

echo.
echo Deployment complete!
echo.
echo Next steps:
echo   - Test the deployment URL
echo   - Check browser console for errors
echo   - Verify stock data loads correctly
echo.
