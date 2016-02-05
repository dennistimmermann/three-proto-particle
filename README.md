# Proto Particle

Proto Particle is a really simple "particle system"
It doesn't include any physics whatsoever, that up to you.
It's basically just a system to efficiently render a ton of particles/geometries in Three JS.
This code may also be a good start to experiment with Three JS BufferGeometries / InstancedBufferGeometries

### Features
- all particles are billboarded
- spritemap support
- use any geometry as particle
- batched updates

### coming soon to a particle near you
- respecting normals
- z-sorting
- examples

## how to particle

### Creating the particle system

    var Particles = require('three-proto-particle')

in it's easiest form with physics and 1024 particles

    var particlesSystem = new Particle.System( 1024 )

just the geometry

    var geometry = new Particle.Geometry( )
    var geometry = new Particle.Geometry( 1024 )
    var geometry = new Particle.Geometry( 1024, new THREE.PlaneBufferGeometry( 1, 1, 1, 1 ) )

just the material

    var material = new Particle.BillboardMaterial( )
    var material = new Particle.BillboardMaterial( { texture: THREE.ImageUtils.loadTexture("images/circle.png") })
    var material = new Particle.BillboardMaterial( { texture: THREE.ImageUtils.loadTexture("images/circle.png"), columns: 2, rows: 2 })

just the mesh without bells and whistles

    var particleMesh = new Particle.Mesh( geometry, material )


### Adding / manipulating particles

just setting the position of a particle

    particleSystem.addParticle( new THREE.Vector3( 1, 1, 1 ) )
    particleSystem.addParticle( [1, 1, 1 ] )

setting position and custom attribute

    particleSystem.addParticle( [1, 1, 1 ], { size: 2, opacity: 0.5, color: [ 0.5, 0.5, 1 ], sprite: 2 } )

just setting single attributes (translation and size) of a single particle (particle #45)

    particleSystem.setAttribute( 'translate' , 45, [2, 0, 5] )
    particleSystem.setAttribute( 'size' , 45, 2 )

setting an attribute (translation) for a bunch of particles

```
var translations = particleSystem.getAttributeArray('translation')
var sizes = particleSystem.getAttributeArray('size')

for( var i = 0; i < particleSystem.particleCount; i++ ) {
    /* keep in mind, that different attributes consist of different number of attributes,
    * e.g. x,y,z for translation and only s for size */
    translations[ i*3 + 0 ] = Math.random() // x
    translations[ i*3 + 1 ] = Math.random() // y
    translations[ i*3 + 2 ] = Math.random() // z

    sizes[ i ] = Math.random()
}
```

### ... more will come soon
