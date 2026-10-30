<template>
    <div class="app-center pb-4">
        <div class="page-heading mb-3">
            <div>
                <h1 class="mb-1">{{ $t("appCenter") }}</h1>
                <p class="text-muted mb-0">官方开源应用，选择后配置宿主机端口，一键生成并部署 Docker Compose。</p>
            </div>
            <span class="badge rounded-pill bg-secondary">首批 {{ apps.length }} 款</span>
        </div>

        <div class="app-grid">
            <article v-for="app in apps" :key="app.id" class="shadow-box app-card">
                <div class="card-header-row">
                    <span class="app-icon" aria-hidden="true">{{ app.icon }}</span>
                    <span class="app-category">{{ app.category }}</span>
                </div>
                <h3 class="app-title">{{ app.name }}</h3>
                <p class="app-description">{{ app.description }}</p>
                <div class="port-preview">
                    <span v-for="port in app.ports" :key="port.key" class="port-chip">
                        {{ port.label }} {{ port.defaultHostPort }}
                    </span>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary" type="button" @click="openInstall(app)">
                        <font-awesome-icon icon="rocket" class="me-1" /> 安装
                    </button>
                    <a class="btn btn-normal" :href="app.officialUrl" target="_blank" rel="noopener noreferrer">源码</a>
                </div>
            </article>
        </div>

        <p class="text-muted small mt-3">部署应用后，可在 Dockge 左侧 Stack 列表中进行编辑、更新、启动和停止。已有容器不会被修改。</p>

        <div v-if="showConfig && selectedApp" class="catalog-overlay" @click.self="closeDialog">
            <section class="catalog-dialog shadow-box" role="dialog" aria-modal="true" :aria-label="selectedApp.name + ' 安装'">
                <div class="dialog-heading">
                    <div>
                        <h3 class="mb-1">{{ selectedApp.icon }} 安装 {{ selectedApp.name }}</h3>
                        <span class="text-muted small">确认配置后创建独立 Stack</span>
                    </div>
                    <button type="button" class="btn btn-normal" :disabled="installing" aria-label="关闭" @click="closeDialog">×</button>
                </div>
                <form @submit.prevent="installApp">
                    <div class="mb-3">
                        <label for="catalog-name" class="form-label">Stack 名称</label>
                        <input
                            id="catalog-name" v-model.trim="stackName" class="form-control" type="text"
                            maxlength="63" pattern="[a-z0-9][a-z0-9_-]*"
                            autocomplete="off" required :disabled="installing"
                        />
                        <div class="form-text">只能使用小写字母、数字、下划线、连字符；不会覆盖已有 Stack。</div>
                    </div>

                    <div v-if="agentOptions.length > 1" class="mb-3">
                        <label for="catalog-agent" class="form-label">部署到</label>
                        <select id="catalog-agent" v-model="endpoint" class="form-select" :disabled="installing">
                            <option
                                v-for="agent in agentOptions" :key="agent.endpoint" :value="agent.endpoint"
                                :disabled="agent.status !== 'online'"
                            >
                                {{ agent.label }} ({{ agent.status }})
                            </option>
                        </select>
                        <small class="form-text">远程节点也需运行本二开版本。</small>
                    </div>

                    <label class="form-label">宿主机端口</label>
                    <div class="port-fields mb-3">
                        <div v-for="port in selectedApp.ports" :key="port.key" class="port-field">
                            <label class="form-label small" :for="'app-port-' + port.key">{{ port.label }}</label>
                            <div class="input-group">
                                <input
                                    :id="'app-port-' + port.key" v-model.number="portValues[port.key]" class="form-control"
                                    type="number" min="1" max="65535" step="1" required :disabled="installing"
                                />
                                <span class="input-group-text">→ {{ port.containerPort }}</span>
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedApp.id === 'myip'" class="mb-3">
                        <label for="catalog-domains" class="form-label">ALLOWED_DOMAINS（可选）</label>
                        <input
                            id="catalog-domains" v-model.trim="allowedDomains" class="form-control"
                            type="text" placeholder="ip.example.com,check.example.com"
                            :disabled="installing"
                        />
                        <div class="form-text">域名访问时必须填写；只通过 IP 访问可留空。多个域名用英文逗号分隔。</div>
                    </div>

                    <p class="app-notice small mb-3">{{ selectedApp.notes }}</p>
                    <div v-if="error" class="alert alert-danger py-2" role="alert">{{ error }}</div>
                    <div v-if="installing" class="text-muted small mb-3" role="status">
                        <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                        正在生成 Stack 并拉取镜像，首次安装可能较慢，请勿重复点击……
                    </div>

                    <div class="dialog-actions">
                        <button type="button" class="btn btn-normal" :disabled="installing" @click="closeDialog">取消</button>
                        <button type="submit" class="btn btn-primary" :disabled="installing">
                            {{ installing ? "正在部署" : "确认并安装" }}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    </div>
