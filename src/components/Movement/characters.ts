import * as THREE from "three";
import { type GLTF } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { setWeight } from "./utils";
import { MOVEMENT_SPEED } from "../IntegratedScene/characters";
import { type Setter } from "solid-js";

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
	characters.set(characterData.id, { model, mixer, animations });
	return { model, mixer, characterData };
};

export const initClickToMove = (
	camera: THREE.Camera,
	characters: Characters,
	groundMesh: THREE.Mesh,
	animationCallbacks: Map<string, () => void>,
	setDistance: Setter<number>
) => {
	const mousePosition = new THREE.Vector2();
	const raycaster = new THREE.Raycaster();
	let intersects: THREE.Intersection[];

	window.addEventListener("mousemove", function (e) {
		mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
		mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
		raycaster.setFromCamera(mousePosition, camera);
		intersects = raycaster.intersectObject(groundMesh);
	});
	window.addEventListener("mousedown", function (e) {
		if (!e.ctrlKey) return;
		// intersects = raycaster.intersectObject(groundMesh);
		// const mousePosition = new THREE.Vector2(
		// 	(e.clientX / window.innerWidth) * 2 - 1,
		// 	-(e.clientY / window.innerHeight) * 2 + 1
		// );
		// raycaster.setFromCamera(mousePosition, camera);

		if (intersects.length > 0 && characters.size) {
			const destination = intersects[0].point;

			characters.forEach(({ model, mixer, animations }, id) => {
				const distance = model.position.distanceTo(destination);
				if (distance > 0.1) {
					setDistance(distance);
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
						setDistance(distance);

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
