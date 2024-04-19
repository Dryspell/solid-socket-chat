import * as THREE from "three";
import { type OutlinePass } from "three/addons/postprocessing/OutlinePass.js";

export const initTestObjects = (
	scene: THREE.Scene,
	renderer: THREE.WebGLRenderer,
	camera: THREE.Camera,
	outlinePass: OutlinePass
) => {
	const group = new THREE.Group();
	scene.add(group);

	const geometry = new THREE.SphereGeometry(3, 48, 24);

	for (let i = 0; i < 20; i++) {
		const material = new THREE.MeshLambertMaterial();
		material.color.setHSL(Math.random(), 1.0, 0.3);

		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.x = Math.random() * 4 - 2;
		mesh.position.y = Math.random() * 4 - 2;
		mesh.position.z = Math.random() * 4 - 2;
		mesh.receiveShadow = true;
		mesh.castShadow = true;
		mesh.scale.multiplyScalar(Math.random() * 0.3 + 0.1);
		group.add(mesh);
	}

	const torusGeometry = new THREE.TorusGeometry(1, 0.3, 16, 100);
	const torusMaterial = new THREE.MeshPhongMaterial({ color: 0xffaaff });
	const torus = new THREE.Mesh(torusGeometry, torusMaterial);
	torus.position.z = -4;
	group.add(torus);
	torus.receiveShadow = true;
	torus.castShadow = true;

	let selectedObjects: THREE.Object3D[] = [];

	function addSelectedObject(object: THREE.Object3D) {
		selectedObjects = [];
		selectedObjects.push(object);
	}
	const raycaster = new THREE.Raycaster();
	const mouse = new THREE.Vector2();

	function checkIntersection() {
		raycaster.setFromCamera(mouse, camera);

		const intersects = raycaster.intersectObject(scene, true);

		if (intersects.length > 0) {
			console.log("intersects", intersects);
			const selectedObject = intersects[0].object;
			addSelectedObject(selectedObject);
			outlinePass.selectedObjects = selectedObjects;
		} else {
			// outlinePass.selectedObjects = [];
		}
	}

	renderer.domElement.style.touchAction = "none";
	renderer.domElement.addEventListener("pointermove", (event) => {
		if (event.isPrimary === false) return;

		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

		checkIntersection();
	});
};
