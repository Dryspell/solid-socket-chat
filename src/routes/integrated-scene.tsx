import { clientOnly } from "@solidjs/start";

const ClientOnly = clientOnly(() => import("~/components/IntegratedScene/IntegratedScene"));
export default function MapControls() {
	return <ClientOnly />;
}
