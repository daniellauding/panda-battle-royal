class Game {
    constructor() {
        // Camera Configuration
        this.cameraConfig = {
            // Third-person settings
            distance: 4, // Much closer to show character
            offsetHorizontal: 1.2,
            offsetHeight: 1.2, // Lower height
            shoulderSide: 'right', // 'right' or 'left'
            fovThirdPerson: 90, // Third-person FOV
            // ADS (Aim Down Sights) settings
            adsDistance: 2.5, // Closer camera when aiming
            adsOffsetHorizontal: 0.6, // Tighter to center when aiming
            adsOffsetHeight: 1.4, // Slightly higher when aiming
            adsFov: 75, // Narrower FOV when aiming for focus
            // First-person settings
            fovFirstPerson: 90, // First-person FOV
            eyeHeight: 2.4, // Height of player's eyes
        };
        
        // Camera mode state
        this.cameraMode = 'third-person'; // 'third-person' or 'first-person'
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.socket = null;
        this.players = new Map();
        this.projectiles = new Map();
        this.localPlayer = null;
        this.config = null;
        this.clock = new THREE.Clock();
        this.inputHandler = null;
        this.ui = null;
        
        // Game state
        this.playerId = null;
        this.gameStarted = false;
        this.mouseLocked = false;
        
        // Camera control
        this.cameraDistance = 8;
        this.cameraHeight = 4;
        this.cameraYaw = 0;     // Horizontal rotation (left/right)
        this.cameraPitch = 0;   // Vertical rotation (up/down)
        this.freeLookYaw = 0;   // For ALT free-look horizontal
        this.freeLookPitch = 0; // For ALT free-look vertical
        this.aimStartYaw = 0;   // Starting yaw when aiming started
        this.aimStartPitch = 0; // Starting pitch when aiming started
        this.aimStartPlayerRotation = 0; // Player rotation when aiming started
        this.cameraPivot = new THREE.Object3D();
        this.cameraArm = new THREE.Object3D();
        
        // Vertical aim limits
        this.minPitch = -Math.PI * 80 / 180; // -80 degrees
        this.maxPitch = Math.PI * 80 / 180;   // +80 degrees
        
        this.init();
    }

    init() {
        console.log('Initializing game...');
        this.setupThreeJS();
        this.setupSocketIO();
        this.setupPointerLock();
        this.inputHandler = new InputHandler(this);
        this.ui = new UI(this);
        
        // Make sure canvas is visible
        const canvas = document.getElementById('game-canvas');
        canvas.style.display = 'block';
        console.log('Canvas display set to block');
        
        this.animate();
        console.log('Animation started');
    }

    setupThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            this.cameraConfig.fovThirdPerson, // Start in third-person
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Renderer
        const canvas = document.getElementById('game-canvas');
        console.log('Canvas element:', canvas);
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        console.log('Renderer initialized, size:', window.innerWidth, 'x', window.innerHeight);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        
        // Create map
        this.createMap();
        console.log('Map created');
        
        // Setup camera controls
        this.setupCameraControls();
        console.log('Camera controls setup');
        
        // Initial camera position (will be updated by camera controls)
        this.cameraYaw = 0;   // Start facing forward
        this.cameraPitch = 0; // Start at neutral height
        
        // Add a test cube to verify Three.js is working
        const testGeometry = new THREE.BoxGeometry(2, 2, 2);
        const testMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const testCube = new THREE.Mesh(testGeometry, testMaterial);
        testCube.position.set(0, 5, 0);
        testCube.castShadow = true;
        this.scene.add(testCube);
        console.log('Test cube added to scene');
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    createMap() {
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Walls/Boundaries
        const wallHeight = 10;
        const wallGeometry = new THREE.BoxGeometry(200, wallHeight, 2);
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        // Create 4 walls
        const walls = [
            { pos: [0, wallHeight/2, 100], rot: [0, 0, 0] },
            { pos: [0, wallHeight/2, -100], rot: [0, 0, 0] },
            { pos: [100, wallHeight/2, 0], rot: [0, Math.PI/2, 0] },
            { pos: [-100, wallHeight/2, 0], rot: [0, Math.PI/2, 0] }
        ];
        
        walls.forEach(wall => {
            const mesh = new THREE.Mesh(wallGeometry, wallMaterial);
            mesh.position.set(...wall.pos);
            mesh.rotation.set(...wall.rot);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.isCollidable = true; // Tag for collision detection
            this.scene.add(mesh);
        });
        
        // Add some cover objects
        this.createCoverObjects();
    }

    createCoverObjects() {
        const coverMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        
        // Create random cover objects
        for (let i = 0; i < 15; i++) {
            const size = Math.random() * 2 + 1;
            const height = Math.random() * 3 + 2;
            const coverGeometry = new THREE.BoxGeometry(size, height, size);
            const cover = new THREE.Mesh(coverGeometry, coverMaterial);
            
            // Random position within map bounds
            cover.position.set(
                (Math.random() - 0.5) * 180,
                height / 2,
                (Math.random() - 0.5) * 180
            );
            
            cover.castShadow = true;
            cover.receiveShadow = true;
            cover.userData.isCollidable = true; // Tag for collision detection
            this.scene.add(cover);
        }
    }

    setupCameraControls() {
        // Camera pivot and arm setup for third-person view
        this.scene.add(this.cameraPivot);
        this.cameraPivot.add(this.cameraArm);
        
        // Position camera behind player (positive Z is behind in camera space)
        this.cameraArm.position.set(0, 0, this.cameraConfig.distance);
        this.cameraArm.add(this.camera);
        this.camera.position.set(0, 0, 0);
        
        // Camera looks forward toward where player is looking (negative Z direction)
        this.camera.lookAt(0, 0, -1);
    }

    setupPointerLock() {
        const canvas = this.renderer.domElement;
        
        // Auto-request pointer lock when game starts
        canvas.addEventListener('click', () => {
            if (this.gameStarted) {
                canvas.requestPointerLock();
            }
        });
        
        // Also request on any key press when game is started
        document.addEventListener('keydown', (event) => {
            if (this.gameStarted && !this.mouseLocked && ['w','a','s','d',' '].includes(event.key.toLowerCase())) {
                canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.mouseLocked = document.pointerLockElement === canvas;
            console.log('Pointer lock changed:', this.mouseLocked);
            
            // Update UI to show lock status
            if (this.ui) {
                if (this.mouseLocked) {
                    this.ui.hideLockMessage();
                } else if (this.gameStarted) {
                    this.ui.showLockMessage();
                }
            }
        });
        
        document.addEventListener('mousemove', (event) => {
            if (this.mouseLocked) {
                // Increased sensitivity for better responsiveness
                const mouseSensitivity = 0.003;
                
                if (this.inputHandler && this.inputHandler.keys['alt']) {
                    // ALT free-look mode - update separate free-look angles
                    this.freeLookYaw -= event.movementX * mouseSensitivity;
                    this.freeLookPitch -= event.movementY * mouseSensitivity;
                    this.freeLookPitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, this.freeLookPitch));
                } else {
                    // Normal mode - update main camera angles
                    this.cameraYaw -= event.movementX * mouseSensitivity;
                    this.cameraPitch -= event.movementY * mouseSensitivity;
                    // Apply vertical aim limits
                    this.cameraPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.cameraPitch));
                }
            }
        });
    }

    setupSocketIO() {
        this.socket = io();
        
        this.socket.on('game-joined', (data) => {
            this.playerId = data.playerId;
            this.config = data.config;
            
            // Create local player
            this.localPlayer = new Player(data.playerId, '', '', true);
            this.players.set(data.playerId, this.localPlayer);
            this.scene.add(this.localPlayer.mesh);
            console.log('Local player created and added to scene');
            
            // Create other players
            console.log('Creating other players from initial data:', data.players.length, 'players');
            data.players.forEach(playerData => {
                if (playerData.id !== this.playerId) {
                    console.log('Creating other player:', playerData.name, playerData.id);
                    const player = new Player(
                        playerData.id,
                        playerData.name,
                        playerData.character,
                        false
                    );
                    player.updateFromServer(playerData);
                    this.players.set(playerData.id, player);
                    this.scene.add(player.mesh);
                    
                    console.log('Other player added to scene:', playerData.name, 'at position:', player.mesh.position);
                }
            });
            
            console.log('Joined game with player ID:', this.playerId);
        });
        
        this.socket.on('player-joined', (data) => {
            if (data.id !== this.playerId) {
                console.log('Adding other player to scene:', data.name, data.id);
                const player = new Player(data.id, data.name, data.character, false);
                player.updateFromServer(data);
                this.players.set(data.id, player);
                this.scene.add(player.mesh);
                
                console.log('Player joined and added to scene:', data.name, 'Total players:', this.players.size, 'at position:', player.mesh.position);
            }
        });
        
        this.socket.on('player-moved', (data) => {
            const player = this.players.get(data.id);
            if (player && !player.isLocal) {
                console.log('Updating player movement:', data.name, 'position:', data.position);
                player.updateFromServer(data);
            } else if (!player) {
                console.log('Player not found for movement update:', data.id);
            }
        });
        
        this.socket.on('player-left', (playerId) => {
            const player = this.players.get(playerId);
            if (player) {
                this.scene.remove(player.mesh);
                this.players.delete(playerId);
                
                // Remove any debug spheres that might still exist
                const debugSphere = this.scene.getObjectByName(`debug-sphere-${playerId}`);
                if (debugSphere) {
                    this.scene.remove(debugSphere);
                }
                
                console.log('Player left:', playerId);
            }
        });
        
        this.socket.on('projectile-fired', (data) => {
            console.log('Received projectile-fired from server:', data.id, 'from player:', data.playerId);
            const projectile = new Projectile(data.id, data.position, data.direction);
            this.projectiles.set(data.id, projectile);
            this.scene.add(projectile.mesh);
            console.log('Projectile added to scene:', data.id, 'Total projectiles:', this.projectiles.size);
        });
        
        this.socket.on('projectile-hit', (projectileId) => {
            this.removeProjectile(projectileId);
        });
        
        this.socket.on('projectile-expired', (projectileId) => {
            this.removeProjectile(projectileId);
        });
        
        this.socket.on('player-hit', (data) => {
            const player = this.players.get(data.playerId);
            if (player) {
                player.health = data.health;
                if (data.playerId === this.playerId) {
                    this.ui.updateHealth(data.health);
                }
                
                if (data.killed) {
                    player.alive = false;
                    
                    // Make dead player invisible
                    player.mesh.visible = false;
                    
                    if (data.playerId === this.playerId) {
                        this.ui.showRespawnScreen();
                    }
                }
            }
        });
        
        this.socket.on('player-killed', (data) => {
            const victim = this.players.get(data.playerId);
            const killer = this.players.get(data.killerId);
            
            if (victim && killer) {
                this.ui.showKillNotification(killer.name, victim.name);
            }
        });
        
        this.socket.on('scoreboard-update', (scoreboard) => {
            this.ui.updateScoreboard(scoreboard);
        });
        
        this.socket.on('projectile-exploded', (data) => {
            console.log('Projectile exploded at:', data.position);
            this.createExplosion(data.position, data.radius);
            this.removeProjectile(data.id);
        });
        
        this.socket.on('rocket-jump', (data) => {
            if (data.playerId === this.playerId) {
                console.log('Rocket jump force applied:', data.force);
                this.localPlayer.velocity.x += data.force.x;
                this.localPlayer.velocity.y += data.force.y;
                this.localPlayer.velocity.z += data.force.z;
            }
        });

        this.socket.on('chat-message', (data) => {
            console.log('Received chat message:', data);
            this.ui.addChatMessage(data.playerName, data.message, data.playerId === this.playerId);
        });
        
        this.socket.on('player-respawned', (data) => {
            console.log('Player respawned:', data.name, 'at position:', data.position);
            const player = this.players.get(data.id);
            if (player) {
                player.updateFromServer(data);
                player.alive = true;
                
                // Make player visible again
                player.mesh.visible = true;
                
                if (data.id === this.playerId) {
                    this.ui.updateHealth(data.health);
                    this.ui.hideRespawnScreen();
                }
            }
        });
    }

    removeProjectile(projectileId) {
        const projectile = this.projectiles.get(projectileId);
        if (projectile) {
            this.scene.remove(projectile.mesh);
            this.projectiles.delete(projectileId);
        }
    }

    startGame(name, character) {
        console.log('Starting game with name:', name, 'character:', character);
        this.gameStarted = true;
        
        // Hide menu
        document.getElementById('menu').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        
        // Join game
        this.socket.emit('join-game', { name, character });
        console.log('Emitted join-game event');
        
        // Start game loop
        this.ui.updateHealth(100);
        
        // Clean up any existing debug spheres
        this.cleanupDebugSpheres();
    }

    shoot() {
        console.log('Player shooting');
        if (!this.localPlayer || !this.localPlayer.alive) return;
        
        // Calculate shooting direction from camera center → crosshair forward
        // This ensures projectiles follow the crosshair exactly
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        direction.normalize();
        
        // Get camera world position for projectile spawn
        const cameraWorldPos = new THREE.Vector3();
        this.camera.getWorldPosition(cameraWorldPos);
        
        // Spawn projectile from camera center (not weapon barrel)
        const position = cameraWorldPos.clone();
        
        // Offset slightly forward to avoid camera near clipping
        position.addScaledVector(direction, 0.2);
        
        // Send shoot event to server
        this.socket.emit('player-shoot', {
            position: position,
            direction: direction
        });
        
        // Create muzzle flash effect at player weapon position for visuals
        const visualFlashPos = this.localPlayer.mesh.position.clone();
        visualFlashPos.y += 1.5; // Shoulder height
        this.createMuzzleFlash(visualFlashPos);
        
        console.log('Shot fired from camera center in direction:', direction);
    }
    
    cleanupDebugSpheres() {
        // Remove all debug spheres from the scene
        const objectsToRemove = [];
        this.scene.traverse((child) => {
            if (child.name && child.name.startsWith('debug-sphere-')) {
                objectsToRemove.push(child);
            }
        });
        
        objectsToRemove.forEach(obj => {
            this.scene.remove(obj);
        });
        
        console.log('Cleaned up', objectsToRemove.length, 'debug spheres');
    }
    
    toggleCameraMode() {
        // Switch between third-person and first-person
        if (this.cameraMode === 'third-person') {
            this.cameraMode = 'first-person';
            this.camera.fov = this.cameraConfig.fovFirstPerson;
            // Remove camera from third-person setup
            this.cameraArm.remove(this.camera);
            this.scene.add(this.camera);
            console.log('Switched to first-person mode');
        } else {
            this.cameraMode = 'third-person';
            this.camera.fov = this.cameraConfig.fovThirdPerson;
            // Re-add camera to third-person setup
            this.scene.remove(this.camera);
            this.cameraArm.add(this.camera);
            this.camera.position.set(0, 0, 0);
            console.log('Switched to third-person mode');
        }
        
        // Update camera projection matrix after FOV change
        this.camera.updateProjectionMatrix();
        
        // Update UI indicator
        if (this.ui) {
            this.ui.updateCameraModeIndicator(this.cameraMode);
        }
    }

    sendChatMessage(message) {
        if (!this.socket || !message.trim()) return;
        
        this.socket.emit('chat-message', {
            message: message.trim()
        });
    }

    createMuzzleFlash(position) {
        const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // Remove flash after short time
        setTimeout(() => {
            this.scene.remove(flash);
        }, 100);
    }
    
    createExplosion(position, radius) {
        console.log('Creating explosion at:', position, 'radius:', radius);
        
        // Create explosion sphere
        const explosionGeometry = new THREE.SphereGeometry(radius, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4400,
            transparent: true,
            opacity: 0.6
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        // Animate explosion
        let scale = 0.1;
        const animate = () => {
            scale += 0.1;
            explosion.scale.set(scale, scale, scale);
            explosion.material.opacity -= 0.05;
            
            if (explosion.material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(explosion);
            }
        };
        animate();
    }

    updateCamera() {
        if (!this.localPlayer) return;
        
        // Determine which camera angles to use
        let currentYaw, currentPitch;
        
        if (this.inputHandler && this.inputHandler.keys['alt']) {
            // ALT free-look mode - use free-look angles, player doesn't rotate
            currentYaw = this.freeLookYaw;
            currentPitch = this.freeLookPitch;
        } else if (this.inputHandler && this.inputHandler.isFreeLookAiming && this.cameraMode === 'third-person') {
            // Mouse2 ADS aiming mode - free mouse look (like ALT mode but with ADS visuals)
            currentYaw = this.cameraYaw;
            currentPitch = this.cameraPitch;
            
            // Character does NOT rotate in ADS mode - free look like ALT mode
            // Only update spine IK for visual pitch matching
            this.localPlayer.setAimPitch(currentPitch);
        } else {
            // Normal mode - use main camera angles
            currentYaw = this.cameraYaw;
            currentPitch = this.cameraPitch;
            
            // Player rotation logic:
            // - First-person: player always faces camera direction
            // - Third-person: player rotates only when moving (allows free-look when stationary)
            if (this.cameraMode === 'first-person') {
                this.localPlayer.mesh.rotation.y = currentYaw;
            } else {
                // Third-person: only rotate player when actively moving
                // This allows complete free-look when standing still
                if (this.inputHandler && this.inputHandler.isMoving()) {
                    this.localPlayer.mesh.rotation.y = currentYaw;
                }
            }
            
            // Update spine IK for visual pitch matching (only in third-person)
            if (this.cameraMode === 'third-person') {
                this.localPlayer.setAimPitch(currentPitch);
            }
        }
        
        if (this.cameraMode === 'first-person') {
            // First-person camera positioning
            this.updateFirstPersonCamera(currentYaw, currentPitch);
        } else {
            // Third-person camera positioning
            this.updateThirdPersonCamera(currentYaw, currentPitch);
        }
    }
    
    updateFirstPersonCamera(yaw, pitch) {
        // Position camera at player's eye level
        const playerPos = this.localPlayer.mesh.position.clone();
        playerPos.y += this.cameraConfig.eyeHeight;
        
        // Set camera position directly (no pivot/arm system needed)
        this.camera.position.copy(playerPos);
        
        // Apply rotations directly to camera
        this.camera.rotation.set(pitch, yaw, 0, 'YXZ');
    }
    
    updateThirdPersonCamera(yaw, pitch) {
        // Check if in ADS mode
        const isAiming = this.inputHandler && this.inputHandler.isFreeLookAiming;
        
        // Camera offsets for over-shoulder positioning
        let horizontalOffset = isAiming ? 
            this.cameraConfig.adsOffsetHorizontal : 
            this.cameraConfig.offsetHorizontal;
        
        let heightOffset = isAiming ?
            this.cameraConfig.adsOffsetHeight :
            this.cameraConfig.offsetHeight;
            
        let distance = isAiming ?
            this.cameraConfig.adsDistance :
            this.cameraConfig.distance;
        
        if (this.cameraConfig.shoulderSide === 'left') {
            horizontalOffset = -horizontalOffset;
        }
        
        // Update FOV for ADS
        const targetFov = isAiming ? this.cameraConfig.adsFov : this.cameraConfig.fovThirdPerson;
        if (Math.abs(this.camera.fov - targetFov) > 0.5) {
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.1);
            this.camera.updateProjectionMatrix();
        }
        
        // Position camera pivot at player position with height offset
        this.cameraPivot.position.copy(this.localPlayer.mesh.position);
        this.cameraPivot.position.y += heightOffset;
        
        // Apply rotations to camera pivot (horizontal) and arm (vertical)
        this.cameraPivot.rotation.y = yaw;
        this.cameraArm.rotation.x = pitch;
        
        // Set camera arm position - behind and to the side of player
        const targetDistance = this.localPlayer.isCrouching ? distance * 0.8 : distance;
        
        this.cameraArm.position.set(
            horizontalOffset, 
            0, 
            targetDistance
        );
        
        // Set camera orientation based on current yaw and pitch
        this.camera.rotation.set(0, 0, 0);
        this.camera.lookAt(0, 0, -1);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // Update players
        this.players.forEach(player => {
            player.update(deltaTime, this.scene);
        });
        
        // Update projectiles
        this.projectiles.forEach((projectile, id) => {
            projectile.update(deltaTime);
            
            // Check collision with walls/objects
            const raycaster = new THREE.Raycaster();
            const collidableObjects = this.scene.children.filter(obj => 
                obj.userData && obj.userData.isCollidable
            );
            
            raycaster.set(projectile.position, projectile.direction);
            const intersects = raycaster.intersectObjects(collidableObjects, true);
            
            if (intersects.length > 0 && intersects[0].distance < 1) {
                projectile.explode(this.scene);
                this.projectiles.delete(id);
            }
        });
        
        // Update camera
        this.updateCamera();
        
        // Handle input
        if (this.inputHandler) {
            this.inputHandler.update(deltaTime);
        }
        
        // Render
        this.renderer.render(this.scene, this.camera);
        
        // Debug first few frames
        if (this.clock.elapsedTime < 2) {
            console.log('Animating... elapsed time:', this.clock.elapsedTime.toFixed(2));
            console.log('Scene children count:', this.scene.children.length);
            console.log('Players count:', this.players.size);
            console.log('Projectiles count:', this.projectiles.size);
        }
    }
}
