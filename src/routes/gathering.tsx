import { clientOnly } from "@solidjs/start";

const ClientOnly = clientOnly(() => import("~/components/Gathering/Entry"));
export default function MapControls() {
	return <ClientOnly />;
}
