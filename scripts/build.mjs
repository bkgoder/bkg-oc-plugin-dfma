import { cp, mkdir } from "node:fs/promises"
import { spawn } from "node:child_process"

await run(process.execPath, ["./node_modules/typescript/bin/tsc", "-p", "tsconfig.json"])
await mkdir("dist/src/dashboard/static", { recursive: true })
await cp("src/dashboard/static", "dist/src/dashboard/static", { recursive: true })

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: false })
    child.once("error", reject)
    child.once("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} exited with code ${code}`))
    })
  })
}
