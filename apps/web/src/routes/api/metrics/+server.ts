import { json } from '@sveltejs/kit';
import { telemetry } from '$lib/server/metrics';

export const GET = async () => {
	try {
		const stats = telemetry.getStats();
		return json(stats);
	} catch (err) {
		console.error('Metrics API error:', err);
		return json({ error: 'Failed to fetch metrics' }, { status: 500 });
	}
};
