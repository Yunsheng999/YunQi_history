var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var Vector = Java.type("org.bukkit.util.Vector");
var MyRunnable = Java.extend(Java.type("java.lang.Runnable"));
var Color = Java.type("org.bukkit.Color");
var DustOptions = Java.type("org.bukkit.Particle$DustOptions");
var instance = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var cooldowns = {};

function onUse(event) {
    var p = event.getPlayer();
    var uuid = p.getUniqueId().toString();
    var now = new Date().getTime();

    if (cooldowns[uuid] && now < cooldowns[uuid]) {
        var remain = Math.ceil((cooldowns[uuid] - now) / 1000);
        return p.sendMessage("§c§l你个神人居然想炸服？你还需要等待 §e" + remain + " §c秒 才能如愿！");
    }

    var w = p.getWorld();
    var loc = p.getEyeLocation();
    var dir = loc.getDirection();

    w.playSound(p.getLocation(), "entity.illusioner.cast_spell", 1, 1.2);
    w.playSound(p.getLocation(), "entity.warden.attack_impact", 1, 0.5);
    
    var targetLoc = null;
    for (var i = 1; i <= 50; i++) {
        var trailLoc = loc.clone().add(dir.clone().multiply(i));
        if (trailLoc.getBlock().getType().isSolid()) {
            targetLoc = trailLoc.clone().add(0, 0.5, 0);
            break;
        }
        w.spawnParticle(Particle.DUST, trailLoc, 15, 0.2, 0.2, 0.2, 1, new DustOptions(Color.fromRGB(0, 255, 255), 2.5), true);
        w.spawnParticle(Particle.GLOW, trailLoc, 3, 0.1, 0.1, 0.1, 0.05, null, true);
        if (i == 50) targetLoc = trailLoc.clone();
    }

    if (!targetLoc) return;

    cooldowns[uuid] = now + 600000;
    w.playSound(targetLoc, "entity.wither.spawn", 3, 0.5);
    w.playSound(targetLoc, "block.beacon.activate", 5, 0.5);
    startUltimateMagicCircle(p, w, targetLoc);
}

