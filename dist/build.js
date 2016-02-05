'use strict';

/**
 * Simple Particle System
 * @author Dennis Timmermann
 *
 * TODO:
 * 	add z-sorting
 *  respect normals
 */

/* require */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var THREE = require('three');

/**
 * p AR ticle system
 */

var Geometry = function (_THREE$InstancedBuffe) {
	_inherits(Geometry, _THREE$InstancedBuffe);

	function Geometry() {
		var particleCount = arguments.length <= 0 || arguments[0] === undefined ? 1024 : arguments[0];
		var tmpl = arguments.length <= 1 || arguments[1] === undefined ? new THREE.PlaneBufferGeometry(1, 1, 1, 1) : arguments[1];

		_classCallCheck(this, Geometry);

		/* setting up the instanced geometry. */

		/* get the meat from the geometry */ // TODO: do something with normals

		var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Geometry).call(this));

		var positions, indices, uvs;

		if (tmpl instanceof THREE.BufferGeometry) {
			positions = tmpl.getAttribute('position').array;
			indices = tmpl.getIndex().array;
			uvs = tmpl.getAttribute('uv').array;
		}

		// TODO
		else if (tmpl instanceof THREE.Geometry) {}
			// positions = new Float32Array(tmpl.vertices)
			// indices = tmpl.getIndex().array
			// uvs = tmpl.getAttribute( 'uv' ).array

			/* setting up custom attributes. You can add your own and use them in the vertex shader ...
    * these attributes are custom for every particle, so be ressourceful :D
    * oh yeah ... floats because of WebGL
    * where particles will be translated to ...  * 3 components ( x, y, z ) */
		var translations = new Float32Array(particleCount * 3);
		/* wich sprite to use ...  * 2 components ( column, row )
   * 0..column * row, starting bottom left going to right, growing upwards */
		var sprites = new Float32Array(particleCount);
		/* how big the particle will be ...  * 1 component (size)
   * 0... */
		var sizes = new Float32Array(particleCount);
		/* how visible the particle will be ...  * 1 component (opacity)
   * 0..1 */
		var opacities = new Float32Array(particleCount);
		/* what color to color the particle ...  * 1 component (r, g, b)0..1 */
		var colors = new Float32Array(particleCount * 3);
		/* particle ids ... beacuse WebGL reasons */
		var ids = new Float32Array(particleCount);
		/* particle time of birth ... beacuse WebGL reasons */
		var tobs = new Float32Array(particleCount);
		/* add your own here ... */

		/* typed arrays are initialized with 0, if you want other values, do that here */
		for (var i = 0, i2 = 0, i3 = 0; i < particleCount; i++, i2 += 2, i3 += 3) {
			colors[i3 + 0] = 1.0;
			colors[i3 + 1] = 1.0;
			colors[i3 + 2] = 1.0;

			colors[i3 + 0] = 1.0;
			colors[i3 + 1] = 9.0;
			colors[i3 + 2] = 1.0;

			opacities[i] = 1.0;

			ids[i] = i;
			// ...
		}

		/* add attributes to geometry
   * these attributes are shared for all particles */
		_this.setIndex(new THREE.BufferAttribute(indices, 1));
		_this.addAttribute('position', new THREE.BufferAttribute(positions, 3, 1));
		_this.addAttribute('uv', new THREE.BufferAttribute(uvs, 2, 1));

		/* custom for every particle */
		_this.addAttribute('sprite', new THREE.InstancedBufferAttribute(sprites, 1, 1));
		_this.addAttribute('size', new THREE.InstancedBufferAttribute(sizes, 1, 1));
		_this.addAttribute('translate', new THREE.InstancedBufferAttribute(translations, 3, 1));
		_this.addAttribute('color', new THREE.InstancedBufferAttribute(colors, 3, 1));
		_this.addAttribute('opacity', new THREE.InstancedBufferAttribute(opacities, 1, 1));
		_this.addAttribute('id', new THREE.InstancedBufferAttribute(ids, 1, 1));
		_this.addAttribute('tob', new THREE.InstancedBufferAttribute(tobs, 1, 1));

		_this.particleCount = particleCount;
		return _this;
	}

	/**
  * if we use a spritemap, we have to change the uvs
  *
  * @param  {number} columns num of columns
  * @param  {number} rows num of rows
  * @param  {boolean} prepareGeometry set tro to change geometry (proportions), too
  */

	_createClass(Geometry, [{
		key: 'prepareSpritemaps',
		value: function prepareSpritemaps(columns, rows) {
			var prepareGeometry = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

			/* check if we want to use tiled spritesheets */
			var positions = this.getAttribute('position');
			var uvs = this.getAttribute('uv');

			/* prepare the uvs */
			for (var i2 = 0; i2 < uvs.array.length; i2 += 2) {
				uvs.array[i2 + 0] /= columns;
				uvs.array[i2 + 1] /= rows;
			}

			if (prepareGeometry) {
				/* and the positions */
				for (var i3 = 0; i3 < positions.array.length; i3 += 3) {
					positions.array[i3 + 0] *= rows / columns;
				}
			}
			// recalculationg normals will be harder i guess?

			positions.needsUpdate = true;
			uvs.needsUpdate = true;
		}
	}, {
		key: 'update',
		value: function update(dt, stage, time) {
			this.material.uniforms.time.value = time / 5000;

			/* gonna try some physic stuff */
		}
	}]);

	return Geometry;
}(THREE.InstancedBufferGeometry);

