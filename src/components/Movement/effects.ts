import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const initEffects = (
	renderer: THREE.WebGLRenderer,
	camera: THREE.Camera,
	scene: THREE.Scene
) => {
	const composer = new EffectComposer(renderer);
	const outlinePass = new OutlinePass(
		new THREE.Vector2(window.innerWidth, window.innerHeight),
		scene,
		camera
	);
	outlinePass.edgeStrength = 5;
	outlinePass.edgeGlow = 0.9;
	outlinePass.edgeThickness = 4;
	outlinePass.pulsePeriod = 9;
	outlinePass.visibleEdgeColor.set("#ffffff");
	outlinePass.hiddenEdgeColor.set("#190a05");

	const textureLoader = new THREE.TextureLoader();
	textureLoader.load("textures/tri_pattern.jpg", function (texture) {
		outlinePass.patternTexture = texture;
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
	});

	composer.addPass(outlinePass);

	const renderPass = new RenderPass(scene, camera);
	composer.addPass(renderPass);

	const outputPass = new OutputPass();
	composer.addPass(outputPass);

	const effectFXAA = new ShaderPass(FXAAShader);
	effectFXAA.uniforms["resolution"].value.set(
		1 / window.innerWidth,
		1 / window.innerHeight
	);
	composer.addPass(effectFXAA);

	return { effectComposer: composer, outlinePass };
};
