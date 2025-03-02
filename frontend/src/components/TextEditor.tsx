import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { paraphraseText } from '../api';

//-----------------------------------------------------------------------------
// Types and Interfaces
//-----------------------------------------------------------------------------

/**
 * Props for the TextEditor component
 */
interface TextEditorProps {
  initialText?: string; // Initial text to display in the editor
  placeholder?: string; // Placeholder text when editor is empty
  readOnly?: boolean; // Whether the editor is read-only
}

/**
 * Represents a text selection within the editor
 */
interface TextSelection {
  text: string; // The selected text content
  range?: Range; // DOM Range object for the selection
  position?: {
    // Position for the AI button
    x: number;
    y: number;
  };
}

//-----------------------------------------------------------------------------
// Main Component
//-----------------------------------------------------------------------------

/**
 * TextEditor component
 *
 * A rich text editor that allows users to select text and paraphrase it using AI
 */
const TextEditor: React.FC<TextEditorProps> = ({
  initialText = '',
  placeholder = 'Start typing or paste text here...',
  readOnly = false,
}) => {
  // State management
  const [content, setContent] = useState<string>(initialText);
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isEmpty, setIsEmpty] = useState<boolean>(!initialText);

  // References
  const editorRef = useRef<HTMLDivElement>(null);

  /**
   * Monitor text selection changes in the document
   */
  useEffect(() => {
    const handleSelectionChange = () => {
      const newSelection = getTextSelection();
      setSelection(newSelection);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  /**
   * Update content state when editor content changes
   */
  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    if (readOnly) return;

    const newContent = e.currentTarget.innerText || '';
    setContent(newContent);
    setIsEmpty(newContent.trim() === '');
  };

  /**
   * Process selected text with AI paraphrasing
   *
   * @param text - The text to be paraphrased
   */
  const handleProcessText = async (text: string) => {
    if (!selection || !text.trim()) return;

    setIsProcessing(true);

    try {
      // Call the API to paraphrase the text
      const result = await paraphraseText(text);

      // Replace the selected text with the paraphrased version
      replaceSelectedText(selection, result.paraphrasedText);

      // Clear selection after processing
      setSelection(null);
    } catch (error) {
      console.error('Error in paraphrasing text:', error);
      // Show error to user
      alert('Failed to process text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Focus the editor on first render
   */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  return (
    <div className="py-10 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto">
      <div className="editor-container relative">
        {/* Editor content area */}
        <div
          ref={editorRef}
          className={cn(
            'editor-content min-h-[300px] p-4 rounded-md border border-border bg-card text-card-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
            readOnly && 'opacity-80 cursor-not-allowed'
          )}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleContentChange}
          role="textbox"
          aria-multiline="true"
          aria-label="Text editor"
          data-placeholder={placeholder}
        >
          {initialText}
        </div>

        {/* Placeholder text (shown when editor is empty) */}
        {isEmpty && !readOnly && <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">{placeholder}</div>}

        {/* AI button that appears near selected text */}
        {selection && !isProcessing && <AIButton selection={selection} onProcessText={handleProcessText} />}
      </div>

      {/* Loading indicator (shown during AI processing) */}
      {isProcessing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="flex flex-col items-center p-6 rounded-lg bg-card shadow-lg animate-scale-in">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-lg font-medium">
              Processing with AI
              <span className="animate-pulse-subtle">...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

//-----------------------------------------------------------------------------
// Supporting Components
//-----------------------------------------------------------------------------

/**
 * AI Button component
 *
 * Displays a floating button near text selections to trigger AI processing
 */
const AIButton: React.FC<{
  selection: TextSelection;
  onProcessText: (text: string) => void;
}> = ({ selection, onProcessText }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  /**
   * Position the button near the text selection
   */
  useEffect(() => {
    // Position the button near the selection
    if (buttonRef.current && selection?.position) {
      const { x, y } = selection.position;
      const button = buttonRef.current;

      // Ensure button stays within viewport
      const rect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let posX = x;
      let posY = y;

      // Adjust if outside viewport
      if (posX + rect.width > viewportWidth - 20) {
        posX = viewportWidth - rect.width - 20;
      }

      if (posY - rect.height < 20) {
        posY = y + 30; // Show below selection instead
      }

      button.style.left = `${posX}px`;
      button.style.top = `${posY}px`;
    }
  }, [selection]);

  return (
    <button
      ref={buttonRef}
      className="ai-button fixed z-10 px-3 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm flex items-center gap-2 animate-slide-up"
      onClick={() => onProcessText(selection.text)}
      aria-label="Process with AI"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse-subtle">
        <path
          d="M8 1.33337L10.06 5.5134L14.6667 6.18007L11.3333 9.42673L12.12 14.0134L8 11.8467L3.88 14.0134L4.66667 9.42673L1.33334 6.18007L5.94 5.5134L8 1.33337Z"
          fill="currentColor"
          fillOpacity="0.9"
        />
      </svg>
      <span>AI</span>
    </button>
  );
};

//-----------------------------------------------------------------------------
// Utility Functions
//-----------------------------------------------------------------------------

/**
 * Gets the current text selection from the document
 *
 * @returns TextSelection object or null if no valid selection exists
 */
const getTextSelection = (): TextSelection | null => {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rects = range.getClientRects();

  if (rects.length === 0) {
    return null;
  }

  // Calculate position for the AI button (above and to the right of selection)
  const lastRect = rects[rects.length - 1];
  const position = {
    x: lastRect.right + 10,
    y: lastRect.top - 10,
  };

  return {
    text: selection.toString(),
    range: range.cloneRange(),
    position,
  };
};

/**
 * Replaces the selected text with new text
 *
 * @param selection - The text selection to replace
 * @param newText - The new text to insert
 */
const replaceSelectedText = (selection: TextSelection, newText: string): void => {
  if (!selection.range) return;

  const sel = window.getSelection();
  if (!sel) return;

  try {
    // Set the range and replace with new text
    sel.removeAllRanges();
    sel.addRange(selection.range);

    // Execute command to replace text
    document.execCommand('insertText', false, newText);
  } catch (error) {
    console.error('Error replacing text:', error);
  }
};

export default TextEditor;
