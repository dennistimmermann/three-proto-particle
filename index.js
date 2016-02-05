'use strict'

/**
 * Simple Particle System
 * @author Dennis Timmermann
 *
 * TODO:
 * 	add z-sorting
 *  respect normals
 */

/* require */
var THREE = require( 'three' )

/**
 * p AR ticle system
 */
class Geometry extends THREE.InstancedBufferGeometry {
	constructor( particleCount = 1024, tmpl = new THREE.PlaneBufferGeometry( 1, 1, 1, 1 ) ) {
		super()

		/* setting up the instanced geometry. */

		/* get the meat from the geometry */ // TODO: do something with normals
        var positions, indices, uvs

        if ( tmpl instanceof THREE.BufferGeometry ) {
            positions = tmpl.getAttribute( 'position' ).array
            indices = tmpl.getIndex().array
            uvs = tmpl.getAttribute( 'uv' ).array
        }

		// TODO
		else if ( tmpl instanceof THREE.Geometry ) {
            // positions = new Float32Array(tmpl.vertices)
            // indices = tmpl.getIndex().array
            // uvs = tmpl.getAttribute( 'uv' ).array
        }

		/* setting up custom attributes. You can add your own and use them in the vertex shader ...
		 * these attributes are custom for every particle, so be ressourceful :D
		 * oh yeah ... floats because of WebGL
		 * where particles will be translated to ...  * 3 components ( x, y, z ) */
		var translations = new Float32Array( particleCount * 3 )
		/* wich sprite to use ...  * 2 components ( column, row )
		 * 0..column * row, starting bottom left going to right, growing upwards */
		var sprites = new Float32Array( particleCount )
		/* how big the particle will be ...  * 1 component (size)
		 * 0... */
		var sizes = new Float32Array( particleCount )
		/* how visible the particle will be ...  * 1 component (opacity)
		 * 0..1 */
		var opacities = new Float32Array( particleCount )
		/* what color to color the particle ...  * 1 component (r, g, b)0..1 */
		var colors = new Float32Array( particleCount * 3 )
		/* particle ids ... beacuse WebGL reasons */
		var ids = new Float32Array( particleCount )
		/* particle time of birth ... beacuse WebGL reasons */
		var tobs = new Float32Array( particleCount )
		/* add your own here ... */

		/* typed arrays are initialized with 0, if you want other values, do that here */
		for ( var i = 0, i2 = 0, i3 = 0; i < particleCount; i++, i2 += 2, i3 += 3 ) {
			colors[ i3 + 0 ] = 1.0
			colors[ i3 + 1 ] = 1.0
			colors[ i3 + 2 ] = 1.0

            colors[ i3 + 0 ] = 1.0
			colors[ i3 + 1 ] = 9.0
			colors[ i3 + 2 ] = 1.0

			opacities[ i ] = 1.0

			ids[ i ] = i
			// ...
		}

		/* add attributes to geometry
		 * these attributes are shared for all particles */
		this.setIndex( new THREE.BufferAttribute( indices, 1 ) )
		this.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 , 1 ) )
		this.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 , 1 ) )

		/* custom for every particle */
		this.addAttribute( 'sprite', new THREE.InstancedBufferAttribute( sprites, 1 , 1 ) )
		this.addAttribute( 'size', new THREE.InstancedBufferAttribute( sizes, 1, 1 ) )
		this.addAttribute( 'translate', new THREE.InstancedBufferAttribute( translations, 3, 1 ) )
		this.addAttribute( 'color', new THREE.InstancedBufferAttribute( colors, 3, 1 ) )
		this.addAttribute( 'opacity', new THREE.InstancedBufferAttribute( opacities, 1 , 1 ) )
		this.addAttribute( 'id', new THREE.InstancedBufferAttribute( ids, 1 , 1 ) )
		this.addAttribute( 'tob', new THREE.InstancedBufferAttribute( tobs, 1 , 1 ) )

		this.particleCount = particleCount
	}



	/**
	 * if we use a spritemap, we have to change the uvs
	 *
	 * @param  {number} columns num of columns
	 * @param  {number} rows num of rows
	 * @param  {boolean} prepareGeometry set tro to change geometry (proportions), too
	 */
	prepareSpritemaps( columns, rows, prepareGeometry = false ) {
		/* check if we want to use tiled spritesheets */
		var positions = this.getAttribute( 'position' )
		var uvs = this.getAttribute( 'uv' )

		/* prepare the uvs */
		for ( var i2 = 0; i2 < uvs.array.length; i2 += 2 ) {
			uvs.array[ i2 + 0 ] /= columns
			uvs.array[ i2 + 1 ] /= rows
		}

		if ( prepareGeometry ) {
			/* and the positions */
			for ( var i3 = 0; i3 < positions.array.length; i3 += 3 ) {
				positions.array[ i3 + 0 ] *= ( rows / columns )
			}
		}
		// recalculationg normals will be harder i guess?

		positions.needsUpdate = true
		uvs.needsUpdate = true
	}

	update( dt, stage, time ) {
		this.material.uniforms.time.value = time / 5000

        /* gonna try some physic stuff */
	}
}

