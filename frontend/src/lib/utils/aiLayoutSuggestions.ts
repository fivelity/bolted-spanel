import { genkit } from 'genkit';
import type { AILayoutRequest, LayoutSuggestion } from '../types/ai';

export async function generateLayoutSuggestions(
  request: AILayoutRequest
): Promise<LayoutSuggestion[]> {
  const prompt = `
    You are a UI/UX expert specializing in system monitoring dashboards.
    
    Current dashboard state:
    - Widgets: ${request.currentWidgets.length}
    - Size: ${request.dashboardSize.width}x${request.dashboardSize.height}
    - Theme: ${request.preferences.theme}
    - Priority: ${request.preferences.priority}
    
    Generate 3 layout suggestions optimized for PC hardware monitoring.
    Focus on grouping related sensors and creating visual hierarchy.
    
    Return suggestions as JSON array with reasoning.
  `;
  
  try {
    const ai = genkit();
    const result = await ai.generate({
      model: 'google/gemini-pro',
      prompt: [{ text: prompt }],
      config: { temperature: 0.7 }
    });
    
    return result.output as LayoutSuggestion[]; // Adjust if output is string: JSON.parse(result.output)
  } catch (error) {
    console.error('AI layout generation failed:', error);
    return [];
  }
} 