import type * as THREE from "three";
import { type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { type GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

export const resourceModelPaths = [
	"models/blocks/Block_Crystal.gltf",
	"models/blocks/Block_Metal.gltf",
];

export const initResourcePrefabs = () => [] as { gltf: GLTF }[];
export type ResourcePrefabs = ReturnType<typeof initResourcePrefabs>;

export const initResources = () =>
	new Map<
		string,
		{
			model: THREE.Object3D<THREE.Object3DEventMap>;
			data: { id?: string };
		}
	>();
export type Resources = ReturnType<typeof initResources>;

export const loadResourcePrefabs = async (loader: GLTFLoader) => {
	const resourcePrefabs = initResourcePrefabs();

	await Promise.all(
		resourceModelPaths.map(async (modelPath) => {
			const gltf = await loader.loadAsync(modelPath);

			gltf.scene.traverse((object) => {
				// @ts-expect-error - TS2339: Property 'isMesh' does not exist on type 'Object3D<Object3DEventMap>'.
				if (object.isMesh) object.castShadow = true;
			});
			resourcePrefabs.push({ gltf });
		})
	);

	return { resourcePrefabs };
};

export const addResource = (
	scene: THREE.Scene,
	resources: Resources,
	newResource: {
		gltf: GLTF;
		data: { id?: string };
		options: { position: THREE.Vector3 };
	}
) => {
	const model = SkeletonUtils.clone(newResource.gltf.scene);
	model.position.copy(newResource.options.position);
	scene.add(model);

	const data = { ...newResource.data, id: model.uuid };
	resources.set(model.uuid, { model, data });

	return { model, data };
};