/**
 * Particle Mesh, prepares geometry and material
 */
class Mesh extends THREE.Mesh {
   constructor( geometry, material ) {
	   /* set up material */
	   /* defines and uniforms */
	   // material.defines = material.defines || {}
	   if ( material.uniforms.texture ) material.defines.TEXTURE = true

	   if ( material.rows > 1 || material.columns > 1 ) {
		   material.defines.SPRITEMAP = true
		   material.uniforms.spritemap = { type: "v2", value: new THREE.Vector2( material.columns, material.rows ) }

		   geometry.prepareSpritemaps( material.columns, material.rows )
	   }

	   super( geometry, material )
	   this.frustumCulled = false
   }
}

/**
 * physics enabled particle system
 */
class System extends Mesh {
	constructor( geometry, material ) {
		if ( typeof geometry == 'number' ) {
			geometry = new Geometry( geometry )
			material = new BillboardMaterial()
		}
		super( geometry, material )

		// this.geometry = geometry
		// this.material = material

		this.particleCount = geometry.particleCount
		this.iter = 0
		this.speed = 1

		this.material.defines.AGE = true

		this.clock = new THREE.Clock()
		this.clock.start()

		this.velocities = new Float32Array( this.particleCount * 3 ),
		this.accelerations = new Float32Array( this.particleCount * 3 )

		this.attributes = {
			velocity: this.velocities,
			acceleration: this.accelerations
		}

		this.forces = []
		this.emitters = []
	}

	// TODO
	addForce( force ) {
		//
	}

	// TODO
	addEmitter( emitter ) {
		//
	}

	/**
	 * add particles. The only necessary argument is the position.
	 * through otions you can specify the other attributes
	 *
	 * @param {Array | THREE.Vector3} translate the position of the particle
	 * @param {Object} options options array containing settings for attributes
	 */
	addParticle( translate, options = {} ) {
		options.tob = options.tob || this.clock.getElapsedTime()
		this.setParticle( this.iter, translate, options )
		this.iter = ( this.iter + 1 ) % ( this.particleCount - 1 )
	}

	/**
	 * set position and options of particle NUM
	 *
	 * @param {number} iter index of particle, 0..particleCount
	 * @param {array|THREE.Vector3} translate x y and z components of particle position
	 * @param {Object} options  other attributes of particle
	 */
	setParticle( iter, translate, options = {} ) {
		/* if the position is a Vector, convert it to an array */
		if ( translate.toArray ) translate = translate.toArray()
		options.translate = translate

		/* by default we set size to 1*/
		if ( options.size === undefined ) options.size = 1.0

		/* set all the attributes */
		for ( var prop in options ) {
			// if ( prop === 'velocity' ) this.setOwnAttribute( 'velocities', this.iter, options[ prop ] )
			this.setAttribute( prop, iter, options[ prop ] )

		}
	}

	/**
	 * set single namend attribute at single position. The attribute width will be infered from the amount of arguments supplied
	 *
	 * @param {String} name Attribute name
	 * @param {Integer} iter which particle, 0..particleCount
	 * @param {Number|Array of Numbers} values attribute values
	 */
	setAttribute( name, iter, values ) {
		if ( !( values instanceof Array )) values = [ values ]

		var offset = iter * values.length
		var attribute = this.getAttributeArray( name )

		for ( var i = 0; i < values.length; i++ ) {
			attribute[ offset + i ] = values[ i ]
		}
	}

	/* more low level, use this if you know what you are doing */
	/**
	 * returns the raw typed array for the attribute. Dirty flag will be set for you
	 *
	 * @param {String} name attribute name
	 * @return {typed Array} the raw attribute array
	 */
	getAttributeArray( name ) {
		if ( this.attributes[ name ] ) return this.attributes[ name ]
		var attribute = this.geometry.getAttribute( name )
		attribute.needsUpdate = true
		return attribute.array
	}

