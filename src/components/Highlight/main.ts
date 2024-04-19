import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";

import Stats from "three/addons/libs/stats.module.js";

import { initGui } from "./tools";
import { constructScene, initLights } from "./scene";

const initEffects = (
	container: HTMLElement,
	scene: THREE.Scene,
	camera: THREE.Camera
) => {
	const renderer = new THREE.WebGLRenderer();
	renderer.shadowMap.enabled = true;
	// todo - support pixelRatio in this demo
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	const composer = new EffectComposer(renderer);

	const renderPass = new RenderPass(scene, camera);
	composer.addPass(renderPass);

	const outlinePass = new OutlinePass(
		new THREE.Vector2(window.innerWidth, window.innerHeight),
		scene,
		camera
	);
	composer.addPass(outlinePass);

	const textureLoader = new THREE.TextureLoader();
	textureLoader.load("textures/tri_pattern.jpg", function (texture) {
		outlinePass.patternTexture = texture;
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
	});

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

		effectFXAA.uniforms["resolution"].value.set(
			1 / window.innerWidth,
			1 / window.innerHeight
		);
	});

	renderer.domElement.style.touchAction = "none";
	renderer.domElement.addEventListener("pointermove", onPointerMove);

	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();
	let selectedObjects: any[] = [];
	const obj3d = new THREE.Object3D();

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
			// outlinePass.selectedObjects = [];
		}
	}

	return {
		composer,
		renderer,
		obj3d,
		outlinePass,
		outputPass,
		effectFXAA,
		renderPass,
	};
};

const initControls = (camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.minDistance = 5;
	controls.maxDistance = 20;
	controls.enablePan = false;
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;

	return { controls };
};

export function init() {
	const container = document.getElementById("container");
	if (!container) throw new Error("Container not found");
	// document.body.appendChild(container);

	const width = window.innerWidth;
	const height = window.innerHeight;

	const scene = new THREE.Scene();

	const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
	camera.position.set(0, 0, 8);

	const { composer, outlinePass, renderer, obj3d } = initEffects(
		container,
		scene,
		camera
	);

	const { controls } = initControls(camera, renderer);

	const { gui, params } = initGui(outlinePass);

	initLights(scene);

	const { group } = constructScene(scene, obj3d);

	const stats = new Stats();
	container.appendChild(stats.dom);

	return {
		camera,
		scene,
		renderer,
		controls,
		composer,
		gui,
		params,
		stats,
		group,
	};
}
