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

    // 2. Register Markdown Post Processor for Reading mode (Safe DOM manipulation)
    this.registerMarkdownPostProcessor(this.underlinePostProcessor);
  }

  // Reading Mode Processor - Safe DOM transformation (No innerHTML)
  private underlinePostProcessor = (element: HTMLElement, context: MarkdownPostProcessorContext) => {
    const strongElements = element.querySelectorAll('strong');

    strongElements.forEach((strongEl) => {
      const section = context.getSectionInfo(strongEl);
      if (section) {
        const sourceText = section.text;
        const innerText = strongEl.textContent || '';
        const rawSnippet = `__${innerText}__`;
        
        // Verify if this strong tag originated from double underscores
        if (sourceText.includes(rawSnippet)) {
          // Safely create a new span element (no innerHTML)
          const underlineSpan = createSpan();
          underlineSpan.addClass('obsidian-custom-underline');
          
          // Move all child nodes (including nested elements like bold **bar**) safely
          while (strongEl.firstChild) {
            underlineSpan.appendChild(strongEl.firstChild);
          }
          
          strongEl.replaceWith(underlineSpan);
        }
      }
    });
  };
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
    // Regex that matches __text__ while accommodating spaces and nested formatting tokens
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
