# Dockge Apps

基于 [Dockge](https://github.com/louislam/dockge) 二次开发的 Docker Compose 管理面板。新增 **应用中心**，选好应用、修改端口，点一下就能安装。

## 主要功能

- 保留 Dockge 原有的容器编排、启动、停止、更新和日志管理功能。
- 内置常用应用，一键生成 Compose 并部署。
- 支持自定义端口，安装前检查 Docker 容器的端口占用。

| 内置应用 | 用途 | 默认宿主机端口 |
| --- | --- | --- |
| [Nginx Proxy Manager](https://github.com/NginxProxyManager/nginx-proxy-manager) | 反向代理、HTTPS 证书 | 80、81、443 |
| [IT-Tools](https://github.com/CorentinTh/it-tools) | 实用在线工具箱 | 8080 |
| [MyIP](https://github.com/jason5ng32/MyIP) | IP 查询、网络检测 | 18966 |

## 安装

需要 **Linux / NAS + Docker + Docker Compose V2**。

```bash
git clone https://github.com/slobys/dockge-apps.git
cd dockge-apps
docker compose -f compose.apps.yaml up -d --build
```

打开 **http://服务器IP:5001**，设置管理员账号，进入 **应用中心**，选择应用并修改端口即可安装。

如需修改面板端口（例如改为 5002）：

```bash
DOCKGE_HTTP_PORT=5002 docker compose -f compose.apps.yaml up -d --build
```

## 使用提醒

- **请使用 `compose.apps.yaml`**；仓库里的 `compose.yaml` 属于原版 Dockge 配置。
- 已安装原版 Dockge 的用户，请先备份数据，不要让两个面板同时管理同一个 Stack 目录。
- MyIP 使用域名访问时，请设置 `ALLOWED_DOMAINS`；部分地理位置功能还需要 MaxMind 凭据。
- 面板拥有 Docker 管理权限，建议仅在可信内网或有访问保护的环境使用。

## 致谢

本项目是**非官方二开版本**。感谢 [Louis Lam 的 Dockge](https://github.com/louislam/dockge) 及上述开源项目；原项目版权和 [MIT 许可证](LICENSE) 保留。