/**
 * Particle Mesh, prepares geometry and material
 */

var Mesh = function (_THREE$Mesh) {
	_inherits(Mesh, _THREE$Mesh);

	function Mesh(geometry, material) {
		_classCallCheck(this, Mesh);

		/* set up material */
		/* defines and uniforms */
		// material.defines = material.defines || {}
		if (material.uniforms.texture) material.defines.TEXTURE = true;

		if (material.rows > 1 || material.columns > 1) {
			material.defines.SPRITEMAP = true;
			material.uniforms.spritemap = { type: "v2", value: new THREE.Vector2(material.columns, material.rows) };

			geometry.prepareSpritemaps(material.columns, material.rows);
		}

		var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(Mesh).call(this, geometry, material));

		_this2.frustumCulled = false;
		return _this2;
	}

	return Mesh;
}(THREE.Mesh);

/**
 * physics enabled particle system
 */

var System = function (_Mesh) {
	_inherits(System, _Mesh);

	function System(geometry, material) {
		_classCallCheck(this, System);

		if (typeof geometry == 'number') {
			geometry = new Geometry(geometry);
			material = new BillboardMaterial();
		}

		// this.geometry = geometry
		// this.material = material

		var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(System).call(this, geometry, material));

		_this3.particleCount = geometry.particleCount;
		_this3.iter = 0;
		_this3.speed = 1;

		_this3.material.defines.AGE = true;

		_this3.clock = new THREE.Clock();
		_this3.clock.start();

		_this3.velocities = new Float32Array(_this3.particleCount * 3), _this3.accelerations = new Float32Array(_this3.particleCount * 3);

		_this3.attributes = {
			velocity: _this3.velocities,
			acceleration: _this3.accelerations
		};

		_this3.forces = [];
		_this3.emitters = [];
		return _this3;
	}

	// TODO

	_createClass(System, [{
		key: 'addForce',
		value: function addForce(force) {}
		//

		// TODO

	}, {
		key: 'addEmitter',
		value: function addEmitter(emitter) {}
		//

		/**
   * add particles. The only necessary argument is the position.
   * through otions you can specify the other attributes
   *
   * @param {Array | THREE.Vector3} translate the position of the particle
   * @param {Object} options options array containing settings for attributes
   */

	}, {
		key: 'addParticle',
		value: function addParticle(translate) {
			var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			options.tob = options.tob || this.clock.getElapsedTime();
			this.setParticle(this.iter, translate, options);
			this.iter = (this.iter + 1) % (this.particleCount - 1);
		}

		/**
   * set position and options of particle NUM
   *
   * @param {number} iter index of particle, 0..particleCount
   * @param {array|THREE.Vector3} translate x y and z components of particle position
   * @param {Object} options  other attributes of particle
   */

	}, {
		key: 'setParticle',
		value: function setParticle(iter, translate) {
			var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

			/* if the position is a Vector, convert it to an array */
			if (translate.toArray) translate = translate.toArray();
			options.translate = translate;

			/* by default we set size to 1*/
			if (options.size === undefined) options.size = 1.0;

			/* set all the attributes */
			for (var prop in options) {
				// if ( prop === 'velocity' ) this.setOwnAttribute( 'velocities', this.iter, options[ prop ] )
				this.setAttribute(prop, iter, options[prop]);
			}
		}

		/**
   * set single namend attribute at single position. The attribute width will be infered from the amount of arguments supplied
   *
   * @param {String} name Attribute name
   * @param {Integer} iter which particle, 0..particleCount
   * @param {Number|Array of Numbers} values attribute values
   */

	}, {
		key: 'setAttribute',
		value: function setAttribute(name, iter, values) {
			if (!(values instanceof Array)) values = [values];

			var offset = iter * values.length;
			var attribute = this.getAttributeArray(name);

			for (var i = 0; i < values.length; i++) {
				attribute[offset + i] = values[i];
			}
		}

		/* more low level, use this if you know what you are doing */
		/**
   * returns the raw typed array for the attribute. Dirty flag will be set for you
   *
   * @param {String} name attribute name
   * @return {typed Array} the raw attribute array
   */

	}, {
		key: 'getAttributeArray',
		value: function getAttributeArray(name) {
			if (this.attributes[name]) return this.attributes[name];
			var attribute = this.geometry.getAttribute(name);
			attribute.needsUpdate = true;
			return attribute.array;
		}
	}, {
		key: '_tickPhysics',
		value: function _tickPhysics() {
			var translations = this.getAttributeArray('translate');
			for (var a = 0; a < this.forces.length; a++) {
				for (var i3 = 0; i3 < this.particleCount * 3; i3 += 3) {
					this.forces[a].influence(i3, translations, this.velocities, this.accelerations);
				}
			}
		}
	}, {
		key: '_tickMove',
		value: function _tickMove() {
			var translations = this.getAttributeArray('translate');
			for (var i = 0; i < this.particleCount * 3; i++) {
				this.velocities[i] += this.accelerations[i];
				translations[i] += this.velocities[i];
				this.accelerations[i] = 0;
			}
		}
	}, {
		key: 'update',
		value: function update(dt, stage, time) {
			this._tickPhysics();
			this._tickMove();
			this.material.uniforms.time.value = this.clock.getElapsedTime();
		}
	}]);

	return System;
}(Mesh);

