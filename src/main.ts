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
		const paragraphs = section?.text.split("\n\n");
		const paragraphIndex = element.parentElement?.indexOf(element) || 2;
		const source = paragraphs?.[paragraphIndex - 2] || "";
		const regex = /(^|\s)(\*\*|__)/g;

		let index = 0;
		for (const match of source.matchAll(regex)) {
			console.log(match);

			const mark = match[2];
			if (mark === '__') {
				strongElements[index]?.classList.add('underline');
			}
			index++;
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
