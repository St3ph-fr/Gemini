# Gemini Code Execution Lab (Google Apps Script)

This folder contains a collection of Google Apps Script implementations that leverage **Gemini's Code Execution** feature. 

Unlike standard LLM responses, these scripts allow Gemini to write and execute Python code in a secure sandbox to perform complex data manipulation, file processing, and mathematical calculations, returning the final result directly to your Google Drive.

## 🚀 Current Tools

### 1. PDF Processor (Split & Merge)
The primary script in this collection demonstrates how to use Gemini as a document engine.
*   **PDF Extraction**: Send a PDF to Gemini and ask it to extract specific pages. Gemini writes the Python logic to slice the PDF and returns a new file.
*   **PDF Merging**: Send multiple Base64-encoded PDFs; Gemini uses Python to combine them into a single document.
*   **Code Transparency**: The script logs the exact Python code Gemini generated, providing full visibility into how the files were processed.

---

## 🛠️ How it Works

1.  **The Request**: The script sends a prompt along with the file data (Base64) to the Gemini API.
2.  **The Tool**: We enable the `{ "code_execution": {} }` tool in the request.
3.  **The Execution**: Gemini recognizes the task (e.g., "Merge these PDFs"), writes a Python script (using libraries like `PyPDF2`), and runs it.
4.  **The Output**: Gemini returns the binary data of the new file, which this script then saves to your Google Drive.

## 📋 Prerequisites

Before running these scripts, ensure you have:

1.  **Google Apps Script Project**: Create one at [script.google.com](https://script.google.com).
2.  **Gemini API Key**: Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
3.  **Model Access**: These scripts currently use `gemini-3-flash-preview` (or the latest experimental version supporting code execution).

## ⚙️ Setup

1.  Copy the `Code.gs` file into your project.
2.  Paste your API Key into the `GEMINI_API_KEY` constant at the top of the script.
3.  To test the PDF tools, replace the placeholder `fileId` variables with IDs from files in your Google Drive.
4.  Run the `testExtractPDF` or `merge2PDFWithCodeExecution` functions from the Apps Script editor.

## 📂 Folder Structure

*   `Code.gs`: The main script containing the API wrapper and the PDF processing logic.
*   *(More examples coming soon...)*

## ⚠️ Limitations & Notes
*   **Experimental**: These scripts use experimental models. API endpoints and model names may change.
*   **File Size**: Large PDFs may hit the Apps Script memory limit or Gemini's context window limit during Base64 encoding.
*   **Privacy**: Be mindful of sending sensitive documents to experimental AI models.
