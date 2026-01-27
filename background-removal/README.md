# Gemini Background Remover (Google Apps Script)

This project allows you to automatically remove backgrounds from images stored in Google Drive using Google Apps Script and the **Gemini API** (specifically leveraging its Code Execution or Vision capabilities). 

It acts as a bridge between your Google Drive files and Google's Gemini models, enabling you to process images without leaving the Google Workspace environment.

## 🚀 Features

* **Drive Integration**: Fetches images directly from your Google Drive.
* **AI-Powered**: Uses Gemini's advanced capabilities (likely Gemini 1.5 Pro or Flash with Code Execution) to intelligently identify and remove backgrounds.
* **Automated Workflow**: Saves the processed transparent image (PNG) back to your Google Drive automatically.
* **Serverless**: Runs entirely within Google Apps Script; no external servers or Python runtime required on your machine.

## 📋 Prerequisites

Before you begin, ensure you have the following:

1.  **Google Cloud Project**: A Google Cloud project with the **Gemini API** enabled.
2.  **API Key**: A valid API key for the Gemini API. [Get one here](https://aistudio.google.com/app/apikey).
3.  **Google Account**: Access to Google Drive and Google Apps Script.

## 🛠️ Installation & Setup

1.  **Create a New Script**:
    * Go to [script.google.com](https://script.google.com/).
    * Click on **"New Project"**.

2.  **Add the Code**:
    * Rename the project (e.g., "Gemini Background Remover").
    * Open the `Code.gs` file in the editor.
    * Copy the content from the source file in this repository: [Code.gs](https://github.com/St3ph-fr/Gemini/blob/main/background-removal/Code.gs)
    * Paste it into your script editor, replacing any existing code.

3.  **Configure Script Properties**:
    * To keep your API key secure, do *not* hardcode it in the script.
    * Go to **Project Settings** (gear icon) > **Script Properties**.
    * Click **Add script property**.
    * **Property**: `GEMINI_API_KEY` (or the variable name used in the code, typically `API_KEY`).
    * **Value**: Your actual Gemini API key string.
    * Click **Save**.

## 💻 Usage

1.  **Upload an Image**: Ensure the image you want to process is uploaded to your Google Drive.
2.  **Get File ID**:
    * Open the image in Google Drive.
    * Look at the URL: `https://drive.google.com/file/d/YOUR_FILE_ID/view`
    * Copy the `YOUR_FILE_ID` part.
3.  **Run the Script**:
    * In the Apps Script editor, locate the main function (e.g., `main`, `removeBackground`, or `processFile`).
    * *Note: You may need to update a variable in the code with your specific File ID, or the script might be set up to process a specific folder.*
    * Click the **Run** button.
4.  **Grant Permissions**:
    * The first time you run the script, Google will ask for permission to access your Drive and connect to external services (the Gemini API). Click **Review Permissions** -> **Allow**.
5.  **Check Results**:
    * Once the execution completes, check your Google Drive. You should see a new file (usually a PNG) with the background removed.

## 🔧 How It Works

1.  **Fetch**: The script retrieves the binary data of the image from Google Drive.
2.  **Send**: It constructs a payload containing the image data and a prompt (e.g., "Remove the background from this image") and sends it to the Gemini API endpoint.
3.  **Process**: 
    * Gemini processes the request. If using **Code Execution**, the model writes and executes a Python script (using libraries like `PIL` or `rembg`) within Google's secure sandbox to perform the pixel-level manipulation.
    * Alternatively, it uses native vision capabilities to generate a mask or a new image.
4.  **Save**: The API returns the processed image data, which the Apps Script saves as a new file in your Drive.

## 📄 License

This code is open-source. Please check the repository license for specifics.

## 👤 Author

**Stéphane Giron (St3ph-fr)**
* [GitHub Profile](https://github.com/St3ph-fr)
* [Medium Articles](https://medium.com/@stephane.giron) - Check here for tutorials on how this code was built.
