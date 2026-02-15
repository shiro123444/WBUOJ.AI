# Stage 1: 从官方 criyle/go-judge 镜像获取编译好的二进制文件
# 这个基础镜像可能很精简或者基于我们未知的发行版，所以我们只用它来提取二进制
FROM criyle/go-judge:latest AS source

# Stage 2: 构建我们的运行环境
# 使用 Ubuntu 22.04 作为基础镜像，这还是一个非常标准的发行版
FROM ubuntu:22.04

# 直接复制本地的 sources.list 到镜像中 (最暴力有效的方法)
COPY sources.list /etc/apt/sources.list

# 避免 apt 安装时的交互提示
ENV DEBIAN_FRONTEND=noninteractive

# 调试：检查网络连接
RUN cat /etc/resolv.conf && \
    apt-get update && apt-get install -y --no-install-recommends \
    gcc \
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
    # diff 工具
    diffutils \
    # 健康检查工具
    curl \
    # 清理缓存减小镜像体积
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 从 go-judge 镜像复制二进制文件到 /usr/bin/
COPY --from=source /opt/go-judge /usr/bin/go-judge

# 创建挂载点（go-judge 配置中经常使用）
RUN mkdir -p /opt/mount

# 暴露端口
EXPOSE 5050

# 启动命令
ENTRYPOINT ["/usr/bin/go-judge"]
