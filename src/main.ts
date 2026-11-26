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
    // 1. Register CodeMirror extension for Live Preview / Editing mode
    this.registerEditorExtension(doubleUnderlineViewPlugin);

    // 2. Register Markdown Post Processor for Reading mode
    this.registerMarkdownPostProcessor(this.underlinePostProcessor);
  }

  // Reading Mode Processor
  private underlinePostProcessor = (element: HTMLElement, context: MarkdownPostProcessorContext) => {
    // Find text nodes or inline elements containing __text__
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let node: Node | null;

    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        // Regex matching __text__ but avoiding code blocks or math if necessary
        const regex = /__([^_]+?)__/g;
        if (regex.test(node.textContent)) {
          // Collect matches to process
          // (Doing it safely outside the walk loop)
        }
      }
    }

    // Alternative simpler approach for Reading mode via innerHTML transformation on safe containers:
    const paragraphs = element.querySelectorAll('p, li, blockquote');
    paragraphs.forEach((p) => {
      // Avoid replacing inside code tags
      if (p.querySelector('code')) return;
      
      const html = p.innerHTML;
      // Replace __text__ with <u class="cm-underline">text</u>
      // Ensure we don't accidentally break existing single underscores or markdown italics/bold
      const updatedHtml = html.replace(/__([^_]+?)__/g, '<span class="obsidian-custom-underline">$1</span>');
      if (updatedHtml !== html) {
        p.innerHTML = updatedHtml;
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
    const pattern = /__([^_]+?)__/g;

    for (let { from, to } of view.visibleRanges) {
      let text = view.state.doc.sliceString(from, to);
      let match;

      while ((match = pattern.exec(text)) !== null) {
        let start = from + match.index;
        let end = start + match[0].length;
        
        // Optional: If you want to hide the underscores and only underline the inner text,
        // adjust start/end ranges accordingly. This decorates the whole __text__ block.
        builder.add(start, end, underlineDecoration);
      }
    }
    return builder.finish();
  }
}

const doubleUnderlineViewPlugin = ViewPlugin.fromClass(DoubleUnderlineExtension, {
  decorations: v => v.decorations,
});
