var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var MyRunnable = Java.extend(Java.type("java.lang.Runnable"));
var instance = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var playerStates = new (Java.type("java.util.HashMap"))();
var cooldowns = {};

function onUse(event) {
    var p = event.getPlayer(), w = p.getWorld(), loc = p.getEyeLocation(), dir = loc.getDirection(), uuid = p.getUniqueId().toString();
    
    var nowTime = new Date().getTime();
    if (cooldowns[uuid] && nowTime < cooldowns[uuid]) {
        var remain = Math.ceil((cooldowns[uuid] - nowTime) / 1000);
        return p.sendMessage("§c§l[创世永恒神杖] §c技能冷却中... 还需要 §e" + remain + " §c秒");
    }

    if (p.isSneaking()) {
        cooldowns[uuid] = nowTime + 15000;
        return triggerRay(p, w, loc, dir);
    }

    var now = new Date().getTime(), state = playerStates.getOrDefault(uuid, { last: 0, task: null });
    if (now - state.last < 350) {
        if (state.task) state.task.cancel();
        playerStates.put(uuid, { last: 0, task: null });
        cooldowns[uuid] = nowTime + 15000;
        return triggerBall(p, w, loc, dir);
    }
    
    var task = Bukkit.getScheduler().runTaskLater(instance, new MyRunnable({
        run: function() { 
            cooldowns[uuid] = new Date().getTime() + 15000;
            triggerHole(p, w, loc, dir); 
            playerStates.put(uuid, { last: now, task: null }); 
        }
    }), 7);
    playerStates.put(uuid, { last: now, task: task });
}

function triggerRay(p, w, loc, dir) {
    w.playSound(p.getLocation(), "entity.warden.attack_impact", 2, 0.5);
    for (var i = 1; i <= 30; i++) {
        var rLoc = loc.clone().add(dir.clone().multiply(i));
        if (rLoc.getBlock().getType().isSolid()) break;
        w.spawnParticle(Particle.SONIC_BOOM, rLoc, 1, 0, 0, 0, 0);
        w.spawnParticle(Particle.DUST, rLoc, 10, 0.1, 0.1, 0.1, new (Java.type("org.bukkit.Particle$DustOptions"))(Java.type("org.bukkit.Color").RED, 2));
        dmg(p, rLoc, 1.5, 30000);
    }
}

function triggerHole(p, w, loc, dir) {
    var b = p.getTargetBlock(null, 10), hLoc = b ? b.getLocation().add(0, 1, 0) : p.getLocation().add(dir.multiply(5)), t = 0, task;
    w.playSound(hLoc, "entity.warden.heartbeat", 2, 0.5);
    task = Bukkit.getScheduler().runTaskTimer(instance, new MyRunnable({
        run: function() {
            if (t++ >= 100) {
                w.spawnParticle(Particle.EXPLOSION_EMITTER, hLoc, 10, 2, 2, 2, 1);
                w.playSound(hLoc, "entity.generic.explode", 5, 0.5);
                dmg(p, hLoc, 10, 50000);
                return task.cancel();
            }
            w.spawnParticle(Particle.PORTAL, hLoc, 100, 1, 1, 1, 0.5);
            w.spawnParticle(Particle.REVERSE_PORTAL, hLoc, 50, 0.5, 0.5, 0.5, 0.2);
            w.getNearbyEntities(hLoc, 10, 10, 10).forEach(function(e) {
                if (e != p && !e.isDead()) e.setVelocity(hLoc.toVector().subtract(e.getLocation().toVector()).normalize().multiply(0.4));
            });
            if (t % 20 == 0) w.playSound(hLoc, "block.beacon.ambient", 1, 0.5);
        }
    }), 0, 1);
}

function triggerBall(p, w, loc, dir) {
    w.playSound(p.getLocation(), "entity.illusioner.prepare_mirror", 2, 1);
    var bLoc = loc.clone(), bt = 0, bTask;
    bTask = Bukkit.getScheduler().runTaskTimer(instance, new MyRunnable({
        run: function() {
            if (bt++ >= 40 || bLoc.getBlock().getType().isSolid()) {
                w.spawnParticle(Particle.FLASH, bLoc, 5, 0.5, 0.5, 0.5, 0.1);
                return bTask.cancel();
            }
            bLoc.add(dir.clone().multiply(0.8));
            w.spawnParticle(Particle.SQUID_INK, bLoc, 10, 0.2, 0.2, 0.2, 0.05);
            w.spawnParticle(Particle.END_ROD, bLoc, 5, 0.2, 0.2, 0.2, 0.05);
            dmg(p, bLoc, 2, 50000);
        }
    }), 0, 1);
}

function dmg(p, l, r, d) {
    p.getWorld().getNearbyEntities(l, r, r, r).forEach(function(e) {
        if (e != p && e.damage && !e.isDead()) e.damage(d, p);
    });
}
