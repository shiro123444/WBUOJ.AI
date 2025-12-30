FROM criyle/go-judge:latest

# 安装所有常用编译器和运行时
RUN apt-get update && apt-get install -y --no-install-recommends \
    # C/C++ 编译器
    gcc \
    g++ \
    build-essential \
    # Python
    python3 \
    python3-pip \
    # Java
    default-jdk \
    # Node.js
    nodejs \
    npm \
    # Go
    golang \
    # 其他工具
    bash \
    coreutils \
    # diff 工具 (HydroJudge checker 需要)
    diffutils \
    # 健康检查工具
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
