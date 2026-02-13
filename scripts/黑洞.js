var Bukkit = Java.type("org.bukkit.Bukkit"); 
var Particle = Java.type("org.bukkit.Particle"); 
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var MyRunnable = Java.extend(Java.type("java.lang.Runnable")); 
var instance = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

function onUse(event) {
    var p = event.getPlayer(), w = p.getWorld(), loc = p.getEyeLocation(), dir = loc.getDirection();
    
    var item = event.getItem();
    if (item == null) return;
    
    var sfItem = SlimefunItem.getByItem(item);
    if (!sfItem || sfItem.getId() !== "RSC_YUNQI_黑洞") {
        return;
    }

    if (item.getAmount() > 0) {
        item.setAmount(item.getAmount() - 1);
    } else {
        return;
    }

    var targetBlock = p.getTargetBlock(null, 10);
    var holeLoc = targetBlock ? targetBlock.getLocation().add(0, 1, 0) : p.getLocation().add(dir.multiply(5));
    
    w.playSound(holeLoc, "entity.warden.heartbeat", 2, 0.5);
    var timer = 0, holeTask;
    
    holeTask = Bukkit.getScheduler().runTaskTimer(instance, new MyRunnable({
        run: function() {
            if (timer++ >= 100) {
                w.spawnParticle(Particle.EXPLOSION_EMITTER, holeLoc, 10, 2, 2, 2, 1);
                w.playSound(holeLoc, "entity.generic.explode", 5, 0.5);
                
                w.getNearbyEntities(holeLoc, 10, 10, 10).forEach(function(e) {
                    if (e != p && e.damage && !e.isDead()) {
                        e.damage(5000, p);
                    }
                });
                return holeTask.cancel();
            }

            w.spawnParticle(Particle.PORTAL, holeLoc, 100, 1, 1, 1, 0.5);
            w.spawnParticle(Particle.REVERSE_PORTAL, holeLoc, 50, 0.5, 0.5, 0.5, 0.2);
            
            w.getNearbyEntities(holeLoc, 10, 10, 10).forEach(function(e) {
                if (e != p && !e.isDead()) {
                    var vec = holeLoc.toVector().subtract(e.getLocation().toVector()).normalize().multiply(0.4);
                    e.setVelocity(vec);
                }
            });

            if (timer % 20 == 0) w.playSound(holeLoc, "block.beacon.ambient", 1, 0.5);
        }
    }), 0, 1);
}