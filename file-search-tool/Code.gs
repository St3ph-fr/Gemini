/**
 * GEMINI FILE SEARCH MANAGER FOR APPS SCRIPT
 * 
 * Documentation Ref: https://ai.google.dev/api/files
 */

const API_VERSION = 'v1beta';
const BASE_URL = `https://generativelanguage.googleapis.com/${API_VERSION}`;
const UPLOAD_URL = `https://generativelanguage.googleapis.com/upload/${API_VERSION}`;
// const GEMINI_API_KEY = "";


// ==========================================
// EXAMPLE RUNNER
// ==========================================

function runDemo() {
  // 1. List existing
  listFileSearchStores();

  //const existingStore = ""; // Something like fileSearchStores/YOUR_NAME Optionnal

  const fileId = "your-file-id-here"; // ID of the drive file to puload
  // 2.1 Upload a file and create Search Store (Replace with a real Drive ID)
  const result = uploadDriveFileToFileSearchStore(fileId);
  Logger.log("Upload Result: " + JSON.stringify(result));

  // 2.1 Upload a file to an existing Search Store (Replace with a real Drive ID)
  // const result = uploadDriveFileToFileSearchStore(fileId,existingStore);
  // Logger.log("Upload Result: " + JSON.stringify(result));
  
  const storeName = result.storeName
  
  // 3. Query (Replace with the store name from step 2)
  const answer = queryGeminiWithFileSearch(
    "Extract the topic of the document", 
    storeName
  );

  // 4. Export report
  // exportFileSearchDataToSheet(true);

  // 5. Delete Search Store
  deleteFileSearchStore(storeName); // To keep file uploaded deleteFileSearchStore(storeName, false)
}

/**
 * Gets the API key from Script Properties.
 */
function getApiKey() {
  // return GEMINI_API_KEY; // If you don't use property
  return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
}

// ==========================================
// 1. STORE MANAGEMENT (Create, List, Delete)
// ==========================================

/**
 * Creates a new File Search Store.
 * @param {string} displayName - The human-readable name (optional).
 * @return {object} The created FileSearchStore object.
 */
function createFileSearchStore(displayName) {
  const payload = {};
  if (displayName) payload.displayName = displayName;

  const response = callGeminiApi_('fileSearchStores', 'post', payload);
  Logger.log(`Created Store: ${response.name}`);
  return response;
}

/**
 * Lists all File Search Stores.
 * @return {Array} Array of FileSearchStore objects.
 */
function listFileSearchStores() {
  let stores = [];
  let pageToken = null;

  do {
    const query = pageToken ? `?pageSize=20&pageToken=${pageToken}` : `?pageSize=20`;
    const response = callGeminiApi_(`fileSearchStores${query}`, 'get');
    
    if (response.fileSearchStores) {
      stores = stores.concat(response.fileSearchStores);
    }
    pageToken = response.nextPageToken;
  } while (pageToken);

  Logger.log(`Found ${stores.length} File Search Stores.`);
  return stores;
}

/**
 * Deletes a File Search Store.
 * @param {string} storeName - The resource name (e.g., 'fileSearchStores/xxx').
 * @param {boolean} force - If true, deletes associated documents.
 */
function deleteFileSearchStore(storeName, force = true) {
  const query = force ? `?force=true` : ``;
  try {
    callGeminiApi_(`${storeName}${query}`, 'delete');
    Logger.log(`Deleted Store: ${storeName}`);
  } catch (e) {
    Logger.log(`Error deleting ${storeName}: ${e.message}`);
  }
}

// ==========================================
// 2. DOCUMENT MANAGEMENT (List in Store)
// ==========================================

/**
 * Lists all Documents within a specific File Search Store.
 * @param {string} storeName - The resource name of the store.
 * @return {Array} Array of Document objects.
 */
function listDocumentsInStore(storeName) {
  let documents = [];
  let pageToken = null;

  do {
    const query = pageToken ? `?pageSize=20&pageToken=${pageToken}` : `?pageSize=20`;
    // Note: The endpoint is v1beta/{name}/documents
    const endpoint = `${storeName}/documents${query}`;
    const response = callGeminiApi_(endpoint, 'get');
    
    if (response.documents) {
      documents = documents.concat(response.documents);
    }
    pageToken = response.nextPageToken;
  } while (pageToken);

  return documents;
}

// ==========================================
// 3. SMART UPLOAD (Drive -> Gemini -> Store)
// ==========================================

/**
 * Orchestrator: Uploads a Google Drive file to a File Search Store.
 * If storeName is null, creates a new store using the file name.
 * Handles Google Docs/Sheets/Slides by converting to PDF.
 * 
 * @param {string} driveFileId - The ID of the Google Drive file.
 * @param {string} storeName - (Optional) 'fileSearchStores/xxx'. If null, creates new.
 * @return {object} The resulting Operation object or Document object.
 */
