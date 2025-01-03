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
    const lineText = document.lineAt(lineNumber).text;
    const isStateful = lineText.includes('extends StatefulWidget');

    try {
        let widgetEndLine = -1;
        while (braceCount > 0 && auxLine < document.lineCount) {
            const nextLine = document.lineAt(++auxLine).text;
            let openBraceIndex = nextLine.indexOf('{');
            let closeBraceIndex = nextLine.indexOf('}');
            while (openBraceIndex >= 0) {
                braceCount++;
                openBraceIndex = nextLine.indexOf('{', openBraceIndex + 1);
            }
            while (closeBraceIndex >= 0) {
                braceCount--;
                closeBraceIndex = nextLine.indexOf('}', closeBraceIndex + 1);
            }
        }
        widgetEndLine = auxLine;

        if (braceCount !== 0) {
            vscode.window.showErrorMessage("Braces do not match in the widget definition.");
            return null;
        }

        let stateClassContent = '';
        let stateClassStartLine = -1;
        let stateClassEndLine = -1;

        if (isStateful) {
            const stateClassNameMatch = lineText.match(/class\s+(\w+)\s+extends\s+StatefulWidget/);
            if (stateClassNameMatch && stateClassNameMatch[1]) {
                const widgetName = stateClassNameMatch[1];
                const expectedStateClassName = `_${widgetName}State`;

                // Procurar pela classe State associada
                for (let i = widgetEndLine + 1; i < document.lineCount; i++) {
                    const currentLineText = document.lineAt(i).text;
                    const stateClassMatch = currentLineText.match(new RegExp(`class\\s+(${expectedStateClassName})\\s+extends\\s+State<${widgetName}>`));
                    if (stateClassMatch) {
                        stateClassStartLine = i;
                        break;
                    }
                }

                if (stateClassStartLine !== -1) {
                    braceCount = 1;
                    auxLine = stateClassStartLine;
                    while (braceCount > 0 && auxLine < document.lineCount) {
                        const nextLine = document.lineAt(++auxLine).text;
                        let openBraceIndex = nextLine.indexOf('{');
                        let closeBraceIndex = nextLine.indexOf('}');
                        while (openBraceIndex >= 0) {
                            braceCount++;
                            openBraceIndex = nextLine.indexOf('{', openBraceIndex + 1);
                        }
                        while (closeBraceIndex >= 0) {
                            braceCount--;
                            closeBraceIndex = nextLine.indexOf('}', closeBraceIndex + 1);
                        }
                    }
                    stateClassEndLine = auxLine;

                    if (braceCount !== 0) {
                        vscode.window.showErrorMessage("Braces do not match in the State class definition.");
                        return null;
                    }

                    const stateRange = new vscode.Range(stateClassStartLine, 0, stateClassEndLine, document.lineAt(stateClassEndLine).range.end.character);
                    stateClassContent = document.getText(stateRange);
                } else {
                    vscode.window.showErrorMessage(`Could not find the State class for ${widgetName}.`);
                    return null;
                }
            }
        }

        const widgetRange = new vscode.Range(lineNumber, 0, widgetEndLine, document.lineAt(widgetEndLine).range.end.character);
        const widgetContent = document.getText(widgetRange);
        const fullWidgetContent = isStateful && stateClassContent ? `${widgetContent}\n\n${stateClassContent}` : widgetContent;

        await editor.edit(editBuilder => {
            editBuilder.delete(isStateful && stateClassEndLine !== -1 ? new vscode.Range(lineNumber, 0, stateClassEndLine, document.lineAt(stateClassEndLine).range.end.character) : widgetRange);
        });

        return fullWidgetContent;
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
