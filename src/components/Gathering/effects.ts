import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

export const initHighlighter = (
	camera: THREE.Camera,
	renderer: THREE.WebGLRenderer,
	scene: THREE.Scene,
	outlinePass: OutlinePass
) => {
	renderer.domElement.style.touchAction = "none";
	renderer.domElement.addEventListener("pointermove", onPointerMove);

	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();
	let selectedObjects: any[] = [];

	function onPointerMove(event: {
		isPrimary: boolean;
		clientX: number;
		clientY: number;
	}) {
		console.log(event);
		if (event.isPrimary === false) return;

		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

		checkIntersection();
	}

	function addSelectedObject(object: THREE.Object3D<THREE.Object3DEventMap>) {
		selectedObjects = [];
		selectedObjects.push(object);
	}

	function checkIntersection() {
		raycaster.setFromCamera(mouse, camera);

		const intersects = raycaster.intersectObject(scene, true);

		if (intersects.length > 0) {
			const selectedObject = intersects[0].object;
			console.log(selectedObject);
			addSelectedObject(selectedObject);
			outlinePass.selectedObjects = selectedObjects;
		} else {
			outlinePass.selectedObjects = [];
		}
	}
};

export const initEffects = (
	renderer: THREE.WebGLRenderer,
	camera: THREE.Camera,
	scene: THREE.Scene
) => {
	const composer = new EffectComposer(renderer);

	const renderPass = new RenderPass(scene, camera);
	composer.addPass(renderPass);

	const outlinePass = new OutlinePass(
		new THREE.Vector2(window.innerWidth, window.innerHeight),
		scene,
		camera
	);
	outlinePass.edgeStrength = 10.0;
	outlinePass.edgeGlow = 0;
	outlinePass.edgeThickness = 10.0;
	outlinePass.pulsePeriod = 1;
	outlinePass.visibleEdgeColor.set("#6666ff");
	outlinePass.hiddenEdgeColor.set("#190a05");

	const textureLoader = new THREE.TextureLoader();
	textureLoader.load("textures/tri_pattern.jpg", function (texture) {
		outlinePass.patternTexture = texture;
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
	});

	composer.addPass(outlinePass);

	const outputPass = new OutputPass();
	composer.addPass(outputPass);

	const effectFXAA = new ShaderPass(FXAAShader);
	effectFXAA.uniforms["resolution"].value.set(
		1 / window.innerWidth,
		1 / window.innerHeight
	);
	composer.addPass(effectFXAA);

	window.addEventListener("resize", () => {
		const width = window.innerWidth;
		const height = window.innerHeight;

		//@ts-expect-error aspect exists on camera
		camera.aspect = width / height;
		//@ts-expect-error updateProjectionMatrix exists on camera
		camera.updateProjectionMatrix();

		renderer.setSize(width, height);
		composer.setSize(width, height);

		effectFXAA.uniforms["resolution"].value.set(1 / width, 1 / height);
	});

	// initHighlighter(camera, renderer, scene, outlinePass);

	return {
		composer,
		outlinePass,
		effectFXAA,
		// outputPass,
		// renderPass
	};
};
