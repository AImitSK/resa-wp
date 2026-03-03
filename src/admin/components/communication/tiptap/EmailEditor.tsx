/**
 * TipTap Rich-Text Editor for email templates.
 *
 * Toolbar: Bold, Italic, Link | H2, H3 | BulletList, OrderedList | Variable dropdown
 * Min-height 300px, border, RESA focus-ring.
 */

import { useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
	Bold,
	Italic,
	Link as LinkIcon,
	Heading2,
	Heading3,
	List,
	ListOrdered,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { VariableNode } from './VariableNode';
import { VariableMenu } from './VariableMenu';

interface EmailEditorProps {
	content: string;
	onUpdate: (html: string) => void;
	availableVariables: string[];
	variableLabels: Record<string, string>;
	variableGroups: Record<string, string[]>;
}

export function EmailEditor({
	content,
	onUpdate,
	availableVariables,
	variableLabels,
	variableGroups,
}: EmailEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				code: false,
				codeBlock: false,
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					style: 'color: #3b82f6; text-decoration: underline;',
				},
			}),
			Placeholder.configure({
				placeholder: __('Schreibe deine E-Mail-Vorlage...', 'resa'),
			}),
			VariableNode,
		],
		content,
		onUpdate: ({ editor: ed }) => {
			onUpdate(ed.getHTML());
		},
	});

	const setLink = useCallback(() => {
		if (!editor) return;

		const previousUrl = editor.getAttributes('link').href;
		const url = window.prompt('URL', previousUrl || 'https://');

		if (url === null) return;

		if (url === '') {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}

		editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	}, [editor]);

	if (!editor) return null;

	return (
		<div className="resa-rounded-md resa-border resa-bg-background focus-within:resa-ring-2 focus-within:resa-ring-primary focus-within:resa-ring-offset-2">
			{/* Toolbar */}
			<div className="resa-flex resa-flex-wrap resa-items-center resa-gap-0.5 resa-border-b resa-p-1">
				{/* Text formatting */}
				<Button
					variant="ghost"
					size="sm"
					className={`resa-h-8 resa-w-8 resa-p-0 ${editor.isActive('bold') ? 'resa-bg-muted' : ''}`}
					onClick={() => editor.chain().focus().toggleBold().run()}
					title={__('Fett', 'resa')}
				>
					<Bold className="resa-size-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className={`resa-h-8 resa-w-8 resa-p-0 ${editor.isActive('italic') ? 'resa-bg-muted' : ''}`}
					onClick={() => editor.chain().focus().toggleItalic().run()}
					title={__('Kursiv', 'resa')}
				>
					<Italic className="resa-size-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className={`resa-h-8 resa-w-8 resa-p-0 ${editor.isActive('link') ? 'resa-bg-muted' : ''}`}
					onClick={setLink}
					title={__('Link', 'resa')}
				>
					<LinkIcon className="resa-size-4" />
				</Button>

				<Separator orientation="vertical" className="resa-mx-1 resa-h-6" />

				{/* Headings */}
				<Button
					variant="ghost"
					size="sm"
					className={`resa-h-8 resa-w-8 resa-p-0 ${editor.isActive('heading', { level: 2 }) ? 'resa-bg-muted' : ''}`}
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					title={__('Überschrift 2', 'resa')}
				>
					<Heading2 className="resa-size-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className={`resa-h-8 resa-w-8 resa-p-0 ${editor.isActive('heading', { level: 3 }) ? 'resa-bg-muted' : ''}`}
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
					title={__('Überschrift 3', 'resa')}
				>
					<Heading3 className="resa-size-4" />
				</Button>

				<Separator orientation="vertical" className="resa-mx-1 resa-h-6" />

				{/* Lists */}
				<Button
					variant="ghost"
					size="sm"
					className={`resa-h-8 resa-w-8 resa-p-0 ${editor.isActive('bulletList') ? 'resa-bg-muted' : ''}`}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					title={__('Aufzählung', 'resa')}
				>
					<List className="resa-size-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className={`resa-h-8 resa-w-8 resa-p-0 ${editor.isActive('orderedList') ? 'resa-bg-muted' : ''}`}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					title={__('Nummerierte Liste', 'resa')}
				>
					<ListOrdered className="resa-size-4" />
				</Button>

				<Separator orientation="vertical" className="resa-mx-1 resa-h-6" />

				{/* Variable dropdown */}
				<VariableMenu
					editor={editor}
					availableVariables={availableVariables}
					variableLabels={variableLabels}
					variableGroups={variableGroups}
				/>
			</div>

			{/* Editor content */}
			<EditorContent
				editor={editor}
				className="resa-prose resa-prose-sm resa-max-w-none resa-p-4 [&_.ProseMirror]:resa-min-h-[300px] [&_.ProseMirror]:resa-outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:resa-text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:resa-float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:resa-content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:resa-pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:resa-h-0"
			/>
		</div>
	);
}
