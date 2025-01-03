import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Assuming your extension's main activation function is exported as `activate`
// and the command is registered there. If not, adjust the import accordingly.
// import * as myExtension from '../../extension'; // Uncomment and adjust path if needed

const testWorkspacePath = path.join(__dirname, '..', '..', 'test-fixtures'); // Adjust if needed

suite('Flutter Widget Extractor Tests', () => {
    vscode.window.showInformationMessage('Start Flutter Widget Extractor tests.');

    // Helper function to open a text document
    async function openTextDocument(filePath: string): Promise<vscode.TextEditor> {
        const document = await vscode.workspace.openTextDocument(filePath);
        return await vscode.window.showTextDocument(document);
    }

    // Helper function to trigger the extract widget command
    async function triggerExtractWidgetCommand(): Promise<void> {
        await vscode.commands.executeCommand('flutter-widget-extractor.extractWidget');
    }

    // Helper function to get the content of a file
    async function getFileContent(filePath: string): Promise<string> {
        const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        return document.getText();
    }

    // Helper function to check if a file exists
    function fileExists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    // Helper function to delete a file
    async function deleteFile(filePath: string): Promise<void> {
        if (fileExists(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }

    // Test case for extracting a StatelessWidget
    test('Extract StatelessWidget', async () => {
        const testFilePath = path.join(testWorkspacePath, 'test_widget.dart');
        const editor = await openTextDocument(testFilePath);

        // Define the range of the StatelessWidget
        const startPos = new vscode.Position(3, 0);
        const endPos = new vscode.Position(7, 1);
        editor.selection = new vscode.Selection(startPos, endPos);

        await triggerExtractWidgetCommand();

        const expectedNewFileName = 'my_test_widget.dart';
        const expectedNewFilePath = path.join(testWorkspacePath, expectedNewFileName);

        assert.ok(fileExists(expectedNewFilePath), 'New widget file should be created.');

        const newFileContent = await getFileContent(expectedNewFilePath);
        assert.ok(newFileContent.includes("import 'package:flutter/material.dart';"), 'New file should include Flutter import.');
        assert.ok(newFileContent.includes('class MyTestWidget extends StatelessWidget'), 'New file should contain the widget class.');

        const originalFileContent = editor.document.getText();
        assert.ok(originalFileContent.includes(`import '${expectedNewFileName}';`), 'Original file should include import statement.');
        assert.ok(!originalFileContent.includes('class MyTestWidget extends StatelessWidget'), 'Original widget code should be removed.');

        // Clean up: close the editor and delete the created file
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await deleteFile(expectedNewFilePath);
    });

    // Test case for extracting a StatefulWidget
    test('Extract StatefulWidget', async () => {
        const testFilePath = path.join(testWorkspacePath, 'test_stateful_widget.dart');
        const editor = await openTextDocument(testFilePath);

        // Define the range of the StatefulWidget
        const startPos = new vscode.Position(3, 0);
        const endPos = new vscode.Position(11, 1); // Adjust end position to include the State class
        editor.selection = new vscode.Selection(startPos, endPos);

        await triggerExtractWidgetCommand();

        const expectedNewFileName = 'my_stateful_widget.dart';
        const expectedNewFilePath = path.join(testWorkspacePath, expectedNewFileName);

        assert.ok(fileExists(expectedNewFilePath), 'New widget file should be created.');

        const newFileContent = await getFileContent(expectedNewFilePath);
        assert.ok(newFileContent.includes("import 'package:flutter/material.dart';"), 'New file should include Flutter import.');
        assert.ok(newFileContent.includes('class MyStatefulWidget extends StatefulWidget'), 'New file should contain the StatefulWidget class.');
        assert.ok(newFileContent.includes('class _MyStatefulWidgetState extends State<MyStatefulWidget>'), 'New file should contain the State class.');

        const originalFileContent = editor.document.getText();
        assert.ok(originalFileContent.includes(`import '${expectedNewFileName}';`), 'Original file should include import statement.');
        assert.ok(!originalFileContent.includes('class MyStatefulWidget extends StatefulWidget'), 'Original StatefulWidget code should be removed.');
        assert.ok(!originalFileContent.includes('class _MyStatefulWidgetState extends State<MyStatefulWidget>'), 'Original State class code should be removed.');

        // Clean up: close the editor and delete the created file
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await deleteFile(expectedNewFilePath);
    });

    // Test case: No editor is active
    test('No active editor', async () => {
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor'); // Ensure no editor is active

        let errorMessageShown = false;
        const originalShowErrorMessage = vscode.window.showErrorMessage;
        const originalShowErrorMessageFunc = vscode.window.showErrorMessage;
        // vscode.window.showErrorMessage = async (message: string | undefined, ...items: string[]) => {
        //     if (message === 'No active editor found.') {
        //         errorMessageShown = true;
        //     }

        //     try {
        //         return await originalShowErrorMessageFunc.call(vscode.window, message, ...items);
        //     } catch (error) {
        //         console.error('Error calling showErrorMessage:', error);
        //         throw error;
        //     }
        // };

        await triggerExtractWidgetCommand();
        assert.ok(errorMessageShown, 'Error message should be shown when no editor is active.');

        // Restore the original showErrorMessage function
        vscode.window.showErrorMessage = originalShowErrorMessage;
    });

    // Test case: Selection does not contain a valid widget definition
    test('Invalid widget selection', async () => {
        const testFilePath = path.join(testWorkspacePath, 'test_widget.dart');
        const editor = await openTextDocument(testFilePath);

        // Select a line that is not a widget definition
        const startPos = new vscode.Position(0, 0);
        const endPos = new vscode.Position(0, 10);
        editor.selection = new vscode.Selection(startPos, endPos);

        let errorMessageShown = false;
        const originalShowErrorMessage = vscode.window.showErrorMessage;
        // vscode.window.showErrorMessage = async (message: string, ...items: string[]) => {
        //     if (message === 'Could not identify the Widget name.') {
        //         errorMessageShown = true;
        //     }
        //     return originalShowErrorMessage.call(vscode.window, message, ...items);
        // };

        await triggerExtractWidgetCommand();
        assert.ok(errorMessageShown, 'Error message should be shown for invalid selection.');

        // Restore the original showErrorMessage function
        vscode.window.showErrorMessage = originalShowErrorMessage;

        // Clean up: close the editor
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
});