</template>

<script>
import { APP_TEMPLATES } from "../../../common/app-catalog";

export default {
    data() {
        return {
            apps: APP_TEMPLATES,
            selectedId: "",
            showConfig: false,
            stackName: "",
            portValues: {},
            allowedDomains: "",
            endpoint: "",
            installing: false,
            error: "",
            installTimer: null,
        };
    },
    computed: {
        selectedApp() {
            return this.apps.find((item) => item.id === this.selectedId);
        },
        agentOptions() {
            const list = this.$root.agentList || {};
            const endpoints = Object.keys(list);
            if (!endpoints.includes("")) {
                endpoints.unshift("");
            }
            return endpoints.map((endpoint) => {
                const agent = list[endpoint] || {};
                return {
                    endpoint,
                    label: agent.name || (endpoint || "当前主机"),
                    status: this.$root.agentStatusList[endpoint] || (endpoint === "" ? "online" : "offline"),
                };
            });
        },
    },
    beforeUnmount() {
        clearTimeout(this.installTimer);
    },
    methods: {
        openInstall(app) {
            this.selectedId = app.id;
            this.stackName = app.defaultStackName;
            this.portValues = Object.fromEntries(app.ports.map((item) => [ item.key, item.defaultHostPort ]));
            this.allowedDomains = "";
            this.endpoint = "";
            this.error = "";
            this.installing = false;
            this.showConfig = true;
        },
        closeDialog() {
            if (!this.installing) {
                this.showConfig = false;
            }
        },
        installApp() {
            if (!this.selectedApp || this.installing) {
                return;
            }
            this.error = "";
            this.installing = true;
            const endpoint = this.endpoint;
            const payload = {
                appId: this.selectedApp.id,
                stackName: this.stackName,
                ports: { ...this.portValues },
                ...(this.selectedApp.id === "myip" ? { allowedDomains: this.allowedDomains } : {}),
            };

            // Older remote agents may not implement the catalog event.
            // This only clears the UI spinner; it does not cancel a server deployment.
            clearTimeout(this.installTimer);
            this.installTimer = setTimeout(() => {
                if (this.installing) {
                    this.installing = false;
                    this.error = "安装响应超时。请先检查 Stack 列表与目标节点日志，不要立即重复安装。";
                }
            }, 600000);

            this.$root.emitAgent(endpoint, "installCatalogApp", payload, (res) => {
                clearTimeout(this.installTimer);
                this.installing = false;
                if (!res || !res.ok) {
                    this.error = res?.msg || "安装失败，请检查目标节点状态。";
                    return;
                }

                this.showConfig = false;
                this.$root.toastRes(res);
                const name = encodeURIComponent(res.stackName);
                const target = endpoint ? `/compose/${name}/${encodeURIComponent(endpoint)}` : `/compose/${name}`;
                this.$router.push(target);
            });
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../styles/vars.scss";

.page-heading, .dialog-heading, .dialog-actions, .card-header-row, .card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}
.page-heading { flex-wrap: wrap; }
.app-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 245px), 1fr));
    gap: 14px;
}
.app-card {
    padding: 18px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    min-height: 234px;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.app-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgb(0 0 0 / 9%);
}
.app-icon { font-size: 29px; }
.app-category {
    font-size: 12px;
    opacity: 0.7;
    background: rgba(128, 128, 128, 0.13);
    padding: 4px 9px;
    border-radius: 999px;
}
.app-title { font-size: 20px; margin: 14px 0 8px; font-weight: 700; }
.app-description { min-height: 45px; margin-bottom: 12px; color: var(--bs-secondary-color); }
.port-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 17px;
}
.port-chip {
    padding: 4px 8px;
    background: rgba(128, 128, 128, 0.1);
    border-radius: 6px;
    font-size: 12px;
}
.card-actions { margin-top: auto; justify-content: flex-start; }
.catalog-overlay {
    position: fixed;
    z-index: 1100;
    inset: 0;
    background: rgba(0, 0, 0, 0.62);
    display: grid;
    place-items: center;
    padding: 16px;
}
.catalog-dialog {
    width: min(100%, 560px);
    max-height: 92vh;
    overflow-y: auto;
    border-radius: 18px;
    padding: 22px;
}
.dialog-heading { margin-bottom: 18px; align-items: flex-start; }
.dialog-heading h3 { font-size: 20px; font-weight: 700; }
.port-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 10px; }
.app-notice {
    border-left: 3px solid $primary;
    padding-left: 10px;
    color: var(--bs-secondary-color);
}
@media (max-width: 600px) {
    .catalog-dialog { padding: 16px; }
    .app-card { min-height: 215px; }
}
</style>
