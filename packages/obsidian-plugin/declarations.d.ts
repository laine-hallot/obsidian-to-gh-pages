import type * as Remote from '@electron/remote';
import type * as Electron from 'electron';

declare global {
	interface Window {
		electron: typeof Electron & { remote: typeof Remote };
		electronWindow: Electron.BaseWindow;
	}
}
