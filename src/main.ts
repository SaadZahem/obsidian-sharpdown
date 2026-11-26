import { Plugin, MarkdownPostProcessorContext } from 'obsidian';

export default class SuperMarkdown extends Plugin {
    async onload() {
        this.registerMarkdownPostProcessor(this.underlinePostProcessor);
    }

    // Reading Mode Processor - Safe DOM transformation (No innerHTML)
    private underlinePostProcessor = (element: HTMLElement, context: MarkdownPostProcessorContext) => {
        const strongElements = element.findAll('strong');
        const section = context.getSectionInfo(element);
        if (!section) return;

        const source = section.text.split("\n").slice(section.lineStart, section.lineEnd + 1).join("\n");
        const regex = /\*\*|__/g;

        // element.dataset.source = source;
        // console.log("process", { element, context, strongElements, section, source, });

        let strongElementIndex = 0;
        let acceptableIndex = 0;
        for (const match of source.matchAll(regex)) {
            if (match.index < acceptableIndex) continue;

            const mark = match[0];
            const charBefore = source[match.index - 1] || "";
            const isOpening = match.index == acceptableIndex || /^$|\s|\n/.test(charBefore);
            acceptableIndex = match.index + mark.length;

            // console.log("match", { match, mark, charBefore, index: strongElementIndex, next: acceptableIndex })

            if (isOpening) {
                if (mark === '__') {
                    strongElements[strongElementIndex]?.classList.add('underline');
                }
                strongElementIndex++;
            }
        }
    };
}
