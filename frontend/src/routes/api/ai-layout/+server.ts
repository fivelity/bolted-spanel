import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateLayoutSuggestions } from '$lib/utils/aiLayoutSuggestions';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const description = body.description || 'Default dashboard layout';
		const availableWidgets = body.availableWidgets || [];
		
		const suggestions = await generateLayoutSuggestions(description, availableWidgets);
		return json(suggestions);
	} catch (error) {
		console.error('AI layout generation failed:', error);
		return json({ error: 'Failed to generate layout suggestions' }, { status: 500 });
	}
}; 