import { clientOnly } from "@solidjs/start";

const ClientOnly = clientOnly(() => import("~/components/mapControls"));
export default function MapControls() {
	return <ClientOnly />;
}
