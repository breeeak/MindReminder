# Story 1.2 验收测试脚本

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Story 1.2 验收测试" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 设置变量
$DB_PATH = "$env:APPDATA\mindreminder\mindreminder.db"

# AC1: 检查依赖
Write-Host "AC1: 检查 better-sqlite3 依赖..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.dependencies."better-sqlite3") {
    Write-Host "✅ AC1: better-sqlite3 依赖已安装" -ForegroundColor Green
}
else {
    Write-Host "❌ AC1: better-sqlite3 依赖缺失" -ForegroundColor Red
}

# AC2: 检查 DatabaseService 文件
Write-Host ""
Write-Host "AC2: 检查 DatabaseService 类..." -ForegroundColor Yellow
if (Test-Path "src/main/database/DatabaseService.ts") {
    Write-Host "✅ AC2: DatabaseService.ts 文件存在" -ForegroundColor Green
}
else {
    Write-Host "❌ AC2: DatabaseService.ts 文件缺失" -ForegroundColor Red
}

# AC3: 检查迁移文件
Write-Host ""
Write-Host "AC3: 检查迁移机制..." -ForegroundColor Yellow
if (Test-Path "src/main/database/migrations") {
    Write-Host "✅ AC3: migrations 目录存在" -ForegroundColor Green
    
    if (Test-Path "src/main/database/migrations/001_initial_schema.ts") {
        Write-Host "✅ AC3: 初始迁移文件存在" -ForegroundColor Green
    }
    else {
        Write-Host "❌ AC3: 初始迁移文件缺失" -ForegroundColor Red
    }
}
else {
    Write-Host "❌ AC3: migrations 目录缺失" -ForegroundColor Red
}

# AC4: 检查数据库文件和表结构
Write-Host ""
Write-Host "AC4: 检查数据库文件和表结构..." -ForegroundColor Yellow
if (Test-Path $DB_PATH) {
    Write-Host "✅ AC4: 数据库文件已创建" -ForegroundColor Green
    Write-Host "   路径: $DB_PATH" -ForegroundColor Gray
    
    $dbFile = Get-Item $DB_PATH
    Write-Host "   大小: $($dbFile.Length) 字节" -ForegroundColor Gray
    
    # 检查日志
    $logPath = "$env:APPDATA\mindreminder\logs\main.log"
    if (Test-Path $logPath) {
        $logContent = Get-Content $logPath -Tail 20
        
        if ($logContent -match "Database initialized successfully") {
            Write-Host "✅ AC4: 数据库初始化成功" -ForegroundColor Green
        }
        
        if ($logContent -match "All required tables exist") {
            Write-Host "✅ AC4: 所有必需表已创建" -ForegroundColor Green
        }
        
        if ($logContent -match "Found \d+ indices") {
            Write-Host "✅ AC4: 索引已建立" -ForegroundColor Green
        }
        
        if ($logContent -match "Migration 1 completed successfully") {
            Write-Host "✅ AC4: 初始迁移执行成功" -ForegroundColor Green
        }
    }
}
else {
    Write-Host "❌ AC4: 数据库文件未创建" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "验收测试完成" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
