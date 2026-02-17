const rootModule = JSON.parse(await Deno.readTextFile('./deno.json'))
const subModules = rootModule.workspace

for (const subModule of subModules) {
    const subModulePath = `./${subModule}/deno.json`
    const subModuleJson = JSON.parse(await Deno.readTextFile(subModulePath))

    if (!subModuleJson.name) {
        continue
    }

    subModuleJson.version = rootModule.version

    await Deno.writeTextFile(
        subModulePath,
        JSON.stringify(subModuleJson, null, 2),
    )
}
