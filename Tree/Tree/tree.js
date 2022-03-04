import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Texture, Scene
} = tiny;

const {Cube, Axis_Arrows, Textured_Phong} = defs


export class Tree extends Scene { //Should be Scene for Assignment 3
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();


        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            cube: new Cube(),
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            sphere4: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),

            sphere0: new defs.Subdivision_Sphere(0),
            sphere1: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(1),

            sphere2: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            sphere3: new defs.Subdivision_Sphere(3),
            leafTest: new defs.Tetrahedron(true),
            cylinder      : new defs.Capped_Cylinder( 4, 12, [[0,1],[0,1]] ),
            cone        : new defs.Closed_Cone( 4, 20, [[0,1],[0,1]] ),
            skybox: new defs.Subdivision_Sphere(4),
            ground: new defs.Capped_Cylinder(100,100,[[0,2],[0,1]]),
            pine_cones: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),

        };

        // *** Materials
        const textured = new defs.Textured_Phong(1);
        this.materials = {
            pine_cones: new Material(new Gouraud_Shader(),
                {ambient: .6, diffusivity: .6, color: hex_color("#6F4E37")}),
            trunk: new Material(new Gouraud_Shader(),
                {ambient: .8, diffusivity: .6, color: hex_color("#ffffff")}),
            water: new Material(new Gouraud_Shader(),
                {ambient: .8, diffusivity: .6, color: hex_color("#ffffff")}),
            land: new Material(new Gouraud_Shader(),
                {ambient: .7, diffusivity: 1, color: hex_color("#ffffff")}),
            tree: new Material(new Gouraud_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            sun: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 1, color: hex_color("#ffffff")}),
            sky: new Material(textured,
                {ambient:1, specularity: 0.2, texture: new Texture("assets/sunsetBackgroundSquare.png"), color: color(0,0,0,1)}),
            ground: new Material(textured,
                {ambient:1, specularity: 0.2, texture: new Texture("assets/groundSquare.png")}),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 40), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Reset Camera", ["Control", "0"], () => this.attached = () => this.initial_camera_location);
        this.new_line();
        this.key_triggered_button("Attach to tree", ["Control", "1"], () => this.attached = () => null);
    }

    draw_tree(context, program_state, tx, ty, tz, treez, green_shade){
        let trunk_transform = Mat4.identity();
        trunk_transform = trunk_transform.times(Mat4.rotation(1.4, 1, 0, 0))
            .times(Mat4.translation(tx, ty, tz))
            .times(Mat4.scale(1, 1, 11))
        this.shapes.cylinder.draw(context, program_state, trunk_transform, this.materials.trunk.override({color:  hex_color("#5c4322")}));

        for (let i = 0; i < 3; i++) {
            let cone_transform = Mat4.identity();
            cone_transform = cone_transform.times(Mat4.rotation(-1.8, 1, 0, 0))
                .times(Mat4.translation(tx, -1 * ty, treez + i * 2.25))
                .times(Mat4.scale(5 - i, 5 - i, 2))
            this.shapes.cone.draw(context, program_state, cone_transform, this.materials.tree.override({color: hex_color(green_shade)}));
        }
    }

    draw_pine_cones(context, program_state, p1x, p1y, p1z, p2x, p2y, p2z, p3x, p3y, p3z, p1angle1, p1angle2, p2angle1, p2angle2, p3angle1, p3angle2){
        let pine_transform = Mat4.identity().times(Mat4.translation(p1x, p1y, p1z))
            .times(Mat4.rotation(p1angle1, 1, 0, 0))
            .times(Mat4.rotation(p1angle2, 1, 0, 0))
            .times(Mat4.scale(0.45, 0.6,0.35));
        this.shapes.pine_cones.draw(context, program_state, pine_transform, this.materials.pine_cones);

        pine_transform = Mat4.identity().times(Mat4.translation(p2x, p2y, p2z))
            .times(Mat4.rotation(p2angle1, 1, 0, 0))
            .times(Mat4.rotation(p2angle2, 1, 0, 0))
            .times(Mat4.scale(0.45, 0.6,0.35));
        this.shapes.pine_cones.draw(context, program_state, pine_transform, this.materials.pine_cones);

        pine_transform = Mat4.identity().times(Mat4.translation(p3x, p3y, p3z))
            .times(Mat4.rotation(p3angle1, 0, 1, 0))
            .times(Mat4.rotation(p3angle2, 1, 0, 0))
            .times(Mat4.scale(0.45, 0.6,0.35));
        this.shapes.pine_cones.draw(context, program_state, pine_transform, this.materials.pine_cones);
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        // TODO: Lighting (Requirement 2)
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const yellow = hex_color("#fac91a");

        const light_color = color(1, 1, 1, 1);

        let light_position;
        // The parameters of the Light are: position, color, size
        let model_transform = Mat4.identity();

        //Moving Sun
        let sun_transform;
        sun_transform = model_transform.times(Mat4.translation(34-(7*t)%68, 14, -7));
        light_position = vec4(34-(7*t)%68, 14, -7, 1);
        program_state.lights = [new Light(light_position, light_color, 100)];

        // Drawing Sky
        let sky_transform = model_transform.times(Mat4.scale(60, 60, 60));
        this.shapes.sphere4.draw(context, program_state, sun_transform, this.materials.sun.override({color: yellow}));
        this.shapes.skybox.draw(context, program_state, sky_transform, this.materials.sky);

        //River
        let water_transform = Mat4.identity();
        water_transform = water_transform.times(Mat4.translation(0, -16, -10))
            .times(Mat4.rotation(-0.2, 1, 0, 0))
            .times(Mat4.scale(50, 4, 20))
        this.shapes.cube.draw(context, program_state, water_transform, this.materials.water.override({color: hex_color("#1ca3ec")}));

        //Land
        for(let i = 0; i < 2; ++i) {
            let land_transform = Mat4.identity();
            land_transform = land_transform.times(Mat4.translation(-31 + (i * 62), -15, -10))
                .times(Mat4.rotation(-0.2, 1, 0, 0))
                .times(Mat4.scale(25, 5, 20))
            this.shapes.cube.draw(context, program_state, land_transform, this.materials.land.override({color: hex_color("#C19A6B")}));
        }

        //Trees on left side
        this.draw_tree(context, program_state, -20, 5, 5, -1.5, "#355E3B");
        this.draw_tree(context, program_state, -8, -5, 5, 0.8, "#355E3B");
        this.draw_tree(context, program_state, -25, -15, 5, 0.4, "#355E3B");
        this.draw_tree(context, program_state, -35, 0, 5, -1, "#355E3B");
        this.draw_tree(context, program_state, -17, -4, 5, -1.1, "#4F7942");
        this.draw_tree(context, program_state, -30, -6, 5, 0.3, "#4F7942");
        this.draw_tree(context, program_state, -15, -15, 5, 1.6, "#4F7942");
        this.draw_tree(context, program_state, -7, -20, 5, 2.3, "#87a96b");
        this.draw_tree(context, program_state, -30, -23, 5, 2.7, "#87a96b");

        //Trees on Right side
        this.draw_tree(context, program_state, 20, 5, 5, -1.5, "#355E3B");
        this.draw_tree(context, program_state, 8, -5, 5, 0.8, "#355E3B");
        this.draw_tree(context, program_state, 25, -15, 5, 0.4, "#355E3B");
        this.draw_tree(context, program_state, 35, 0, 5, -1, "#355E3B");
        this.draw_tree(context, program_state, 17, -4, 5, -1.1, "#4F7942");
        this.draw_tree(context, program_state, 30, -6, 5, 0.3, "#4F7942");
        this.draw_tree(context, program_state, 15, -15, 5, 1.6, "#4F7942");
        this.draw_tree(context, program_state, 7, -20, 5, 2.3, "#87a96b");
        this.draw_tree(context, program_state,  30, -23, 5, 2.7, "#87a96b");

        //Pine Cones
        this.draw_pine_cones(context, program_state, -20, -0.3, 9.2, -18, 1.5, 7.2, -20, 3.5,
            7, 2.3, 0, 2.3, 0, 2.3, -2.3)
        this.draw_pine_cones(context, program_state, 10, -0.3, -2.2, 6, 1.5, -3, 9, 3.5,
            -3.5, 2.3, 0, 2.3, -2.3, 0, 2.3)
        this.draw_pine_cones(context, program_state, 26, -1.5, -4.2, 31, 1, -3.5, 29.5, 3,
            -4.3, 2.3, -2, 2.3, 0, 2.3, -2.3)
        this.draw_pine_cones(context, program_state, -15, -1.8, -11, -13, 0.1, -13, -15, 2,
            -13.3, 2.3, 0, -2, -2.3, 0, 2.3)
        this.draw_pine_cones(context, program_state, 20, -0.3, 9.2, 18, 1.5, 7.2, 20, 3.5,
            7, 2.3, 0, 2.3, 0, 2.3, -2.3)

        //Set up the camera
        if(this.attached) {
            if (this.attached() == this.initial_camera_location) {
                //let desired = this.initial_camera_location;
                //desired = desired.map((x, i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));
                program_state.set_camera(Mat4.look_at(vec3(0, 10, 40), vec3(0, 0, 0), vec3(0, 1, 0)));
                //program_state.set_camera(this.initial_camera_location);
                this.attached = null;
            }
            else
            {
                let desired = model_transform.times(Mat4.translation(8,0,15));
                desired = Mat4.inverse(desired);
                desired = desired.map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));
                program_state.set_camera(desired);
            }
        }
    }
}

class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        varying vec4 vertex_color;
        
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                
                //For gouraud shader
                vertex_color = vec4(shape_color.xyz * ambient, shape_color.w);
                vertex_color.xyz += phong_model_lights(normalize(N), vertex_worldspace);
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                // Compute an initial (ambient) color:
                //gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                //gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                
                //For gouraud shader
                gl_FragColor = vertex_color;
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

class Ring_Shader extends Shader {
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `
        precision mediump float;
        varying vec4 point_position;
        varying vec4 center;
        `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        attribute vec3 position;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        
        void main(){
            // The vertex's final resting place:
            gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
            point_position = model_transform * vec4(position, 1.0);
            
            // position of the new center of ring
            center = model_transform * vec4(0.0, 0.0, 0.0, 1.0);
        }`;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
        return this.shared_glsl_code() + `
        void main(){
            // distance between fragment and center
            vec3 distance = vec3(point_position.xyz - center.xyz);
            
            // set alpha value (brightness) of the fragment
            gl_FragColor = vec4(vec3(0.69,0.502,0.251), cos(length(distance) * 20.0));
        }`;
    }
}