var Force = function () {
	function Force() {
		_classCallCheck(this, Force);

		this.active = true;
		this.priority = 0;
	}

	_createClass(Force, [{
		key: 'influence',
		value: function influence(iter, positions, velocities, accelerations) {
			return [0, 0, 0];
		}
	}]);

	return Force;
}();

var Attractor = function (_Force) {
	_inherits(Attractor, _Force);

	function Attractor() {
		var px = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
		var py = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
		var pz = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
		var mass = arguments.length <= 3 || arguments[3] === undefined ? 100 : arguments[3];
		var spread = arguments.length <= 4 || arguments[4] === undefined ? 1.5 : arguments[4];
		var deadzone = arguments.length <= 5 || arguments[5] === undefined ? 1 : arguments[5];

		_classCallCheck(this, Attractor);

		var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(Attractor).call(this));

		_this4.x = px;
		_this4.y = py;
		_this4.z = pz;

		_this4.mass = mass / 1000;
		_this4.spread = spread;
		_this4.deadzone = deadzone;
		return _this4;
	}

	_createClass(Attractor, [{
		key: 'influence',
		value: function influence(iter, positions, velocities, accelerations) {
			var dx = this.x - positions[iter + 0];
			var dy = this.y - positions[iter + 1];
			var dz = this.z - positions[iter + 2];

			/* don't ask me why, but in V8 this is faster than omitting the math.max */
			var cdx = Math.max(dx * dx, this.deadzone);
			var cdy = Math.max(dy * dy, this.deadzone);
			var cdz = Math.max(dz * dz, this.deadzone);

			var force = this.mass / Math.pow(cdx + cdy + cdz, this.spread);

			accelerations[iter + 0] += dx * force;
			accelerations[iter + 1] += dy * force;
			accelerations[iter + 2] += dz * force;
		}
	}]);

	return Attractor;
}(Force);

