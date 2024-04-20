import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
	loadCharacterPrefabs,
} from "./characters";
import {
	initCamera,
	initCameraControls,
	initEffects,
	initRenderer,
} from "./rendering";
import { loadResourcePrefabs } from "./resources";

const initScene = () => {
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0xa0a0a0);
	// scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);
	return scene;
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

	return { loader, characterPrefabs, resourcePrefabs };
};
