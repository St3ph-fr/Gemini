# Gemini File Search Manager for Google Apps Script

**Build a Serverless RAG (Retrieval-Augmented Generation) engine using Google Drive and Gemini.**

This library allows you to manage the **Gemini API File Search** tool directly from Google Apps Script. It bridges the gap between your data (Google Drive) and the Gemini models, handling the complex logic of multipart uploads, store management, and citation retrieval without requiring any external servers or Python infrastructure.

## 🚀 Key Features

  * **Serverless RAG:** Manage the entire lifecycle of a Retrieval-Augmented Generation system using only Apps Script.
  * **Smart Drive Uploads:** Automatically converts Google Docs, Sheets, and Slides to PDF before uploading to Gemini.
  * **Store Management:** Create, list, and delete File Search Stores programmatically.
  * **Audit & Reporting:** Export a full inventory of your Search Stores and indexed files directly to a Google Sheet.
  * **Citation Handling:** Built-in support for parsing and logging source citations (grounding chunks) from Gemini's responses.
  * **Cost Effective:** Leverages Gemini's "scale-to-zero" billing (pay only for indexing and inference, not storage).

## 🛠 Prerequisites

1.  **Google Cloud Project / AI Studio:** You need a project with the Gemini API enabled.
2.  **API Key:** Get a valid API Key from [Google AI Studio](https://aistudio.google.com/).
3.  **Google Apps Script:** A container-bound script (inside a Sheet/Doc) or a standalone script.

## 📦 Installation

1.  Create a new **Google Apps Script** project ( `script.google.com` ).
2.  Copy the contents of `Code.gs` (or your main file) into the script editor.
3.  **Set your API Key:**
      * Go to **Project Settings** (gear icon) in the Apps Script editor.
      * Scroll to **Script Properties**.
      * Click **Add script property**.
      * Property: `GEMINI_API_KEY`
      * Value: `Your_Actual_API_Key_Here`

## 📖 Usage Guide

### 1\. Initialize and Upload Files

The library handles the complex `multipart/related` requests required to upload blobs to the Gemini API.

```javascript
function uploadDemo() {
  // The ID of the file in your Google Drive
  const driveFileId = "your-id-here"; 
  
  // Uploads the file. If no storeName is provided, it creates a new one.
  // Note: Google Docs/Sheets/Slides are auto-converted to PDF.
  const result = uploadDriveFileToFileSearchStore(driveFileId);
  
  Logger.log("Store Name: " + result.storeName);
  Logger.log("File Name: " + result.fileName);
}
```

### 2\. Query Gemini (RAG Inference)

Once your files are indexed, you can query the model. The function automatically attaches the File Search tool to the request.

```javascript
function queryDemo() {
  const storeName = "fileSearchStores/your-store-id-here";
  const question = "What are the main takeaways from the uploaded document?";
  
  // Queries Gemini 2.5
  const answer = queryGeminiWithFileSearch(question, storeName);
  
  // The function automatically logs Citations/Sources to the console
  Logger.log(answer);
}
```

### 3\. Audit Your Knowledge Base

Keep track of what data is accessible to your LLM by exporting a report.

```javascript
function reportDemo() {
  // Creates a new Google Sheet with a list of all Stores and Files
  exportFileSearchDataToSheet(true);
}
```

### 4\. Cleanup

Avoid clutter by deleting old stores. You can choose to delete just the store reference or force-delete the documents within it.

```javascript
function cleanupDemo() {
  const storeName = "fileSearchStores/your-store-id-here";
  deleteFileSearchStore(storeName, true); // true = force delete
}
```

## ⚙️ Architecture

The solution follows this workflow:

1.  **Extract:** Apps Script fetches the Blob from Google Drive.
2.  **Convert:** If the file is a native Google format (Doc, Sheet, Slide), it is converted to PDF in-memory.
3.  **Upload:** The Blob is sent to the `generativelanguage.googleapis.com/upload` endpoint.
4.  **Index:** The uploaded file is imported into a `File Search Store`.
5.  **Retrieve:** During a query, Gemini searches the store, retrieves relevant chunks, and generates an answer with citations.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)

-----

*Disclaimer: This is a community-contributed project and is not an official Google product. Please refer to the [Gemini API Documentation](https://ai.google.dev/docs) for official guidance.*
