import { Plugin, MarkdownPostProcessorContext } from 'obsidian';
import { 
  EditorView, 
  Decoration, 
  DecorationSet, 
  ViewPlugin, 
  ViewUpdate 
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

export default class DoubleUnderlinePlugin extends Plugin {
  async onload() {
    // 1. Register CodeMirror extension for Live Preview
    this.registerEditorExtension(doubleUnderlineViewPlugin);

    // 2. Register Markdown Post Processor for Reading mode
    this.registerMarkdownPostProcessor(this.underlinePostProcessor);
  }

  // Reading Mode Processor - Handles all nested combinations accurately
  private underlinePostProcessor = (element: HTMLElement, context: MarkdownPostProcessorContext) => {
    const section = context.getSectionInfo(element);
    if (!section) return;

    // Find all strong elements in the rendered block
    const strongElements = element.querySelectorAll('strong');

    strongElements.forEach((strongEl) => {
      // Check if this specific strong element corresponds to a double underscore in source
      // We do this by verifying the exact source snippet or inspecting the section context
      const innerHTML = strongEl.innerHTML;
      
      // Look at the source text for this section
      // If the source contains __[content]__ corresponding to this node, convert to underline span
      const parentBlock = section.text;
      
      // Helper to check if the rendered strong element originated from __...__
      // By inspecting whether the raw source text wraps this inner content in __ rather than **
      if (isDoubleUnderscoreSource(parentBlock, innerHTML, strongEl)) {
        const underlineSpan = createSpan();
        underlineSpan.addClass('obsidian-custom-underline');
        
        while (strongEl.firstChild) {
          underlineSpan.appendChild(strongEl.firstChild);
        }
        strongEl.replaceWith(underlineSpan);
      }
    });
  };
}

/**
 * Helper to determine if a rendered strong element came from __...__ in source 
 * rather than **...**, while handling nested structures correctly.
 */
function isDoubleUnderscoreSource(sourceText: string, innerHTML: string, el: HTMLElement): boolean {
  // Extract plain text or check surrounding characters in the source text
  // A robust check verifies if the delimiters around this segment in source are '__'
  const textContent = el.textContent || '';
  
  // Search for patterns like __...__ enclosing this text content in the source block
  const escapedText = textContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`__(${escapedText})__|__([^_]+?)__`, 'g');
  
  let match;
  while ((match = regex.exec(sourceText)) !== null) {
    // Verify if this match corresponds to our element's position/content
    if (match[1] === textContent || match[2] === textContent) {
      return true;
    }
  }
  
  // Fallback heuristic for nested bold/underline cases (e.g. __**ui**__ vs **__ui__**)
  // Check if the exact outer wrapper in source uses double underscores
  return sourceText.includes(`__${textContent}__`) || 
         (sourceText.includes('__') && el.parentElement?.tagName !== 'STRONG' && sourceText.trim().startsWith('__'));
}

// --- Live Preview (CodeMirror 6) Implementation ---

const underlineDecoration = Decoration.mark({
  class: 'obsidian-custom-underline',
});

class DoubleUnderlineExtension {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    // Regex that handles nested markers cleanly without leaving hanging tokens
    const pattern = /__((?:[^\n_]|_(?!_))+?)__/g;

    for (let { from, to } of view.visibleRanges) {
      let text = view.state.doc.sliceString(from, to);
      let match;

      while ((match = pattern.exec(text)) !== null) {
        let start = from + match.index;
        let end = start + match[0].length;
        
        builder.add(start, end, underlineDecoration);
      }
    }
    return builder.finish();
  }
}

const doubleUnderlineViewPlugin = ViewPlugin.fromClass(DoubleUnderlineExtension, {
  decorations: v => v.decorations,
});