function uploadDriveFileToFileSearchStore(driveFileId, storeName = null) {
  const file = DriveApp.getFileById(driveFileId);
  const fileName = file.getName();
  const mimeType = file.getMimeType();
  
  Logger.log(`Processing Drive File: ${fileName} (${mimeType})`);

  // 1. Get Blob (Convert Google formats to PDF)
  let blob;
  if ([MimeType.GOOGLE_DOCS, MimeType.GOOGLE_SHEETS, MimeType.GOOGLE_SLIDES].includes(mimeType)) {
    blob = file.getAs(MimeType.PDF);
  } else {
    blob = file.getBlob();
  }

  // 2. Create Store if not exists
  if (!storeName) {
    Logger.log("No store defined. Creating new File Search Store...");
    const newStore = createFileSearchStore(`Store for ${fileName}`);
    storeName = newStore.name;
  }

  // 3. Upload Binary to Gemini Files API (Standard Media Upload)
  // We need a 'files/xxx' resource ID before we can import it to the store.
  const geminiFile = uploadBlobToGeminiFiles_(blob);
  Logger.log(`File uploaded to Gemini Files API: ${geminiFile.name}`);

  // 4. Import the Gemini File into the File Search Store
  const operation = importFileToStore_(storeName, geminiFile.name);
  
  // 5. Poll the operation until complete
  waitForOperation_(operation.name);

  return {
    storeName: storeName,
    fileName: geminiFile.name,
    status: "Uploaded and Processed"
  };
}

/**
 * Helper: Uploads a raw blob to the Gemini `files` endpoint.
 * This is a prerequisite before adding it to a File Search Store.
 */
function uploadBlobToGeminiFiles_(blob) {
  const apiKey = getApiKey();
  
  // Using the upload/v1beta/files endpoint requires headers indicating size and type
  // A simple way is to use the multipart upload or the JSON metadata + payload approach.
  // Here we use a direct upload strategy for simplicity with Apps Script.
  
  const metadata = {
    file: {
      displayName: blob.getName()
    }
  };

  const boundary = "xxxxxxxxxx";
  let data = "--" + boundary + "\r\n";
  data += "Content-Disposition: form-data; name=\"metadata\"\r\n";
  data += "Content-Type: application/json; charset=UTF-8\r\n\r\n";
  data += JSON.stringify(metadata) + "\r\n";
  data += "--" + boundary + "\r\n";
  data += "Content-Disposition: form-data; name=\"file\"; filename=\"" + blob.getName() + "\"\r\n";
  data += "Content-Type: " + blob.getContentType() + "\r\n\r\n";
  
  const payload = Utilities.newBlob(data).getBytes()
    .concat(blob.getBytes())
    .concat(Utilities.newBlob("\r\n--" + boundary + "--").getBytes());

  const options = {
    method: "post",
    contentType: "multipart/related; boundary=" + boundary,
    payload: payload,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(`${UPLOAD_URL}/files?uploadType=multipart&key=${apiKey}`, options);
  
  if (response.getResponseCode() !== 200) {
    throw new Error(`Upload failed: ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText()).file;
}

/**
 * Helper: Calls the importFile endpoint on the Store.
 */
function importFileToStore_(storeName, geminiFileName) {
  const payload = {
    fileName: geminiFileName
  };
  // endpoint: v1beta/{storeName}:importFile
  return callGeminiApi_(`${storeName}:importFile`, 'post', payload);
}

/**
 * Helper: Polls an Operation until it is marked as done.
 */
function waitForOperation_(operationName) {
  Logger.log(`Waiting for operation: ${operationName}`);
  let op;
  do {
    Utilities.sleep(2000); // Wait 2 seconds
    op = callGeminiApi_(operationName, 'get');
    Logger.log(`Operation status: done=${op.done}`);
  } while (!op.done);

  if (op.error) {
    throw new Error(`Operation failed: ${JSON.stringify(op.error)}`);
  }
  return op;
}

// ==========================================
// 4. QUERY GEMINI (Inference)
// ==========================================

/**
 * Queries Gemini using a specific File Search Store.
 * 
 * @param {string} userQuery - The question.
 * @param {string} storeName - The resource name 'fileSearchStores/xxx'.
 * @param {string} modelName - e.g., 'gemini-1.5-flash'.
 */
function queryGeminiWithFileSearch(userQuery, storeName, modelName = "gemini-2.5-flash") {
  const payload = {
    contents: [{
      parts: [{ text: userQuery }]
    }],
    tools: [{
      file_search: {
        file_search_store_names: [storeName]
      }
    }]
  };

  // Appel API
  const response = callGeminiApi_(`models/${modelName}:generateContent`, 'post', payload);
  
  if (response.candidates && response.candidates[0].content) {
    const text = response.candidates[0].content.parts.map(p => p.text).join('');
    Logger.log("Gemini Answer: " + text);

    // --- GESTION DES CITATIONS (LOGGING) ---
    const metadata = response.candidates?.[0]?.groundingMetadata;

    if (metadata && metadata.groundingChunks) {
      console.log("--- SOURCES / CITATIONS (Top 3) ---");
      
      // On prend seulement les 3 premiers chunks
      metadata.groundingChunks.slice(0, 3).forEach((chunk, index) => {
        const context = chunk.retrievedContext;
        
        if (context) {
          // Gestion du titre (parfois c'est l'ID du fichier ou le nom)
          const title = context.title || "Titre inconnu";
          
          // Troncature du texte à 250 caractères
          let extrait = context.text || "";
          if (extrait.length > 250) {
            extrait = extrait.substring(0, 250).replace(/\n/g, ' ') + "... [tronqué]";
          }

          // Affichage formaté
          console.log(
            `Citation #${index + 1}\n` +
            `Titre: ${title}\n` +
            `Store: ${context.fileSearchStore}\n` +
            `Extrait: "${extrait}"\n` +
            `-----------------------------------`
          );
        }
      });
    } else {
      console.log("Aucune citation / source trouvée pour cette réponse.");
    }
    // ---------------------------------------

    return text;
  } else {
    Logger.log("No content generated.");
    return "No content generated.";
  }
}

