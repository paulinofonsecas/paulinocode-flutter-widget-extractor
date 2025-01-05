# Flutter Widget Extractor

This VS Code extension helps you quickly extract Flutter widgets into separate Dart files, improving code organization and reusability.

![syntax](https://github.com/paulinofonsecas/paulinocode-flutter-widget-extractor/blob/master/media/demo.gif?raw=true)

**Features:**

* **Extracts widgets:** Selects the widget code within the editor and extracts it into a new Dart file.
* **Generates file name:** Creates a file name based on the widget class name (camelCase to snake_case).
* **Adds import:** Automatically adds an import statement for the extracted widget in the original file.
* **Removes original code (optional):** Removes the extracted widget code from the original file.

**Installation:**

1. Open the VS Code Extensions view (Ctrl+Shift+X).
2. Search for "Flutter Widget Extractor".
3. Click "Install".

**Usage:**

1. Place your cursor on the line where the widget class is defined.
2. Open the context menu and select "Flutter: Extract Widget to File".
3. Or Open the Command Palette (Ctrl+Shift+P) and type "Widget to File".
4. Select the "Flutter: Extract Widget to File" command.
5. The extension will create a new Dart file with the widget code and add an import statement to the original file.

**Contributing:**

Contributions are welcome! Please submit pull requests to the [GitHub repository](https://github.com/paulinofonsecas/paulinocode-flutter-widget-extractor).

**License:**

This extension is licensed under the [MIT License](https://docs.github.com/articles/licensing-a-repository).

**Disclaimer:**

This extension is provided "as is" without any warranty. Use at your own risk.