var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var MyRunnable = Java.extend(Java.type("java.lang.Runnable"));
var instance = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

function onUse(event) {
    var player = event.getPlayer();
    var skillWorld = player.getWorld();
    var skillWorldName = skillWorld.getName();
    
    var clickedBlock = event.getClickedBlock();
    if (clickedBlock == null || !clickedBlock.isPresent()) return;
    var block = clickedBlock.get();

    if (block.getType().name() != "BEDROCK") {
        player.sendMessage("§c仪式失败：必须在基岩上进行仪式！");
        return;
    }
    if (block.getY() > -50) {
        player.sendMessage("§c仪式失败：高度必须在 Y=-50 或更低。当前高度: " + block.getY());
        return;
    }

    var item = player.getInventory().getItemInMainHand();
    var sfItem = SlimefunItem.getByItem(item);
    if (!sfItem || sfItem.getId() != "RSC_YUNQI_星穹徽章") {
        player.sendMessage("§c您必须主手持有星穹徽章！");
        return;
    }

    item.setAmount(item.getAmount() - 1);
    var center = block.getLocation().add(0.5, 0.5, 0.5);
    var radius = 25, rSq = 625;

    player.sendMessage("§6§l[宇宙奇点] §e已开启！即将爆炸，请在 10 秒内撤离！");
    player.playSound(center, "entity.ender_dragon.growl", 1.0, 0.5);

    var particleTask = Bukkit.getScheduler().runTaskTimer(instance, new MyRunnable({
        run: function() {
            if (!player.getWorld().getName().equals(skillWorldName)) {
                particleTask.cancel();
                player.sendMessage("§c§l[宇宙奇点] §c你已离开释放世界，技能取消！");
                return;
            }
            for (var i = 0; i < 800; i++) {
                var phi = Math.acos(1 - 2 * Math.random()), theta = 6.283 * Math.random();
                var loc = center.clone().add(
                    radius * Math.sin(phi) * Math.cos(theta), 
                    radius * Math.sin(phi) * Math.sin(theta), 
                    radius * Math.cos(phi)
                );

                var p;
                try {
                    p = (i % 2 == 0) ? Particle.valueOf("WITCH") : Particle.valueOf("SOUL_FIRE_FLAME");
                } catch(e) {
                    p = Particle.FLAME;
                }
                center.getWorld().spawnParticle(p, loc, 1, 0.02, 0.02, 0.02, 0.01);
            }
        }
    }), 0, 5);

    Bukkit.getScheduler().runTaskLater(instance, new MyRunnable({
        run: function() {
            particleTask.cancel();
            
            if (!player.getWorld().getName().equals(skillWorldName)) {
                player.sendMessage("§c§l[宇宙奇点] §c你已离开释放世界，技能取消！");
                return;
            }
            
            var success = player.getLocation().distanceSquared(center) > rSq;
            player.sendMessage(success ? "§a§l[宇宙奇点] §b你成功逃离了区域！" : "§c§l[宇宙奇点] §4你未能逃离...");
            
            if (success) Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "sf give " + player.getName() + " RSC_YUNQI_宇宙奇点 1");
            else {
                Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "gamerule sendCommandFeedback false ") ;
                Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "gamerule showDeathMessages false ") ;
                player.damage(999999999) ;
                Bukkit.broadcastMessage(player.getName() + " §a§l死于奇点坍缩 ...") ;
                Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "gamerule showDeathMessages true") ;
                Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "gamerule sendCommandFeedback true ") ;
                }
                center.getWorld().getNearbyEntities(center, radius, radius, radius).forEach(function(e) {
                    if (e.getType().name() != "PLAYER" && e.getLocation().distanceSquared(center) <= rSq) e.remove()
                }); 

            for (var x = -radius; x <= radius; x++) {
                for (var y = -radius; y <= radius; y++) {
                    for (var z = -radius; z <= radius; z++) {
                        if (x*x + y*y + z*z <= rSq) {
                            var b = center.clone().add(x,y,z).getBlock();
                            if (b.getType() != Material.AIR && b.getType() != Material.BEDROCK) b.setType(Material.AIR);
                        }
                    }
                }
            }
            center.getWorld().createExplosion(center, 5, false, false);
        }
    }), 200);
}
