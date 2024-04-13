import { onMount } from "solid-js";
import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";
import {
	type FunctionController,
	GUI,
} from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let scene: THREE.Scene,
	renderer: THREE.WebGLRenderer,
	camera: THREE.PerspectiveCamera,
	controls: OrbitControls,
	stats: Stats;
let model: THREE.Object3D<THREE.Object3DEventMap> | THREE.AnimationObjectGroup,
	skeleton: THREE.SkeletonHelper,
	mixer: THREE.AnimationMixer,
	clock: THREE.Clock;

const crossFadeControls:
	| { enable: () => void }[]
	| (
			| FunctionController<
					{
						"show model": boolean;
						"show skeleton": boolean;
						"deactivate all": () => void;
						"activate all": () => void;
						"pause/continue": () => void;
						"make single step": () => void;
						"modify step size": number;
						"from walk to idle": () => void;
						"from idle to walk": () => void;
						"from walk to run": () => void;
						"from run to walk": () => void;
						"use default duration": boolean;
						"set custom duration": number;
						"modify idle weight": number;
						"modify walk weight": number;
						"modify run weight": number;
						"modify time scale": number;
					},
					"from walk to idle"
			  >
			| FunctionController<
					{
						"show model": boolean;
						"show skeleton": boolean;
						"deactivate all": () => void;
						"activate all": () => void;
						"pause/continue": () => void;
						"make single step": () => void;
						"modify step size": number;
						"from walk to idle": () => void;
						"from idle to walk": () => void;
						"from walk to run": () => void;
						"from run to walk": () => void;
						"use default duration": boolean;
						"set custom duration": number;
						"modify idle weight": number;
						"modify walk weight": number;
						"modify run weight": number;
						"modify time scale": number;
					},
					"from idle to walk"
			  >
			| FunctionController<
					{
						"show model": boolean;
						"show skeleton": boolean;
						"deactivate all": () => void;
						"activate all": () => void;
						"pause/continue": () => void;
						"make single step": () => void;
						"modify step size": number;
						"from walk to idle": () => void;
						"from idle to walk": () => void;
						"from walk to run": () => void;
						"from run to walk": () => void;
						"use default duration": boolean;
						"set custom duration": number;
						"modify idle weight": number;
						"modify walk weight": number;
						"modify run weight": number;
						"modify time scale": number;
					},
					"from walk to run"
			  >
			| FunctionController<
					{
						"show model": boolean;
						"show skeleton": boolean;
						"deactivate all": () => void;
						"activate all": () => void;
						"pause/continue": () => void;
						"make single step": () => void;
						"modify step size": number;
						"from walk to idle": () => void;
						"from idle to walk": () => void;
						"from walk to run": () => void;
						"from run to walk": () => void;
						"use default duration": boolean;
						"set custom duration": number;
						"modify idle weight": number;
						"modify walk weight": number;
						"modify run weight": number;
						"modify time scale": number;
					},
					"from run to walk"
			  >
	  )[] = [];

let idleAction: THREE.AnimationAction,
	walkAction: THREE.AnimationAction,
	runAction: THREE.AnimationAction;
let idleWeight: number, walkWeight: number, runWeight: number;
let actions: any[],
	settings: {
		[x: string]: any;
		"show model"?: boolean;
		"show skeleton"?: boolean;
		"deactivate all"?: () => void;
		"activate all"?: () => void;
		"pause/continue"?: () => void;
		"make single step"?: () => void;
		"modify step size"?: number;
		"from walk to idle"?: () => void;
		"from idle to walk"?: () => void;
		"from walk to run"?: () => void;
		"from run to walk"?: () => void;
		"use default duration"?: boolean;
		"set custom duration"?: number;
		"modify idle weight"?: number;
		"modify walk weight"?: number;
		"modify run weight"?: number;
		"modify time scale"?: number;
	};

let singleStepMode = false;
let sizeOfNextStep = 0;

