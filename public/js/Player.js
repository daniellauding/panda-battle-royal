class Player {
    constructor(id, name, character, isLocal) {
        this.id = id;
        this.name = name;
        this.character = character;
        this.isLocal = isLocal;
        this.health = 100;
        this.alive = true;
        this.kills = 0;
        this.deaths = 0;
        this.damageDealt = 0;
        this.isCrouching = false;
        this.isOnGround = true;
        
        // 3D Model
        this.mesh = this.createPlayerMesh();
        this.mesh.position.set(0, 1, 0);
        this.mesh.rotation.y = 0; // Face forward (negative Z direction)
        
        // Movement state
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.rotationSpeed = new THREE.Vector2();
        
        // Upper body IK for pitch visualization
        this.spineRotation = 0; // Current spine pitch rotation
        this.targetSpineRotation = 0; // Target spine pitch rotation
        
        // Weapon animation state
        this.weaponSwayTime = 0;
        this.weaponAnimating = false;
    }

    createPlayerMesh() {
        console.log('Creating player mesh for:', this.name, 'character:', this.character, 'isLocal:', this.isLocal);
        const geoBody = new THREE.BoxGeometry(2, 3, 1.2); // Bigger and more visible
        const geoHead = new THREE.SphereGeometry(0.8, 8, 8);
        const matBody = new THREE.MeshLambertMaterial({ color: this.getCharacterColor() });
        const matHead = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const body = new THREE.Mesh(geoBody, matBody);
        const head = new THREE.Mesh(geoHead, matHead);
        head.position.y = 2.4;
        
        // Smiley face (shows front direction clearly)
        const geoFace = new THREE.BoxGeometry(0.6, 0.6, 0.1);
        const matFace = new THREE.MeshLambertMaterial({ color: 0xffff00 }); // Yellow smiley
        const face = new THREE.Mesh(geoFace, matFace);
        face.position.set(0, 0.3, -0.4); // Front of body (negative Z is forward)
        
        // Eyes
        const geoEye = new THREE.SphereGeometry(0.05, 8, 8);
        const matEye = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(geoEye, matEye);
        const rightEye = new THREE.Mesh(geoEye, matEye);
        leftEye.position.set(-0.15, 0.1, -0.01);
        rightEye.position.set(0.15, 0.1, -0.01);
        face.add(leftEye);
        face.add(rightEye);
        
        // Mouth
        const geoMouth = new THREE.TorusGeometry(0.15, 0.03, 4, 8, Math.PI);
        const matMouth = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const mouth = new THREE.Mesh(geoMouth, matMouth);
        mouth.position.set(0, -0.1, -0.01);
        mouth.rotation.z = Math.PI;
        face.add(mouth);
        
        // Rocket launcher
        const geoWeapon = new THREE.BoxGeometry(0.3, 0.3, 1.5);
        const matWeapon = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const weapon = new THREE.Mesh(geoWeapon, matWeapon);
        weapon.position.set(0.8, 0.5, -0.5); // Right side, pointing forward
        weapon.name = 'weapon'; // Name for animation reference
        
        // Weapon handle
        const geoHandle = new THREE.BoxGeometry(0.15, 0.4, 0.15);
        const matHandle = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown
        const handle = new THREE.Mesh(geoHandle, matHandle);
        handle.position.set(0, -0.3, 0.3);
        weapon.add(handle);

        // Create spine group for upper body IK
        const spine = new THREE.Group();
        spine.add(head);
        spine.add(face);
        spine.add(weapon);
        spine.name = 'spine';
        
        const mesh = new THREE.Group();
        mesh.add(body);
        mesh.add(spine);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    getCharacterColor() {
        switch (this.character) {
            case 'red-panda': return 0xff5555;
            case 'blue-panda': return 0x5555ff;
            case 'green-panda': return 0x55ff55;
            case 'purple-panda': return 0xaa00ff;
            default: return 0xffffff;
        }
    }

    updateFromServer(data) {
        if (!this.isLocal) {
            console.log('Updating remote player:', this.name, 'position:', data.position);
            
            // Update position
            if (data.position) {
                this.mesh.position.set(data.position.x, data.position.y, data.position.z);
            }
            
            // Update rotation
            if (data.rotation) {
                this.mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
            }
            
            // Update velocity for smooth interpolation
            if (data.velocity) {
                this.velocity.set(data.velocity.x, data.velocity.y, data.velocity.z);
            }
            
            // Update other states
            if (data.isCrouching !== undefined) {
                this.isCrouching = data.isCrouching;
            }
        }
        
        // Update health and stats for all players
        if (data.health !== undefined) this.health = data.health;
        if (data.alive !== undefined) this.alive = data.alive;
        if (data.kills !== undefined) this.kills = data.kills;
        if (data.deaths !== undefined) this.deaths = data.deaths;
        if (data.damage !== undefined) this.damageDealt = data.damage;
    }

    update(deltaTime, scene) {
        if (this.isLocal) {
            this.handleCollisions(scene);
            this.updateMovement(deltaTime);
        } else {
            // For remote players, apply basic movement updates for smooth interpolation
            this.updateRemotePlayer(deltaTime);
        }
        
        // Update spine IK for visual pitch matching
        this.updateSpineIK(deltaTime);
        
        // Update weapon animations
        this.updateWeaponAnimation(deltaTime);
    }

    updateMovement(deltaTime) {
        // Check if on ground
        this.isOnGround = this.mesh.position.y <= 1.1;
        
        // Apply gravity
        if (this.mesh.position.y > 1) {
            this.velocity.y -= 20 * deltaTime; // Faster gravity
        } else {
            this.mesh.position.y = 1;
            if (this.velocity.y < 0) {
                this.velocity.y = 0;
            }
        }
        
        // Apply velocity
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Damping for horizontal movement (less damping for bunny hopping)
        const dampingFactor = this.isOnGround ? 0.85 : 0.98;
        this.velocity.x *= dampingFactor;
        this.velocity.z *= dampingFactor;

        // Update crouch state
        if (this.isCrouching) {
            this.mesh.scale.y = 0.5;
            if (this.isOnGround) {
                this.mesh.position.y = 0.5;
            }
        } else {
            this.mesh.scale.y = 1;
            if (this.mesh.position.y < 1) {
                this.mesh.position.y = 1;
            }
        }
    }
    
    jump() {
        if (this.isOnGround) { // Only jump if on ground
            let jumpForce = 8;
            
            // Bunny hop: increase jump force based on horizontal velocity
            const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
            if (horizontalSpeed > 3) {
                jumpForce = 8 + (horizontalSpeed * 0.3); // Bonus jump height for speed
            }
            
            this.velocity.y = jumpForce;
            console.log('Jump! Force:', jumpForce, 'Horizontal speed:', horizontalSpeed.toFixed(2));
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    handleCollisions(scene) {
        if (!this.velocity || (this.velocity.x === 0 && this.velocity.z === 0)) return;
        
        const raycaster = new THREE.Raycaster();
        const playerPos = this.mesh.position.clone();
        playerPos.y += 0.5; // Check from center of player
        
        // Filter only collidable objects
        const collidableObjects = scene.children.filter(obj => 
            obj.userData && obj.userData.isCollidable
        );
        
        // Check movement direction
        const moveDirection = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).normalize();
        
        raycaster.set(playerPos, moveDirection);
        const intersects = raycaster.intersectObjects(collidableObjects, true);
        
        if (intersects.length > 0 && intersects[0].distance < 1.0) {
            // Stop movement in collision direction
            this.velocity.x = 0;
            this.velocity.z = 0;
            
            // Push player back slightly
            const pushBack = moveDirection.clone().multiplyScalar(-0.1);
            this.mesh.position.add(pushBack);
        }
    }

    die() {
        this.alive = false;
        this.deaths += 1;
    }

    respawn() {
        this.health = 100;
        this.alive = true;
        this.mesh.position.set(0, 1, 0);
    }
    
    updateSpineIK(deltaTime) {
        // Smoothly interpolate spine rotation to target
        const lerpSpeed = 8; // How fast the spine follows camera pitch
        this.spineRotation = THREE.MathUtils.lerp(
            this.spineRotation, 
            this.targetSpineRotation, 
            lerpSpeed * deltaTime
        );
        
        // Apply rotation to spine group
        const spine = this.mesh.getObjectByName('spine');
        if (spine) {
            spine.rotation.x = this.spineRotation;
        }
    }
    
    setAimPitch(pitch) {
        // Set target spine rotation based on camera pitch
        // Limit spine rotation to prevent unnatural poses
        const maxSpinePitch = Math.PI / 6; // 30 degrees
        this.targetSpineRotation = Math.max(
            -maxSpinePitch, 
            Math.min(maxSpinePitch, pitch * 0.5) // Half of camera pitch
        );
    }
    
    updateRemotePlayer(deltaTime) {
        // Update crouch state
        if (this.isCrouching) {
            this.mesh.scale.y = 0.5;
            if (this.mesh.position.y > 0.5) {
                this.mesh.position.y = Math.max(0.5, this.mesh.position.y - deltaTime * 5);
            }
        } else {
            this.mesh.scale.y = 1;
            if (this.mesh.position.y < 1) {
                this.mesh.position.y = Math.min(1, this.mesh.position.y + deltaTime * 5);
            }
        }
        
        // Ensure player is visible
        this.mesh.visible = this.alive;
    }
    
    updateWeaponAnimation(deltaTime) {
        const weapon = this.mesh.getObjectByName('weapon');
        if (!weapon) return;
        
        // Check if player is moving (for local player only)
        const isMoving = this.isLocal && 
            (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1);
        
        if (isMoving) {
            // Weapon sway animation while moving
            this.weaponSwayTime += deltaTime * 8; // Animation speed
            
            // Simple weapon sway pattern
            const swayX = Math.sin(this.weaponSwayTime) * 0.02;
            const swayY = Math.abs(Math.sin(this.weaponSwayTime * 2)) * 0.01;
            const swayZ = Math.cos(this.weaponSwayTime * 1.5) * 0.01;
            
            // Apply sway to weapon position
            weapon.position.x = 0.8 + swayX;
            weapon.position.y = 0.5 + swayY;
            weapon.position.z = -0.5 + swayZ;
            
            // Slight rotation sway
            weapon.rotation.z = swayX * 0.5;
        } else {
            // Return weapon to rest position
            const lerpSpeed = 5;
            weapon.position.x = THREE.MathUtils.lerp(weapon.position.x, 0.8, lerpSpeed * deltaTime);
            weapon.position.y = THREE.MathUtils.lerp(weapon.position.y, 0.5, lerpSpeed * deltaTime);
            weapon.position.z = THREE.MathUtils.lerp(weapon.position.z, -0.5, lerpSpeed * deltaTime);
            weapon.rotation.z = THREE.MathUtils.lerp(weapon.rotation.z, 0, lerpSpeed * deltaTime);
            
            // Reset sway time when not moving
            this.weaponSwayTime = 0;
        }
    }
    
    startAiming() {
        // Simple aiming animation - bring weapon closer to center
        const weapon = this.mesh.getObjectByName('weapon');
        if (weapon) {
            this.weaponAnimating = true;
            // Could add tween.js here for smooth animation
        }
    }
    
    stopAiming() {
        // Return weapon to normal position
        const weapon = this.mesh.getObjectByName('weapon');
        if (weapon) {
            this.weaponAnimating = false;
            // Could add tween.js here for smooth animation
        }
    }
}

