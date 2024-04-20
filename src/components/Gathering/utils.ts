import type * as THREE from "three";
import { type Characters } from "./characters";

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
