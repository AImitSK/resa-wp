/**
 * Dropdown menu for inserting template variables into the TipTap editor.
 *
 * Groups variables by category (Lead, Modul, Makler, System)
 * and only shows variables available for the current template.
 */

import { __ } from '@wordpress/i18n';
import { Braces } from 'lucide-react';
import type { Editor } from '@tiptap/react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VariableMenuProps {
	editor: Editor;
	availableVariables: string[];
	variableLabels: Record<string, string>;
	variableGroups: Record<string, string[]>;
}

export function VariableMenu({
	editor,
	availableVariables,
	variableLabels,
	variableGroups,
}: VariableMenuProps) {
	const handleInsert = (variableName: string) => {
		editor
			.chain()
			.focus()
			.insertContent({
				type: 'variable',
				attrs: { variableName },
			})
			.run();
	};

	// Filter groups to only show available variables.
	const filteredGroups = Object.entries(variableGroups)
		.map(([group, vars]) => ({
			group,
			variables: vars.filter((v) => availableVariables.includes(v)),
		}))
		.filter(({ variables }) => variables.length > 0);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="resa-gap-1 resa-h-8 resa-px-2">
					<Braces className="resa-size-4" />
					{__('Variable', 'resa')}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="resa-w-56">
				{filteredGroups.map(({ group, variables }, groupIndex) => (
					<DropdownMenuGroup key={group}>
						{groupIndex > 0 && <DropdownMenuSeparator />}
						<DropdownMenuLabel>{group}</DropdownMenuLabel>
						{variables.map((varName) => (
							<DropdownMenuItem
								key={varName}
								onSelect={() => handleInsert(varName)}
								className="resa-font-mono resa-text-xs"
							>
								<span className="resa-mr-2 resa-text-muted-foreground">{`{{${varName}}}`}</span>
								<span className="resa-ml-auto resa-text-xs resa-text-muted-foreground resa-font-sans">
									{variableLabels[varName] || varName}
								</span>
							</DropdownMenuItem>
						))}
					</DropdownMenuGroup>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
