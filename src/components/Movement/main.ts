import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { onWindowResize } from "./utils";
import { initCharacterPrefabs, type Characters } from "./characters";

const modelPaths = [
	"models/Character_Female_1.gltf",
	"models/Character_Female_2.gltf",
	"models/Character_Male_1.gltf",
	"models/Character_Male_2.gltf",
	"models/Demon.gltf",
	"models/Giant.gltf",
	"models/Goblin.gltf",
	"models/Hedgehog.gltf",
	"models/Skeleton.gltf",
	"models/Skeleton_Armor.gltf",
	"models/Wizard.gltf",
	"models/Yeti.gltf",
	"models/Zombie.gltf",
];

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
	const cameraControls = initCameraControls(camera, renderer);

	const stats = new Stats();
	container.appendChild(stats.dom);

	window.addEventListener("resize", onWindowResize(camera, renderer));

	return {
		scene,
		camera,
		cameraControls,
		renderer,
		clock,
		stats,
	};
}

export function animate(
	scene: THREE.Scene,
	camera: THREE.Camera,
	renderer: THREE.WebGLRenderer,
	clock: THREE.Clock,
	stats: Stats,
	characters: Characters,
	callbacks: Map<string, Function>
) {
	// Render loop
	const animationCallback = () =>
		animate(scene, camera, renderer, clock, stats, characters, callbacks);
	requestAnimationFrame(animationCallback);

	// Get the time elapsed since the last frame, used for mixer update (if not in single step mode)
	let mixerUpdateDelta = clock.getDelta();

	// Update the animation mixer, the stats panel, and render this frame
	characters.forEach(({ mixer }) => {
		mixer.update(mixerUpdateDelta);
	});

	callbacks.forEach((callback) => callback());

	stats.update();

	renderer.render(scene, camera);
}

const initLoadingManager = () => {
	const manager = new THREE.LoadingManager();
	manager.onStart = function (url, itemsLoaded, itemsTotal) {
		console.log(
			"Started loading file: " +
				url +
				".\nLoaded " +
				itemsLoaded +
				" of " +
				itemsTotal +
				" files."
		);
	};

	manager.onLoad = function () {
		console.log("Loading complete!");
	};

	manager.onProgress = function (url, itemsLoaded, itemsTotal) {
		console.log(
			"Loading file: " +
				url +
				".\nLoaded " +
				itemsLoaded +
				" of " +
				itemsTotal +
				" files."
		);
	};

	manager.onError = function (url) {
		console.log("There was an error loading " + url);
	};
	return manager;
};

export const load = async () => {
	const manager = initLoadingManager();
	const loader = new GLTFLoader(manager);

	const characterPrefabs = initCharacterPrefabs();

	await Promise.all(
		modelPaths.map(async (modelPath) => {
			const gltf = await loader.loadAsync(modelPath);

			gltf.scene.traverse((object) => {
				// @ts-expect-error - TS2339: Property 'isMesh' does not exist on type 'Object3D<Object3DEventMap>'.
				if (object.isMesh) object.castShadow = true;
			});
			characterPrefabs.push({ gltf });
		})
	);

	return { loader, characterPrefabs };
};
