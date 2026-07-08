import { spawn } from "node:child_process";
export function isRemoteReview() {
    return process.env.BKG_OC_REVIEW_REMOTE === "1" ||
        process.env.BKG_OC_DASHBOARD_REMOTE === "1" ||
        Boolean(process.env.SSH_CONNECTION || process.env.SSH_TTY);
}
export async function openReviewBrowser(url) {
    if (isRemoteReview())
        return;
    const configured = process.env.BKG_OC_REVIEW_BROWSER ?? process.env.BKG_OC_DASHBOARD_BROWSER;
    const command = configured ??
        (process.platform === "win32" ? "cmd.exe" : process.platform === "darwin" ? "open" : "xdg-open");
    const args = configured
        ? [url]
        : process.platform === "win32"
            ? ["/d", "/s", "/c", "start", "", url]
            : [url];
    await new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            detached: true,
            stdio: "ignore",
            windowsHide: true,
        });
        child.once("error", reject);
        child.once("spawn", () => {
            child.unref();
            resolve();
        });
    });
}
