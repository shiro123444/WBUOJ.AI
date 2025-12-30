#!/bin/bash

# Hydro Judge 安装脚本
# 适用于 OpenCloudOS / CentOS Stream / RHEL 9

set -e

echo "=========================================="
echo "  Hydro Judge 评测引擎安装脚本"
echo "=========================================="

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用 root 权限运行此脚本"
    echo "用法: sudo ./install-judge.sh"
    exit 1
fi

# 检查内核版本
KERNEL_VERSION=$(uname -r | cut -d. -f1-2)
REQUIRED_VERSION="4.4"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$KERNEL_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ 内核版本过低: $KERNEL_VERSION (需要 >= $REQUIRED_VERSION)"
    exit 1
fi
echo "✅ 内核版本检查通过: $(uname -r)"

# 检测包管理器
if command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
else
    echo "❌ 未找到支持的包管理器 (dnf/yum)"
    exit 1
fi
echo "✅ 使用包管理器: $PKG_MANAGER"

echo ""
echo ">>> 步骤 1/5: 安装系统依赖..."
$PKG_MANAGER install -y \
    gcc gcc-c++ \
    python3 python3-pip \
    java-17-openjdk java-17-openjdk-devel \
    golang \
    libseccomp libseccomp-devel \
    make cmake \
    git curl wget

echo ""
echo ">>> 步骤 2/5: 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "安装 Node.js 20..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    $PKG_MANAGER install -y nodejs
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 版本过低: $(node -v) (需要 >= 20)"
    exit 1
fi
echo "✅ Node.js 版本: $(node -v)"

echo ""
echo ">>> 步骤 3/5: 安装 Hydro Judge..."
npm install -g @hydrooj/hydrojudge

echo ""
echo ">>> 步骤 4/5: 创建配置目录..."
JUDGE_USER=${SUDO_USER:-$(whoami)}
JUDGE_HOME=$(eval echo ~$JUDGE_USER)
mkdir -p "$JUDGE_HOME/.hydro"
mkdir -p /tmp/hydrojudge/cache

# 复制配置文件模板
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/judge.yaml.example" ]; then
    if [ ! -f "$JUDGE_HOME/.hydro/judge.yaml" ]; then
        cp "$SCRIPT_DIR/judge.yaml.example" "$JUDGE_HOME/.hydro/judge.yaml"
        chown $JUDGE_USER:$JUDGE_USER "$JUDGE_HOME/.hydro/judge.yaml"
        echo "✅ 配置文件已创建: $JUDGE_HOME/.hydro/judge.yaml"
        echo "⚠️  请编辑配置文件，设置正确的 server_url 和 password"
    else
        echo "✅ 配置文件已存在: $JUDGE_HOME/.hydro/judge.yaml"
    fi
fi

echo ""
echo ">>> 步骤 5/5: 安装 systemd 服务..."
if [ -f "$SCRIPT_DIR/hydrojudge.service" ]; then
    cp "$SCRIPT_DIR/hydrojudge.service" /etc/systemd/system/
    # 替换用户名
    sed -i "s/User=judge/User=$JUDGE_USER/" /etc/systemd/system/hydrojudge.service
    systemctl daemon-reload
    echo "✅ systemd 服务已安装"
    echo "   启动服务: sudo systemctl start hydrojudge"
    echo "   开机自启: sudo systemctl enable hydrojudge"
fi

echo ""
echo "=========================================="
echo "  安装完成！"
echo "=========================================="
echo ""
echo "已安装的组件:"
echo "  - GCC: $(gcc --version | head -n1)"
echo "  - Python: $(python3 --version)"
echo "  - Java: $(java -version 2>&1 | head -n1)"
echo "  - Go: $(go version)"
echo "  - Node.js: $(node -v)"
echo "  - Hydro Judge: $(hydrojudge --version 2>/dev/null || echo '已安装')"
echo ""
echo "下一步:"
echo "  1. 编辑配置文件: $JUDGE_HOME/.hydro/judge.yaml"
echo "  2. 启动后端服务 (确保 WebSocket 端点可用)"
echo "  3. 启动评测服务: sudo systemctl start hydrojudge"
echo ""
