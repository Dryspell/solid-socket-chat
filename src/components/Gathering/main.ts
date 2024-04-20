import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
	characterModelPaths,
	initCharacterPrefabs,
	loadCharacterPrefabs,
	type Characters,
} from "./characters";
import { type EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { initEffects } from "./effects";
import { loadResourcePrefabs } from "./resources";

const initScene = () => {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0xa0a0a0);
	// scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);
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
	// renderer.setPixelRatio(window.devicePixelRatio);
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

	const { composer, outlinePass } = initEffects(renderer, camera, scene);

	return {
		scene,
		camera,
		cameraControls,
		renderer,
		clock,
		stats,
		composer,
		outlinePass,
	};
}

export function animationUpdate(callbacks: Map<string, Function>) {
	callbacks.forEach((callback) => callback());
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

	const { characterPrefabs } = await loadCharacterPrefabs(loader);
	const { resourcePrefabs } = await loadResourcePrefabs(loader);
	// const resourcePrefabs = [] as Awaited<
	// 	ReturnType<typeof loadResourcePrefabs>
	// >["resourcePrefabs"];

	return { loader, characterPrefabs, resourcePrefabs };
};
