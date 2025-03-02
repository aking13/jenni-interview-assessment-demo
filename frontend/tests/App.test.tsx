import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import App from '../src/App';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock data for paraphrasing
const mockParaphraseResponse = {
  originalText: 'This is a test sentence.',
  paraphrasedText: 'This sentence is a test.',
};

// Set up an MSW server to mock API responses
const server = setupServer(
  http.post('http://localhost:8000/paraphrase', async ({ request }) => {
    const data = (await request.json()) as { text: string };
    return HttpResponse.json({
      originalText: data.text,
      paraphrasedText: mockParaphraseResponse.paraphrasedText,
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.alert since jsdom doesn't implement it
window.alert = vi.fn();

// Mock the getSelection and execCommand functionality
const mockRange = {
  cloneRange: () => mockRange,
  getClientRects: () => [
    {
      right: 100,
      top: 100,
    },
  ],
};

const mockSelection = {
  toString: () => mockParaphraseResponse.originalText,
  getRangeAt: () => mockRange,
  rangeCount: 1,
  removeAllRanges: vi.fn(),
  addRange: vi.fn(),
};

describe('Text Editor App', () => {
  beforeAll(() => {
    // Mock window.getSelection
    Object.defineProperty(window, 'getSelection', {
      value: () => mockSelection,
      writable: true,
    });

    // Mock document.execCommand
    document.execCommand = vi.fn();
  });

  it('renders the text editor', () => {
    render(<App />);

    // Check if the app title is rendered
    expect(screen.getByText('Textme Editor')).toBeTruthy();

    // Check if the text editor is rendered
    const editor = screen.getByRole('textbox', { name: 'Text editor' });
    expect(editor).toBeTruthy();
  });

  it('allows text input in the editor', () => {
    render(<App />);

    const editor = screen.getByRole('textbox', { name: 'Text editor' });

    // Directly set the textContent property
    act(() => {
      editor.textContent = 'This is a test sentence.';
      // Trigger the input event
      fireEvent.input(editor);
    });

    expect(editor.textContent).toBe('This is a test sentence.');
  });

  it('shows AI button when text is selected and processes text when clicked', async () => {
    render(<App />);

    const editor = screen.getByRole('textbox', { name: 'Text editor' });

    // Set content and trigger selection
    act(() => {
      editor.textContent = 'This is a test sentence.';
      fireEvent.input(editor);
    });

    // Simulate text selection
    await act(async () => {
      const selectionChangeEvent = new Event('selectionchange');
      document.dispatchEvent(selectionChangeEvent);
    });

    // Check if AI button appears and click it
    const aiButton = await screen.findByLabelText('Process with AI');
    expect(aiButton).toBeTruthy();

    // Click the AI button and wait for the API call
    await act(async () => {
      fireEvent.click(aiButton);
      // Wait a bit for the async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Check if document.execCommand was called to replace the text
    expect(document.execCommand).toHaveBeenCalledWith('insertText', false, mockParaphraseResponse.paraphrasedText);
  });
});
