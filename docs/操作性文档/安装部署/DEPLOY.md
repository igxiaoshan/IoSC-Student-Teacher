# Docker 部署指南

本文档详细说明使用 Docker 部署本项目的两种方式。

---

## 目录

- [方式一：使用 Dockerfile 手动部署](#方式一使用-dockerfile-手动部署)
- [方式二：使用 docker-compose 一键部署](#方式二使用-docker-compose-一键部署)
- [环境变量配置](#环境变量配置)
- [服务访问地址](#服务访问地址)
- [数据管理](#数据管理)
- [常见问题](#常见问题)

---

## 方式一：使用 Dockerfile 手动部署

此方式需要手动执行 Docker 命令，逐步构建和启动每个服务。

### 前置要求

- 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)
- 确保 Docker 守护进程已启动（Windows/Mac: 打开 Docker Desktop）

### Step 1：准备环境

```bash
# 确认 Docker 已安装
docker --version

# 确认 Docker 服务运行中
docker ps
```

### Step 2：构建后端镜像

```bash
# 在项目根目录下执行
docker build -t school-backend -f Dockerfile.backend .
```

**参数说明：**
- `-t school-backend`: 镜像名称（可自定义）
- `-f Dockerfile.backend`: 指定 Dockerfile 路径
- `.`: 构建上下文（当前目录）

### Step 3：构建前端镜像

```bash
docker build -t school-frontend -f Dockerfile.frontend .
```

### Step 4：启动 MongoDB 容器

```bash
# 创建网络
docker network create school-network

# 启动 MongoDB
docker run -d \
  --name school-mongodb \
  --network school-network \
  -v mongodb_data:/data/db \
  -p 27017:27017 \
  mongo:7
```

**参数说明：**
- `--network school-network`: 连接到自定义网络
- `-v mongodb_data:/data/db`: 数据卷持久化
- `-p 27017:27017`: 端口映射

### Step 5：启动后端容器

```bash
docker run -d \
  --name school-backend \
  --network school-network \
  -p 5000:5000 \
  -e MONGO_URL=mongodb://school-mongodb:27017/school \
  -e NODE_ENV=production \
  -v $(pwd)/backend/uploads:/app/uploads \
  -v $(pwd)/backend/videos:/app/videos \
  school-backend
```

### Step 6：启动前端容器

```bash
docker run -d \
  --name school-frontend \
  --network school-network \
  -p 80:80 \
  school-frontend
```

### Step 7：验证部署

```bash
# 查看运行中的容器
docker ps

# 测试后端 API
curl http://localhost:5000

# 访问前端
open http://localhost
```

### 停止和清理

```bash
# 停止所有容器
docker stop school-frontend school-backend school-mongodb

# 删除容器
docker rm school-frontend school-backend school-mongodb

# 删除镜像
docker rmi school-frontend school-backend

# 删除网络
docker network rm school-network

# 删除数据卷（清空数据库）
docker volume rm mongodb_data
```

---

## 方式二：使用 docker-compose 一键部署

此方式通过 `docker-compose.yml` 配置文件，一键启动所有服务。

### 前置要求

- 安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)（已包含 docker-compose）
- 或单独安装 [docker-compose](https://docs.docker.com/compose/install/)

### Step 1：确认 docker-compose 可用

```bash
# 方式1：使用 docker compose（Docker Desktop 内置）
docker compose version

# 方式2：使用独立的 docker-compose 命令
docker-compose version
```

> **注意：** 新版 Docker 使用 `docker compose`（空格），旧版使用 `docker-compose`（横杠）。本文档使用空格格式。

### Step 2：创建环境变量文件（可选）

```bash
# 复制示例配置文件
cp backend/.env.example .env
```

编辑 `.env` 文件填入你的 AI 服务密钥（详见[环境变量配置](#环境变量配置)）。

### Step 3：一键启动所有服务

```bash
# 前台运行（查看实时日志）
docker compose up

# 后台运行（推荐）
docker compose up -d
```

执行此命令后，Docker 会自动：
1. 构建后端和前端镜像
2. 启动 MongoDB 容器
3. 启动后端 API 容器
4. 启动前端 Nginx 容器
5. 配置网络连接

### Step 4：验证部署

```bash
# 查看服务状态
docker compose ps

# 查看所有服务日志
docker compose logs

# 查看指定服务日志
docker compose logs backend
docker compose logs frontend
docker compose logs mongodb

# 测试后端 API
curl http://localhost:5000

# 访问前端
open http://localhost
```

### 服务管理命令

```bash
# 重新构建镜像（代码有更新时）
docker compose up --build

# 重启所有服务
docker compose restart

# 重启指定服务
docker compose restart backend

# 停止所有服务
docker compose stop

# 启动已停止的服务
docker compose start

# 暂停服务
docker compose pause

# 恢复服务
docker compose unpause
```

### 完全清理

```bash
# 停止并删除所有容器、网络
docker compose down

# 停止并删除容器、网络、数据卷（清空数据库）
docker compose down -v

# 停止并删除容器、网络、数据卷、镜像
docker compose down -v --rmi all

# 查看已停止的容器
docker compose ps -a
```

---

## 环境变量配置

如果使用 docker-compose，可以创建 `.env` 文件配置环境变量：

```bash
# 复制示例配置
cp backend/.env.example .env
```

### 重要配置项

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `MONGO_URL` | MongoDB 连接地址 | `mongodb://mongodb:27017/school` |
| `DIFY_API_KEY` | Dify AI API Key | `app-xxx` |
| `DIFY_TEACHER_LESSON_APP_ID` | Dify 教师课件应用 ID | `xxx` |
| `VOLC_ACCESS_KEY` | 火山引擎 Access Key | `AKLT...` |
| `VOLC_SECRET_KEY` | 火山引擎 Secret Key | `TlRo...` |

### 仅使用本地服务（不配置 AI）

如果不配置 AI 密钥，系统将使用模拟数据模式运行，所有 AI 功能返回预设响应。

---

## 服务访问地址

部署完成后可通过以下地址访问：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端首页 | http://localhost | React 应用 |
| 后端 API | http://localhost:5000 | Express API |
| MongoDB | mongodb://localhost:27017/school | 数据库连接串 |

### 容器内访问

在同一个 Docker 网络中，服务通过服务名相互访问：

| 从容器内访问 | 地址 |
|--------------|------|
| 前端 → 后端 | http://backend:5000 |
| 后端 → MongoDB | mongodb://mongodb:27017/school |
| Nginx → 后端 | http://backend:5000 |

---

## 数据管理

### 数据持久化

| 数据类型 | 存储位置 | 说明 |
|----------|----------|------|
| MongoDB 数据 | `mongodb_data` 卷 | 自动持久化 |
| 上传文件 | `./backend/uploads` | 映射到主机目录 |
| 视频文件 | `./backend/videos` | 映射到主机目录 |

### 备份 MongoDB 数据

```bash
# 创建备份目录
mkdir -p backup

# 备份数据
docker compose exec mongodb mongodump --archive=/tmp/backup.gz --gzip

# 复制到主机
docker compose cp mongodb:/tmp/backup.gz ./backup/

# 或者直接备份数据卷
docker run --rm -v school-mongodb_data:/data/db -v $(pwd)/backup:/backup mongo:7 tar czf /backup/mongodb_backup.tar.gz /data/db
```

### 恢复 MongoDB 数据

```bash
# 从备份文件恢复
docker compose exec -T mongodb mongorestore --archive=/tmp/backup.gz --gzip --drop

# 或者解压数据卷备份
docker run --rm -v school-mongodb_data:/data/db -v $(pwd)/backup:/backup mongo:7 tar xzf /backup/mongodb_backup.tar.gz -C /
```

### 清空数据库

```bash
# 仅删除数据卷
docker compose down -v

# 删除所有数据（包括镜像）
docker compose down -v --rmi all
```

---

## 常见问题

### Q1: 端口被占用

```bash
# 检查端口占用
netstat -ano | findstr :80
netstat -ano | findstr :5000
netstat -ano | findstr :27017

# 或在 Docker 中查看
docker compose ps
```

**解决方案：** 停止占用端口的服务，或修改 `docker-compose.yml` 中的端口映射。

### Q2: 构建失败

```bash
# 清理 Docker 缓存重新构建
docker compose build --no-cache
```

### Q3: 容器启动失败

```bash
# 查看详细日志
docker compose logs --tail=100

# 进入容器调试
docker compose exec backend sh
docker compose exec mongodb mongosh
```

### Q4: 前端无法访问后端 API

检查 Nginx 代理配置是否正确：
```bash
# 查看前端容器日志
docker compose logs frontend

# 测试后端连通性
docker compose exec frontend wget -qO- http://backend:5000
```

### Q5: MongoDB 连接失败

```bash
# 检查 MongoDB 状态
docker compose ps mongodb

# 检查 MongoDB 日志
docker compose logs mongodb

# 测试连接
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Q6: 镜像拉取缓慢

```bash
# 配置国内镜像加速
# 在 Docker Desktop -> Settings -> Docker Engine 添加：
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
```

### Q7: 如何更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose up --build -d

# 或只重建特定服务
docker compose up --build backend
```

### Q8: 生产环境部署

生产环境建议：

1. **使用 Nginx 反向代理 + SSL**
2. **分离 MongoDB 到专用服务器**
3. **配置环境变量文件**（不上传 `.env` 到仓库）
4. **设置资源限制**

```yaml
# 生产环境 docker-compose.yml 示例片段
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    restart: always
```

---

## 快速参考

```bash
# 一键启动（推荐）
docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose stop

# 清理所有
docker compose down -v
```

---

## 文件清单

| 文件 | 说明 |
|------|------|
| `docker-compose.yml` | docker-compose 配置文件 |
| `Dockerfile.backend` | 后端镜像构建文件 |
| `Dockerfile.frontend` | 前端镜像构建文件 |
| `nginx.conf` | Nginx 配置文件 |
| `.dockerignore` | Docker 构建忽略文件 |
