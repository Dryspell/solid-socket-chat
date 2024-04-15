import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { onWindowResize } from "./utils";
import { type CharacterPrefabs, type Characters } from "./characters";

const initScene = () => {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0xa0a0a0);
	scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);
	return scene;
};

const initCameraControls = (
	camera: THREE.PerspectiveCamera,
	renderer: THREE.WebGLRenderer
) => {
	// Camera Controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.listenToKeyEvents(window); // optional
	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.05;
	controls.screenSpacePanning = false;
	controls.maxPolarAngle = Math.PI / 2;
	//
	return controls;
};

const initCamera = () => {
	const camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth / window.innerHeight,
		1,
		100
	);
	camera.position.set(1, 2, -3);
	camera.lookAt(0, 1, 0);
	return camera;
};

const initRenderer = (container: HTMLElement) => {
	const renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	container.appendChild(renderer.domElement);
	return renderer;
};

export function init() {
	const container = document.getElementById("container");
	if (!container) throw new Error("Container not found");

	const clock = new THREE.Clock();
	const scene = initScene();
	const renderer = initRenderer(container);

	const camera = initCamera();
	initCameraControls(camera, renderer);

	const stats = new Stats();
	container.appendChild(stats.dom);

	window.addEventListener("resize", onWindowResize(camera, renderer));

	return { scene, camera, renderer, clock, stats };
}

export function animate(
	scene: THREE.Scene,
	camera: THREE.Camera,
	renderer: THREE.WebGLRenderer,
	clock: THREE.Clock,
	stats: Stats,
	characters: Characters
) {
	// Render loop
	const animationCallback = () =>
		animate(scene, camera, renderer, clock, stats, characters);
	requestAnimationFrame(animationCallback);

	// Get the time elapsed since the last frame, used for mixer update (if not in single step mode)
	let mixerUpdateDelta = clock.getDelta();

	// Update the animation mixer, the stats panel, and render this frame
	characters.forEach(({ mixer }) => {
		mixer.update(mixerUpdateDelta);
	});

	stats.update();

	renderer.render(scene, camera);
}

export const load = (characterPrefabs: CharacterPrefabs) => {
	const loader = new GLTFLoader();
	loader.load("models/Character_Female_1.gltf", function (gltf) {
		gltf.scene.traverse(function (object) {
			// @ts-expect-error - TS2339: Property 'isMesh' does not exist on type 'Object3D<Object3DEventMap>'.
			if (object.isMesh) object.castShadow = true;
		});
		characterPrefabs.push({ gltf });
	});
	return loader;
};
