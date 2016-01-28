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

in it's easiest form with 1024 particles

    var particles = new Particle.System()

with a custom number of particles

    var particles = new Particle.System(64)

with material changes, eg a texture

    var particles = new Particle.System(64, new Particles.Material( { 'texture': THREE.ImageUtils.loadTexture( "images/uv.jpg" )} )

use a spritsheet with 4 columns and 2 rows

    var particles = new Particle.System(64, new Particles.Material( { 'texture': THREE.ImageUtils.loadTexture( "images/sprites.jpg" )} , 4, 2)

just using a custom geometry

    var particles = new Particle.System(4096, new Particles.Material() , 1, 1, new THREE.CircleBufferGeometry(1,6))

### Adding / manipulating particles

just setting the position of a particle

    particles.addParticle( new THREE.Vector3( 1, 1, 1 ) )
    particles.addParticle( [1, 1, 1 ] )

setting position and custom attribute

    particles.addParticle( [1, 1, 1 ], { size: 2, opacity: 0.5, color: [ 0.5, 0.5, 1 ], sprite: 2 } )

just setting single attributes (translation and size) of a single particle (particle #45)

    particles.setAttribute( 'translate' , 45, [2, 0, 5] )
    particles.setAttribute( 'size' , 45, 2 )

setting an attribute (translation) for a bunch of particles

```
var translations = particles.getAttributeArray('translation')
var sizes = particles.getAttributeArray('size')

for( var i = 0; i < particles.particleCount; i++ ) {
    /* keep in mind, that different attributes consist of different number of attributes, 
    * e.g. x,y,z for translation and only s for size */
    translations[ i*3 + 0 ] = Math.random() // x
    translations[ i*3 + 1 ] = Math.random() // y
    translations[ i*3 + 2 ] = Math.random() // z

    sizes[ i ] = Math.random()
}
```

### ... more will come soon



