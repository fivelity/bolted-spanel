import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { generateLayoutSuggestions } from '$lib/utils/aiLayoutSuggestions';
import type { AILayoutRequest } from '$lib/types/ai';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body: AILayoutRequest = await request.json();
    const suggestions = await generateLayoutSuggestions(body);
    return json(suggestions);
  } catch (error) {
    return json({ error: 'Failed to generate layout suggestions' }, { status: 500 });
  }
}; 