import yaml from "yaml";
import { APP_TEMPLATES, AppTemplate } from "../common/app-catalog";
import { ValidationError } from "./util-server";

export interface PreparedApp {
    template: AppTemplate;
    stackName: string;
    ports: Record<string, number>;
    composeYAML: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidStackName(value: unknown): value is string {
    return typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,62}$/.test(value);
}

export function isValidDomainList(value: string): boolean {
    if (value.length > 1024) {
        return false;
    }

    const domain = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    return value.split(",").every((part) => domain.test(part.trim()));
}

/**
 * Strictly validate a client request and generate Compose from an internal allowlist.
 * User input cannot select an arbitrary image, YAML block, path or command.
 */
export function prepareAppInstall(input: unknown): PreparedApp {
    if (!isObject(input)) {
        throw new ValidationError("安装请求无效。");
    }

    const template = APP_TEMPLATES.find((item) => item.id === input.appId);
    if (!template) {
        throw new ValidationError("不支持的应用，请从内置应用中心选择。");
    }

    const stackName = input.stackName;
    if (!isValidStackName(stackName)) {
        throw new ValidationError("Stack 名称只能使用小写字母、数字、下划线与连字符（1–63 位），且必须以字母或数字开头。");
    }

    if (!isObject(input.ports)) {
        throw new ValidationError("端口配置无效。");
    }

    const expectedKeys = template.ports.map((port) => port.key);
    if (Object.keys(input.ports).length !== expectedKeys.length ||
        Object.keys(input.ports).some((key) => !expectedKeys.includes(key as typeof expectedKeys[number]))) {
        throw new ValidationError("端口字段不匹配当前应用。");
    }

    const ports: Record<string, number> = {};
    const used = new Set<number>();
    for (const item of template.ports) {
        const value = input.ports[item.key];
        if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > 65535) {
            throw new ValidationError(`端口「${item.label}」必须是 1–65535 的整数。`);
        }
        if (used.has(value)) {
            throw new ValidationError("同一应用的宿主机端口不能重复。");
        }
        used.add(value);
        ports[item.key] = value;
    }

    const service: {
        image: string;
        restart: string;
        ports: string[];
        volumes?: string[];
        environment?: Record<string, string>;
    } = {
        image: template.image,
        restart: "unless-stopped",
        ports: template.ports.map((item) => `${ports[item.key]}:${item.containerPort}`),
    };

    if (template.id === "nginx-proxy-manager") {
        service.volumes = [ "./data:/data", "./letsencrypt:/etc/letsencrypt" ];
    }

    if (template.id === "myip") {
        const allowedDomains = input.allowedDomains === undefined ? "" : input.allowedDomains;
        if (typeof allowedDomains !== "string" || !isValidDomainList(allowedDomains) && allowedDomains !== "") {
            throw new ValidationError("ALLOWED_DOMAINS 只能填写以英文逗号分隔的有效域名。");
        }
        if (allowedDomains.trim()) {
            service.environment = { ALLOWED_DOMAINS: allowedDomains.split(",").map((part) => part.trim()).join(",") };
        }
    } else if (input.allowedDomains !== undefined && input.allowedDomains !== "") {
        throw new ValidationError("此应用不支持域名白名单设置。");
    }

    return {
        template,
        stackName,
        ports,
        composeYAML: yaml.stringify({ services: { [template.id]: service } }),
    };
}

/** Parse the published port bindings returned by docker inspect for running containers. */
export function collectPublishedPorts(inspectLines: string): Set<number> {
    const published = new Set<number>();
    for (const line of inspectLines.split(/\r?\n/)) {
        if (!line.trim()) {
            continue;
        }
        const bindings: unknown = JSON.parse(line);
        if (!isObject(bindings)) {
            continue;
        }
        for (const item of Object.values(bindings)) {
            if (!Array.isArray(item)) {
                continue;
            }
            for (const binding of item) {
                if (isObject(binding) && typeof binding.HostPort === "string" && /^\d+$/.test(binding.HostPort)) {
                    const port = Number(binding.HostPort);
                    if (port >= 1 && port <= 65535) {
                        published.add(port);
                    }
                }
            }
        }
    }
    return published;
}
