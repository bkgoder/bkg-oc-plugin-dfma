import { readFileSync } from "node:fs"

const pkg = JSON.parse(readFileSync("package.json", "utf8"))
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"))
const root = lock.packages?.[""]
const failures = []

function same(label, left, right) {
  if (left !== right) failures.push(`${label} mismatch: package.json=${JSON.stringify(left)} package-lock.json=${JSON.stringify(right)}`)
}

same("name", pkg.name, lock.name)
same("version", pkg.version, lock.version)
same("root name", pkg.name, root?.name)
same("root version", pkg.version, root?.version)

for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
  const pkgDeps = pkg[section] ?? {}
  const lockDeps = root?.[section] ?? {}
  for (const [name, range] of Object.entries(pkgDeps)) {
    if (lockDeps[name] !== range) failures.push(`${section}.${name} mismatch: package.json=${range} package-lock.json=${lockDeps[name]}`)
  }
  for (const name of Object.keys(lockDeps)) {
    if (!(name in pkgDeps)) failures.push(`${section}.${name} exists in package-lock root but not package.json`)
  }
}

if (pkg.devDependencies?.vitest && !lock.packages?.["node_modules/vitest"]) {
  failures.push("vitest is declared in package.json but node_modules/vitest is missing from package-lock.json")
}

if (lock.packages?.["node_modules/unique-names-generator"]) {
  failures.push("unique-names-generator is still present in package-lock.json")
}

const forbiddenLatest = []
for (const [section, deps] of Object.entries({ dependencies: pkg.dependencies ?? {}, devDependencies: pkg.devDependencies ?? {} })) {
  for (const [name, range] of Object.entries(deps)) {
    if (range === "latest") forbiddenLatest.push(`${section}.${name}`)
  }
}
if (forbiddenLatest.length) failures.push(`latest ranges are forbidden: ${forbiddenLatest.join(", ")}`)

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"))
  process.exit(1)
}

console.log("package-lock integrity passed")
