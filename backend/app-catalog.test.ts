import test from "node:test";
import assert from "node:assert/strict";
import yaml from "yaml";
import { APP_TEMPLATES } from "../common/app-catalog";
import { collectPublishedPorts, isValidDomainList, isValidStackName, prepareAppInstall } from "./app-catalog";

function request(id: string, ports: Record<string, number>, overrides: Record<string, unknown> = {}) {
    return { appId: id,
        stackName: id,
        ports,
        ...overrides };
}

test("all three applications generate valid, allowlisted Compose services", () => {
    assert.equal(APP_TEMPLATES.length, 3);
    const cases = [
        [ "nginx-proxy-manager", { http: 80,
            admin: 81,
            https: 443 }, "jc21/nginx-proxy-manager:latest" ],
        [ "it-tools", { web: 8080 }, "corentinth/it-tools:latest" ],
        [ "myip", { web: 18966 }, "jason5ng32/myip:latest" ],
    ] as const;
    for (const [ id, ports, image ] of cases) {
        const created = prepareAppInstall(request(id, ports));
        const doc = yaml.parse(created.composeYAML);
        const service = doc.services[id];
        assert.equal(service.image, image);
        assert.equal(service.restart, "unless-stopped");
        assert.equal(service.ports.length, Object.keys(ports).length);
        assert.equal(Object.keys(doc.services).length, 1);
    }
});

test("NPM has three independent published ports and persistent data paths", () => {
    const doc = yaml.parse(prepareAppInstall(request("nginx-proxy-manager", {
        http: 8180,
        admin: 8181,
        https: 8443,
    })).composeYAML);
    assert.deepEqual(doc.services["nginx-proxy-manager"].ports, [ "8180:80", "8181:81", "8443:443" ]);
    assert.deepEqual(doc.services["nginx-proxy-manager"].volumes, [
        "./data:/data", "./letsencrypt:/etc/letsencrypt",
    ]);
});

test("port validation rejects repeated, unsafe, out-of-range and unexpected values", () => {
    const invalid = [ 0, -1, 65536, 2.5, Number.NaN, "8080", null, {}];
    for (const value of invalid) {
        assert.throws(() => prepareAppInstall(request("it-tools", { web: value as number })), /端口/);
    }
    assert.throws(() => prepareAppInstall(request("nginx-proxy-manager", {
        http: 1234,
        admin: 1234,
        https: 2345,
    })), /重复/);
    assert.throws(() => prepareAppInstall(request("it-tools", { web: 8000,
        unexpected: 8001 })), /字段/);
});

test("invalid app and unsafe stack names are refused", () => {
    assert.equal(isValidStackName("safe_stack-01"), true);
    for (const stackName of [ "../etc", "Test", "", "_name", "x".repeat(64) ]) {
        assert.equal(isValidStackName(stackName), false);
        assert.throws(() => prepareAppInstall(request("it-tools", { web: 8080 }, { stackName })), /Stack 名称/);
    }
    assert.throws(() => prepareAppInstall(request("not-on-list", { web: 8090 })), /不支持/);
    const doc = yaml.parse(prepareAppInstall(request("it-tools", { web: 8080 }, { image: "evil/ubuntu" })).composeYAML);
    assert.equal(doc.services["it-tools"].image, "corentinth/it-tools:latest");
});

test("MyIP domain list is validated and encoded as data", () => {
    assert.equal(isValidDomainList("my.example.com,ip.example.org"), true);
    const doc = yaml.parse(prepareAppInstall(request("myip", { web: 19000 }, {
        allowedDomains: "my.example.com, ip.example.org",
    })).composeYAML);
    assert.equal(doc.services.myip.environment.ALLOWED_DOMAINS, "my.example.com,ip.example.org");
    for (const domain of [ "a.com\nservices:", "a.com;echo", "-bad.org", "https://example.com" ]) {
        assert.equal(isValidDomainList(domain), false);
        assert.throws(() => prepareAppInstall(request("myip", { web: 18966 }, { allowedDomains: domain })), /ALLOWED_DOMAINS/);
    }
});

test("Docker inspect publishes only numeric host ports", () => {
    const output = "{\"80/tcp\":[{\"HostIp\":\"0.0.0.0\",\"HostPort\":\"9080\"},{\"HostIp\":\"::\",\"HostPort\":\"9080\"}],\"443/tcp\":null}\n" +
        "{\"18966/tcp\":[{\"HostIp\":\"0.0.0.0\",\"HostPort\":\"18966\"}]}\n";
    assert.deepEqual([ ...collectPublishedPorts(output) ].sort((a, b) => a - b), [ 9080, 18966 ]);
});
