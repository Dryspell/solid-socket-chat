import * as THREE from "three";
import { type GLTF } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { setWeight } from "./utils";

export const initCharacterPrefabs = () => [] as { gltf: GLTF }[];
export type CharacterPrefabs = ReturnType<typeof initCharacterPrefabs>;

export const initCharacters = () =>
	new Map<
		string,
		{
			model: THREE.Object3D<THREE.Object3DEventMap>;
			mixer: THREE.AnimationMixer;
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
	characters.set(characterData.id, { model, mixer });
	return { model, mixer, characterData };
};
