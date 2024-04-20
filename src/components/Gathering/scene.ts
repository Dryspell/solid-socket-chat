import {
	addCharacter,
	type CharacterPrefabs,
	type Characters,
} from "./characters";
import { addResource, type Resources, type ResourcePrefabs } from "./resources";
import { characterExists } from "./utils";
import * as THREE from "three";

const initLights = (scene: THREE.Scene) => {
	const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
	hemiLight.position.set(0, 20, 0);
	scene.add(hemiLight);

	const dirLight = new THREE.DirectionalLight(0xffffff, 3);
	dirLight.position.set(-3, 10, -10);
	dirLight.castShadow = true;
	dirLight.shadow.camera.top = 2;
	dirLight.shadow.camera.bottom = -2;
	dirLight.shadow.camera.left = -2;
	dirLight.shadow.camera.right = 2;
	dirLight.shadow.camera.near = 0.1;
	dirLight.shadow.camera.far = 40;
	scene.add(dirLight);
};

export function constructScene(
	scene: THREE.Scene,
	characters: Characters,
	characterPrefabs: CharacterPrefabs,
	resources: Resources,
	resourcePrefabs: ResourcePrefabs
) {
	initLights(scene);

	// ground
	const groundMesh = new THREE.Mesh(
		new THREE.PlaneGeometry(100, 100),
		new THREE.MeshPhongMaterial({ color: "#28ed81", depthWrite: false })
	);
	groundMesh.rotation.x = -Math.PI / 2;
	groundMesh.receiveShadow = true;
	scene.add(groundMesh);

	addCharacter(scene, characters, {
		gltf: characterPrefabs[
			Math.floor(Math.random() * characterPrefabs.length)
		].gltf,
		data: {},
		options: { position: new THREE.Vector3(0, 0, 0) },
	});

	resourcePrefabs.forEach((resourcePrefab) => {
		addResource(scene, resources, {
			gltf: resourcePrefab.gltf,
			data: {},
			options: {
				position: new THREE.Vector3(
					Math.random() * 20 - 10,
					1,
					Math.random() * 20 - 10
				),
			},
		});
	});

	return { groundMesh };
}
