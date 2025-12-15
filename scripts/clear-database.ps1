# 清空MindReminder数据库脚本
# 此脚本会删除数据库文件，重启应用后会自动创建新的空数据库

Write-Host "MindReminder - 清空数据库脚本" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 获取userData路径
$userDataPath = "$env:APPDATA\mindreminder"
$dbPath = Join-Path $userDataPath "mindreminder.db"

Write-Host "数据库路径: $dbPath" -ForegroundColor Yellow
Write-Host ""

# 检查数据库文件是否存在
if (Test-Path $dbPath) {
    Write-Host "发现数据库文件" -ForegroundColor Green
    
    # 确认删除
    $confirmation = Read-Host "确定要删除所有数据吗？此操作不可逆！(输入 YES 确认)"
    
    if ($confirmation -eq "YES") {
        try {
            Remove-Item $dbPath -Force
            Write-Host ""
            Write-Host "✓ 数据库已成功删除！" -ForegroundColor Green
            Write-Host "  重启应用后将自动创建新的空数据库" -ForegroundColor Gray
        } catch {
            Write-Host ""
            Write-Host "✗ 删除失败: $_" -ForegroundColor Red
            Write-Host "  请确保应用已关闭后再试" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "操作已取消" -ForegroundColor Yellow
    }
} else {
    Write-Host "未找到数据库文件" -ForegroundColor Yellow
    Write-Host "可能的原因：" -ForegroundColor Gray
    Write-Host "  1. 应用尚未运行过" -ForegroundColor Gray
    Write-Host "  2. 数据库已被删除" -ForegroundColor Gray
    Write-Host "  3. 路径不正确" -ForegroundColor Gray
}

Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")



