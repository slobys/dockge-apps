# Dockge Apps · Dockge 应用中心二开版

> **独立社区衍生版（非 Dockge 官方版本）**，基于 [louislam/dockge](https://github.com/louislam/dockge)，遵守原项目 MIT 许可证并保留作者署名。原始 Dockge 项目仍由 Louis Lam 维护。
>
> **请使用下方 `compose.apps.yaml` 进行安装。原版 `compose.yaml` 仍引用官方镜像，不包含本仓库的应用中心功能。**

## 功能亮点

- **应用中心**：无需复制粘贴 Docker Compose，面板中直接安装 [Nginx Proxy Manager](https://github.com/NginxProxyManager/nginx-proxy-manager)、[IT-Tools](https://github.com/CorentinTh/it-tools)、[MyIP](https://github.com/jason5ng32/MyIP)。
- **独立端口设置**：Nginx Proxy Manager 的 HTTP/管理/HTTPS 三个宿主机端口均可配置；IT-Tools 与 MyIP 也支持端口修改。
- **安全部署**：登录鉴权、限定官方镜像与模板、端口和 Stack 名称校验、Docker 已发布端口冲突检查、安装互斥；不会覆盖已有 Stack。
- **沿用 Dockge 管理**：安装后自动进入对应 Stack，可继续通过 Compose 编辑器管理、更新或停止。
- **MyIP 提示**：通过真实域名访问时需要填写 `ALLOWED_DOMAINS`；MaxMind 地理位置与 ASN 功能需要用户自行申请免费的账户凭据，未配置可能返回 503。

## 快速部署（Linux / NAS）

要求 Docker Engine、Docker Compose V2、足够的镜像拉取空间。Docker 管理权限非常高，**只应在可信内网或受保护的反向代理后开放 Dockge 管理端口**。

```bash
git clone https://github.com/slobys/dockge-apps.git
cd dockge-apps
mkdir -p data
docker compose -f compose.apps.yaml up -d --build
```

浏览器打开 `http://服务器IP:5001`，完成管理员设置，点击顶部的 **应用中心** → 选择应用 → 设置端口 → **确认并安装**。首次拉取镜像需要联网，不会自动对公网开放路由器或云防火墙。

如需自定义 Dockge 面板及 stacks 目录，可在 `docker compose` 前设置（**Stack 宿主机和容器路径必须相同且为绝对路径**）：

```bash
DOCKGE_HTTP_PORT=5002 DOCKGE_STACKS_DIR=/opt/stacks \
  docker compose -f compose.apps.yaml up -d --build
```

**已有 Dockge 用户：** 部署前备份旧版数据目录以及 `/opt/stacks`，并在测试时使用其他面板端口，避免两个 Dockge 实例共同操作同一 Stack。不要在已有生产环境直接覆盖或重新创建原容器。

**端口说明：** 自定义端口是「宿主机端口:容器端口」，例如 NPM 管理页面 `8181:81` 则从 `http://服务器IP:8181` 访问。应用中心可检测运行中 Docker 容器已发布端口；其他宿主机进程、防火墙和部署瞬间的外部竞争仍可能造成启动失败。遇到失败，生成的 Compose 会保留，可在 Stack 页面调整并重试。

**MyIP 配置：** 若需要完整 MaxMind 查询，在创建后打开对应 Stack 编辑器，按 [MyIP 官方指南](https://docs.ipcheck.ing/developer/getting-started/maxmind-setup) 配置 `MAXMIND_ACCOUNT_ID` 和 `MAXMIND_LICENSE_KEY`；域名访问时设置 `ALLOWED_DOMAINS`。不建议把凭据提交到 GitHub。

## 开发与验证

```bash
npm ci
npm run test:catalog
npm run check-ts
npm run lint
npm run build:frontend
docker compose -f compose.apps.yaml config
```

应用中心逻辑位于 `common/app-catalog.ts`、`backend/app-catalog.ts`、`backend/app-installer.ts` 与 `frontend/src/pages/AppCenter.vue`。单元测试验证模板、输入限制与 Docker 端口解析；单元测试不代表已经在真实 NAS 上完成所有镜像的安装验收。

---

## 原版 Dockge 介绍与参考文档（以下为上游资料，安装命令请以本页为准）

<div align="center" width="100%">
    <img src="./frontend/public/icon.svg" width="128" alt="" />
</div>

# Dockge

A fancy, easy-to-use and reactive self-hosted docker compose.yaml stack-oriented manager.

[![GitHub Repo stars](https://img.shields.io/github/stars/louislam/dockge?logo=github&style=flat)](https://github.com/louislam/dockge) [![Docker Pulls](https://img.shields.io/docker/pulls/louislam/dockge?logo=docker)](https://hub.docker.com/r/louislam/dockge/tags) [![Docker Image Version (latest semver)](https://img.shields.io/docker/v/louislam/dockge/latest?label=docker%20image%20ver.)](https://hub.docker.com/r/louislam/dockge/tags) [![GitHub last commit (branch)](https://img.shields.io/github/last-commit/louislam/dockge/master?logo=github)](https://github.com/louislam/dockge/commits/master/)

<img src="https://github.com/louislam/dockge/assets/1336778/26a583e1-ecb1-4a8d-aedf-76157d714ad7" width="900" alt="" />

View Video: https://youtu.be/AWAlOQeNpgU?t=48

## ⭐ Features

- 🧑‍💼 Manage your `compose.yaml` files
  - Create/Edit/Start/Stop/Restart/Delete
  - Update Docker Images
- ⌨️ Interactive Editor for `compose.yaml`
- 🦦 Interactive Web Terminal
- 🕷️ (1.4.0 🆕) Multiple agents support - You can manage multiple stacks from different Docker hosts in one single interface
- 🏪 Convert `docker run ...` commands into `compose.yaml`
- 📙 File based structure - Dockge won't kidnap your compose files, they are stored on your drive as usual. You can interact with them using normal `docker compose` commands

<img src="https://github.com/louislam/dockge/assets/1336778/cc071864-592e-4909-b73a-343a57494002" width=300 />

- 🚄 Reactive - Everything is just responsive. Progress (Pull/Up/Down) and terminal output are in real-time
- 🐣 Easy-to-use & fancy UI - If you love Uptime Kuma's UI/UX, you will love this one too

![](https://github.com/louislam/dockge/assets/1336778/89fc1023-b069-42c0-a01c-918c495f1a6a)

## 🔧 How to Install

Requirements:
- [Docker](https://docs.docker.com/engine/install/) 20+ / Podman
- (Podman only) podman-docker (Debian: `apt install podman-docker`)
- OS:
  - Major Linux distros that can run Docker/Podman such as:
     - ✅ Ubuntu
     - ✅ Debian (Bullseye or newer)
     - ✅ Raspbian (Bullseye or newer)
     - ✅ CentOS
     - ✅ Fedora
     - ✅ ArchLinux
  - ❌ Debian/Raspbian Buster or lower is not supported
  - ❌ Windows (Will be supported later)
- Arch: armv7, arm64, amd64 (a.k.a x86_64)

### Basic

- Default Stacks Directory: `/opt/stacks`
- Default Port: 5001

```
# Create directories that store your stacks and stores Dockge's stack
mkdir -p /opt/stacks /opt/dockge
cd /opt/dockge

# Download the compose.yaml
curl https://raw.githubusercontent.com/louislam/dockge/master/compose.yaml --output compose.yaml

# Start the server
docker compose up -d

# If you are using docker-compose V1 or Podman
# docker-compose up -d
```

Dockge is now running on http://localhost:5001

### Advanced

If you want to store your stacks in another directory, you can generate your compose.yaml file by using the following URL with custom query strings.

```
# Download your compose.yaml
curl "https://dockge.kuma.pet/compose.yaml?port=5001&stacksPath=/opt/stacks" --output compose.yaml
```

- port=`5001`
- stacksPath=`/opt/stacks`

Also, once compose is generated/downloaded, add the `PUID` and `PGID` section below to your compose `environment:` section to set stack ownership, otherwise default is `root`

```
      # Both PUID and PGID must be set for it to do anything
      - PUID=1000 # Set the stack file/dir ownership to this user
      - PGID=1000 # Set the stack file/dir ownership to this group
```

Interactive compose.yaml generator is available on: 
https://dockge.kuma.pet

### -OR-
Copy and paste your compose from the following:

If you want to store your stacks in another directory, you can change the `DOCKGE_STACKS_DIR` environment variable and volumes.

compose:
```
services:
  dockge:
    image: louislam/dockge:1
    restart: unless-stopped
    ports:
      # Host Port:Container Port
      - 5001:5001
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./data:/app/data
        
      # If you want to use private registries, you need to share the auth file with Dockge:
      # - /root/.docker/:/root/.docker

      # Stacks Directory
      # Your stacks directory in the host (The paths inside container must be the same as the host)
      # ⚠️ If you did it wrong, your data could end up be written into a wrong path.
      # ✔️ CORRECT EXAMPLE: - /my-stacks:/my-stacks (Both paths match)
      # ❌ WRONG EXAMPLE: - /docker:/my-stacks (Both paths do not match)
      - /opt/stacks:/opt/stacks
    environment:
      # Tell Dockge where your stacks directory is
      - DOCKGE_STACKS_DIR=/opt/stacks
      # Both PUID and PGID must be set for it to do anything
      - PUID=1000 # Set the stack file/dir ownership to this user
      - PGID=1000 # Set the stack file/dir ownership to this group
```

## How to Update

```bash
cd /opt/dockge
docker compose pull && docker compose up -d
```

## Screenshots

![](https://github.com/louislam/dockge/assets/1336778/e7ff0222-af2e-405c-b533-4eab04791b40)


![](https://github.com/louislam/dockge/assets/1336778/7139e88c-77ed-4d45-96e3-00b66d36d871)

![](https://github.com/louislam/dockge/assets/1336778/f019944c-0e87-405b-a1b8-625b35de1eeb)

![](https://github.com/louislam/dockge/assets/1336778/a4478d23-b1c4-4991-8768-1a7cad3472e3)


## Motivations

- I have been using Portainer for some time, but for the stack management, I am sometimes not satisfied with it. For example, sometimes when I try to deploy a stack, the loading icon keeps spinning for a few minutes without progress. And sometimes error messages are not clear.
- Try to develop with ES Module + TypeScript

If you love this project, please consider giving it a ⭐.


## 🗣️ Community and Contribution

### Bug Report
https://github.com/louislam/dockge/issues

### Ask for Help / Discussions
https://github.com/louislam/dockge/discussions

### Translation
If you want to translate Dockge into your language, please read [Translation Guide](https://github.com/louislam/dockge/blob/master/frontend/src/lang/README.md)

### Create a Pull Request

Be sure to read the [guide](https://github.com/louislam/dockge/blob/master/CONTRIBUTING.md), as we don't accept all types of pull requests and don't want to waste your time.

## FAQ

#### "Dockge"?

"Dockge" is a coinage word which is created by myself. I originally hoped it sounds like `Dodge`, but apparently many people called it `Dockage`, it is also acceptable.

The naming idea came from Twitch emotes like `sadge`, `bedge` or `wokege`. They all end in `-ge`.

#### Can I manage a single container without `compose.yaml`?

The main objective of Dockge is to try to use the docker `compose.yaml` for everything. If you want to manage a single container, you can just use Portainer or Docker CLI.

#### Can I manage existing stacks?

Yes, you can. However, you need to move your compose file into the stacks directory:

1. Stop your stack
2. Move your compose file into `/opt/stacks/<stackName>/compose.yaml`
3. In Dockge, click the " Scan Stacks Folder" button in the top-right corner's dropdown menu
4. Now you should see your stack in the list

#### Is Dockge a Portainer replacement?

Yes or no. Portainer provides a lot of Docker features. While Dockge is currently only focusing on docker-compose with a better user interface and better user experience.

If you want to manage your container with docker-compose only, the answer may be yes.

If you still need to manage something like docker networks, single containers, the answer may be no.

#### Can I install both Dockge and Portainer?

Yes, you can.

## Others

Dockge is built on top of [Compose V2](https://docs.docker.com/compose/migrate/). `compose.yaml`  also known as `docker-compose.yml`.
