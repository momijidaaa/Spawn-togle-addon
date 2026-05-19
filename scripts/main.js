import { 
    CommandPermissionLevel, 
    CustomCommandStatus, 
    Player, 
    system, 
    world 
} from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

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

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    customCommandRegistry.registerCommand(
        {
            name: "toggle",
            description: "モブのスポーン設定UIを開きます",
            permissionLevel: CommandPermissionLevel.Operator,
            cheatsRequired: false,
        },
        (origin) => {
            const player = origin.initiator ?? origin.sourceEntity;
            if (!(player instanceof Player)) {
                return {
                    status: CustomCommandStatus.Failure,
                    message: "このコマンドはプレイヤーのみ使用できます。",
                };
            }

            system.run(() => {
                const cStatus = spawnSettings.creeper ? "§aON (通常スポーン)" : "§cOFF (即時消去)";
                const pStatus = spawnSettings.phantom ? "§aON (通常スポーン)" : "§cOFF (即時消去)";

                const form = new ActionFormData()
                    .title("§l§0モブスポーン制限設定")
                    .body(`§r切り替えたいモブを選択してください。\n\n§7現在の状態:\n・クリーパー: ${cStatus}\n§7・ファントム: ${pStatus}`)
                    .button(`クリーパーを切り替える\n現在: ${cStatus}`)
                    .button(`ファントムを切り替える\n現在: ${pStatus}`);

                form.show(player).then((result) => {
                    if (result.canceled) return;

                    if (result.selection === 0) {
                        spawnSettings.creeper = !spawnSettings.creeper;
                        const text = spawnSettings.creeper ? "§aON (通常スポーン)" : "§cOFF (即時消去)";
                        world.sendMessage(`§e[MobToggler] クリーパーのスポーンを ${text} §eに変更しました。`);
                    } else if (result.selection === 1) {
                        spawnSettings.phantom = !spawnSettings.phantom;
                        const text = spawnSettings.phantom ? "§aON (通常スポーン)" : "§cOFF (即時消去)";
                        world.sendMessage(`§e[MobToggler] ファントムのスポーンを ${text} §eに変更しました。`);
                    }
                });
            });

            return { status: CustomCommandStatus.Success };
        }
    );
});
