import type * as THREE from "three";
import { type Characters } from "./characters";
import { type EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";

export function setWeight(
	action: {
		enabled: boolean;
		setEffectiveTimeScale: (arg0: number) => void;
		setEffectiveWeight: (arg0: any) => void;
	},
	weight: number
) {
	action.enabled = true;
	action.setEffectiveTimeScale(1);
	action.setEffectiveWeight(weight);
}

export const characterExists = (
	characters: Characters,
	position: THREE.Vector3
) => {
	const values = characters.values();
	for (let i = 0; i < characters.size; i++) {
		const model = values.next().value.model;
		if (model.position.x === position.x && model.position.z === position.z)
			return true;
	}
	return false;
};

/**
 * This function is needed, since animationAction.crossFadeTo() disables its start action and sets
 * the start action's timeScale to ((start animation's duration) / (end animation's duration))
 * @param {THREE.Camera} camera:THREE.Camera
 * @param {THREE.WebGLRenderer} renderer:THREE.WebGLRenderer
 * @returns {() => void}
 */
export function onWindowResize(
	camera: THREE.Camera,
	renderer: THREE.WebGLRenderer,
	effectComposer?: EffectComposer
) {
	return () => {
		// @ts-expect-error - TS2339: Property 'aspect' does not exist on type 'Camera'.
		camera.aspect = window.innerWidth / window.innerHeight;
		// @ts-expect-error - TS2339: Property 'updateProjectionMatrix' does not exist on type 'Camera'.
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
		effectComposer?.setSize(window.innerWidth, window.innerHeight);
	};
}