	_tickPhysics() {
		var translations = this.getAttributeArray( 'translate' )
		for ( var a = 0; a < this.forces.length; a++ ) {
			for ( var i3 = 0; i3 < this.particleCount * 3; i3 += 3 ) {
				this.forces[ a ].influence( i3, translations, this.velocities, this.accelerations )
			}
		}
	}

	_tickMove() {
		var translations = this.getAttributeArray( 'translate' )
		for ( var i = 0; i < this.particleCount * 3; i++ ) {
			this.velocities[ i ] += this.accelerations[ i ]
			translations[ i ] += this.velocities[ i ]
			this.accelerations[ i ] = 0
		}
	}

	update( dt, stage, time ) {
		this._tickPhysics()
		this._tickMove()
		this.material.uniforms.time.value = this.clock.getElapsedTime()
	}
}

class Force {
	constructor() {
		this.active = true
		this.priority = 0
	}

	influence( iter, positions, velocities, accelerations ) {
		return [ 0, 0, 0 ]
	}
}

class Attractor extends Force {
	constructor( px = 0, py = 0, pz = 0, mass = 100, spread = 1.5, deadzone = 1) {
		super()
		this.x = px
		this.y = py
		this.z = pz

		this.mass = mass / 1000
		this.spread = spread
		this.deadzone = deadzone
	}

	influence( iter, positions, velocities, accelerations ) {
		var dx = this.x - positions[ iter + 0 ]
		var dy = this.y - positions[ iter + 1 ]
		var dz = this.z - positions[ iter + 2 ]

		/* don't ask me why, but in V8 this is faster than omitting the math.max */
		var cdx = Math.max( dx * dx , this.deadzone )
		var cdy = Math.max( dy * dy , this.deadzone )
		var cdz = Math.max( dz * dz , this.deadzone )

		var force = this.mass / Math.pow( cdx + cdy + cdz, this.spread )

		accelerations[ iter + 0 ] += dx * force
		accelerations[ iter + 1 ] += dy * force
		accelerations[ iter + 2 ] += dz * force
	}
}

class Jet extends Force {
	constructor( px = 0, py = 0, pz = 0, mass = 100, spread = 1.5, deadzone = 1, dx, dy, dz) {
		super()
		this.x = px
		this.y = py
		this.z = pz

		this.dx = dx
		this.dy = dy
		this.dz = dz

		this.mass = mass / 1000
		this.spread = spread
		this.deadzone = deadzone
	}

	influence( iter, positions, velocities, accelerations ) {
		var dx = this.x - positions[ iter + 0 ]
		var dy = this.y - positions[ iter + 1 ]
		var dz = this.z - positions[ iter + 2 ]

		/* don't ask me why, but in V8 this is faster than omitting the math.max */
		var cdx = Math.max( dx * dx , this.deadzone )
		var cdy = Math.max( dy * dy , this.deadzone )
		var cdz = Math.max( dz * dz , this.deadzone )

		var force = this.mass / Math.pow( cdx + cdy + cdz, this.spread )

		accelerations[ iter + 0 ] += Math.abs( dx * force ) * this.dx
		accelerations[ iter + 1 ] += Math.abs( dy * force ) * this.dy
		accelerations[ iter + 2 ] += Math.abs( dz * force ) * this.dz
	}
}

class Limit extends Force {
	constructor( vmx = 0.0981, vmy = 0.0981, vmz = 0.0981 ) {
		super()
		this.x = vmx
		this.y = vmy
		this.z = vmz
	}

	influence( iter, positions, velocities, accelerations ) {
		velocities[ iter + 0 ] = Math.max( Math.min( velocities[ iter + 0 ], this.x ), -this.x )
		velocities[ iter + 1 ] = Math.max( Math.min( velocities[ iter + 1 ], this.y ), -this.y )
		velocities[ iter + 2 ] = Math.max( Math.min( velocities[ iter + 2 ], this.z ), -this.z )

		accelerations[ iter + 0 ] = Math.max( Math.min( accelerations[ iter + 0 ], this.x ), -this.x )
		accelerations[ iter + 1 ] = Math.max( Math.min( accelerations[ iter + 1 ], this.y ), -this.y )
		accelerations[ iter + 2 ] = Math.max( Math.min( accelerations[ iter + 2 ], this.z ), -this.z )
	}
}

