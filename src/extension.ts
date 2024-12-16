import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * @function getWidgetName
 * @description Get the name of the widget from the line text.
 * @param lineText The line text from which to extract the widget name.
 * @returns The name of the widget or null if no widget name is found.
 */
function getWidgetName(lineText: string): string | null {
    const widgetNameMatch = lineText.match(/class\s+(\w+)\s+extends\s+(?:Stateless|Stateful)Widget/);
    if (!widgetNameMatch || widgetNameMatch.length < 2 || widgetNameMatch[1].length < 2) {
        return null;
    }
    return widgetNameMatch[1];
}

/**
 * @function getWidgetContent
 * @description Get the content of the widget from the editor.
 * @param editor The active text editor.
 * @param lineNumber The line number of the widget.
 * @returns The content of the widget or null if an error occurs.
 */
async function getWidgetContent(editor: vscode.TextEditor, lineNumber: number): Promise<string | null> {
    let braceCount = 1;
    let auxLine = lineNumber;
    const document = editor.document;
    try {
        while (braceCount > 0 && auxLine < document.lineCount) {
            const nextLine = document.lineAt(++auxLine).text;
            const openBraceIndex = nextLine.indexOf('{');
            const closeBraceIndex = nextLine.indexOf('}');
            if (openBraceIndex >= 0) {
                braceCount++;
            }
            if (closeBraceIndex >= 0 && (openBraceIndex === -1 || closeBraceIndex < openBraceIndex)) {
                braceCount--;
            }
        }

        if (braceCount !== 0) {
            vscode.window.showErrorMessage("Braces do not match.");
            return null;
        }

        const range = new vscode.Range(lineNumber, 0, auxLine, document.lineAt(auxLine).range.end.character);
        const widgetContent = document.getText(range);

        await editor.edit(editBuilder => {
            editBuilder.delete(range);
        });

        return widgetContent;
    } catch (error) {
        vscode.window.showErrorMessage(`Error extracting widget content: ${error}`);
        return null;
    }
}

/**
 * @function createWidgetFile
 * @description Create a new file with the widget content.
 * @param widgetContent The content of the widget.
 * @param currentFilePath The path of the current file.
 * @param widgetName The name of the widget.
 * @returns A promise that resolves when the file is created.
 */
async function createWidgetFile(widgetContent: string, currentFilePath: string, fileName: string): Promise<void> {

    try {
        const newFileContent = `import 'package:flutter/material.dart';\n\n${widgetContent}`;
        const newFilePath = path.join(path.dirname(currentFilePath), fileName);

        await fs.promises.writeFile(newFilePath, newFileContent);

        const doc = await vscode.workspace.openTextDocument(newFilePath);
        await vscode.window.showTextDocument(doc);
    } catch (error) {
        vscode.window.showErrorMessage(`Error creating widget file: ${error}`);
    }
}

/**
 * @function activate
 * @description The entry point of the extension.
 * @param context The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('flutter-widget-extractor.extractWidget', extractWidgetasync);

    context.subscriptions.push(disposable);
}

export async function extractWidgetasync() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage("No active editor found.");
        return;
    }

    const lineNumber = editor.selection.active.line;
    const lineText = editor.document.lineAt(lineNumber).text;

    const widgetName = getWidgetName(lineText);
    if (!widgetName) {
        vscode.window.showErrorMessage("Could not identify the Widget name.");
        return;
    }

    const widgetContent = await getWidgetContent(editor, lineNumber);
    if (!widgetContent) {
        return;
    }

    const currentFilePath = editor.document.uri.fsPath;
    const fileName = `${widgetName.replace(/([A-Z])/g, '_$1').toLowerCase().substring(1)}.dart`;

    const importStatement = `import '${fileName}';\n`;

    await editor.edit(editBuilder => {
        editBuilder.insert(new vscode.Position(0, 0), importStatement);
    });

    await createWidgetFile(widgetContent, currentFilePath, fileName);


}

/**
 * @function deactivate
 * @description A callback that is called when the extension is deactivated.
 */
export function deactivate() { }

