import type * as THREE from "three";

import type Stats from "three/addons/libs/stats.module.js";

import { type OrbitControls } from "three/addons/controls/OrbitControls.js";
import { type EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { onMount } from "solid-js";
import { init } from "./main";
import { type defaultParams } from "./tools";

function animate(
	controls: OrbitControls,
	composer: EffectComposer,
	params: ReturnType<typeof defaultParams>,
	stats: Stats,
	group: THREE.Group
) {
	const animationCallback = () => animate(controls, composer, params, stats, group);
	requestAnimationFrame(animationCallback);

	stats.begin();

	const timer = performance.now();

	if (params.rotate) {
		group.rotation.y = timer * 0.0001;
	}

	controls.update();
	composer.render();

	stats.end();
}

export default function Entry() {
	onMount(() => {
		const {
			camera,
			scene,
			renderer,
			composer,
			controls,
			gui,
			params,
			stats,
			group,
		} = init();
		animate(controls, composer, params, stats, group);
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
		</div>
	);
}
