import type { VFile } from 'vfile';

import type * as NodeFS from 'node:fs/promises';
import type * as NodePath from 'node:path';

import {
	App,
	MarkdownView,
	Modal,
	Plugin,
	PluginSettingTab,
	Setting,
	FileSystemAdapter,
} from 'obsidian';
import { mdToHtml } from 'md-to-html';

export const fsPromises: typeof NodeFS = window.require('node:fs/promises');
export const path: typeof NodePath = window.require('node:path');

// Remember to rename these classes and interfaces!

interface MdToPagesSettings {
	outputDir: string;
	fileExt: string;
	standaloneHtml: boolean;
}

const DEFAULT_SETTINGS: MdToPagesSettings = {
	outputDir: '',
	fileExt: 'html',
	standaloneHtml: false,
};

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
) => {
	const parsedData = await mdToHtml(filePath);
	const htmlString = formatOutputHtml(parsedData, basename, standaloneHtml);

	await fsPromises.writeFile(
		path.resolve(outputDir, `${basename}.${fileExtension}`),
		htmlString
	);
};

export default class MdToPages extends Plugin {
	settings: MdToPagesSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
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
		});
		this.addCommand({
			id: 'publish-folder',
			name: 'Publish a folder',
			callback: () => {
				console.log('Hey, you!');
			},
		});
		this.addCommand({
			id: 'publish-preferred-folder',
			name: 'Publish a folder',
			callback: () => {
				console.log('Hey, you!');
			},
		});
		this.addCommand({
			id: 'publish-vault',
			name: 'Publish all notes in vault',
			callback: () => {
				console.log('Hey, you!');
			},
		});
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SettingTab extends PluginSettingTab {
	plugin: MdToPages;

	constructor(app: App, plugin: MdToPages) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Publish output directory')
			.setDesc('Configure where resulting output html gets stored')
			.addExtraButton((extraButton) => extraButton.setIcon('circle-x'))
			.addText((text) =>
				text
					.setPlaceholder('path/to/dir')
					.setValue(this.plugin.settings.outputDir)
					.onChange(async (value) => {
						this.plugin.settings.outputDir = value;
						await this.plugin.saveSettings();
					})
			)
			.addButton((button) =>
				button.setButtonText('Select').onClick(async () => {
					const pickerResult = await openDirectoryPicker();
					if (!pickerResult.canceled) {
						const selectedPath = pickerResult.filePaths[0];
						console.log(selectedPath);
						this.plugin.settings.outputDir = selectedPath;
						await this.plugin.saveSettings();
					}
				})
			);
		new Setting(containerEl)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.standaloneHtml)
					.onChange(async (toggle) => {
						this.plugin.settings.standaloneHtml = toggle;
						await this.plugin.saveSettings();
					})
			)
			.setName('Standalone HTML files')
			.setDesc(
				'Emit full HTML5 file with instead of a fragment (wrap output in html and body and add some styling)'
			);

		new Setting(containerEl)
			.addText((textBox) =>
				textBox
					.setValue(this.plugin.settings.fileExt)
					.onChange(async (value) => {
						this.plugin.settings.fileExt = value;
						await this.plugin.saveSettings();
					})
			)
			.setName('File extension of emit files with');
	}
}

const openDirectoryPicker = async (): Promise<{
	filePaths: string[];
	canceled: boolean;
}> => {
	const pickerResult = await window.electron.remote.dialog.showOpenDialog(
		window.electronWindow,
		{
			properties: ['openDirectory'],
		}
	);
	return pickerResult;
};