var Jet = function (_Force2) {
	_inherits(Jet, _Force2);

	function Jet() {
		var px = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
		var py = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
		var pz = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
		var mass = arguments.length <= 3 || arguments[3] === undefined ? 100 : arguments[3];
		var spread = arguments.length <= 4 || arguments[4] === undefined ? 1.5 : arguments[4];
		var deadzone = arguments.length <= 5 || arguments[5] === undefined ? 1 : arguments[5];
		var dx = arguments[6];
		var dy = arguments[7];
		var dz = arguments[8];

		_classCallCheck(this, Jet);

		var _this5 = _possibleConstructorReturn(this, Object.getPrototypeOf(Jet).call(this));

		_this5.x = px;
		_this5.y = py;
		_this5.z = pz;

		_this5.dx = dx;
		_this5.dy = dy;
		_this5.dz = dz;

		_this5.mass = mass / 1000;
		_this5.spread = spread;
		_this5.deadzone = deadzone;
		return _this5;
	}

	_createClass(Jet, [{
		key: 'influence',
		value: function influence(iter, positions, velocities, accelerations) {
			var dx = this.x - positions[iter + 0];
			var dy = this.y - positions[iter + 1];
			var dz = this.z - positions[iter + 2];

			/* don't ask me why, but in V8 this is faster than omitting the math.max */
			var cdx = Math.max(dx * dx, this.deadzone);
			var cdy = Math.max(dy * dy, this.deadzone);
			var cdz = Math.max(dz * dz, this.deadzone);

			var force = this.mass / Math.pow(cdx + cdy + cdz, this.spread);

			accelerations[iter + 0] += Math.abs(dx * force) * this.dx;
			accelerations[iter + 1] += Math.abs(dy * force) * this.dy;
			accelerations[iter + 2] += Math.abs(dz * force) * this.dz;
		}
	}]);

	return Jet;
}(Force);

var Limit = function (_Force3) {
	_inherits(Limit, _Force3);

	function Limit() {
		var vmx = arguments.length <= 0 || arguments[0] === undefined ? 0.0981 : arguments[0];
		var vmy = arguments.length <= 1 || arguments[1] === undefined ? 0.0981 : arguments[1];
		var vmz = arguments.length <= 2 || arguments[2] === undefined ? 0.0981 : arguments[2];

		_classCallCheck(this, Limit);

		var _this6 = _possibleConstructorReturn(this, Object.getPrototypeOf(Limit).call(this));

		_this6.x = vmx;
		_this6.y = vmy;
		_this6.z = vmz;
		return _this6;
	}

	_createClass(Limit, [{
		key: 'influence',
		value: function influence(iter, positions, velocities, accelerations) {
			velocities[iter + 0] = Math.max(Math.min(velocities[iter + 0], this.x), -this.x);
			velocities[iter + 1] = Math.max(Math.min(velocities[iter + 1], this.y), -this.y);
			velocities[iter + 2] = Math.max(Math.min(velocities[iter + 2], this.z), -this.z);

			accelerations[iter + 0] = Math.max(Math.min(accelerations[iter + 0], this.x), -this.x);
			accelerations[iter + 1] = Math.max(Math.min(accelerations[iter + 1], this.y), -this.y);
			accelerations[iter + 2] = Math.max(Math.min(accelerations[iter + 2], this.z), -this.z);
		}
	}]);

	return Limit;
}(Force);

var Gravity = function (_Force4) {
	_inherits(Gravity, _Force4);

	function Gravity() {
		var ax = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
		var ay = arguments.length <= 1 || arguments[1] === undefined ? -0.0981 / 60 : arguments[1];
		var az = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

		_classCallCheck(this, Gravity);

		var _this7 = _possibleConstructorReturn(this, Object.getPrototypeOf(Gravity).call(this));

		_this7.x = ax;
		_this7.y = ay;
		_this7.z = az;
		return _this7;
	}

	_createClass(Gravity, [{
		key: 'influence',
		value: function influence(iter, positions, velocities, accelerations) {
			accelerations[iter + 0] += this.x;
			accelerations[iter + 1] += this.y;
			accelerations[iter + 2] += this.z;
		}
	}]);

	return Gravity;
}(Force);

var Friction = function (_Force5) {
	_inherits(Friction, _Force5);

	function Friction() {
		var fx = arguments.length <= 0 || arguments[0] === undefined ? 0.5 : arguments[0];
		var fy = arguments.length <= 1 || arguments[1] === undefined ? 0.5 : arguments[1];
		var fz = arguments.length <= 2 || arguments[2] === undefined ? 0.5 : arguments[2];

		_classCallCheck(this, Friction);

		var _this8 = _possibleConstructorReturn(this, Object.getPrototypeOf(Friction).call(this));

		_this8.x = fx;
		_this8.y = fy;
		_this8.z = fz;
		return _this8;
	}

	_createClass(Friction, [{
		key: 'influence',
		value: function influence(iter, positions, velocities, accelerations) {
			velocities[iter + 0] *= this.x;
			velocities[iter + 1] *= this.y;
			velocities[iter + 2] *= this.z;
		}
	}]);

	return Friction;
}(Force);

