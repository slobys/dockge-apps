import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { DockgeServer } from "./dockge-server";
import { Stack } from "./stack";
import { DockgeSocket, fileExists, ValidationError } from "./util-server";
import { collectPublishedPorts, prepareAppInstall } from "./app-catalog";

const execFileAsync = promisify(execFile);

// Block overlapping catalog installs on the same Dockge process. Docker remains
// the ultimate authority for races with external processes and other hosts.
let installInProgress = false;

export async function getOccupiedDockerPorts(): Promise<Set<number>> {
    const { stdout: idsText } = await execFileAsync("docker", [ "container", "ls", "--format", "{{.ID}}" ], {
        timeout: 10000,
        maxBuffer: 1024 * 1024,
        encoding: "utf8",
    });
    const ids = idsText.trim().split(/\s+/).filter(Boolean);
    const occupied = new Set<number>();

    // Avoid an excessive argv length on Docker hosts with many containers.
    for (let start = 0; start < ids.length; start += 40) {
        const batch = ids.slice(start, start + 40);
        const { stdout } = await execFileAsync("docker", [
            "inspect", "--format", "{{json .NetworkSettings.Ports}}", ...batch,
        ], {
            timeout: 15000,
            maxBuffer: 1024 * 1024,
            encoding: "utf8",
        });

        for (const port of collectPublishedPorts(stdout)) {
            occupied.add(port);
        }
    }
    return occupied;
}

export async function installCatalogApp(server: DockgeServer, socket: DockgeSocket, request: unknown) {
    // Validate before taking the application-wide installation lock.
    const prepared = prepareAppInstall(request);

    if (installInProgress) {
        throw new ValidationError("另一个应用正在安装，请在当前安装结束后重试。");
    }
    installInProgress = true;

    try {
        const dir = path.join(server.stacksDir, prepared.stackName);
        if (await fileExists(dir)) {
            throw new ValidationError(`Stack「${prepared.stackName}」已存在，请换一个名称。`);
        }

        // Fail closed if Docker status cannot be inspected. Do not guess that
        // ports are free when the Docker socket is unavailable.
        const occupied = await getOccupiedDockerPorts();
        const conflicts = Object.values(prepared.ports).filter((port) => occupied.has(port));
        if (conflicts.length > 0) {
            throw new ValidationError(`Docker 已占用宿主机端口：${conflicts.join("、")}，请修改端口再安装。`);
        }

        const stack = new Stack(server, prepared.stackName, prepared.composeYAML, "");
        await stack.save(true);
        try {
            await stack.deploy(socket);
        } catch (error) {
            // Keep generated Compose intact so the user can inspect/retry it
            // through the standard Dockge editor. Never delete user data here.
            server.sendStackList();
            const reason = error instanceof Error ? error.message : "未知错误";
            throw new Error(`Stack 已创建但启动失败，请在 Stack 管理页面查看终端日志并重试：${reason}`);
        }

        server.sendStackList();
        stack.joinCombinedTerminal(socket);
        return {
            stackName: prepared.stackName,
            appId: prepared.template.id,
            ports: prepared.ports,
        };
    } finally {
        installInProgress = false;
    }
}
