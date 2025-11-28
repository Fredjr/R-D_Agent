import { Mark, mergeAttributes } from '@tiptap/core';

export interface CitationOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    citation: {
      /**
       * Set a citation mark
       */
      setCitation: (attributes: { sourceId: string; citationNumber: number }) => ReturnType;
      /**
       * Toggle a citation mark
       */
      toggleCitation: (attributes: { sourceId: string; citationNumber: number }) => ReturnType;
      /**
       * Unset a citation mark
       */
      unsetCitation: () => ReturnType;
    };
  }
}

export const Citation = Mark.create<CitationOptions>({
  name: 'citation',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      sourceId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-source-id'),
        renderHTML: (attributes) => {
          if (!attributes.sourceId) return {};
          return { 'data-source-id': attributes.sourceId };
        },
      },
      citationNumber: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-citation-number'),
        renderHTML: (attributes) => {
          if (!attributes.citationNumber) return {};
          return { 'data-citation-number': attributes.citationNumber };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span.citation' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: 'citation',
          style: 'color: #DC2626; cursor: pointer; font-weight: 600;',
        }
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setCitation:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleCitation:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetCitation:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

export default Citation;

