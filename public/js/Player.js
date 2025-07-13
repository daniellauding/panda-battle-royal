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
        
        // Animation state
        this.animationTime = 0;
        this.isMoving = false;
        this.isRunning = false;
        this.walkCycleSpeed = 8; // Walking animation speed
        this.runCycleSpeed = 12; // Running animation speed
    }

    createPlayerMesh() {
        console.log('Creating player mesh for:', this.name, 'character:', this.character, 'isLocal:', this.isLocal);
        return this.createLowPolyPanda();
    }

    createLowPolyPanda() {
        const panda = new THREE.Group();
        const userColor = this.getCharacterColor();
        
        // Panda body (main torso)
        const bodyGeometry = new THREE.CylinderGeometry(0.8, 1.0, 2.5, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: userColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.25;
        body.castShadow = true;
        body.receiveShadow = true;
        panda.add(body);
        
        // Panda head
        const headGeometry = new THREE.SphereGeometry(0.9, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 3.2;
        head.castShadow = true;
        head.receiveShadow = true;
        
        // Panda ears
        const earGeometry = new THREE.SphereGeometry(0.35, 6, 6);
        const earMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.6, 0.4, -0.2);
        rightEar.position.set(0.6, 0.4, -0.2);
        leftEar.castShadow = true;
        rightEar.castShadow = true;
        head.add(leftEar);
        head.add(rightEar);
        
        // Eye patches (black areas around eyes)
        const eyePatchGeometry = new THREE.SphereGeometry(0.25, 6, 6);
        const eyePatchMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const leftEyePatch = new THREE.Mesh(eyePatchGeometry, eyePatchMaterial);
        const rightEyePatch = new THREE.Mesh(eyePatchGeometry, eyePatchMaterial);
        leftEyePatch.position.set(-0.35, 0.1, -0.7);
        rightEyePatch.position.set(0.35, 0.1, -0.7);
        head.add(leftEyePatch);
        head.add(rightEyePatch);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.12, 6, 6);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.35, 0.1, -0.8);
        rightEye.position.set(0.35, 0.1, -0.8);
        head.add(leftEye);
        head.add(rightEye);
        
        // Eye pupils
        const pupilGeometry = new THREE.SphereGeometry(0.06, 6, 6);
        const pupilMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(-0.35, 0.1, -0.85);
        rightPupil.position.set(0.35, 0.1, -0.85);
        head.add(leftPupil);
        head.add(rightPupil);
        
        // Snout
        const snoutGeometry = new THREE.SphereGeometry(0.25, 6, 6);
        const snoutMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
        const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
        snout.position.set(0, -0.2, -0.8);
        snout.scale.set(1, 0.6, 0.8);
        head.add(snout);
        
        // Nose
        const noseGeometry = new THREE.SphereGeometry(0.08, 6, 6);
        const noseMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, -0.2, -1.1);
        head.add(nose);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.25, 0.3, 1.8, 6);
        const armMaterial = new THREE.MeshLambertMaterial({ color: userColor });
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-1.1, 2.0, 0);
        rightArm.position.set(1.1, 2.0, 0);
        leftArm.rotation.z = Math.PI / 6;
        rightArm.rotation.z = -Math.PI / 6;
        leftArm.castShadow = true;
        rightArm.castShadow = true;
        leftArm.name = 'leftArm';
        rightArm.name = 'rightArm';
        panda.add(leftArm);
        panda.add(rightArm);
        
        // Hands (paws)
        const handGeometry = new THREE.SphereGeometry(0.35, 6, 6);
        const handMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.set(-1.4, 1.0, 0);
        rightHand.position.set(1.4, 1.0, 0);
        leftHand.castShadow = true;
        rightHand.castShadow = true;
        panda.add(leftHand);
        panda.add(rightHand);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.3, 0.35, 1.5, 6);
        const legMaterial = new THREE.MeshLambertMaterial({ color: userColor });
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.4, 0.75, 0);
        rightLeg.position.set(0.4, 0.75, 0);
        leftLeg.castShadow = true;
        rightLeg.castShadow = true;
        leftLeg.name = 'leftLeg';
        rightLeg.name = 'rightLeg';
        panda.add(leftLeg);
        panda.add(rightLeg);
        
        // Feet (paws)
        const footGeometry = new THREE.SphereGeometry(0.4, 6, 6);
        const footMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
        const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
        leftFoot.position.set(-0.4, 0.2, 0);
        rightFoot.position.set(0.4, 0.2, 0);
        leftFoot.scale.set(1, 0.7, 1.2);
        rightFoot.scale.set(1, 0.7, 1.2);
        leftFoot.castShadow = true;
        rightFoot.castShadow = true;
        panda.add(leftFoot);
        panda.add(rightFoot);
        
        // Rocket launcher
        const weaponGeometry = new THREE.BoxGeometry(0.3, 0.3, 1.5);
        const weaponMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weapon.position.set(0.8, 2.5, -0.5);
        weapon.name = 'weapon';
        weapon.castShadow = true;
        
        // Weapon handle
        const handleGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.15);
        const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(0, -0.3, 0.3);
        weapon.add(handle);
        
        // Create spine group for upper body IK
        const spine = new THREE.Group();
        spine.add(head);
        spine.add(weapon);
        spine.name = 'spine';
        
        panda.add(spine);
        panda.castShadow = true;
        panda.receiveShadow = true;
        
        return panda;
    }

    getCharacterColor() {
        switch (this.character) {
            case 'red-panda': return 0xff6b47;      // Warm orange-red
            case 'blue-panda': return 0x4a90e2;     // Sky blue
            case 'green-panda': return 0x7ed321;    // Fresh green
            case 'purple-panda': return 0x9013fe;   // Vibrant purple
            case 'pink-panda': return 0xff69b4;     // Hot pink
            case 'orange-panda': return 0xff8c00;   // Dark orange
            case 'yellow-panda': return 0xffd700;   // Gold
            case 'cyan-panda': return 0x00ffff;     // Cyan
            case 'brown-panda': return 0x8b4513;    // Saddle brown
            case 'black-panda': return 0x2c2c2c;    // Dark gray (not pure black)
            default: return 0xffffff;               // White (classic panda)
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
        
        // Update panda animations
        this.updatePandaAnimation(deltaTime);
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
        
        // Update movement state for animations
        const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        this.isMoving = horizontalSpeed > 0.1;
        this.isRunning = horizontalSpeed > 5; // Running threshold
        
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
        playerPos.y += 1.0; // Check from center of player
        
        // Get all collidable objects including trees, bridges, fences
        const collidableObjects = [];
        scene.traverse((child) => {
            if (child.userData && child.userData.isCollidable) {
                collidableObjects.push(child);
            }
            // Include tree trunks and other solid objects
            if (child.isMesh && child.material && !child.name.includes('debug')) {
                // Exclude other players but include map objects
                let isOtherPlayer = false;
                scene.traverse((playerMesh) => {
                    if (playerMesh !== this.mesh && playerMesh.isGroup) {
                        if (child.parent === playerMesh || child === playerMesh) {
                            isOtherPlayer = true;
                        }
                    }
                });
                
                // Include if it's not another player and not this player
                if (!isOtherPlayer && child.parent !== this.mesh && child !== this.mesh) {
                    collidableObjects.push(child);
                }
            }
        });
        
        // Check multiple directions around the player
        const checkDirections = [
            new THREE.Vector3(this.velocity.x, 0, this.velocity.z).normalize(), // Forward
            new THREE.Vector3(this.velocity.x, 0, 0).normalize(), // X direction
            new THREE.Vector3(0, 0, this.velocity.z).normalize()  // Z direction
        ];
        
        let blocked = false;
        
        for (const direction of checkDirections) {
            if (direction.length() === 0) continue;
            
            raycaster.set(playerPos, direction);
            const intersects = raycaster.intersectObjects(collidableObjects, false);
            
            if (intersects.length > 0 && intersects[0].distance < 1.2) {
                // Stop movement in the blocked direction
                if (Math.abs(direction.x) > Math.abs(direction.z)) {
                    this.velocity.x = 0;
                } else {
                    this.velocity.z = 0;
                }
                blocked = true;
                
                console.log('Collision detected with:', intersects[0].object.name || 'unnamed object');
            }
        }
        
        if (blocked) {
            // Push player back slightly from the collision
            const moveDirection = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).normalize();
            const pushBack = moveDirection.clone().multiplyScalar(-0.2);
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
        // Update movement state for animations (same as local player)
        const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        this.isMoving = horizontalSpeed > 0.1;
        this.isRunning = horizontalSpeed > 5; // Running threshold
        
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
    
    updatePandaAnimation(deltaTime) {
        if (!this.isMoving) {
            // Reset to idle pose
            this.resetToIdlePose(deltaTime);
            return;
        }
        
        // Update animation time
        const animSpeed = this.isRunning ? this.runCycleSpeed : this.walkCycleSpeed;
        this.animationTime += deltaTime * animSpeed;
        
        // Get body parts for animation
        const leftArm = this.mesh.getObjectByName('leftArm');
        const rightArm = this.mesh.getObjectByName('rightArm');
        const leftLeg = this.mesh.getObjectByName('leftLeg');
        const rightLeg = this.mesh.getObjectByName('rightLeg');
        
        if (!leftArm || !rightArm || !leftLeg || !rightLeg) return;
        
        // Walking/running animation - arm and leg swinging
        const armSwing = Math.sin(this.animationTime) * 0.3;
        const legSwing = Math.sin(this.animationTime) * 0.2;
        
        // Arms swing opposite to each other
        leftArm.rotation.x = armSwing;
        rightArm.rotation.x = -armSwing;
        
        // Legs swing opposite to each other (and opposite to arms for natural gait)
        leftLeg.rotation.x = -legSwing;
        rightLeg.rotation.x = legSwing;
        
        // Add slight body bobbing when moving
        const bodyBob = Math.abs(Math.sin(this.animationTime * 2)) * 0.05;
        if (this.isRunning) {
            // More pronounced bobbing when running
            this.mesh.position.y = 1 + bodyBob * 2;
        } else {
            // Subtle bobbing when walking
            this.mesh.position.y = 1 + bodyBob;
        }
    }
    
    resetToIdlePose(deltaTime) {
        // Smoothly return to idle positions
        const leftArm = this.mesh.getObjectByName('leftArm');
        const rightArm = this.mesh.getObjectByName('rightArm');
        const leftLeg = this.mesh.getObjectByName('leftLeg');
        const rightLeg = this.mesh.getObjectByName('rightLeg');
        
        if (leftArm && rightArm && leftLeg && rightLeg) {
            const lerpSpeed = 5;
            
            // Reset arm rotations
            leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0, lerpSpeed * deltaTime);
            rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0, lerpSpeed * deltaTime);
            
            // Reset leg rotations
            leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, lerpSpeed * deltaTime);
            rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, lerpSpeed * deltaTime);
            
            // Reset body position
            this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, 1, lerpSpeed * deltaTime);
        }
        
        // Reset animation time when not moving
        this.animationTime = 0;
    }
}

