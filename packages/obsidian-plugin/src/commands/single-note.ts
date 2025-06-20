import type { VFile } from 'vfile';

import type { Plugin, Command } from 'obsidian';
import type * as NodeFS from 'node:fs/promises';
import type * as NodePath from 'node:path';

import { MarkdownView, FileSystemAdapter } from 'obsidian';
import { mdToHtml } from 'md-to-html';

export const fsPromises: typeof NodeFS = window.require('node:fs/promises');
export const path: typeof NodePath = window.require('node:path');

const formatOutputHtml = (
	file: VFile,
	title: string,
	standaloneHtml: boolean
): string => {
	const baseHtmlString = file.toString();
	if (standaloneHtml) {
		return `<html><head><title>${title}</title></head><body>${baseHtmlString}</body></html>`;
	}
	return ``;
};

const publishNote = async (
	{ basename, filePath }: { basename: string; filePath: string },
	outputDir: string,
	fileExtension: string,
	standaloneHtml: boolean
): Promise<void> => {
	const parsedData = await mdToHtml(filePath);
	const htmlString = formatOutputHtml(parsedData, basename, standaloneHtml);

	await fsPromises.writeFile(
		path.resolve(outputDir, `${basename}.${fileExtension}`),
		htmlString
	);
};

export const singleNote = (plugin: Plugin): Command => {
	return function () {
		return {
			id: 'publish-active-note',
			name: 'Publish active note',
			callback: () => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view !== null) {
					const activeFile = view.file;
					if (activeFile !== null) {
						const { adapter: storageAdapter } = this.app.vault;
						if (storageAdapter instanceof FileSystemAdapter) {
							const fileSystemPath = storageAdapter.getFullPath(
								activeFile.path
							);
							publishNote(
								{
									basename: activeFile.basename,
									filePath: fileSystemPath,
								},
								this.settings.outputDir,
								this.settings.fileExt,
								this.settings.standaloneHtml
							);
						}
					}
				}
			},
		};
	}.bind(plugin)();
};
