import * as THREE from "three";
import { type GLTF } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { setWeight } from "./utils";
import { type Setter } from "solid-js";
import { SelectionBox } from "three/addons/interactive/SelectionBox.js";
import { SelectionHelper } from "three/addons/interactive/SelectionHelper.js";
import { type OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { type OutlinePass } from "three/examples/jsm/Addons.js";
import { type GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const characterModelPaths = [
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

export const MOVEMENT_SPEED = 0.064;

export const initCharacterPrefabs = () => [] as { gltf: GLTF }[];
export type CharacterPrefabs = ReturnType<typeof initCharacterPrefabs>;

export const loadCharacterPrefabs = async (loader: GLTFLoader) => {
	const characterPrefabs = initCharacterPrefabs();

	await Promise.all(
		characterModelPaths.map(async (modelPath) => {
			const gltf = await loader.loadAsync(modelPath);

			gltf.scene.traverse((object) => {
				// @ts-expect-error - TS2339: Property 'isMesh' does not exist on type 'Object3D<Object3DEventMap>'.
				if (object.isMesh) object.castShadow = true;
			});
			characterPrefabs.push({ gltf });
		})
	);

	return { characterPrefabs };
};

export const initCharacters = () =>
	new Map<
		string,
		{
			model: THREE.Object3D<THREE.Object3DEventMap>;
			mixer: THREE.AnimationMixer;
			animations: THREE.AnimationClip[];
			data: { id?: string };
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

	const data = { id: model.uuid, ...newCharacter.data };

	characters.set(model.uuid, { model, mixer, animations, data });

	return { model, mixer, animations, data };
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
	renderer: THREE.WebGLRenderer,
	outlinePass: OutlinePass
) => {
	const selectionBox = new SelectionBox(camera, scene);
	const helper = new SelectionHelper(renderer, "selectBox");

	document.addEventListener("pointerdown", function (event) {
		if (!event.shiftKey) {
			return;
		}
		cameraControls.enabled = false;

		outlinePass.selectedObjects = [];

		const start = new THREE.Vector3(
			(event.clientX / window.innerWidth) * 2 - 1,
			-(event.clientY / window.innerHeight) * 2 + 1,
			0
		);
		selectionBox.startPoint.set(...start.toArray());
		selectionBox.endPoint.set(...start.toArray());
	});

	document.addEventListener("pointermove", function (event) {
		if (!helper.isDown || !event.shiftKey) {
			return;
		}
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
		outlinePass.selectedObjects = allSelected;
	});

	document.addEventListener("pointerup", function (event) {
		if (!event.shiftKey) {
			cameraControls.enabled = true;
			return;
		}
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
		outlinePass.selectedObjects = allSelected;
	});
};
