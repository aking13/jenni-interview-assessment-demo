import { logger } from './utils/logger';

//-----------------------------------------------------------------------------
// Types and Interfaces
//-----------------------------------------------------------------------------

/**
 * Response structure from the paraphrase API endpoint
 */
export interface ParaphraseResponse {
  paraphrasedText: string; // The AI-generated paraphrased version of the text
  originalText: string; // The original text that was submitted for paraphrasing
}

//-----------------------------------------------------------------------------
// Configuration
//-----------------------------------------------------------------------------

/**
 * Base URL for API requests, loaded from environment variables
 */
const API_URL = import.meta.env.VITE_API_URL;

//-----------------------------------------------------------------------------
// API Functions
//-----------------------------------------------------------------------------

/**
 * Sends text to the backend API for paraphrasing
 *
 * Makes a POST request to the paraphrase endpoint with the provided text
 * and returns the paraphrased version along with the original text.
 *
 * @param text - The text to be paraphrased
 * @returns A promise that resolves to a ParaphraseResponse object
 * @throws Error if the API request fails
 */
export const paraphraseText = async (text: string): Promise<ParaphraseResponse> => {
  const url = `${API_URL}/paraphrase`;
  const body = { text };

  // Log the outgoing request (without exposing the full text content)
  logger.api.request('POST', url, { textLength: text.length });

  try {
    // Send the request to the backend
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // Handle error responses
    if (!response.ok) {
      const error = await response.text();
      logger.api.error('POST', url, { status: response.status, error });
      throw new Error('Failed to paraphrase text');
    }

    // Parse and return the successful response
    const data = await response.json();
    logger.api.response('POST', url, { success: true, responseLength: data.paraphrasedText?.length });
    return data;
  } catch (error) {
    // Log and re-throw any errors that occur
    logger.api.error('POST', url, error);
    throw error;
  }
};
