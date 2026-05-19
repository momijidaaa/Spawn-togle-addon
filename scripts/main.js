import { world, system } from "@minecraft/server";

const spawnSettings = {
    creeper: true,
    phantom: true
};

world.afterEvents.entitySpawn.subscribe((event) => {
    const { entity } = event;
    if (!entity || !entity.isValid()) return;

    const typeId = entity.typeId;

    if (typeId === "minecraft:creeper" && !spawnSettings.creeper) {
        system.run(() => {
            if (entity.isValid()) entity.despawn();
        });
        return;
    }

    if (typeId === "minecraft:phantom" && !spawnSettings.phantom) {
        system.run(() => {
            if (entity.isValid()) entity.despawn();
        });
        return;
    }
});

const commandRegistry = new Map();

function registerCommand(name, callback) {
    commandRegistry.set(name.toLowerCase(), callback);
}

world.beforeEvents.chatSend.subscribe((chatEvent) => {
    const { message, sender } = chatEvent;

    if (!message.startsWith("/")) return;

    const commandBody = message.slice(1).trim();
    const args = commandBody.split(/\s+/);
    const commandName = args[0].toLowerCase();

    if (commandRegistry.has(commandName)) {
        chatEvent.cancel = true;

        if (!sender.isOp()) {
            sender.sendMessage("§c[Error] このコマンドを実行する権限（OP）がありません。");
            return;
        }

        system.run(() => {
            const handler = commandRegistry.get(commandName);
            handler(args.slice(1), sender);
        });
    }
});

registerCommand("toggle", (args, sender) => {
    const subCommand = args[0]?.toLowerCase();

    if (subCommand === "creeper" || subCommand === "phantom") {
        spawnSettings[subCommand] = !spawnSettings[subCommand];
        const isEnabled = spawnSettings[subCommand];
        const statusText = isEnabled ? "§aON (通常スポーン)§e" : "§cOFF (即時消去)§e";
        
        world.sendMessage(`§e[MobToggler] §b${sender.name}§e が §f${subCommand}§e のスポーンを ${statusText} に切り替えました。`);
        return;
    }

    if (subCommand === "status") {
        const creeperStatus = spawnSettings.creeper ? "§aON (湧く)§r" : "§cOFF (消去中)§r";
        const phantomStatus = spawnSettings.phantom ? "§aON (湧く)§r" : "§cOFF (消去中)§r";

        sender.sendMessage(
            `§e==== 現在のモブスポーン設定 ====\n` +
            `§f・クリーパー: ${creeperStatus}\n` +
            `§f・ファントム  : ${phantomStatus}\n` +
            `§e================================`
        );
        return;
    }

    sender.sendMessage("§c[使用方法] /toggle creeper | /toggle phantom | /toggle status");
});
