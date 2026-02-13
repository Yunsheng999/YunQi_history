var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var MyRunnable = Java.extend(Java.type("java.lang.Runnable"));var instance = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var cooldowns = {};

function onUse(event) {
    var p = event.getPlayer(), w = p.getWorld(), loc = p.getEyeLocation(), dir = loc.getDirection();
    var uuid = p.getUniqueId().toString();
    var now = new Date().getTime();

    if (cooldowns[uuid] && now < cooldowns[uuid]) {
        var remain = Math.ceil((cooldowns[uuid] - now) / 1000);
        return p.sendMessage("§c§l[往生死灵魂杖] §c技能冷却中... 还需要 §e" + remain + " §c秒");
    }

    cooldowns[uuid] = now + 15000;
    
    if (p.isSneaking()) {
        w.playSound(p.getLocation(), "entity.wither.shoot", 1, 0.5);
        for (var i = -2; i <= 2; i++) {
            (function(offset) {
                var step = 0, task;
                var spreadDir = rotateVector(dir.clone(), offset * 0.2);
                task = Bukkit.getScheduler().runTaskTimer(instance, new MyRunnable({
                    run: function() {
                        if (step++ > 20) return task && task.cancel();
                        var currentLoc = loc.clone().add(spreadDir.clone().multiply(step * 0.8));
                        w.spawnParticle(Particle.SOUL, currentLoc, 2, 0.1, 0.1, 0.1, 0.02);
                        w.spawnParticle(Particle.SQUID_INK, currentLoc, 5, 0.05, 0.05, 0.05, 0.01);
                        w.getNearbyEntities(currentLoc, 1.2, 1.2, 1.2).forEach(function(e) {
                            if (e != p && e.damage && !e.isDead()) {
                                e.damage(5000, p);
                                w.playSound(currentLoc, "entity.zombie.attack_iron_door", 0.5, 1.5);
                            }
                        });
                    }
                }), 0, 1);
            })(i);
        }
    } else {
        var target = p.getTargetEntity(15);
        if (target && target.damage) {
            w.playSound(target.getLocation(), "entity.phantom.bite", 1, 0.5);
            w.spawnParticle(Particle.LARGE_SMOKE, target.getLocation().add(0, 1, 0), 50, 0.5, 1, 0.5, 0.1);
            w.spawnParticle(Particle.SOUL_FIRE_FLAME, target.getLocation().add(0, 1, 0), 30, 0.3, 0.8, 0.3, 0.05);
            target.damage(10000, p);
        } else {
            p.sendMessage("§c范围内未发现可斩击的目标！");
        }
    }
}

function rotateVector(v, angle) {
    var cos = Math.cos(angle), sin = Math.sin(angle);
    return v.setX(v.getX() * cos - v.getZ() * sin).setZ(v.getX() * sin + v.getZ() * cos).normalize();
}