function startUltimateMagicCircle(p, w, center) {
    var ticks = 0;
    var maxTicks = 3000;
    var maxRadius = 35.0;
    var expandTicks = 800;
    
    var hLayer1 = 0, hLayer2 = 0, hLayer3 = 0, hLayer4 = 0;
    var prog1 = 0, prog2 = 0, prog3 = 0, prog4 = 0;
    var drawDuration = 240;
    
    w.playSound(center, "ambient.basalt_deltas.mood", 5, 0.5);

    var task = Bukkit.getScheduler().runTaskTimer(instance, new MyRunnable({
        run: function() {
            if (ticks >= maxTicks) {
                task.cancel();
                drawFinalExplosion(w, center, maxRadius, hLayer4);
                w.playSound(center, "entity.generic.explode", 5, 0.5);
                w.playSound(center, "entity.warden.sonic_boom", 5, 0.5);
                return;
            }

            var currentRadius;
            if (ticks < expandTicks) {
                var progress = ticks / expandTicks;
                var smoothProg = progress * progress * progress * (progress * (6 * progress - 15) + 10);
                currentRadius = smoothProg * maxRadius;
                
                if (ticks % 30 == 0) {
                    drawShockwave(w, center, currentRadius, Color.fromRGB(0, 255, 255));
                }
            } else {
                currentRadius = maxRadius + Math.sin(ticks * 0.05) * 0.8;
            }

            if (ticks > expandTicks) {
                var riseProgress = (ticks - expandTicks);
                
                hLayer1 = Math.min(20, riseProgress * 0.04);  
                prog1 = Math.min(1.0, riseProgress / drawDuration);

                if (hLayer1 >= 10) { 
                    var rise2Start = 250;
                    var rise2 = (riseProgress - rise2Start);
                    if (rise2 > 0) {
                        hLayer2 = Math.min(40, rise2 * 0.06);
                        prog2 = Math.min(1.0, rise2 / drawDuration);
                    }
                }

                if (hLayer2 >= 20) {
                    var rise3Start = 500;
                    var rise3 = (riseProgress - rise3Start);
                    if (rise3 > 0) {
                        hLayer3 = Math.min(65, rise3 * 0.08);
                        prog3 = Math.min(1.0, rise3 / drawDuration);
                    }
                }

                if (hLayer3 >= 35) {
                    var rise4Start = 850;
                    var rise4 = (riseProgress - rise4Start);
                    if (rise4 > 0) {
                        hLayer4 = Math.min(100, rise4 * 0.15);
                        prog4 = Math.min(1.0, rise4 / drawDuration);
                    }
                }
            }

            var rot1 = ticks * 0.04;
            var rot2 = -ticks * 0.025;

            if (ticks % 5 == 0) drawVoidRifts(w, center, currentRadius, rot1);
            
            if (ticks > expandTicks && ticks % 2 == 0) drawRuneRain(w, center, currentRadius);

            if (hLayer4 > 0) drawHelix(w, center, hLayer4, currentRadius * 0.3, ticks);

            var gProg = ticks < expandTicks ? (ticks / expandTicks) : 1.0;
            drawComplexRune(w, center, currentRadius, rot1, gProg);
            
            if (ticks > expandTicks * 0.5) {
                var sProg = Math.min(1.0, (ticks - expandTicks * 0.5) / expandTicks);
                drawOuterStarArray(w, center, currentRadius * 1.15, rot1 * 1.2, sProg, ticks);
                
                var whiteProg = Math.max(0, Math.min(1.0, (ticks - expandTicks * 0.8) / (expandTicks * 0.5)));
                if (whiteProg > 0) {
                    drawCircle(w, center, currentRadius * 1.35, -rot1 * 0.3, Color.WHITE, 1.5, 600, whiteProg);
                }
            }

            if (hLayer1 > 0) {
                var loc1 = center.clone().add(0, hLayer1, 0);
                drawHexagram(w, loc1, currentRadius * 0.9, rot1, Color.fromRGB(255, 0, 100), Color.fromRGB(100, 0, 255), prog1);
                drawCircle(w, loc1, currentRadius * 0.92, rot2, Color.fromRGB(255, 255, 255), 1.2, 120, prog1);
                if (ticks % 2 == 0) drawVertexPillars(w, center, loc1, currentRadius * 0.9, rot1);
            }

            if (hLayer2 > 0) {
                var loc2 = center.clone().add(0, hLayer2, 0);
                drawStar(w, loc2, currentRadius * 0.7, 8, rot2, Color.fromRGB(255, 215, 0), prog2);
                drawCircle(w, loc2, currentRadius * 0.75, rot1 * 1.5, Color.WHITE, 0.8, 100, prog2);
                drawCircle(w, loc2, 5, rot1 * 5, Color.fromRGB(0, 255, 255), 0.5, 30, prog2);
            }

            if (hLayer3 > 0) {
                var loc3 = center.clone().add(0, hLayer3, 0);
                drawCircle(w, loc3, currentRadius * 0.5, rot1 * 2, Color.fromRGB(0, 255, 255), 1.5, 150, prog3);
                drawCircle(w, loc3, currentRadius * 0.55, rot2 * 2, Color.fromRGB(255, 255, 255), 0.8, 80, prog3);
            }

            if (hLayer4 > 0) {
                var loc4 = center.clone().add(0, hLayer4, 0);
                var sphereProgress = Math.min(1, (hLayer4 - 30) / 70);
                if (sphereProgress > 0) drawUltimateSphere(w, loc4, 12.0, ticks * 0.08, sphereProgress, ticks);
                
                if (ticks % 10 == 0 && prog4 >= 1.0) {
                    w.spawnParticle(Particle.FLASH, loc4, 3, 0.1, 0.1, 0.1, 0, null, true);
                }
            }

            if (ticks % 2 == 0) {
                var beamHeight = Math.max(hLayer1, hLayer4);
                w.spawnParticle(Particle.GUST_EMITTER_LARGE, center.clone().add(0, beamHeight, 0), 1, 0, 0, 0, 0, null, true);
                w.spawnParticle(Particle.END_ROD, center.clone().add(0, beamHeight/2, 0), 100, 2, beamHeight/2, 2, 0.02, null, true);
            }

            if (ticks % 40 == 0 && ticks > expandTicks) {
                var angle = Math.random() * Math.PI * 2;
                var dist = Math.random() * currentRadius;
                var strikeLoc = center.clone().add(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
                w.strikeLightning(strikeLoc);
            }

            if (ticks % 20 == 0) {
                w.playSound(center, "block.beacon.ambient", 2, 0.5);
            }

            ticks++;
        }
    }), 0, 1);
}

function drawComplexRune(w, center, radius, rotation, progress) {
    drawCircle(w, center, radius, rotation, Color.fromRGB(0, 255, 255), 1.5, 400, progress);
    drawCircle(w, center, radius * 0.95, -rotation * 0.5, Color.WHITE, 1.0, 300, progress);
    
    if (progress > 0.3) {
        var pHex = (progress - 0.3) / 0.7;
        drawHexagram(w, center, radius * 0.85, rotation * 0.5, Color.fromRGB(0, 200, 255), Color.fromRGB(0, 100, 255), pHex);
    }
    if (progress > 0.5) {
        var pSq = (progress - 0.5) / 0.5;
        drawSquare(w, center, radius * 0.6, rotation * 0.8, Color.fromRGB(255, 255, 255), pSq);
    }
}

function drawUltimateSphere(w, center, radius, rotation, progress, ticks) {
    var points = 800;
    var phi = Math.PI * (3 - Math.sqrt(5));

    for (var i = 0; i < points; i++) {
        var y = 1 - (i / (points - 1)) * 2;
        var rAtY = Math.sqrt(1 - y * y);
        var theta = phi * i + rotation;
        
        var x = Math.cos(theta) * rAtY;
        var z = Math.sin(theta) * rAtY;
        
        var pLoc = center.clone().add(x * radius, y * radius * progress, z * radius);
        
        var color = Color.fromRGB(
            Math.max(0, Math.min(255, Math.floor(127 + 127 * Math.sin(rotation + i * 0.1)))),
            Math.max(0, Math.min(255, Math.floor(127 + 127 * Math.sin(rotation + i * 0.1 + 2)))),
            255
        );
        
        var twinkleSize = (0.8 + 1.0 * Math.abs(Math.sin(i + ticks * 0.4))) * progress;
        w.spawnParticle(Particle.DUST, pLoc, 1, 0, 0, 0, 1, new DustOptions(color, twinkleSize), true);
        
        if (i % 40 == 0 && progress > 0.8) {
            w.spawnParticle(Particle.GLOW, pLoc, 1, 0, 0, 0, 0.01, null, true);
        }
    }
}

function drawSquare(w, center, radius, rotation, color, progress) {
    var points = [];
    for (var i = 0; i < 4; i++) {
        var angle = rotation + (i * Math.PI / 2) + (Math.PI / 4);
        points.push(center.clone().add(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    
    for (var i = 0; i < 4; i++) {
        var edgeStart = i / 4;
        if (progress <= edgeStart) continue;
        var edgeProgress = Math.min(1.0, (progress - edgeStart) * 4);
        drawLine(w, points[i], points[(i + 1) % 4], color, edgeProgress);
    }
}

function drawStar(w, center, radius, points, rotation, color, progress) {
    var outerPoints = [];
    var innerPoints = [];
    var innerRadius = radius * 0.5;
    
    for (var i = 0; i < points; i++) {
        var angle = rotation + (i * Math.PI * 2 / points);
        outerPoints.push(center.clone().add(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
        var innerAngle = angle + (Math.PI / points);
        innerPoints.push(center.clone().add(Math.cos(innerAngle) * innerRadius, 0, Math.sin(innerAngle) * innerRadius));
    }
    
    var totalEdges = points * 2;
    for (var i = 0; i < points; i++) {
        var edge1Start = (i * 2) / totalEdges;
        if (progress > edge1Start) {
            var p1 = Math.min(1.0, (progress - edge1Start) * totalEdges);
            drawLine(w, outerPoints[i], innerPoints[i], color, p1);
        }
        
        var edge2Start = (i * 2 + 1) / totalEdges;
        if (progress > edge2Start) {
            var p2 = Math.min(1.0, (progress - edge2Start) * totalEdges);
            drawLine(w, innerPoints[i], outerPoints[(i + 1) % points], color, p2);
        }
    }
}

function drawVertexPillars(w, groundCenter, skyLoc, radius, rotation) {
    var ticksLocal = Math.floor(rotation * 25);
    for (var i = 0; i < 6; i++) {
        var angle = rotation + (i * Math.PI * 2 / 6);
        var x = Math.cos(angle) * radius;
        var z = Math.sin(angle) * radius;
        var gPoint = groundCenter.clone().add(x, 0, z);
        var sPoint = skyLoc.clone().add(x, 0, z);
        
        var step = (ticksLocal % 20) / 20;
        var pLoc = gPoint.clone().add(sPoint.clone().subtract(gPoint).toVector().multiply(step));
        w.spawnParticle(Particle.WITCH, pLoc, 5, 0.1, 0.1, 0.1, 0.05, null, true);
        w.spawnParticle(Particle.ELECTRIC_SPARK, pLoc, 2, 0, 0, 0, 0, null, true);
    }
}

function drawShockwave(w, center, radius, color) {
    var points = 100;
    var options = new DustOptions(color, 2.0);
    for (var i = 0; i < points; i++) {
        var angle = (i * Math.PI * 2 / points);
        var x = Math.cos(angle) * radius;
        var z = Math.sin(angle) * radius;
        var pLoc = center.clone().add(x, 0.1, z);
        w.spawnParticle(Particle.DUST, pLoc, 1, 0, 0, 0, 1, options, true);
        w.spawnParticle(Particle.CLOUD, pLoc, 1, 0, 0.1, 0, 0.01, null, true);
    }
    w.playSound(center, "entity.generic.explode", 0.8, 0.5);
}

function drawHelix(w, center, height, radius, ticks) {
    for (var i = 0; i < 2; i++) {
        var offset = i * Math.PI;
        var angle = ticks * 0.1 + offset;
        var x = Math.cos(angle) * radius;
        var z = Math.sin(angle) * radius;
        
        for (var h = 0; h < height; h += 0.5) {
            var hAngle = h * 0.2 + angle;
            var hX = Math.cos(hAngle) * radius;
            var hZ = Math.sin(hAngle) * radius;
            var pLoc = center.clone().add(hX, h, hZ);
            w.spawnParticle(Particle.SOUL_FIRE_FLAME, pLoc, 1, 0, 0, 0, 0, null, true);
        }
    }
}

function drawVoidRifts(w, center, radius, rotation) {
    for (var i = 0; i < 4; i++) {
        var angle = rotation + (i * Math.PI / 2);
        var x = Math.cos(angle) * radius;
        var z = Math.sin(angle) * radius;
        var pLoc = center.clone().add(x, 0.5, z);
        w.spawnParticle(Particle.DRAGON_BREATH, pLoc, 10, 0.5, 0.5, 0.5, 0.05, null, true);
        w.spawnParticle(Particle.PORTAL, pLoc, 5, 0.2, 0.2, 0.2, 0.1, null, true);
    }
}

function drawRuneRain(w, center, radius) {
    for (var i = 0; i < 3; i++) {
        var angle = Math.random() * Math.PI * 2;
        var dist = Math.random() * radius;
        var x = Math.cos(angle) * dist;
        var z = Math.sin(angle) * dist;
        var pLoc = center.clone().add(x, 50, z);
        w.spawnParticle(Particle.ENCHANT, pLoc, 0, 0, -1, 0, 0.5, null, true);
    }
}

function drawFinalExplosion(w, center, radius, height) {
    for (var r = 1; r < radius * 2; r += 2) {
        drawShockwave(w, center, r, Color.WHITE);
    }
    w.spawnParticle(Particle.FLASH, center.clone().add(0, height/2, 0), 100, 2, height/2, 2, 0, null, true);
    w.spawnParticle(Particle.EXPLOSION_EMITTER, center.clone().add(0, height, 0), 10, 1, 1, 1, 0, null, true);
    
    for (var i = 0; i < 200; i++) {
        var dir = new Vector(Math.random()-0.5, Math.random(), Math.random()-0.5).normalize().multiply(2);
        w.spawnParticle(Particle.SOUL_FIRE_FLAME, center.clone().add(0, height, 0), 0, dir.getX(), dir.getY(), dir.getZ(), 0.5, null, true);
    }
}

function drawHexagram(w, center, radius, rotation, color1, color2, progress) {
    drawTriangle(w, center, radius, rotation, color1, progress);
    drawTriangle(w, center, radius, rotation + Math.PI, color2, progress);
}

function drawTriangle(w, center, radius, rotation, color, progress) {
    var points = [];
    for (var i = 0; i < 3; i++) {
        var angle = rotation + (i * Math.PI * 2 / 3);
        points.push(center.clone().add(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    
    for (var i = 0; i < 3; i++) {
        var edgeStart = i / 3;
        var edgeEnd = (i + 1) / 3;
        if (progress <= edgeStart) continue;
        
        var edgeProgress = Math.min(1.0, (progress - edgeStart) * 3);
        drawLine(w, points[i], points[(i + 1) % 3], color, edgeProgress);
    }
}

function drawLine(w, loc1, loc2, color, progress) {
    var distance = loc1.distance(loc2);
    var vector = loc2.clone().subtract(loc1).toVector().normalize().multiply(0.15);
    var options = new DustOptions(color, 1.0);
    
    var steps = Math.floor((distance / 0.15) * (progress || 1.0));
    var current = loc1.clone();
    for (var i = 0; i < steps; i++) {
        w.spawnParticle(Particle.DUST, current, 1, 0, 0, 0, 1, options, true);
        current.add(vector);
    }
}

function drawOuterStarArray(w, center, radius, rotation, progress, ticks) {
    var points = Math.floor(1800 * progress);
    var currentR = radius * (0.5 + 0.5 * progress);
    var R = currentR;
    var r = R * 0.35;
    var d = R * (0.7 + 0.5 * Math.sin(ticks * 0.1)); 
    
    for (var i = 0; i < points; i++) {
        var t = (i / 1800) * Math.PI * 2 * 12;
        var x = (R - r) * Math.cos(t + rotation) + d * Math.cos(((R - r) / r) * (t + rotation));
        var z = (R - r) * Math.sin(t + rotation) - d * Math.sin(((R - r) / r) * (t + rotation));
        
        var yOffset = Math.sin(t * 4 + ticks * 0.2) * 2.5 * progress;
        var pLoc = center.clone().add(x, 0.1 + yOffset, z);
        
        var color = Color.fromRGB(
            Math.max(0, Math.min(255, Math.floor(100 + 155 * Math.sin(t + ticks * 0.1)))),
            Math.max(0, Math.min(255, Math.floor(150 + 105 * Math.cos(t * 0.4)))),
            255
        );
        
        var twinkleSize = 0.6 + 1.0 * Math.abs(Math.sin(t * 10 + ticks * 0.3));
        w.spawnParticle(Particle.DUST, pLoc, 1, 0, 0, 0, 1, new DustOptions(color, twinkleSize), true);
        
        if (i % 5 == 0) { 
            w.spawnParticle(Particle.GLOW, pLoc, 1, 0, 0, 0, 0.01, null, true);
        }
        
        if (Math.random() < 0.02) {
            w.spawnParticle(Particle.END_ROD, pLoc, 1, 0, 0, 0, 0.05, null, true);
        }
    }
}

function drawCircle(w, center, radius, rotation, color, size, points, progress) {
    var limit = Math.floor(points * (progress || 1.0));
    for (var i = 0; i < limit; i++) {
        var angle = rotation + (i * Math.PI * 2 / points);
        var x = Math.cos(angle) * radius;
        var z = Math.sin(angle) * radius;
        
        var currentSize = size * (0.8 + 0.4 * Math.abs(Math.sin(i * 0.5 + rotation * 2)));
        var options = new DustOptions(color, currentSize);
        
        w.spawnParticle(Particle.DUST, center.clone().add(x, 0, z), 1, 0, 0, 0, 1, options, true);
    }
}