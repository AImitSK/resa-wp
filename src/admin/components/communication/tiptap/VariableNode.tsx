/**
 * Custom TipTap Node for template variables.
 *
 * Renders {{variable_name}} as inline, non-editable badges.
 * Supports round-trip: HTML → TipTap → HTML.
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';

/**
 * React component that renders the variable badge in the editor.
 */
function VariableBadge({ node }: NodeViewProps) {
	const variableName = (node.attrs.variableName as string) || '';

	return (
		<NodeViewWrapper as="span" className="resa-inline">
			<span
				className="resa-inline-flex resa-items-center resa-rounded resa-border resa-bg-muted resa-px-1.5 resa-py-0.5 resa-font-mono resa-text-xs resa-text-muted-foreground"
				contentEditable={false}
				data-variable={variableName}
			>
				{`{{${variableName}}}`}
			</span>
		</NodeViewWrapper>
	);
}

/**
 * TipTap extension: Variable node.
 *
 * - Inline, atomic (not editable, only deletable as a whole)
 * - Parses `<span data-variable="name">{{name}}</span>` back to node
 * - Renders to `<span data-variable="name">{{name}}</span>` in HTML output
 */
export const VariableNode = Node.create({
	name: 'variable',
	group: 'inline',
	inline: true,
	atom: true,
	selectable: true,
	draggable: false,

	addAttributes() {
		return {
			variableName: {
				default: '',
				parseHTML: (element) => element.getAttribute('data-variable') || '',
				renderHTML: (attributes) => ({
					'data-variable': attributes.variableName,
				}),
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: 'span[data-variable]',
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ['span', mergeAttributes(HTMLAttributes), `{{${HTMLAttributes['data-variable']}}}`];
	},

	addNodeView() {
		return ReactNodeViewRenderer(VariableBadge);
	},
});
