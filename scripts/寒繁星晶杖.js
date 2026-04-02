var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var MyRunnable = Java.extend(Java.type("java.lang.Runnable"));
var instance = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var cooldowns = {};

function onUse(event) {
    var player = event.getPlayer(), world = player.getWorld(), startLoc = player.getLocation().add(0, 1, 0), step = 0, task;
    var uuid = player.getUniqueId().toString();
    var now = new Date().getTime();
    var skillWorldName = world.getName();

    if (cooldowns[uuid] && now < cooldowns[uuid]) {
        var remain = Math.ceil((cooldowns[uuid] - now) / 1000);
        return player.sendMessage("§c§l[寒繁星晶杖] §c技能冷却中... 还需要 §e" + remain + " §c秒");
    }

    cooldowns[uuid] = now + 15000;
    world.playSound(startLoc, "block.glass.break", 1, 1.5);
    world.playSound(startLoc, "entity.player.levelup", 0.5, 2);

    task = Bukkit.getScheduler().runTaskTimer(instance, new MyRunnable({
        run: function() {
            if (!player.getWorld().getName().equals(skillWorldName)) {
                task.cancel();
                player.sendMessage("§c§l[寒繁星晶杖] §c你已离开释放世界，技能取消！");
                return;
            }
            if (step >= 24) return task && task.cancel();
            var dist = step * 0.6;
            for (var i = 0; i < 16; i++) {
                var angle = i * Math.PI / 8, loc = startLoc.clone().add(Math.cos(angle) * dist, Math.sin(step * 0.5 + i) * 0.2, Math.sin(angle) * dist);
                world.spawnParticle(Particle.SNOWFLAKE, loc, 3, 0.05, 0.05, 0.05, 0.01);
                if (step % 2 == 0) world.spawnParticle(Particle.INSTANT_EFFECT, loc, 1, 0, 0, 0, 0);
                
                world.getNearbyEntities(loc, 1, 1, 1).forEach(function(e) {
                    if (e.getUniqueId().toString() != player.getUniqueId().toString() && e.damage && !e.isDead()) {
                        e.damage(5000, player);
                        e.addPotionEffect(new PotionEffect(PotionEffectType.SLOWNESS, 60, 2));
                        world.playSound(loc, "block.glass.break", 0.5, 2);
                    }
                });
            }
            step++;
        }
    }), 0, 1);
}
