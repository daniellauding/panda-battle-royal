class Projectile {
    constructor(id, position, direction) {
        this.id = id;
        this.position = new THREE.Vector3().copy(position);
        this.direction = new THREE.Vector3().copy(direction).normalize();
        this.speed = 150; // Super fast rockets
        
        // Create MASSIVE rocket-shaped mesh - SUPER visible
        const geometry = new THREE.SphereGeometry(2, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: false
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        
        // Add a MASSIVE bright glowing trail
        const trailGeometry = new THREE.SphereGeometry(3, 16, 16);
        const trailMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.9
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.set(0, 0, 0);
        this.mesh.add(trail);
        
        // Add another layer for extra visibility
        const outerGeometry = new THREE.SphereGeometry(4, 16, 16);
        const outerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4400,
            transparent: true,
            opacity: 0.5,
            wireframe: true
        });
        const outer = new THREE.Mesh(outerGeometry, outerMaterial);
        outer.position.set(0, 0, 0);
        this.mesh.add(outer);
        
        this.mesh.castShadow = true;
        
        console.log('MASSIVE Rocket created at:', position, 'direction:', direction);
        console.log('Rocket mesh:', this.mesh);
    }

    update(deltaTime) {
        // Move projectile in direction
        const velocity = this.direction.clone().multiplyScalar(this.speed * deltaTime);
        this.position.add(velocity);
        this.mesh.position.copy(this.position);
        
        // Simple rotation towards direction (remove complex lookAt)
        console.log('Projectile moving from:', this.mesh.position.x.toFixed(2), this.mesh.position.y.toFixed(2), this.mesh.position.z.toFixed(2));
    }

    explode(scene) {
        console.log('Rocket exploded at:', this.position);
        
        // Create explosion effect
        const explosionGeometry = new THREE.SphereGeometry(3, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00,
            transparent: true,
            opacity: 0.7
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.position);
        scene.add(explosion);
        
        // Remove explosion after short time
        setTimeout(() => {
            scene.remove(explosion);
        }, 200);
        
        // Remove rocket
        scene.remove(this.mesh);
    }
}
