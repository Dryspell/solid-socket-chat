import * as THREE from "three";
import { type GLTF } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { setWeight } from "./utils";
import { type Setter } from "solid-js";
import { SelectionBox } from "three/addons/interactive/SelectionBox.js";
import { SelectionHelper } from "three/addons/interactive/SelectionHelper.js";
import { type OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export const MOVEMENT_SPEED = 0.064;

export const initCharacterPrefabs = () => [] as { gltf: GLTF }[];
export type CharacterPrefabs = ReturnType<typeof initCharacterPrefabs>;

export const initCharacters = () =>
	new Map<
		string,
		{
			model: THREE.Object3D<THREE.Object3DEventMap>;
			mixer: THREE.AnimationMixer;
			animations: THREE.AnimationClip[];
		}
	>();
export type Characters = ReturnType<typeof initCharacters>;

export const addCharacter = (
	scene: THREE.Scene,
	characters: Characters,
	newCharacter: {
		gltf: GLTF;
		data: { id?: string };
		options: { position: THREE.Vector3 };
	}
) => {
	const characterData = { id: crypto.randomUUID(), ...newCharacter.data };
	const model = SkeletonUtils.clone(newCharacter.gltf.scene);
	model.position.copy(newCharacter.options.position);
	scene.add(model);

	const animations = newCharacter.gltf.animations;

	const mixer = new THREE.AnimationMixer(model);

	const idleAction = mixer.clipAction(
		animations.find((a) => a.name === "Idle")!
	);
	setWeight(idleAction, 1);
	idleAction.play();
	characters.set(model.uuid, { model, mixer, animations });
	return { model, mixer, characterData };
};

export const initClickToMove = (
	camera: THREE.Camera,
	characters: Characters,
	groundMesh: THREE.Mesh,
	animationCallbacks: Map<string, () => void>,
	setDistanceReporter: Setter<number>
) => {
	const mousePosition = new THREE.Vector2();
	const raycaster = new THREE.Raycaster();
	let intersects: THREE.Intersection[];

	window.addEventListener("mousedown", function (e) {
		if (!e.ctrlKey) return;
		mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
		mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
		raycaster.setFromCamera(mousePosition, camera);
		intersects = raycaster.intersectObject(groundMesh);

		if (intersects.length > 0 && characters.size) {
			const destination = intersects[0].point;

			characters.forEach(({ model, mixer, animations }, id) => {
				const distance = model.position.distanceTo(destination);
				if (distance > 0.1) {
					setDistanceReporter(distance);
					model.lookAt(destination);
					const direction = model.position
						.clone()
						.sub(destination)
						.normalize()
						.multiplyScalar(MOVEMENT_SPEED);
					mixer
						.clipAction(animations.find((a) => a.name === "Run")!)
						.play();

					animationCallbacks.set(`move-${id}`, () => {
						model.position.sub(direction);

						const distance = model.position.distanceTo(destination);
						setDistanceReporter(distance);

						if (distance <= 0.1) {
							animationCallbacks.delete(`move-${id}`);
							mixer
								.clipAction(
									animations.find((a) => a.name === "Run")!
								)
								.stop();
							mixer
								.clipAction(
									animations.find((a) => a.name === "Idle")!
								)
								.play();
						}
					});
				}
			});
		}
	});
};

export const initSelectionBox = (
	characters: Characters,
	camera: THREE.Camera,
	cameraControls: OrbitControls,
	scene: THREE.Scene,
	renderer: THREE.WebGLRenderer
) => {
	const selectionBox = new SelectionBox(camera, scene);
	const helper = new SelectionHelper(renderer, "selectBox");


	document.addEventListener("pointerdown", function (event) {
		if (event.shiftKey) cameraControls.enabled = false;

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
			// for (let i = 0; i < selectionBox.collection.length; i++) {
			// 	//@ts-expect-error - TS2339: Property 'emissive' does not exist on type 'material'.
			// 	selectionBox.collection[i].material.emissive.set(0x000000);
			// }

			selectionBox.endPoint.set(
				(event.clientX / window.innerWidth) * 2 - 1,
				-(event.clientY / window.innerHeight) * 2 + 1,
				0.5
			);

			const allSelected = selectionBox
				.select()
				.filter(
					(item) =>
						item.parent?.parent?.uuid &&
						characters.has(item.parent?.parent?.uuid)
				);

			for (let i = 0; i < allSelected.length; i++) {
				//@ts-expect-error - TS2339: Property 'emissive' does not exist on type 'material'.
				allSelected[i].material.emissive.set(0xffffff);
			}
		}
	});

	document.addEventListener("pointerup", function (event) {
		cameraControls.enabled = true;
		selectionBox.endPoint.set(
			(event.clientX / window.innerWidth) * 2 - 1,
			-(event.clientY / window.innerHeight) * 2 + 1,
			0.5
		);

		const allSelected = selectionBox
			.select()
			.filter(
				(item) =>
					item.parent?.parent?.uuid &&
					characters.has(item.parent?.parent?.uuid)
			);
	});
};
