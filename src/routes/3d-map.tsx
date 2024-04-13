import { clientOnly } from "@solidjs/start";

const ClientOnly = clientOnly(() => import("~/components/3d-map"));
export default function ThreeDMap() {
	return <ClientOnly />;
}