function init() {
	const container = document.getElementById("container");
	if (!container) throw new Error("Container not found");

	camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth / window.innerHeight,
		1,
		100
	);
	camera.position.set(1, 2, -3);
	camera.lookAt(0, 1, 0);

	clock = new THREE.Clock();

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xa0a0a0);
	scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

	const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
	hemiLight.position.set(0, 20, 0);
	scene.add(hemiLight);

	const dirLight = new THREE.DirectionalLight(0xffffff, 3);
	dirLight.position.set(-3, 10, -10);
	dirLight.castShadow = true;
	dirLight.shadow.camera.top = 2;
	dirLight.shadow.camera.bottom = -2;
	dirLight.shadow.camera.left = -2;
	dirLight.shadow.camera.right = 2;
	dirLight.shadow.camera.near = 0.1;
	dirLight.shadow.camera.far = 40;
	scene.add(dirLight);

	// scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

	// ground

	const mesh = new THREE.Mesh(
		new THREE.PlaneGeometry(100, 100),
		new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
	);
	mesh.rotation.x = -Math.PI / 2;
	mesh.receiveShadow = true;
	scene.add(mesh);

	const loader = new GLTFLoader();
	loader.load("models/Character_Female_1.gltf", function (gltf) {
		model = gltf.scene;
		scene.add(model);

		model.traverse(function (object) {
			// @ts-expect-error - TS2339: Property 'isMesh' does not exist on type 'Object3D<Object3DEventMap>'.
			if (object.isMesh) object.castShadow = true;
		});

		//

		skeleton = new THREE.SkeletonHelper(model);
		skeleton.visible = false;
		scene.add(skeleton);

		//

		createPanel();

		//

		const animations = gltf.animations;
		console.log(animations);

		mixer = new THREE.AnimationMixer(model);

		idleAction = mixer.clipAction(
			animations.find((a) => a.name === "Idle")!
		);
		console.log(idleAction, idleAction.getEffectiveWeight());
		walkAction = mixer.clipAction(
			animations.find((a) => a.name === "Walk")!
		);
		runAction = mixer.clipAction(animations.find((a) => a.name === "Run")!);

		actions = [idleAction, walkAction, runAction];

		activateAllActions();
		animate();
	});

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	container.appendChild(renderer.domElement);

	// Camera Controls
	controls = new OrbitControls(camera, renderer.domElement);
	controls.listenToKeyEvents(window); // optional

	//controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.05;

	controls.screenSpacePanning = false;

	// controls.minDistance = 100;
	// controls.maxDistance = 500;

	controls.maxPolarAngle = Math.PI / 2;
	//

	stats = new Stats();
	container.appendChild(stats.dom);

	window.addEventListener("resize", onWindowResize);
}

function createPanel() {
	const panel = new GUI({ width: 310 });

	const folder1 = panel.addFolder("Visibility");
	const folder2 = panel.addFolder("Activation/Deactivation");
	const folder3 = panel.addFolder("Pausing/Stepping");
	const folder4 = panel.addFolder("Crossfading");
	const folder5 = panel.addFolder("Blend Weights");
	const folder6 = panel.addFolder("General Speed");

	settings = {
		"show model": true,
		"show skeleton": false,
		"deactivate all": deactivateAllActions,
		"activate all": activateAllActions,
		"pause/continue": pauseContinue,
		"make single step": toSingleStepMode,
		"modify step size": 0.05,
		"from walk to idle": function () {
			prepareCrossFade(walkAction, idleAction, 1.0);
		},
		"from idle to walk": function () {
			prepareCrossFade(idleAction, walkAction, 0.5);
		},
		"from walk to run": function () {
			prepareCrossFade(walkAction, runAction, 2.5);
		},
		"from run to walk": function () {
			prepareCrossFade(runAction, walkAction, 5.0);
		},
		"use default duration": true,
		"set custom duration": 3.5,
		"modify idle weight": 0.0,
		"modify walk weight": 1.0,
		"modify run weight": 0.0,
		"modify time scale": 1.0,
	};

	folder1.add(settings, "show model").onChange(showModel);
	folder1.add(settings, "show skeleton").onChange(showSkeleton);
	folder2.add(settings, "deactivate all");
	folder2.add(settings, "activate all");
	folder3.add(settings, "pause/continue");
	folder3.add(settings, "make single step");
	folder3.add(settings, "modify step size", 0.01, 0.1, 0.001);
	crossFadeControls.push(folder4.add(settings, "from walk to idle"));
	crossFadeControls.push(folder4.add(settings, "from idle to walk"));
	crossFadeControls.push(folder4.add(settings, "from walk to run"));
	crossFadeControls.push(folder4.add(settings, "from run to walk"));
	folder4.add(settings, "use default duration");
	folder4.add(settings, "set custom duration", 0, 10, 0.01);
	folder5
		.add(settings, "modify idle weight", 0.0, 1.0, 0.01)
		.listen()
		.onChange(function (weight) {
			setWeight(idleAction, weight);
		});
	folder5
		.add(settings, "modify walk weight", 0.0, 1.0, 0.01)
		.listen()
		.onChange(function (weight) {
			setWeight(walkAction, weight);
		});
	folder5
		.add(settings, "modify run weight", 0.0, 1.0, 0.01)
		.listen()
		.onChange(function (weight) {
			setWeight(runAction, weight);
		});
	folder6
		.add(settings, "modify time scale", 0.0, 1.5, 0.01)
		.onChange(modifyTimeScale);

	folder1.open();
	folder2.open();
	folder3.open();
	folder4.open();
	folder5.open();
	folder6.open();
}

function showModel(visibility: any) {
	model.visible = visibility;
}

function showSkeleton(visibility: any) {
	skeleton.visible = visibility;
}

function modifyTimeScale(speed: any) {
	mixer.timeScale = speed;
}

