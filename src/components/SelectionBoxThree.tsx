import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";

import { SelectionBox } from "three/addons/interactive/SelectionBox.js";
import { SelectionHelper } from "three/addons/interactive/SelectionHelper.js";
import { onMount } from "solid-js";

let container: HTMLElement | null, stats: Stats;
let camera: THREE.Camera, scene: THREE.Scene, renderer: THREE.WebGLRenderer;

function init() {
	container = document.getElementById("container");
	if (!container) throw new Error("Container not found");

	camera = new THREE.PerspectiveCamera(
		70,
		window.innerWidth / window.innerHeight,
		0.1,
		500
	);
	camera.position.z = 50;

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xf0f0f0);

	scene.add(new THREE.AmbientLight(0xaaaaaa));

	const light = new THREE.SpotLight(0xffffff, 10000);
	light.position.set(0, 25, 50);
	light.angle = Math.PI / 5;

	light.castShadow = true;
	light.shadow.camera.near = 10;
	light.shadow.camera.far = 100;
	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 1024;

	scene.add(light);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	console.log(renderer.domElement);

	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;

	container.appendChild(renderer.domElement);

	stats = new Stats();
	stats.dom.style.position = "absolute";
	container.appendChild(stats.dom);

	window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
	// @ts-expect-error - TS2339: Property 'aspect' does not exist on type 'Camera'.
	camera.aspect = window.innerWidth / window.innerHeight;
	// @ts-expect-error - TS2339: Property 'updateProjectionMatrix' does not exist on type 'Camera'.
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
	requestAnimationFrame(animate);

	render();
	stats.update();
}

function render() {
	renderer.render(scene, camera);
}

const generateObject = (geometry: THREE.BufferGeometry) => {
	const object = new THREE.Mesh(
		geometry,
		new THREE.MeshLambertMaterial({
			color: Math.random() * 0xffffff,
		})
	);

	object.position.x = Math.random() * 80 - 40;
	object.position.y = Math.random() * 45 - 25;
	object.position.z = Math.random() * 45 - 25;

	object.rotation.x = Math.random() * 2 * Math.PI;
	object.rotation.y = Math.random() * 2 * Math.PI;
	object.rotation.z = Math.random() * 2 * Math.PI;

	object.scale.x = Math.random() * 2 + 1;
	object.scale.y = Math.random() * 2 + 1;
	object.scale.z = Math.random() * 2 + 1;

	object.castShadow = true;
	object.receiveShadow = true;

	scene.add(object);
	return object;
};

export default function SelectionBoxThree() {
	onMount(() => {
		init();
		animate();

		const geometry = new THREE.BoxGeometry();

		for (let i = 0; i < 20; i++) {
			generateObject(geometry);
		}

		const selectionBox = new SelectionBox(camera, scene);
		const helper = new SelectionHelper(renderer, "selectBox");

		document.addEventListener("pointerdown", function (event) {
			for (const item of selectionBox.collection) {
				//@ts-expect-error - TS2339: Property 'emissive' does not exist on type 'material'.
				item.material.emissive.set(0x000000);
			}

			selectionBox.startPoint.set(
				(event.clientX / window.innerWidth) * 2 - 1,
				-(event.clientY / window.innerHeight) * 2 + 1,
				0.5
			);
		});

		document.addEventListener("pointermove", function (event) {
			if (helper.isDown) {
				for (let i = 0; i < selectionBox.collection.length; i++) {
					//@ts-expect-error - TS2339: Property 'emissive' does not exist on type 'material'.
					selectionBox.collection[i].material.emissive.set(0x000000);
				}

				selectionBox.endPoint.set(
					(event.clientX / window.innerWidth) * 2 - 1,
					-(event.clientY / window.innerHeight) * 2 + 1,
					0.5
				);

				const allSelected = selectionBox.select();

				for (let i = 0; i < allSelected.length; i++) {
					//@ts-expect-error - TS2339: Property 'emissive' does not exist on type 'material'.
					allSelected[i].material.emissive.set(0xffffff);
				}
			}
		});

		document.addEventListener("pointerup", function (event) {
			selectionBox.endPoint.set(
				(event.clientX / window.innerWidth) * 2 - 1,
				-(event.clientY / window.innerHeight) * 2 + 1,
				0.5
			);

			const allSelected = selectionBox.select();

			for (let i = 0; i < allSelected.length; i++) {
				//@ts-expect-error - TS2339: Property 'emissive' does not exist on type 'material'.
				allSelected[i].material.emissive.set(0xffffff);
			}
		});
	});

	return (
		<div
			style={{
				"background-color": "#f0f0f0",
				color: "#000",
				"touch-action": "none",
			}}
		>
			<div
				style={{
					position: "absolute",
					width: "100vw",
					height: "100vh",
				}}
				id="container"
			/>
			<button
				style={{ position: "absolute", top: 0, right: 0 }}
				onClick={() => {
					const geometry = new THREE.BoxGeometry();
					generateObject(geometry);
				}}
			>
				Add Object
			</button>
			<style>
				{`
        .selectBox {
          border: 1px solid #55aaff;
          background-color: rgba(75, 160, 255, 0.3);
          position: fixed;
        }
      `}
			</style>
		</div>
	);
}
