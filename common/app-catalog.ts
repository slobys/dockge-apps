/**
 * Built-in application catalog, shared by the UI and the authenticated backend.
 * Only the backend may turn these fixed identifiers into Compose files.
 */
export const APP_TEMPLATES = [
    {
        id: "nginx-proxy-manager",
        name: "Nginx Proxy Manager",
        icon: "🌐",
        category: "网络服务",
        description: "图形化配置反向代理、域名与 HTTPS 证书。",
        officialUrl: "https://github.com/NginxProxyManager/nginx-proxy-manager",
        image: "jc21/nginx-proxy-manager:latest",
        defaultStackName: "nginx-proxy-manager",
        ports: [
            { key: "http",
                label: "HTTP 入口",
                containerPort: 80,
                defaultHostPort: 80 },
            { key: "admin",
                label: "管理面板",
                containerPort: 81,
                defaultHostPort: 81 },
            { key: "https",
                label: "HTTPS 入口",
                containerPort: 443,
                defaultHostPort: 443 },
        ],
        notes: "代理服务对外使用 HTTP/HTTPS 端口；自定义宿主机端口后，请同步检查路由器转发规则。",
    },
    {
        id: "it-tools",
        name: "IT-Tools",
        icon: "🧰",
        category: "开发工具",
        description: "面向开发者与运维人员的在线工具箱。",
        officialUrl: "https://github.com/CorentinTh/it-tools",
        image: "corentinth/it-tools:latest",
        defaultStackName: "it-tools",
        ports: [
            { key: "web",
                label: "Web 面板",
                containerPort: 80,
                defaultHostPort: 8080 },
        ],
        notes: "独立 Web 页面，部署后可直接访问面板端口。",
    },
    {
        id: "myip",
        name: "MyIP",
        icon: "📍",
        category: "网络工具",
        description: "IP 查询、DNS 泄露检查、网络诊断与质量检测。",
        officialUrl: "https://github.com/jason5ng32/MyIP",
        image: "jason5ng32/myip:latest",
        defaultStackName: "myip",
        ports: [
            { key: "web",
                label: "Web 面板",
                containerPort: 18966,
                defaultHostPort: 18966 },
        ],
        notes: "通过域名访问须填写 ALLOWED_DOMAINS；完整地理位置/ASN 数据还需在 Stack 编辑器中配置免费的 MaxMind 凭据。",
    },
] as const;

export type AppTemplate = typeof APP_TEMPLATES[number];
export type AppTemplateId = AppTemplate["id"];
