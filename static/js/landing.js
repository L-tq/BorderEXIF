/* ExifBorder – Landing Page Animations */
(function() {
    /* ---- GSAP plugins ---- */
    gsap.registerPlugin(ScrollTrigger, TextPlugin);

    /* ---- DOM refs ---- */
    var preloader = document.getElementById('preloader');
    var pfLines = document.querySelectorAll('.pf-line');
    var preloaderText = document.querySelector('.preloader-text');
    var particlesCanvas = document.getElementById('particlesCanvas');
    var ctx = particlesCanvas ? particlesCanvas.getContext('2d') : null;
    var orbs = document.querySelectorAll('.orb');
    var heroFrameLines = document.querySelectorAll('.hero-frame-line');
    var heroExifTyping = document.querySelector('.hero-exif-typing');
    var heroExifStrip = document.querySelector('.hero-exif-strip');
    var heroChips = document.querySelectorAll('.hero-chip');
    var heroBgDots = document.querySelectorAll('.hero-bg-dot');
    var heroCornerAccents = document.querySelectorAll('.hero-corner-accent');
    var heroLayout = document.getElementById('heroLayout');
    var heroImagePlaceholder = document.getElementById('heroImagePlaceholder');
    var heroText = document.getElementById('heroText');
    var heroSection = document.getElementById('lp-hero');
    var btnMagnetic = document.querySelector('.btn-magnetic');
    var statCards = document.querySelectorAll('.stat-card');
    var statNumbers = document.querySelectorAll('.stat-number');
    var ossBadge = document.querySelector('.oss-badge');
    var ghOutlines = document.querySelectorAll('.gh-outline');
    var workflowCards = document.querySelectorAll('.workflow-card');
    var ctaScramble = document.querySelector('.cta-scramble');
    var btnShockwave = document.querySelector('.btn-shockwave');
    var footerLinks = document.querySelectorAll('.lp-footer a');
    var cursorRing = document.querySelector('.cursor-ring');
    var cursorDot = document.querySelector('.cursor-dot');
    var themeToggle = document.querySelector('.lp-theme-toggle');
    var lpHeader = document.querySelector('.lp-header');

    /* ---- Touch device detection ---- */
    var isTouch = window.matchMedia('(pointer: coarse)').matches;

    /* ============================================================
       Preloader
       ============================================================ */
    function initPreloader() {
        var tl = gsap.timeline();
        /* Top line: left to right */
        tl.fromTo(pfLines[0], { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power2.inOut' }, 0);
        /* Right line: top to bottom */
        tl.fromTo(pfLines[1], { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: 'power2.inOut' }, 0.15);
        /* Bottom line: right to left */
        tl.fromTo(pfLines[2], { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: 'power2.inOut' }, 0.3);
        /* Left line: bottom to top */
        tl.fromTo(pfLines[3], { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: 'power2.inOut' }, 0.45);
        /* Pulse frame */
        tl.to(pfLines, { opacity: 0.3, duration: 0.4, ease: 'power1.inOut' }, 0.9);
        tl.to(pfLines, { opacity: 1, duration: 0.4, ease: 'power1.inOut' }, 1.3);
        /* Dismiss */
        tl.to(preloader, { opacity: 0, duration: 0.5, ease: 'power2.in', onComplete: function() {
            preloader.classList.add('hidden');
        }}, 1.6);
        /* Count-up text */
        var counter = { val: 0 };
        gsap.to(counter, { val: 100, duration: 1.4, ease: 'power2.out', onUpdate: function() {
            if (preloaderText) preloaderText.textContent = 'LOADING ' + Math.round(counter.val) + '%';
        }});
    }

    /* ============================================================
       Particles canvas
       ============================================================ */
    var particles = [];
    var PARTICLE_COUNT = 50;
    var canvasW, canvasH;

    function resizeParticlesCanvas() {
        if (!particlesCanvas) return;
        canvasW = particlesCanvas.width = window.innerWidth;
        canvasH = particlesCanvas.height = window.innerHeight;
    }

    function spawnParticle() {
        return {
            x: Math.random() * canvasW,
            y: Math.random() * canvasH,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 1.2 + 0.4,
            alpha: Math.random() * 0.4 + 0.1
        };
    }

    function initParticles() {
        if (!particlesCanvas || !ctx) return;
        resizeParticlesCanvas();
        for (var i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(spawnParticle());
        }
        window.addEventListener('resize', resizeParticlesCanvas);
        tickParticles();
    }

    function tickParticles() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvasW, canvasH);
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var baseColor = isDark ? '255,255,255' : '37,99,235';
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            /* Wrap around edges */
            if (p.x < 0) p.x = canvasW;
            if (p.x > canvasW) p.x = 0;
            if (p.y < 0) p.y = canvasH;
            if (p.y > canvasH) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + baseColor + ',' + p.alpha + ')';
            ctx.fill();
        }
        /* Run at ~30fps via setTimeout to reduce GPU load */
        setTimeout(function() { requestAnimationFrame(tickParticles); }, 33);
    }

    /* ============================================================
       Floating orbs — parallax on mouse
       ============================================================ */
    var mouseX = 0, mouseY = 0;
    var orbTargets = [
        { el: null, factor: 35 },
        { el: null, factor: 50 },
        { el: null, factor: 30 }
    ];

    function initOrbs() {
        if (orbs.length === 0) return;
        for (var i = 0; i < Math.min(orbs.length, 3); i++) {
            orbTargets[i].el = orbs[i];
        }
        /* Slow autonomous drift */
        orbTargets.forEach(function(ot, idx) {
            if (!ot.el) return;
            var phase = idx * 2.1;
            gsap.to(ot.el, {
                x: '+=30', y: '+=25', duration: 8 + idx * 3, ease: 'sine.inOut',
                yoyo: true, repeat: -1,
                modifiers: {
                    x: function(x) { return parseFloat(x) + mouseX * ot.factor + 'px'; },
                    y: function(y) { return parseFloat(y) + mouseY * ot.factor + 'px'; }
                }
            });
        });
    }

    function onPointerMove(e) {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    /* ============================================================
       Hero — parallax, chips, wireframe, typing
       ============================================================ */
    var heroMouseX = 0, heroMouseY = 0; /* normalized -1..1 relative to hero section */

    function initHero() {
        /* ---- Wireframe draw on scroll ---- */
        if (heroFrameLines.length === 4) {
            var hfTl = gsap.timeline({
                scrollTrigger: {
                    trigger: '#lp-hero',
                    start: 'top 70%',
                    end: 'top 20%',
                    scrub: 0.6
                }
            });
            hfTl.to(heroFrameLines[0], { scaleX: 1, duration: 1, ease: 'power2.out' }, 0);
            hfTl.to(heroFrameLines[1], { scaleY: 1, duration: 1, ease: 'power2.out' }, 0.2);
            hfTl.to(heroFrameLines[2], { scaleX: 1, duration: 1, ease: 'power2.out' }, 0.4);
            hfTl.to(heroFrameLines[3], { scaleY: 1, duration: 1, ease: 'power2.out' }, 0.6);
            /* Corner accents appear as frame completes */
            hfTl.to(heroCornerAccents, { opacity: 0.7, duration: 0.6, stagger: 0.08 }, 0.8);
        }

        /* ---- Corner accent pulse ---- */
        gsap.to(heroCornerAccents, {
            opacity: '+=0.2', duration: 2, ease: 'sine.inOut',
            yoyo: true, repeat: -1,
            delay: 1.5
        });

        /* ---- EXIF typing along image edge ---- */
        if (heroExifTyping) {
            ScrollTrigger.create({
                trigger: '#lp-hero',
                start: 'top 50%',
                onEnter: function() {
                    heroExifTyping.style.opacity = '1';
                    gsap.to(heroExifTyping, {
                        text: 'f/2.8  1/500s  ISO 100  35mm',
                        duration: 2.5,
                        ease: 'none',
                        delay: 0.8
                    });
                },
                once: true
            });
        }

        /* ---- EXIF strip under hero text ---- */
        if (heroExifStrip) {
            ScrollTrigger.create({
                trigger: '#lp-hero',
                start: 'top 50%',
                onEnter: function() {
                    heroExifStrip.style.opacity = '1';
                    gsap.to(heroExifStrip, {
                        text: 'Camera: Sony A7IV  •  Lens: FE 24-70mm f/2.8 GM II  •  GPS: 37.7749° N, 122.4194° W',
                        duration: 3,
                        ease: 'none',
                        delay: 1.2
                    });
                },
                once: true
            });
        }

        /* ---- Floating EXIF chips — drift handled in rAF (no GSAP conflict) ---- */

        /* ---- Background dots — subtle drift ---- */
        heroBgDots.forEach(function(dot, idx) {
            gsap.to(dot, {
                x: (Math.random() - 0.5) * 25,
                y: (Math.random() - 0.5) * 25,
                duration: 7 + idx * 2,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1
            });
        });

        /* ---- Hero mouse parallax ---- */
        if (heroSection) {
            heroSection.addEventListener('mousemove', function(e) {
                var rect = heroSection.getBoundingClientRect();
                heroMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
                heroMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            });
            heroSection.addEventListener('mouseleave', function() {
                heroMouseX = 0;
                heroMouseY = 0;
            });
        }
    }

    /* ---- Hero parallax update — called from main rAF loop ---- */
    var heroParallaxTime = 0;
    function updateHeroParallax() {
        if (isTouch) return;
        heroParallaxTime += 0.016; /* ~60fps increment */
        /* Image placeholder tilts toward cursor */
        if (heroImagePlaceholder) {
            var tiltX = heroMouseY * -8;
            var tiltY = heroMouseX * 8;
            heroImagePlaceholder.style.transform =
                'perspective(600px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg)';
        }
        /* Hero text shifts slightly */
        if (heroText) {
            heroText.style.transform =
                'translate(' + (heroMouseX * 6) + 'px,' + (heroMouseY * 4) + 'px)';
        }
        /* Floating chips — autonomous oscillation + mouse parallax */
        heroChips.forEach(function(chip, idx) {
            var depth = parseFloat(chip.getAttribute('data-depth')) || 0.5;
            var freq = 0.4 + idx * 0.15;
            var driftX = Math.sin(heroParallaxTime * freq + idx) * 15;
            var driftY = Math.cos(heroParallaxTime * freq * 0.7 + idx) * 12;
            var px = driftX + heroMouseX * depth * 30;
            var py = driftY + heroMouseY * depth * 20;
            chip.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px)';
        });
        /* Background dots — oscillation + subtle parallax */
        heroBgDots.forEach(function(dot, idx) {
            var depth = 0.15 + idx * 0.05;
            var freq = 0.3 + idx * 0.2;
            var driftX = Math.sin(heroParallaxTime * freq + idx * 2) * 8;
            var driftY = Math.cos(heroParallaxTime * freq * 0.8 + idx) * 6;
            dot.style.transform =
                'translate(' + (driftX + heroMouseX * depth * 20).toFixed(1) + 'px,' + (driftY + heroMouseY * depth * 15).toFixed(1) + 'px)';
        });
    }

    /* ============================================================
       Magnetic button
       ============================================================ */
    function initMagneticButton() {
        if (!btnMagnetic) return;
        var ripple = btnMagnetic.querySelector('.btn-ripple');
        var btnRect = btnMagnetic.getBoundingClientRect();

        btnMagnetic.addEventListener('mouseenter', function() {
            btnRect = btnMagnetic.getBoundingClientRect();
        });

        btnMagnetic.addEventListener('mousemove', function(e) {
            btnRect = btnMagnetic.getBoundingClientRect();
            var rx = e.clientX - btnRect.left;
            var ry = e.clientY - btnRect.top;
            var cx = rx - btnRect.width / 2;
            var cy = ry - btnRect.height / 2;
            /* Move button slightly toward cursor */
            gsap.to(btnMagnetic, {
                x: cx * 0.2,
                y: cy * 0.2,
                duration: 0.4,
                ease: 'power2.out'
            });
            /* Move ripple */
            if (ripple) {
                ripple.style.left = rx + 'px';
                ripple.style.top = ry + 'px';
                ripple.style.width = '80px';
                ripple.style.height = '80px';
                ripple.style.transform = 'translate(-50%, -50%) scale(1)';
                ripple.style.opacity = '1';
            }
        });

        btnMagnetic.addEventListener('mouseleave', function() {
            gsap.to(btnMagnetic, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
            if (ripple) {
                ripple.style.transform = 'translate(-50%, -50%) scale(0)';
                ripple.style.opacity = '0';
            }
        });
    }

    /* ============================================================
       Trust & Stats — count-up
       ============================================================ */
    function initStats() {
        statNumbers.forEach(function(el) {
            var target = el.getAttribute('data-target');
            if (!target) return;
            var isPercent = target.indexOf('%') !== -1;
            var numVal = parseFloat(target);
            var counter = { val: 0 };
            ScrollTrigger.create({
                trigger: el,
                start: 'top 85%',
                onEnter: function() {
                    gsap.to(counter, {
                        val: numVal,
                        duration: 2,
                        ease: 'power2.out',
                        onUpdate: function() {
                            el.textContent = isPercent ? Math.round(counter.val) + '%' : Math.round(counter.val).toLocaleString();
                        },
                        onComplete: function() {
                            /* Glow on completion */
                            var card = el.closest('.stat-card');
                            if (card) {
                                card.classList.add('glowing');
                                gsap.to(card, {
                                    boxShadow: 'var(--lp-card-hover-shadow), 0 0 50px var(--lp-glow-cyan-strong)',
                                    duration: 0.6
                                });
                            }
                        }
                    });
                },
                once: true
            });
        });
    }

    /* GitHub icon stroke-draw */
    function initGitHubIcon() {
        if (ghOutlines.length === 0) return;
        ghOutlines.forEach(function(path) {
            var len = path.getTotalLength();
            path.style.strokeDasharray = len;
            path.style.strokeDashoffset = len;
        });
        ScrollTrigger.create({
            trigger: ossBadge,
            start: 'top 85%',
            onEnter: function() {
                ghOutlines.forEach(function(path) {
                    gsap.to(path, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' });
                });
                gsap.fromTo(ossBadge, { y: 8, opacity: 0.6 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' });
            },
            once: true
        });
    }

    /* ============================================================
       Workflow Cards — stagger + 3D tilt
       ============================================================ */
    function initWorkflowCards() {
        /* Stagger entrance */
        gsap.fromTo(workflowCards,
            { y: 60, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power2.out',
                scrollTrigger: {
                    trigger: '#lp-workflow',
                    start: 'top 75%',
                    once: true
                }
            }
        );

        /* 3D tilt on hover */
        workflowCards.forEach(function(card) {
            card.addEventListener('mousemove', function(e) {
                var rect = card.getBoundingClientRect();
                var cx = e.clientX - rect.left;
                var cy = e.clientY - rect.top;
                var rx = (cy / rect.height - 0.5) * -15; /* rotateX: -15 to +15 */
                var ry = (cx / rect.width - 0.5) * 15;   /* rotateY: -15 to +15 */
                gsap.to(card, {
                    rotateX: rx,
                    rotateY: ry,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            });
            card.addEventListener('mouseleave', function() {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.6,
                    ease: 'elastic.out(1, 0.4)'
                });
            });
        });
    }

    /* ============================================================
       CTA Scramble text
       ============================================================ */
    function initScrambleText() {
        if (!ctaScramble) return;
        var text = ctaScramble.textContent.trim();
        ctaScramble.textContent = '';
        var chars = [];
        for (var i = 0; i < text.length; i++) {
            var span = document.createElement('span');
            span.className = 'scramble-char';
            span.textContent = text[i];
            span.style.display = 'inline-block';
            ctaScramble.appendChild(span);
            chars.push(span);
        }

        ScrollTrigger.create({
            trigger: '#lp-cta',
            start: 'top 80%',
            onEnter: function() {
                chars.forEach(function(span, idx) {
                    /* Random starting position */
                    var sx = (Math.random() - 0.5) * 160;
                    var sy = (Math.random() - 0.5) * 80;
                    var sr = (Math.random() - 0.5) * 120;
                    gsap.fromTo(span,
                        { x: sx, y: sy, rotation: sr, opacity: 0, scale: 0.3 },
                        {
                            x: 0, y: 0, rotation: 0, opacity: 1, scale: 1,
                            duration: 0.7,
                            delay: idx * 0.03,
                            ease: 'back.out(1.7)'
                        }
                    );
                });
            },
            once: true
        });
    }

    /* ============================================================
       Shockwave button
       ============================================================ */
    function initShockwave() {
        if (!btnShockwave) return;
        var ring = btnShockwave.querySelector('.shockwave-ring');
        if (!ring) return;

        btnShockwave.addEventListener('mouseenter', function() {
            var tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
            tl.fromTo(ring,
                { opacity: 0.8, scale: 1 },
                { opacity: 0, scale: 1.15, duration: 0.8, ease: 'power2.out' }
            );
            btnShockwave._shockwaveTl = tl;
        });

        btnShockwave.addEventListener('mouseleave', function() {
            if (btnShockwave._shockwaveTl) {
                btnShockwave._shockwaveTl.kill();
                btnShockwave._shockwaveTl = null;
            }
            gsap.to(ring, { opacity: 0, scale: 1, duration: 0.2 });
        });
    }

    /* ============================================================
       Footer elastic underlines
       ============================================================ */
    function initFooterLinks() {
        footerLinks.forEach(function(link) {
            var afterEl = link.querySelector('::after'); /* Can't target pseudo directly */
            link.addEventListener('mouseenter', function() {
                gsap.to(link, { color: 'var(--lp-text)', duration: 0.2 });
            });
            link.addEventListener('mouseleave', function() {
                gsap.to(link, { color: 'var(--lp-text-muted)', duration: 0.2 });
            });
        });

        /* Animate the ::after scaleX via CSS custom property approach:
           we toggle a data attribute and use CSS transition with elastic timing */
        footerLinks.forEach(function(link) {
            link.addEventListener('mouseenter', function() {
                link.dataset.hover = 'true';
            });
            link.addEventListener('mouseleave', function() {
                link.dataset.hover = 'false';
            });
        });
    }

    /* ============================================================
       Cursor — ring + dot + physics particle bursts
       ============================================================ */
    var cursorX = -100, cursorY = -100;
    var ringX = -100, ringY = -100;
    var prevX = -100, prevY = -100;
    var cursorParticles = [];
    var MAX_CURSOR_PARTICLES = 30;
    var cursorParticleIdx = 0;

    function createCursorParticles() {
        var frag = document.createDocumentFragment();
        for (var i = 0; i < MAX_CURSOR_PARTICLES; i++) {
            var p = document.createElement('div');
            p.className = 'cursor-particle';
            frag.appendChild(p);
            cursorParticles.push({
                el: p,
                x: 0, y: 0, vx: 0, vy: 0,
                life: 0, decay: 0, size: 0,
                hue: 0
            });
        }
        document.body.appendChild(frag);
    }

    function spawnCursorParticle(x, y, speed) {
        var cp = cursorParticles[cursorParticleIdx];
        var angle = Math.random() * Math.PI * 2;
        var spd = (Math.random() * 2 + 0.8) * Math.min(speed || 1, 2.5);
        cp.x = x;
        cp.y = y;
        cp.vx = Math.cos(angle) * spd;
        cp.vy = Math.sin(angle) * spd;
        cp.life = 1;
        cp.decay = Math.random() * 0.035 + 0.025;
        cp.size = Math.random() * 2 + 1.5;
        cp.hue = Math.random() * 20 - 10;
        cursorParticleIdx = (cursorParticleIdx + 1) % MAX_CURSOR_PARTICLES;
    }

    function updateCursorParticles() {
        for (var i = 0; i < cursorParticles.length; i++) {
            var cp = cursorParticles[i];
            if (cp.life <= 0) continue;
            cp.life -= cp.decay;
            if (cp.life <= 0) {
                cp.el.style.opacity = '0';
                cp.el.style.transform = 'translate(-50%, -50%) scale(0)';
                continue;
            }
            cp.vx *= 0.96;
            cp.vy *= 0.96;
            cp.vy += 0.04; /* subtle gravity */
            cp.x += cp.vx;
            cp.y += cp.vy;
            cp.el.style.left = cp.x + 'px';
            cp.el.style.top = cp.y + 'px';
            cp.el.style.width = cp.size + 'px';
            cp.el.style.height = cp.size + 'px';
            cp.el.style.opacity = cp.life.toFixed(2);
            cp.el.style.transform = 'translate(-50%, -50%) scale(' + cp.life.toFixed(2) + ')';
            cp.el.style.filter = 'hue-rotate(' + cp.hue.toFixed(0) + 'deg)';
        }
    }

    function initCursor() {
        if (isTouch) return;
        if (!cursorRing || !cursorDot) return;
        createCursorParticles();
        /* Position off-screen initially */
        cursorRing.style.left = '-100px';
        cursorRing.style.top = '-100px';
        cursorDot.style.left = '-100px';
        cursorDot.style.top = '-100px';
        animateCursor();
    }

    function animateCursor() {
        /* Prevent burst on first frame when prev is -100 */
        if (prevX === -100 && prevY === -100 && cursorX !== -100) {
            prevX = cursorX;
            prevY = cursorY;
        }
        /* Snappy lerp for ring — responsive, not laggy */
        ringX += (cursorX - ringX) * 0.40;
        ringY += (cursorY - ringY) * 0.40;
        if (cursorRing) {
            cursorRing.style.left = ringX + 'px';
            cursorRing.style.top = ringY + 'px';
        }
        if (cursorDot) {
            cursorDot.style.left = cursorX + 'px';
            cursorDot.style.top = cursorY + 'px';
        }
        /* Spawn particles based on cursor speed — restrained splash */
        var dist = Math.sqrt((cursorX - prevX) * (cursorX - prevX) + (cursorY - prevY) * (cursorY - prevY));
        if (dist > 4) {
            var count = Math.min(Math.floor(dist / 12), 2);
            for (var i = 0; i < count; i++) {
                spawnCursorParticle(cursorX, cursorY, dist / 8);
            }
        }
        prevX = cursorX;
        prevY = cursorY;
        updateCursorParticles();
        updateHeroParallax();
        requestAnimationFrame(animateCursor);
    }

    document.addEventListener('pointermove', function(e) {
        cursorX = e.clientX;
        cursorY = e.clientY;
        /* Check if hovering over clickable elements */
        if (cursorRing) {
            var target = document.elementFromPoint(e.clientX, e.clientY);
            var isClickable = target && target.closest('a, button, .btn-magnetic, .btn-shockwave, .workflow-card, .oss-badge');
            if (isClickable) {
                cursorRing.classList.add('hovering');
            } else {
                cursorRing.classList.remove('hovering');
            }
        }
    }, { passive: true });

    /* ============================================================
       Header scroll effect
       ============================================================ */
    function initHeaderScroll() {
        if (!lpHeader) return;
        window.addEventListener('scroll', function() {
            if (window.scrollY > 40) {
                lpHeader.classList.add('scrolled');
            } else {
                lpHeader.classList.remove('scrolled');
            }
        });
        /* Initial check */
        if (window.scrollY > 40) lpHeader.classList.add('scrolled');
    }

    /* ============================================================
       Theme toggle
       ============================================================ */
    function initTheme() {
        if (!themeToggle) return;
        var html = document.documentElement;
        themeToggle.textContent = html.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
        themeToggle.addEventListener('click', function() {
            var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('exifborder-theme', next);
            themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
            /* Refresh particles color on theme change */
            if (particlesCanvas && ctx) {
                ctx.clearRect(0, 0, canvasW, canvasH);
            }
            /* Update ScrollTrigger calculations */
            ScrollTrigger.refresh();
        });
    }

    /* ============================================================
       Init
       ============================================================ */
    function init() {
        initPreloader();
        initParticles();
        initOrbs();
        initHero();
        initMagneticButton();
        initStats();
        initGitHubIcon();
        initWorkflowCards();
        initScrambleText();
        initShockwave();
        initFooterLinks();
        initCursor();
        initTheme();
        initHeaderScroll();

        /* Global pointer move for orbs */
        document.addEventListener('pointermove', onPointerMove, { passive: true });

        /* Refresh ScrollTrigger on load */
        window.addEventListener('load', function() {
            ScrollTrigger.refresh();
        });

        /* Refresh on resize (debounced) */
        var resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                ScrollTrigger.refresh();
            }, 200);
        });
    }

    /* Start on DOM ready */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
