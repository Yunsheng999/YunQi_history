var Bukkit = Java.type("org.bukkit.Bukkit"); 
var Particle = Java.type("org.bukkit.Particle"); 
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var MyRunnable = Java.extend(Java.type("java.lang.Runnable")); 
var instance = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

function onUse(event) {
    var p = event.getPlayer(), w = p.getWorld();
    
    var item = event.getItem();
    if (item == null) return;
    
    var sfItem = SlimefunItem.getByItem(item);
    if (!sfItem || sfItem.getId() !== "RSC_YUNQI_光粒打击坐标") {
        return;
    }

    var targetBlock = p.getTargetBlock(null, 100);
    if (!targetBlock || targetBlock.getType().isAir()) return;
    var targetLoc = targetBlock.getLocation().add(0.5, 1, 0.5);

    if (item.getAmount() > 0) {
        item.setAmount(item.getAmount() - 1);
    } else {
        return;
    }

    w.playSound(p.getLocation(), "entity.ender_dragon.growl", 1, 2);
    p.sendMessage("§e[光粒打击] §f已锁定坐标...");

    var startHeight = 60;
    var currentLoc = targetLoc.clone().add(0, startHeight, 0);
    var fallTask;
    
    fallTask = Bukkit.getScheduler().runTaskTimer(instance, new MyRunnable({
        run: function() {
            for (var i = 0; i < 3; i++) {
                currentLoc.subtract(0, 1, 0);
                
                w.spawnParticle(Particle.END_ROD, currentLoc, 5, 0.1, 0.1, 0.1, 0.05);
                w.spawnParticle(Particle.FIREWORK, currentLoc, 2, 0.05, 0.05, 0.05, 0.02);
                w.spawnParticle(Particle.FLASH, currentLoc, 1, 0, 0, 0, 0);

                if (currentLoc.getY() <= targetLoc.getY() || currentLoc.getBlock().getType().isSolid()) {
                    executeImpact(p, w, targetLoc);
                    return fallTask.cancel();
                }
            }
            w.playSound(currentLoc, "entity.experience_orb.pickup", 0.5, 0.5);
        }
    }), 0, 1);
}

function executeImpact(p, w, loc) {
    w.spawnParticle(Particle.EXPLOSION_EMITTER, loc, 20, 2, 2, 2, 1);
    w.spawnParticle(Particle.FLASH, loc, 50, 3, 3, 3, 0.5);
    w.spawnParticle(Particle.SONIC_BOOM, loc, 5, 1, 1, 1, 1);
    
    w.playSound(loc, "entity.generic.explode", 10, 0.5);
    w.playSound(loc, "entity.warden.sonic_boom", 5, 1);
    w.playSound(loc, "ui.toast.challenge_complete", 2, 0.5);

    var damage = Math.floor(Math.random() * 5001);
    var radius = 8.0;

    var entities = w.getNearbyEntities(loc, radius, radius, radius);
    var damageCount = 0;
    
    for (var i = 0; i < entities.size(); i++) {
        var entity = entities.get(i);
        if (entity.getUniqueId().equals(p.getUniqueId())) continue;
        if (entity instanceof org.bukkit.entity.LivingEntity) {
            entity.damage(damage, p);
            damageCount++;
        }
    }

    p.sendMessage("§e[光粒打击] §f打击完成！波及了 §b" + damageCount + " §f个目标，造成了 §c" + damage + " §f点伤害。");
}