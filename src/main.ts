import { Plugin, MarkdownPostProcessorContext } from 'obsidian';
import { 
    EditorView, 
    Decoration, 
    DecorationSet, 
    ViewPlugin, 
    ViewUpdate 
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

export default class EnhancedMarker extends Plugin {
    async onload() {
        // 1. Register CodeMirror extension for Live Preview
        this.registerEditorExtension(UnderlineViewPlugin);

        // 2. Register Markdown Post Processor for Reading mode (Safe DOM manipulation)
        this.registerMarkdownPostProcessor(this.underlinePostProcessor);
    }

    // Reading Mode Processor - Safe DOM transformation (No innerHTML)
    private underlinePostProcessor = (element: HTMLElement, context: MarkdownPostProcessorContext) => {
        const strongElements = element.findAll('strong');
        const section = context.getSectionInfo(element);
        if (!section) return;

        const source = section.text.split("\n").slice(section.lineStart, section.lineEnd + 1).join("\n");
        const regex = /\*\*|__/g;

        element.dataset.source = source;
        console.log("process", { element, context, strongElements, section, source, });

        let strongElementIndex = 0;
        let acceptableIndex = 0;
        for (const match of source.matchAll(regex)) {
            if (match.index < acceptableIndex) continue;

            const mark = match[0];
            const charBefore = source[match.index - 1] || "";
            const isOpening = match.index == acceptableIndex || /^$|\s|\n/.test(charBefore);
            acceptableIndex = match.index + mark.length;

            console.log("match", { match, mark, charBefore, index: strongElementIndex, next: acceptableIndex })

            if (isOpening) {
                if (mark === '__') {
                    strongElements[strongElementIndex]?.classList.add('underline');
                }
                strongElementIndex++;
            }
        }
    };
}

// --- Live Preview (CodeMirror 6) Implementation ---

const underlineDecoration = Decoration.mark({
    class: 'underline',
});

class UnderlineExtension {
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

const UnderlineViewPlugin = ViewPlugin.fromClass(UnderlineExtension, {
    decorations: v => v.decorations,
});

// vim: et sw=4 sts=4 ts=4