// ==========================================
// 5. REPORTING (Export to Sheets)
// ==========================================

/**
 * Exports all File Search Stores and their contained files to a new Google Sheet.
 * @param {boolean} createNewSheet - If true, creates new SS. If false, logs data.
 */
function exportFileSearchDataToSheet(createNewSheet = true) {
  const allStores = listFileSearchStores();
  
  if (!allStores || allStores.length === 0) {
    Logger.log("No stores found to export.");
    return;
  }

  const exportData = [['Store Name', 'Store Display Name', 'Store ID', 'Doc Name', 'Doc Display Name', 'Doc State', 'Mime Type', 'Size']];

  allStores.forEach(store => {
    Logger.log(`Fetching docs for ${store.displayName || store.name}...`);
    const docs = listDocumentsInStore(store.name);
    
    if (docs && docs.length > 0) {
      docs.forEach(doc => {
        exportData.push([
          store.name,
          store.displayName || 'N/A',
          store.name.split('/')[1],
          doc.name,
          doc.displayName || 'N/A',
          doc.state,
          doc.mimeType,
          doc.sizeBytes
        ]);
      });
    } else {
      // Add a row even if empty, just for the store info
      exportData.push([
        store.name,
        store.displayName || 'N/A',
        store.name.split('/')[1],
        'EMPTY', '', '', '', ''
      ]);
    }
  });

  if (createNewSheet) {
    const ss = SpreadsheetApp.create("Gemini File Search Report " + new Date().toISOString());
    const sheet = ss.getActiveSheet();
    sheet.getRange(1, 1, exportData.length, exportData[0].length).setValues(exportData);
    Logger.log(`Report created: ${ss.getUrl()}`);
  } else {
    Logger.log(JSON.stringify(exportData));
  }
}

// ==========================================
// UTILITIES (API Caller)
// ==========================================

/**
 * Generic helper function to call the Gemini API with retry logic.
 */
function callGeminiApi_(endpoint, method, payload = null) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Please set GEMINI_API_KEY in Script Properties");

  // If endpoint is full URL (like from operations.get), use it, otherwise append to BASE
  let url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}/${endpoint}`;
  
  // Append Key
  if (url.includes('?')) {
    url += `&key=${apiKey}`;
  } else {
    url += `?key=${apiKey}`;
  }

  const options = {
    'method': method,
    'muteHttpExceptions': true,
    'headers': {
       'Content-Type': 'application/json'
    }
  };

  if (payload && (method === 'post' || method === 'put')) {
    options.payload = JSON.stringify(payload);
  }
    console.log(url)

  let response;
  for (let i = 0; i < 3; i++) {
    response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      const text = response.getContentText();
      return text ? JSON.parse(text) : {}; // Handle empty responses (like Delete)
    } else if (response.getResponseCode() === 404) {
      // Break immediately on 404, no need to retry
      throw new Error(`Resource not found (404): ${url}`);
    }

    Logger.log(`API call to ${endpoint} failed with status ${response.getResponseCode()}. Retrying in ${i + 1} sec...`);
    Utilities.sleep((i + 1) * 1000);
  }

  Logger.log(`FATAL: Gemini API Error. Response: ${response.getContentText()}`);
  throw new Error(`Failed to call Gemini API: ${response.getContentText()}`);
}
