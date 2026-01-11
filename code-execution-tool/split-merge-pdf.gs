/**
 * CONFIGURATION
 * 1. Replace the API key below or set it in Project Settings > Script Properties
 * 2. Ensure you have the Drive API service enabled in your Apps Script project.
 */
const GEMINI_API_KEY = "YOUR_API_KEY_HERE"; 

/**
 * TEST FUNCTIONS
 * Update these IDs with your own Google Drive File IDs before running.
 */
function runPdfExtractionTest() {
  const fileId = "PASTE_YOUR_FILE_ID_HERE";
  extractPdfPagesWithCodeExecution(fileId);
}

function runPdfMergeTest() {
  const fileId1 = "PASTE_YOUR_FILE_ID_1_HERE";
  const fileId2 = "PASTE_YOUR_FILE_ID_2_HERE";
  merge2PDFWithCodeExecution(fileId1, fileId2);
}

/**
 * Extracts specific pages from a PDF using Gemini Code Execution.
 * It sends the PDF to Gemini, executes Python to split it, and saves the result.
 * 
 * @param {string} fileId The ID of the PDF file on Google Drive.
 */
function extractPdfPagesWithCodeExecution(fileId) {
  // 1. PREPARE FILE AND METADATA
  // Get the original file to define the new filename
  const originalFile = DriveApp.getFileById(fileId);
  const originalName = originalFile.getName().replace(/\.[^/.]+$/, ""); // Remove extension
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm");
  
  // Convert the file to Base64 to send it to the API
  const blob = originalFile.getBlob();
  const base64Data = Utilities.base64Encode(blob.getBytes());

  // 2. CONSTRUCT THE API REQUEST
  // We explicitly ask Gemini to generate a new PDF file for pages 1 and 2
  const contents = [{
    parts: [
      { 
        "text": "Job : Create new PDF. Task : Export page 1 to 2." 
      },
      {
        "inline_data": {
          "mime_type": "application/pdf",
          "data": base64Data
        }
      }
    ]
  }];

  // We must enable the 'code_execution' tool
  const tools = [{ "code_execution": {} }];

  // 3. CALL GEMINI API
  const response = callGeminiApi(contents, tools, "You are a specialized document processor.");

  if (!response || !response.candidates) {
    console.error("No valid response from API.");
    return;
  }

  // 4. PROCESS THE RESPONSE
  // The response will contain multiple parts: the code written, the logs, and the final file.
  console.log("--- Processing Gemini Response ---");
  const parts = response.candidates[0].content.parts;

  parts.forEach((part, index) => {
    
    // A. Visualizing the Python Code Gemini wrote
    if (part.executableCode) {
      console.log(`[Part ${index}] 🐍 Generated Python Code:\n`, part.executableCode.code);
    } 
    
    // B. Visualizing the Output of that Python Code
    else if (part.codeExecutionResult) {
      console.log(`[Part ${index}] ⚙️ Code Execution Output:\n`, part.codeExecutionResult.output);
    } 
    
    // C. Handling the Resulting File (The new PDF)
    else if (part.inlineData) {
      console.log(`[Part ${index}] 📄 Found generated file data (${part.inlineData.mimeType}). Saving to Drive...`);
      
      const newFileName = `${originalName} - Extracted - ${timestamp}.pdf`;
      
      // Decode the result and create the file
      const decodedData = Utilities.base64Decode(part.inlineData.data);
      const newFileBlob = Utilities.newBlob(decodedData, part.inlineData.mimeType, newFileName);
      const newFile = DriveApp.createFile(newFileBlob);
      
      console.log("✅ File saved successfully!");
      console.log("File Name: " + newFileName);
      console.log("File URL: " + newFile.getUrl());
    } 
    
    // D. Handling any text response
    else if (part.text) {
      console.log(`[Part ${index}] 🗣️ Text Response:\n`, part.text);
    }
  });
}

/**
 * Merges two PDF files into one using Gemini Code Execution.
 */
function merge2PDFWithCodeExecution(fileId1, fileId2) {
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm");

  const file1 = DriveApp.getFileById(fileId1);
  const file2 = DriveApp.getFileById(fileId2);
  
  const base64File1 = Utilities.base64Encode(file1.getBlob().getBytes());
  const base64File2 = Utilities.base64Encode(file2.getBlob().getBytes());

  const contents = [{
    parts: [
      { "text": "Job : Merge PDFs. Task : Create one file from the 2 PDF files." },
      { "inline_data": { "mime_type": "application/pdf", "data": base64File1 } },
      { "inline_data": { "mime_type": "application/pdf", "data": base64File2 } }
    ]
  }];

  const tools = [{ "code_execution": {} }];
  const response = callGeminiApi(contents, tools, "You are a specialized document processor.");

  if (response && response.candidates) {
    const fileName = `Merged_PDF_${timestamp}.pdf`;
    processGeminiResponse(response.candidates[0].content.parts, fileName);
  } else {
    console.error("No valid response from API.");
  }
}

/**
 * Helper to handle the API response parts (Python code, logs, and file generation).
 */
function processGeminiResponse(parts, outputFileName) {
  console.log("--- Processing Gemini Response ---");

  parts.forEach((part, index) => {
    // 1. Handle Generated Python Code
    if (part.executableCode) {
      console.log(`[Part ${index}] Python Code:\n`, part.executableCode.code);
    } 
    
    // 2. Handle Python Execution Output
    else if (part.codeExecutionResult) {
      console.log(`[Part ${index}] Code Output:\n`, part.codeExecutionResult.output);
    } 
    
    // 3. Handle Binary File Generation (The result)
    else if (part.inlineData) {
      console.log(`[Part ${index}] Found inline file data (${part.inlineData.mimeType}). Saving...`);
      
      const decodedData = Utilities.base64Decode(part.inlineData.data);
      const newFileBlob = Utilities.newBlob(decodedData, part.inlineData.mimeType, outputFileName);
      const newFile = DriveApp.createFile(newFileBlob);
      
      console.log("✅ File saved: " + newFile.getUrl());
    } 
    
    // 4. Handle Text Response
    else if (part.text) {
      console.log(`[Part ${index}] Text Response:\n`, part.text);
    }
  });
}

/**
 * Core API Call Logic with Retries
 */
function callGeminiApi(contents, tools, systemInstruction, modelName = "gemini-3-flash-preview") {
  const MAX_RETRIES = 3;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    "contents": contents,
    "generationConfig": { 
      "thinkingConfig": { "thinkingLevel": "LOW" },
      "temperature": 1 
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = { "parts": [{ "text": systemInstruction }] };
  }
  if (tools) {
    payload.tools = tools;
  }

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true,
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();

      if (responseCode === 200) {
        return JSON.parse(responseText);
      } else {
        console.warn(`Attempt ${attempt + 1} failed (HTTP ${responseCode}).`);
        if (attempt + 1 < MAX_RETRIES) Utilities.sleep(Math.pow(2, attempt) * 1000);
      }
    } catch (e) {
      console.error(`Attempt ${attempt + 1} Error: ${e.toString()}`);
      if (attempt + 1 < MAX_RETRIES) Utilities.sleep(Math.pow(2, attempt) * 1000);
    }
  }
  return null;
}
