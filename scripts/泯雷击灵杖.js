var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var MyRunnable = Java.extend(Java.type("java.lang.Runnable"));
var instance = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var cooldowns = {};

function onUse(event) {
    var player = event.getPlayer(), world = player.getWorld(), origin = player.getLocation(), dir = origin.getDirection().setY(0).normalize(), step = 0, task;
    var uuid = player.getUniqueId().toString();
    var now = new Date().getTime();
    var skillWorldName = world.getName();

    if (cooldowns[uuid] && now < cooldowns[uuid]) {
        var remain = Math.ceil((cooldowns[uuid] - now) / 1000);
        return player.sendMessage("§c§l[泯雷击灵杖] §c技能冷却中... 还需要 §e" + remain + " §c秒");
    }

    cooldowns[uuid] = now + 15000;
    world.playSound(origin, "entity.lightning_bolt.thunder", 1, 0.8);

    task = Bukkit.getScheduler().runTaskTimer(instance, new MyRunnable({
        run: function() {
            if (!player.getWorld().getName().equals(skillWorldName)) {
                task.cancel();
                player.sendMessage("§c§l[泯雷击灵杖] §c你已离开释放世界，技能取消！");
                return;
            }
            if (step >= 5) return task && task.cancel();
            for (var i = 0; i < 4; i++) {
                var d = Math.random() * 10 + 1, a = (Math.random() - 0.5) * 1.05;
                var x = dir.getX() * Math.cos(a) - dir.getZ() * Math.sin(a), z = dir.getX() * Math.sin(a) + dir.getZ() * Math.cos(a);
                var loc = origin.clone().add(x * d, 0, z * d);
                loc.setY(world.getHighestBlockYAt(loc) + 1);

                world.spawnParticle(Particle.WITCH, loc.clone().add(0, 2, 0), 40, 0.5, 2, 0.5, 0.1);
                world.spawnParticle(Particle.FLASH, loc, 1, 0, 0, 0, 0);
                world.playSound(loc, "entity.lightning_bolt.impact", 0.7, 1.2);

                world.getNearbyEntities(loc, 2.5, 4, 2.5).forEach(function(e) {
                    if (e.getUniqueId().toString() != player.getUniqueId().toString() && e.damage && !e.isDead()) {
                        e.damage(5000, player);
                        e.setVelocity(e.getLocation().toVector().subtract(origin.toVector()).normalize().multiply(0.5).setY(0.3));
                    }
                });
            }
            step++;
        }
    }), 0, 2);
}

