# Minecraft modpacks

Each folder in `packs/` is a [packwiz](https://packwiz.infra.link/) modpack that stays in sync with its server. Published by NxHost.

## Join with Prism Launcher

1. In Prism Launcher, click **Add Instance**, then **Import**.
2. Paste the pack's **Import URL** from the table below and click **OK**.
3. Launch it. The first start downloads the mods; after that it updates itself whenever the pack changes.

| Pack | Minecraft | Loader | Import URL |
|---|---|---|---|
| NxTerra | 1.21.1 | neoforge 21.1.266 | `https://raw.githubusercontent.com/Nxthun/minecraft/main/packs/nxterra/nxterra-prism.zip` |

## Already have an instance?

Put [packwiz-installer-bootstrap.jar](https://github.com/packwiz/packwiz-installer-bootstrap/releases/latest/download/packwiz-installer-bootstrap.jar) in the instance's `minecraft` folder, then in **Edit › Settings › Custom commands** set the pre-launch command to:

```
"$INST_JAVA" -jar packwiz-installer-bootstrap.jar https://raw.githubusercontent.com/Nxthun/minecraft/main/packs/<pack>/pack.toml
```
