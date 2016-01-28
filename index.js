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
var THREE = require('three')

/**
 * p AR ticle system
 *
 * @class  Particles
 */
class Particles extends THREE.Object3D {
	constructor( num_particles = 1024, material = new Material(), columns = 1, rows = 1, tmpl = new THREE.PlaneBufferGeometry( 1, 1, 1, 1 ) ) {
		super( )

		/* trust me, we dont want more than 65k particles */
		if( num_particles > 0xffff ) {
			throw new Error( 'too many particles' )
		}

		this.num_particles = num_particles
		/* keep track of wich particles we already used */
		this.iter = 0

		/* keept track of wich attributes we have to update for the next frame */
		this.dirty_attributes = new Set()

		/* setting up the instanced geometry. */
		var geometry = new THREE.InstancedBufferGeometry()

		/* get the meat from the geometry */ //TODO: do something with normals
		var positions = new Float32Array(tmpl.getAttribute('position').array)
		var indices = new Uint32Array(tmpl.getIndex().array)
		var uvs = new Float32Array(tmpl.getAttribute('uv').array)

		/* check if we want to use tiled spritesheets */
		if(rows > 1 || columns > 1) {
			/* prepare the uvs */
			for( var i2 = 0; i2 < uvs.length; i2 += 2) {
				uvs[ i2 + 0 ] /= columns
				uvs[ i2 + 1 ] /= rows
			}
			/* and the positions */
			for( var i3 = 0; i3 < positions.length; i3 += 3 ) {
				positions[ i3 + 0 ] *= ( rows / columns )
			}
			// recalculationg normals will be harder i guess?
		}
		/* supply the material to our spritemap */
		material.uniforms.spritemap = { type: "v2", value: new THREE.Vector2(columns, rows) }

		/* setting up custom attributes. You can add your own and use them in the vertex shader ...
		 * these attributes are custom for every particle, so be ressourceful :D
		 * where particles will be translated to ...  * 3 components ( x, y, z ) */
		var translations = new Float32Array( num_particles * 3 )
		/* wich sprite to use ...  * 2 components ( column, row )
		 * 0..column * row, starting bottom left going to right, growing upwards */
		var sprites = new Float32Array( num_particles )
		/* how big the particle will be ...  * 1 component (size)
		 * 0... */
		var sizes = new Float32Array( num_particles )
		/* how visible the particle will be ...  * 1 component (opacity)
		 * 0..1 */
		var opacities = new Float32Array( num_particles )
		/* what color to color the particle ...  * 1 component (r, g, b)0..1 */
		var colors = new Float32Array(num_particles * 3)
		/* add your own here ... */

		/* typed arrays are initialized with 0, if you want other values, do that here */
		for ( var i = 0, i2 = 0, i3 = 0; i < num_particles; i++, i2 += 2, i3 += 3 ) {
			colors[ i3 + 0 ] = 1.0
			colors[ i3 + 1 ] = 1.0
			colors[ i3 + 2 ] = 1.0

			opacities[ i ] = 1.0
			//...
		}

		/* add attributes to geometry
		 * these attributes are shared for all particles */
		geometry.setIndex( new THREE.BufferAttribute( indices, 1 )  )
		geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ,1 ) )
		geometry.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 , 1) )

		/* custom for every particle */
		geometry.addAttribute( 'sprite', new THREE.InstancedBufferAttribute( sprites, 1 ,1 ) )
		geometry.addAttribute( 'size', new THREE.InstancedBufferAttribute( sizes, 1, 1) )
		geometry.addAttribute( 'translate', new THREE.InstancedBufferAttribute( translations, 3, 1 ) )
		geometry.addAttribute( 'color', new THREE.InstancedBufferAttribute( colors, 3, 1 ) )
		geometry.addAttribute( 'opacity', new THREE.InstancedBufferAttribute( opacities, 1 ,1 ) )

		/* create mesh and add it */
		this.mesh = new THREE.Mesh(geometry, material)
		this.add(this.mesh)

		/* calculating a bounding box can be quite expensive so we just render the particles no matter what */
		this.frustumCulled = false
		this.mesh.frustumCulled = false

		/* sorting stuff */ // ... will fix
		// this.sort = {
		// 	distance_array: new Float32Array(num_particles)
		// }
	}

	/**
	 * add particles. The only necessary argument is the position.
	 * through otions you can specify the other attributes
	 *
	 * @param {Array | THREE.Vector3} translate the position of the particle
	 * @param {Object} options options array containing settings for attributes
	 */
	addParticle(translate, options = {}) {
		/* if the position is a Vector, convert it to an array */
		if( translate.toArray ) translate = translate.toArray()
		options.translate = translate

		/* by default we set size to 1*/
		if( options.size == undefined ) options.size = 1.0

		/* set all the attributes */
		for( var prop in options ) {
			this.setAttribute(prop, this.iter, options[prop])

		}

		this.iter = ( this.iter+1 ) % this.num_particles
	}

	/* more low level, use this if you know what you are doing */
	/**
	 * returns the raw typed array for the attribute. Dirty flag will be set for you
	 *
	 * @param {String} name attribute name
	 * @return {typed Array} the raw attribute array
	 */
	getAttributeArray(name) {
		var attribute = this.mesh.geometry.getAttribute(name)
		attribute.needsUpdate = true
		return attribute.array
	}

	/**
	 * set single namend attribute at single position. The attribute width will be infered from the amount of arguments supplied
	 *
	 * @param {String} name Attribute name
	 * @param {Integer} iter which particle, 0..num_particles
	 * @param {Number|Array of Numbers} values attribute values
	 */
	setAttribute(name, iter, values) {
		if(!(values instanceof Array)) values = [values]

		var attribute = this.mesh.geometry.getAttribute(name)
		var offset = iter * values.length

		for( var i = 0; i < values.length; i ++ ) {
			attribute.array[ offset + i ] = values[i]
		}

		attribute.needsUpdate = true
	}
}