function deactivateAllActions() {
	actions.forEach(function (action: { stop: () => void }) {
		action.stop();
	});
}

function activateAllActions() {
	setWeight(idleAction, settings["modify idle weight"]);
	setWeight(walkAction, settings["modify walk weight"]);
	setWeight(runAction, settings["modify run weight"]);

	actions.forEach(function (action: { play: () => void }) {
		action.play();
	});
}

function pauseContinue() {
	if (singleStepMode) {
		singleStepMode = false;
		unPauseAllActions();
	} else {
		if (idleAction.paused) {
			unPauseAllActions();
		} else {
			pauseAllActions();
		}
	}
}

function pauseAllActions() {
	actions.forEach(function (action: { paused: boolean }) {
		action.paused = true;
	});
}

function unPauseAllActions() {
	actions.forEach(function (action: { paused: boolean }) {
		action.paused = false;
	});
}

function toSingleStepMode() {
	unPauseAllActions();

	singleStepMode = true;
	sizeOfNextStep = settings["modify step size"];
}

function prepareCrossFade(
	startAction: any,
	endAction: any,
	defaultDuration: number
) {
	// Switch default / custom crossfade duration (according to the user's choice)

	const duration = setCrossFadeDuration(defaultDuration);

	// Make sure that we don't go on in singleStepMode, and that all actions are unpaused

	singleStepMode = false;
	unPauseAllActions();

	// If the current action is 'idle' (duration 4 sec), execute the crossfade immediately;
	// else wait until the current action has finished its current loop

	if (startAction === idleAction) {
		executeCrossFade(startAction, endAction, duration);
	} else {
		synchronizeCrossFade(startAction, endAction, duration);
	}
}

function setCrossFadeDuration(defaultDuration: any) {
	// Switch default crossfade duration <-> custom crossfade duration

	if (settings["use default duration"]) {
		return defaultDuration;
	} else {
		return settings["set custom duration"];
	}
}

function synchronizeCrossFade(startAction: any, endAction: any, duration: any) {
	mixer.addEventListener("loop", onLoopFinished);

	function onLoopFinished(event: { action: any }) {
		if (event.action === startAction) {
			mixer.removeEventListener("loop", onLoopFinished);

			executeCrossFade(startAction, endAction, duration);
		}
	}
}

function executeCrossFade(
	startAction: { crossFadeTo: (arg0: any, arg1: any, arg2: boolean) => void },
	endAction: { time: number },
	duration: any
) {
	// Not only the start action, but also the end action must get a weight of 1 before fading
	// (concerning the start action this is already guaranteed in this place)

	setWeight(endAction, 1);
	endAction.time = 0;

	// Crossfade with warping - you can also try without warping by setting the third parameter to false

	startAction.crossFadeTo(endAction, duration, true);
}

// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
// the start action's timeScale to ((start animation's duration) / (end animation's duration))

function setWeight(
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

// Called by the render loop

function updateWeightSliders() {
	settings["modify idle weight"] = idleWeight;
	settings["modify walk weight"] = walkWeight;
	settings["modify run weight"] = runWeight;
}

// Called by the render loop

function updateCrossFadeControls() {
	if (idleWeight === 1 && walkWeight === 0 && runWeight === 0) {
		crossFadeControls[0].disable();
		crossFadeControls[1].enable();
		crossFadeControls[2].disable();
		crossFadeControls[3].disable();
	}

	if (idleWeight === 0 && walkWeight === 1 && runWeight === 0) {
		crossFadeControls[0].enable();
		crossFadeControls[1].disable();
		crossFadeControls[2].enable();
		crossFadeControls[3].disable();
	}

	if (idleWeight === 0 && walkWeight === 0 && runWeight === 1) {
		crossFadeControls[0].disable();
		crossFadeControls[1].disable();
		crossFadeControls[2].disable();
		crossFadeControls[3].enable();
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	// Render loop

	requestAnimationFrame(animate);

	idleWeight = idleAction.getEffectiveWeight();
	walkWeight = walkAction.getEffectiveWeight();
	runWeight = runAction.getEffectiveWeight();

	// Update the panel values if weights are modified from "outside" (by crossfadings)

	updateWeightSliders();

	// Enable/disable crossfade controls according to current weight values

	updateCrossFadeControls();

	// Get the time elapsed since the last frame, used for mixer update (if not in single step mode)

	let mixerUpdateDelta = clock.getDelta();

	// If in single step mode, make one step and then do nothing (until the user clicks again)

	if (singleStepMode) {
		mixerUpdateDelta = sizeOfNextStep;
		sizeOfNextStep = 0;
	}

	// Update the animation mixer, the stats panel, and render this frame

	mixer.update(mixerUpdateDelta);

	stats.update();

	renderer.render(scene, camera);
}

export default function GLTFModel() {
	onMount(() => {
		init();
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
