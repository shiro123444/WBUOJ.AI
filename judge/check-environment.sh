#!/bin/bash

# 环境检查脚本

echo "=========================================="
echo "  Hydro Judge 环境检查"
echo "=========================================="
echo ""

# 检查内核版本
echo ">>> 内核版本"
KERNEL_VERSION=$(uname -r)
echo "    当前: $KERNEL_VERSION"
KERNEL_MAJOR=$(echo $KERNEL_VERSION | cut -d. -f1)
KERNEL_MINOR=$(echo $KERNEL_VERSION | cut -d. -f2)
if [ "$KERNEL_MAJOR" -gt 4 ] || ([ "$KERNEL_MAJOR" -eq 4 ] && [ "$KERNEL_MINOR" -ge 4 ]); then
    echo "    状态: ✅ 满足要求 (>= 4.4)"
else
    echo "    状态: ❌ 版本过低 (需要 >= 4.4)"
fi
echo ""

# 检查编译器和运行时
echo ">>> 编译器和运行时"

check_command() {
    local name=$1
    local cmd=$2
    local version_cmd=$3
    
    if command -v $cmd &> /dev/null; then
        local version=$($version_cmd 2>&1 | head -n1)
        echo "    $name: ✅ $version"
        return 0
    else
        echo "    $name: ❌ 未安装"
        return 1
    fi
}

MISSING=0

check_command "GCC" "gcc" "gcc --version" || ((MISSING++))
check_command "G++" "g++" "g++ --version" || ((MISSING++))
check_command "Python 3" "python3" "python3 --version" || ((MISSING++))
check_command "Java" "java" "java -version" || ((MISSING++))
check_command "Node.js" "node" "node -v" || ((MISSING++))
check_command "Go" "go" "go version" || ((MISSING++))

echo ""

# 检查 libseccomp
echo ">>> 安全库"
if ldconfig -p 2>/dev/null | grep -q libseccomp || [ -f /usr/lib64/libseccomp.so ]; then
    echo "    libseccomp: ✅ 已安装"
else
    echo "    libseccomp: ❌ 未安装"
    ((MISSING++))
fi
echo ""

# 检查 Docker
echo ">>> Docker"
if command -v docker &> /dev/null; then
    echo "    Docker: ✅ $(docker --version)"
else
    echo "    Docker: ❌ 未安装"
    ((MISSING++))
fi
echo ""

# 检查 go-judge 沙箱
echo ">>> Go-Judge 沙箱"
if curl -s http://localhost:5050/version &> /dev/null; then
    SANDBOX_VERSION=$(curl -s http://localhost:5050/version | grep -o '"buildVersion":"[^"]*' | cut -d'"' -f4)
    echo "    go-judge: ✅ 运行中 ($SANDBOX_VERSION)"
else
    echo "    go-judge: ❌ 未运行"
    echo "    启动命令: docker run -d --name ai-club-oj-sandbox --privileged --shm-size=256m -p 5050:5050 criyle/go-judge:latest"
    ((MISSING++))
fi
echo ""

# 检查 hydrojudge
echo ">>> Hydro Judge"
if command -v hydrojudge &> /dev/null; then
    echo "    hydrojudge: ✅ 已安装"
else
    echo "    hydrojudge: ❌ 未安装"
    echo "    安装命令: npm install -g @hydrooj/hydrojudge"
    ((MISSING++))
fi
echo ""

# 检查配置文件
echo ">>> 配置文件"
if [ -f ~/.hydro/judge.yaml ]; then
    echo "    ~/.hydro/judge.yaml: ✅ 存在"
else
    echo "    ~/.hydro/judge.yaml: ❌ 不存在"
    echo "    请复制 judge.yaml.production 到 ~/.hydro/judge.yaml"
fi
echo ""

# 总结
echo "=========================================="
if [ $MISSING -eq 0 ]; then
    echo "  ✅ 所有依赖已满足"
else
    echo "  ⚠️  缺少 $MISSING 个依赖"
    echo "  运行 sudo ./install-judge.sh 安装缺失依赖"
fi
echo "=========================================="
