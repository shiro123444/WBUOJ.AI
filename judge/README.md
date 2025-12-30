# Hydro Judge 评测引擎部署指南

本目录包含 Hydro Judge 评测引擎的配置和部署脚本。

## 系统要求

- Linux 内核 4.4+ (当前系统: OpenCloudOS 6.6.114 ✅)
- Node.js 20+
- Python 3.8+
- 编译器和运行时环境

## 快速部署

### 1. 安装依赖

```bash
# 运行安装脚本
sudo ./install-judge.sh
```

### 2. 配置评测机

编辑 `~/.hydro/judge.yaml` 配置文件，设置后端服务地址和认证信息。

### 3. 启动评测服务

```bash
# 使用 systemd 服务
sudo systemctl start hydrojudge
sudo systemctl enable hydrojudge

# 或手动启动
hydrojudge
```

## 目录结构

```
judge/
├── README.md           # 本文件
├── install-judge.sh    # 安装脚本
├── judge.yaml.example  # 配置文件模板
└── hydrojudge.service  # systemd 服务文件
```

## 支持的语言

| 语言 | 标识 | 编译器/解释器 |
|-----|------|-------------|
| C++ | cc.cc17o2 | g++ -std=c++17 -O2 |
| Python | py.py3 | Python 3 |
| Java | java | OpenJDK 17 |
| JavaScript | js.node | Node.js 20 |
| Go | go | Go 1.21+ |

## 故障排查

### 查看日志
```bash
journalctl -u hydrojudge -f
```

### 测试连接
```bash
hydrojudge --help
```
