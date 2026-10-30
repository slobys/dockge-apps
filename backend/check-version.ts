import { log } from "./log";
import packageJSON from "../package.json";
import { Settings } from "./settings";

// How much time in ms to wait between update checks
const UPDATE_CHECKER_INTERVAL_MS = 1000 * 60 * 60 * 48;
// Check this fork only. An upstream release should not recommend installing the non-fork image.
const CHECK_URL = "https://api.github.com/repos/slobys/dockge-apps/releases/latest";

class CheckVersion {
    version = packageJSON.version;
    latestVersion? : string;
    interval? : NodeJS.Timeout;

    async startInterval() {
        const check = async () => {
            if (await Settings.get("checkUpdate") === false) {
                return;
            }

            log.debug("update-checker", "Retrieving latest versions");

            try {
                const res = await fetch(CHECK_URL);
                const data = await res.json();

                // No releases published yet: GitHub returns 404, so no badge is shown.
                const tag = data.tag_name;
                if (typeof tag === "string" && /^v?\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(tag)) {
                    this.latestVersion = tag.replace(/^v/, "");
                }

            } catch (_) {
                log.info("update-checker", "Failed to check for new versions");
            }

        };

        await check();
        this.interval = setInterval(check, UPDATE_CHECKER_INTERVAL_MS);
    }
}

const checkVersion = new CheckVersion();
export default checkVersion;