var Floor = function (_Force6) {
	_inherits(Floor, _Force6);

	function Floor() {
		var y = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
		var strength = arguments.length <= 1 || arguments[1] === undefined ? 0.9 : arguments[1];

		_classCallCheck(this, Floor);

		var _this9 = _possibleConstructorReturn(this, Object.getPrototypeOf(Floor).call(this));

		_this9.y = y;
		_this9.strength = strength;
		return _this9;
	}

	_createClass(Floor, [{
		key: 'influence',
		value: function influence(iter, positions, velocities, accelerations) {
			if (positions[iter + 1] <= this.y) {
				positions[iter + 1] = this.y;
				velocities[iter + 1] *= -this.strength;
				// accelerations[ iter + 1 ] = 0
			}
		}
	}]);

	return Floor;
}(Force);

/**
 * Material for the Particle System
 *
 * @class Material
 */

var BillboardMaterial = function (_THREE$ShaderMaterial) {
	_inherits(BillboardMaterial, _THREE$ShaderMaterial);

	function BillboardMaterial(options) {
		_classCallCheck(this, BillboardMaterial);

		var columns = 1;
		var rows = 1;

		/* default options for the material, basically just the shaders */
		var def = {
			uniforms: {
				time: { type: 'f', value: 1.0 }
			},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader
		};

		/* custom options can be passed and will be applied to the defaults */
		for (var prop in options) {
			/* uniforms will be added */
			if (prop === 'uniforms') {
				for (var uniform in options.uniforms) {
					def.uniforms[uniform] = options.uniform[uniform];
				}
			}
			/* texture is a special case and will be added to uniforms */
			else if (prop === 'texture') {
					def.uniforms.texture = def.uniforms.texture || { type: "t", value: options.texture };
				} else if (prop === 'columns') columns = options.columns;else if (prop === 'rows') rows = options.columns;

				/* add the rest */
				else def[prop] = options[prop];
		}

		var _this10 = _possibleConstructorReturn(this, Object.getPrototypeOf(BillboardMaterial).call(this, def));

		_this10.columns = columns;
		_this10.rows = rows;
		return _this10;
	}

	return BillboardMaterial;
}(THREE.ShaderMaterial);

var vertexShader = '\n\tattribute float size;\n\tattribute vec3 translate;\n\tattribute float sprite;\n\tattribute float opacity;\n\tattribute vec3 color;\n\tattribute float id;\n\tattribute float tob;\n\n\tuniform vec2 spritemap;\n\tuniform float time;\n\n\tvarying float vOpacity;\n\tvarying vec3 vColor;\n\tvarying vec2 vUv;\n\n\tvoid main() {\n\n\t\tvColor = color;\n\t\tvOpacity = opacity;\n\n\t\t#ifdef SPRITEMAP\n\t\t\tvec2 coords = vec2( mod( sprite, spritemap.x ), floor( sprite / spritemap.y ) );\n\t\t\tvUv = uv + vec2(1,1) / spritemap * coords;\n\t\t#else\n\t\t\tvUv = uv;\n\t\t#endif\n\n\t\t#ifdef AGE\n\t\t\tfloat age = time - tob;\n\t\t#else\n\t\t\tfloat age = 0;\n\t\t#endif\n\n\t\tfloat radius = 0.05;\n\t\tfloat speed = ( 0.2 + mod(id, 8.0) / 10.0 ) * 5.0;\n\t\tfloat progress = time * speed + id;\n\n\t\tvec3 mtrans = vec3( translate.x + sin( progress ) * radius, translate.y + sin( progress * speed / 5.0 ) * radius, translate.z + cos( progress ) * radius );\n\n\t\tvec4 mvPosition = modelViewMatrix * vec4( translate, 1.0 );\n\t\tmvPosition.xyz += position * size; // * ( sin(time + id) + 1.5 );\n\n\t\tgl_Position = projectionMatrix * mvPosition;\n\t}\n';

var fragmentShader = '\n\tuniform sampler2D texture;\n\tvarying vec2 vUv;\n\tvarying vec3 vColor;\n\tvarying float vOpacity;\n\tvoid main() {\n\t\t#ifdef TEXTURE\n\t\t\tgl_FragColor = vec4( vColor, vOpacity ) * texture2D( texture, vUv);\n\t\t#else\n\t\t\tgl_FragColor = vec4( vColor, vOpacity );\n\t\t#endif\n\t}\n';

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
};
