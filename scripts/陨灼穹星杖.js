var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var Material = Java.type("org.bukkit.Material");
var MyRunnable = Java.extend(Java.type("java.lang.Runnable"));
var instance = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var chantingPlayers = {};
var cooldowns = {};

function onUse(event) {
    var player = event.getPlayer();
    var uuid = player.getUniqueId().toString();
    var world = player.getWorld();
    var skillWorldName = world.getName();
    
    var now = new Date().getTime();
    if (cooldowns[uuid] && now < cooldowns[uuid]) {
        var remain = Math.ceil((cooldowns[uuid] - now) / 1000);
        return player.sendMessage("§c§l[陨灼穹星杖] §c技能冷却中... 还需要 §e" + remain + " §c秒");
    }
    
    if (chantingPlayers[uuid]) return player.sendMessage("§c正在吟唱中...");
    
    var startLoc = player.getLocation().clone();
    var count = 0;
    chantingPlayers[uuid] = true;
    cooldowns[uuid] = now + 15000;
    player.sendMessage("§6§l[陨灼穹星杖] §e开始吟唱...请勿移动！");

    var chantTask = Bukkit.getScheduler().runTaskTimer(instance, new MyRunnable({
        run: function() {
            if (!player.getWorld().getName().equals(skillWorldName)) {
                chantTask.cancel();
                delete chantingPlayers[uuid];
                player.sendMessage("§c§l[陨灼穹星杖] §c你已离开释放世界，技能取消！");
                return;
            }
            if (count >= 100) return;
            if (player.getLocation().distanceSquared(startLoc) > 0.1) player.teleport(startLoc);
            
            var angle = count * 0.5;
            var particleLoc = startLoc.clone().add(Math.cos(angle) * 1.5, 0.1, Math.sin(angle) * 1.5);
            world.spawnParticle(Particle.FLAME, particleLoc, 3, 0.05, 0.05, 0.05, 0.02);
            
            if (count % 20 == 0) {
                player.sendTitle("§c§l吟唱中", "§e剩余 " + (5 - count/20) + " 秒", 0, 25, 0);
                player.playSound(startLoc, "block.note_block.hat", 1, 1);
            }
            count++;
        }
    }), 0, 1);

    Bukkit.getScheduler().runTaskLater(instance, new MyRunnable({
        run: function() {
            chantTask.cancel();
            delete chantingPlayers[uuid];
            
            if (!player.getWorld().getName().equals(skillWorldName)) {
                player.sendMessage("§c§l[陨灼穹星杖] §c你已离开释放世界，技能取消！");
                return;
            }
            
            var targetBlock = player.getTargetBlockExact(15);
            var impactLoc = targetBlock ? targetBlock.getLocation() : player.getLocation().add(player.getLocation().getDirection().multiply(10));
            player.sendTitle("§4§l陨石坠落！", "", 5, 20, 5);
            world.playSound(impactLoc, "entity.wither.spawn", 1, 0.5);

            var fireball = world.spawnEntity(impactLoc.clone().add(0, 30, 0), Java.type("org.bukkit.entity.EntityType").FIREBALL);
            fireball.setDirection(new (Java.type("org.bukkit.util.Vector"))(0, -1, 0));
            fireball.setYield(0);
            fireball.setIsIncendiary(false);

            var checkTask;
            checkTask = Bukkit.getScheduler().runTaskTimer(instance, new MyRunnable({
                run: function() {
                    if (!player.getWorld().getName().equals(skillWorldName)) {
                        if (checkTask) checkTask.cancel();
                        fireball.remove();
                        player.sendMessage("§c§l[陨灼穹星杖] §c你已离开释放世界，技能取消！");
                        return;
                    }
                    if (fireball.isDead() || fireball.getLocation().getY() <= impactLoc.getY() + 1) {
                        if (checkTask) checkTask.cancel();
                        fireball.remove();
                        
                        world.spawnParticle(Particle.EXPLOSION_EMITTER, impactLoc, 5, 1, 1, 1, 1);
                        world.spawnParticle(Particle.LAVA, impactLoc, 50, 2, 2, 2, 0.5);
                        world.spawnParticle(Particle.FLAME, impactLoc, 100, 3, 3, 3, 0.2);
                        ["entity.generic.explode", "entity.dragon_fireball.explode"].forEach(function(sound) {
                            world.playSound(impactLoc, sound, 5, 0.5);
                        });
                        
                        world.getNearbyEntities(impactLoc, 5, 5, 5).forEach(function(entity) {
                            if (entity.getUniqueId().toString() != uuid && entity.damage) {
                                entity.damage(6000, player);
                            }
                        });
                    } else {
                        world.spawnParticle(Particle.LARGE_SMOKE, fireball.getLocation(), 10, 0.5, 0.5, 0.5, 0.05);
                        world.spawnParticle(Particle.FLAME, fireball.getLocation(), 20, 0.3, 0.3, 0.3, 0.1);
                    }
                }
            }), 0, 1);
        }
    }), 100);
}