/**
 * Material for the Particle System
 *
 * @class Material
 */
class Material extends THREE.ShaderMaterial {
	constructor(options) {

		/* default options for the material, basically just the shaders */
		var def = {
			uniforms: {
				texture:   { type: "t", value: undefined },
			},
			vertexShader:   vertexShader,
			fragmentShader: fragmentShader,
		}

		/* custom options can be passed and will be applied to the defaults */
		for( var prop in options ) {
			/* uniforms will be added */
			if( prop == 'uniforms' ) {
				for( var uniform in options.uniforms ) {
					def.uniforms[uniform] = options.uniform[uniform]
				}
			}
			/* texture is a special case and will be added to uniforms */
			else if( prop == 'texture' ) {
				def.uniforms[prop].value = options[prop]
			}
			/* add the rest */
			else def[prop] = options[prop]
		}
		super(def)
	}
}

var vertexShader = `
	attribute float size;
	attribute vec3 translate;
	attribute float sprite;
	attribute float opacity;
	attribute vec3 color;

	uniform vec2 spritemap;

	varying float vOpacity;
	varying vec3 vColor;
	varying vec2 vUv;

	void main() {

		vColor = color;
		vOpacity = opacity;

		vec2 coords = vec2( mod( sprite, spritemap.x ), floor( sprite / spritemap.y ) );
		vUv = uv + vec2(1,1) / spritemap * coords;

		vec4 mvPosition = modelViewMatrix * vec4( translate, 1.0 );
		mvPosition.xyz += position * size;

		gl_Position = projectionMatrix * mvPosition;
	}
`

var fragmentShader = `
	uniform sampler2D texture;
	varying vec2 vUv;
	varying vec3 vColor;
	varying float vOpacity;
	void main() {
		gl_FragColor = vec4( vColor, vOpacity ) * texture2D( texture, vUv);
	}
`

module.exports = {
	System: Particles,
	Material: Material,
	fragmentShader: fragmentShader,
	vertexShader: vertexShader
}
