class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.jumpPressed = false;
        this.lastJumpTime = 0;
        this.lastShootTime = 0;
        this.chatMode = false;
        this.isCurrentlyAiming = false; // Track if player is actively aiming
        this.isFreeLookAiming = false; // Track if player is in free-look aim mode (mouse2)

        window.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        window.addEventListener('keyup', (event) => this.onKeyUp(event), false);
        window.addEventListener('mousedown', (event) => this.onMouseDown(event), false);
        window.addEventListener('mouseup', (event) => this.onMouseUp(event), false);
        window.addEventListener('click', (event) => this.onClick(event), false);
        
        // Prevent context menu on right-click
        window.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        }, false);
    }

    onKeyDown(event) {
        const key = event.key.toLowerCase();
        
        // Handle Enter key for chat
        if (key === 'enter') {
            event.preventDefault();
            this.handleEnterKey();
            return;
        }
        
        // If in chat mode, don't process game keys
        if (this.chatMode) {
            return;
        }
        
        this.keys[key] = true;
        
        // Handle jump on keydown for better responsiveness
        if (key === ' ' && !this.jumpPressed) {
            this.jumpPressed = true;
            this.handleJump();
        }
        
        // Toggle shoulder side with Q key
        if (key === 'q') {
            this.game.cameraConfig.shoulderSide = 
                this.game.cameraConfig.shoulderSide === 'right' ? 'left' : 'right';
            console.log('Shoulder toggled to:', this.game.cameraConfig.shoulderSide);
        }
        
        // Toggle camera mode with V key
        if (key === 'v') {
            this.game.toggleCameraMode();
        }
        
        // Start free-look mode with ALT
        if (key === 'alt') {
            // Store current camera angles when starting free-look
            this.game.freeLookYaw = this.game.cameraYaw;
            this.game.freeLookPitch = this.game.cameraPitch;
            this.game.freeLookStartPlayerRotation = this.game.localPlayer?.mesh?.rotation.y || 0;
            console.log('Free-look mode started');
        }
    }

    onKeyUp(event) {
        const key = event.key.toLowerCase();
        
        // If in chat mode, don't process game keys
        if (this.chatMode) {
            return;
        }
        
        this.keys[key] = false;
        
        // Reset jump when space is released
        if (key === ' ') {
            this.jumpPressed = false;
        }
        
        // End free-look mode with ALT release
        if (key === 'alt') {
            // Reset camera to match player's forward direction
            this.game.cameraYaw = this.game.freeLookStartPlayerRotation || this.game.cameraYaw;
            this.game.cameraPitch = 0; // Reset vertical look
            console.log('Free-look mode ended - camera reset to player direction');
        }
    }

    onMouseDown(event) {
        console.log('Mouse down detected, button:', event.button);
        if (event.button === 0) { // Left mouse button - shoot
            this.isCurrentlyAiming = true;
            this.handleShoot();
            
            // Start aiming animation
            if (this.game.localPlayer) {
                this.game.localPlayer.startAiming();
            }
        } else if (event.button === 2) { // Right mouse button - ADS aim
            this.isFreeLookAiming = true;
            console.log('ADS aiming started');
            
            // Update crosshair to aiming state
            if (this.game.ui) {
                this.game.ui.setCrosshairAiming();
            }
            
            // Store current camera angles when starting aim mode
            this.game.aimStartYaw = this.game.cameraYaw;
            this.game.aimStartPitch = this.game.cameraPitch;
            this.game.aimStartPlayerRotation = this.game.localPlayer?.mesh?.rotation.y || 0;
        }
    }
    
    onMouseUp(event) {
        if (event.button === 0) { // Left mouse button
            this.isCurrentlyAiming = false;
            
            // Stop aiming animation
            if (this.game.localPlayer) {
                this.game.localPlayer.stopAiming();
            }
        } else if (event.button === 2) { // Right mouse button
            this.isFreeLookAiming = false;
            console.log('ADS aiming ended');
            
            // Return crosshair to normal state
            if (this.game.ui) {
                this.game.ui.setCrosshairNormal();
            }
        }
    }

    onClick(event) {
        console.log('Click detected, button:', event.button);
        if (event.button === 0) { // Left mouse button
            this.handleShoot();
        }
    }

    handleShoot() {
        const currentTime = performance.now();
        const shootCooldown = 500; // 500ms between shots
        
        console.log('Attempting to shoot, mouse locked:', this.game.mouseLocked);
        
        if (currentTime - this.lastShootTime < shootCooldown) {
            console.log('Shooting on cooldown');
            return;
        }
        
        if (this.game.mouseLocked && this.game.localPlayer && this.game.localPlayer.alive) {
            console.log('Shooting!');
            this.game.shoot();
            this.lastShootTime = currentTime;
            
            // Update crosshair to show cooldown
            this.game.ui.setCrosshairCooldown();
            setTimeout(() => {
                this.game.ui.setCrosshairReady();
            }, shootCooldown);
        } else {
            console.log('Cannot shoot - mouse not locked or player not ready');
        }
    }

    update(deltaTime) {
        const localPlayer = this.game.localPlayer;

        if (!localPlayer || !localPlayer.alive) return;

        const speedModifier = this.keys['shift'] ? 2 : 1;
        const moveDirection = new THREE.Vector3();
        const playerSpeed = (this.game.config?.playerSpeed || 10) * speedModifier;

        if (this.keys['w']) moveDirection.z -= 1;  // W = Forward (negative Z is forward)
        if (this.keys['s']) moveDirection.z += 1;  // S = Backward
        if (this.keys['a']) moveDirection.x -= 1;  // A = Left
        if (this.keys['d']) moveDirection.x += 1;  // D = Right

        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            
            // Get camera's world direction for movement calculation
            const cameraDirection = new THREE.Vector3();
            this.game.camera.getWorldDirection(cameraDirection);
            
            // Create camera's right vector (for strafing)
            const cameraRight = new THREE.Vector3();
            cameraRight.crossVectors(cameraDirection, this.game.camera.up).normalize();
            
            // Calculate movement in world space based on camera orientation
            const worldMoveDirection = new THREE.Vector3();
            
            // Forward/backward movement (W/S)
            worldMoveDirection.addScaledVector(cameraDirection, -moveDirection.z);
            
            // Left/right movement (A/D) 
            worldMoveDirection.addScaledVector(cameraRight, moveDirection.x);
            
            // Flatten to horizontal plane
            worldMoveDirection.y = 0;
            worldMoveDirection.normalize();

            localPlayer.velocity.x = worldMoveDirection.x * playerSpeed;
            localPlayer.velocity.z = worldMoveDirection.z * playerSpeed;
        }

        // Crouch
        localPlayer.isCrouching = this.keys['control'] || false;
        
        // Broadcast player movement more frequently to ensure sync
        // Send updates when moving, jumping, crouching, or every few frames to maintain sync
        const shouldBroadcast = moveDirection.length() > 0 || 
                               this.keys[' '] || 
                               this.keys['shift'] || 
                               this.keys['control'] ||
                               (performance.now() - (this.lastBroadcast || 0)) > 100; // Every 100ms
        
        if (shouldBroadcast) {
            this.lastBroadcast = performance.now();
            this.game.socket.emit('player-move', {
                position: {
                    x: localPlayer.mesh.position.x,
                    y: localPlayer.mesh.position.y,
                    z: localPlayer.mesh.position.z
                },
                rotation: {
                    x: localPlayer.mesh.rotation.x,
                    y: localPlayer.mesh.rotation.y,
                    z: localPlayer.mesh.rotation.z
                },
                velocity: {
                    x: localPlayer.velocity.x,
                    y: localPlayer.velocity.y,
                    z: localPlayer.velocity.z
                },
                isCrouching: localPlayer.isCrouching,
                alive: localPlayer.alive
            });
        }
    }

    handleJump() {
        const localPlayer = this.game.localPlayer;
        const currentTime = performance.now();
        const timeSinceLastJump = currentTime - this.lastJumpTime;

        if (localPlayer && localPlayer.alive && timeSinceLastJump > 300) {
            localPlayer.jump();
            this.lastJumpTime = currentTime;
        }
    }

    handleEnterKey() {
        if (this.chatMode) {
            // Send chat message
            this.game.ui.sendChatMessage();
            this.exitChatMode();
        } else {
            // Enter chat mode
            this.enterChatMode();
        }
    }

    enterChatMode() {
        this.chatMode = true;
        this.game.ui.showChatInput();
        console.log('Entered chat mode');
    }

    exitChatMode() {
        this.chatMode = false;
        this.game.ui.hideChatInput();
        console.log('Exited chat mode');
    }
    
    isMoving() {
        // Check if any movement keys are pressed
        return this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d'];
    }
    
    isAiming() {
        // Return true when player is actively aiming (holding mouse button or recently shot)
        const timeSinceLastShot = performance.now() - this.lastShootTime;
        return this.isCurrentlyAiming || timeSinceLastShot < 1000; // Consider aiming for 1 second after shot
    }
}
