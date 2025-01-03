import * as vscode from 'vscode';
import { extractWidgetasync } from './functions';


/**
 * @function activate
 * @description The entry point of the extension.
 * @param context The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('flutter-widget-extractor.extractWidget', extractWidgetasync);

    context.subscriptions.push(disposable);
}

/**
 * @function deactivate
 * @description A callback that is called when the extension is deactivated.
 */
export function deactivate() { }