class Gravity extends Force {
	constructor( ax = 0, ay = -0.0981 / 60, az = 0 ) {
		super()
		this.x = ax
		this.y = ay
		this.z = az
	}

	influence( iter, positions, velocities, accelerations ) {
		accelerations[ iter + 0 ] += this.x
		accelerations[ iter + 1 ] += this.y
		accelerations[ iter + 2 ] += this.z
	}
}

class Friction extends Force {
	constructor( fx = 0.5, fy = 0.5, fz = 0.5 ) {
		super()
		this.x = fx
		this.y = fy
		this.z = fz
	}

	influence( iter, positions, velocities, accelerations ) {
		velocities[ iter + 0 ] *= this.x
		velocities[ iter + 1 ] *= this.y
		velocities[ iter + 2 ] *= this.z
	}
}

class Floor extends Force {
	constructor( y = 0, strength = 0.9 ) {
		super()
		this.y = y
		this.strength = strength
	}

	influence( iter, positions, velocities, accelerations ) {
		if ( positions[ iter + 1 ] <= this.y ) {
			positions[ iter + 1 ] = this.y
			velocities[ iter + 1 ] *= -this.strength
			// accelerations[ iter + 1 ] = 0
		}
	}
}

/**
 * Material for the Particle System
 *
 * @class Material
 */
class BillboardMaterial extends THREE.ShaderMaterial {
	constructor( options ) {
		var columns = 1
		var rows = 1

		/* default options for the material, basically just the shaders */
		var def = {
            uniforms: {
                time: { type: 'f', value: 1.0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        }

		/* custom options can be passed and will be applied to the defaults */
		for ( var prop in options ) {
			/* uniforms will be added */
			if ( prop === 'uniforms' ) {
				for ( var uniform in options.uniforms ) {
					def.uniforms[ uniform ] = options.uniform[ uniform ]
				}
			}
			/* texture is a special case and will be added to uniforms */
			else if ( prop === 'texture' ) {
				def.uniforms.texture = def.uniforms.texture || { type: "t", value: options.texture }
			}

			else if ( prop === 'columns' ) columns = options.columns

			else if ( prop === 'rows' ) rows = options.columns

			/* add the rest */
			else def[ prop ] = options[ prop ]
		}

		super( def )

		this.columns = columns
		this.rows = rows
	}
}

var vertexShader = `
	attribute float size;
	attribute vec3 translate;
	attribute float sprite;
	attribute float opacity;
	attribute vec3 color;
	attribute float id;
	attribute float tob;

	uniform vec2 spritemap;
	uniform float time;

	varying float vOpacity;
	varying vec3 vColor;
	varying vec2 vUv;

	void main() {

		vColor = color;
		vOpacity = opacity;

		#ifdef SPRITEMAP
			vec2 coords = vec2( mod( sprite, spritemap.x ), floor( sprite / spritemap.y ) );
			vUv = uv + vec2(1,1) / spritemap * coords;
		#else
			vUv = uv;
		#endif

		#ifdef AGE
			float age = time - tob;
		#else
			float age = 0;
		#endif

		float radius = 0.05;
		float speed = ( 0.2 + mod(id, 8.0) / 10.0 ) * 5.0;
		float progress = time * speed + id;

		vec3 mtrans = vec3( translate.x + sin( progress ) * radius, translate.y + sin( progress * speed / 5.0 ) * radius, translate.z + cos( progress ) * radius );

		vec4 mvPosition = modelViewMatrix * vec4( translate, 1.0 );
		mvPosition.xyz += position * size; // * ( sin(time + id) + 1.5 );

		gl_Position = projectionMatrix * mvPosition;
	}
`

var fragmentShader = `
	uniform sampler2D texture;
	varying vec2 vUv;
	varying vec3 vColor;
	varying float vOpacity;
	void main() {
		#ifdef TEXTURE
			gl_FragColor = vec4( vColor, vOpacity ) * texture2D( texture, vUv);
		#else
			gl_FragColor = vec4( vColor, vOpacity );
		#endif
	}
`

module.exports = {
	Mesh: Mesh,
	Geometry: Geometry,
	System: System,
	Actors: {
		Gravity: Gravity,
		Attractor: Attractor,
		Jet: Jet,
		Limit: Limit,
		Floor: Floor
	},
	BillboardMaterial: BillboardMaterial,
	fragmentShader: fragmentShader,
	vertexShader: vertexShader
}
