import {
	addCharacter,
	type CharacterPrefabs,
	type Characters,
} from "./characters";
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

export const initGrid = (
	scene: THREE.Scene,
	camera: THREE.PerspectiveCamera,
	characters: Characters,
	characterPrefabs: CharacterPrefabs
) => {
	const mousePosition = new THREE.Vector2();
	const raycaster = new THREE.Raycaster();
	let intersects;

	const planeMesh = new THREE.Mesh(
		new THREE.PlaneGeometry(100, 100),
		new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			visible: false,
		})
	);
	planeMesh.rotateX(-Math.PI / 2);
	scene.add(planeMesh);

	const grid = new THREE.GridHelper(100, 100);
	scene.add(grid);

	const highlightMesh = new THREE.Mesh(
		new THREE.PlaneGeometry(1, 1),
		new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			transparent: true,
		})
	);
	highlightMesh.rotateX(-Math.PI / 2);
	highlightMesh.position.set(0.5, 0, 0.5);
	scene.add(highlightMesh);

	window.addEventListener("mousemove", function (e) {
		mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
		mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
		raycaster.setFromCamera(mousePosition, camera);
		intersects = raycaster.intersectObject(planeMesh);
		if (intersects?.length > 0) {
			const highlightPos = new THREE.Vector3()
				.copy(intersects[0].point)
				.floor()
				.addScalar(0.5);
			highlightMesh.position.set(highlightPos.x, 0, highlightPos.z);

			if (!characterExists(characters, highlightMesh.position))
				highlightMesh.material.color.setHex(0xffffff);
			else highlightMesh.material.color.setHex(0xff0000);
		}
	});

	window.addEventListener("mousedown", function (e) {
		if (!e.ctrlKey) return;
		if (!characterExists(characters, highlightMesh.position)) {
			if (intersects.length > 0 && characterPrefabs.length) {
				addCharacter(scene, characters, {
					gltf: characterPrefabs[
						Math.floor(Math.random() * characterPrefabs.length)
					].gltf,
					data: {},
					options: { position: highlightMesh.position },
				});
				highlightMesh.material.color.setHex(0xff0000);
			}
		}
	});
};

export function constructScene(
	scene: THREE.Scene,
	characters: Characters,
	characterPrefabs: CharacterPrefabs
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

	return { groundMesh };
}
