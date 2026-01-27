/**
 * 🎨 AI Sticker Generator: From Photo to Transparent PNG
 * 
 * This script orchestrates a complete pipeline using Google Gemini:
 * 1. Takes a source image from Google Drive.
 * 2. Uses Gemini Pro Vision to generate a sticker style illustration with a green screen.
 * 3. Uses Gemini Flash (with Python Code Execution) to remove the green screen.
 * 4. Saves the final transparent PNG back to Drive.
 *
 * Platform: Google Apps Script
 */

// ==========================================
// ⚙️ CONFIGURATION
// ==========================================
const CONFIG = {
  GEMINI_API_KEY: "YOUR KEY", // ⚠️ Replace with your actual key
  SOURCE_FILE_ID: "File ID of Image", // ID of the photo to transform
  MODEL_IMAGE_GEN: "gemini-3-pro-image-preview", // Model for visual creativity
  MODEL_CODE_EXEC: "gemini-3-pro-preview" // Model for Python logic
};

// ==========================================
// 🚀 MAIN TRIGGER FUNCTION
// ==========================================

/**
 * ENTRY POINT: Run this function to execute the entire process at once.
 */
function executeFullStickerPipeline() {
  console.log("🎬 === STARTING AUTOMATED PIPELINE === 🎬");
  const startTime = new Date();

  try {
    // 1. Retrieve Source File
    const sourceFile = DriveApp.getFileById(CONFIG.SOURCE_FILE_ID);
    console.log(`📂 Source file found: "${sourceFile.getName()}"`);

    // 2. Step One: Generate Sticker (Green Screen)
    console.log("\n🔹 STEP 1/2: Generating Sticker Image...");
    const stickerImageFile = stepGenerateSticker(sourceFile);

    if (!stickerImageFile) {
      throw new Error("⛔ Process stopped: Failed to generate sticker image.");
    }
    console.log(`✅ Sticker generated: ${stickerImageFile.getUrl()}`);

    // Small pause to ensure Drive indexing (optional but safer)
    Utilities.sleep(2000); 

    // 3. Step Two: Remove Background (Python)
    console.log("\n🔹 STEP 2/2: Removing Green Screen via Python...");
    const finalTransparentFile = stepRemoveBackground(stickerImageFile);

    if (finalTransparentFile) {
      console.log("\n🎉 SUCCESS! Final transparent sticker saved:");
      console.log(`👉 ${finalTransparentFile.getUrl()}`);
    } else {
      throw new Error("⛔ Process stopped: Failed to remove background.");
    }

  } catch (error) {
    console.error(`❌ PIPELINE FAILED: ${error.message}`);
  }

  const duration = (new Date() - startTime) / 1000;
  console.log(`\n⏱️ Execution time: ${duration} seconds.`);
  console.log("🎬 === PIPELINE FINISHED === 🎬");
}

// ==========================================
// 🔧 LOGIC STEPS
// ==========================================

/**
 * Step 1: Calls Gemini to create the illustration on a green background.
 */
function stepGenerateSticker(file) {
  const prompt = `Focus on the main character of the image for your work. 
  CRITICAL CHROMAKEY REQUIREMENTS:
  BACKGROUND: Solid, flat, uniform chromakey green color. Use EXACTLY hex color #00FF00 (RGB 0, 255, 0). The entire background must be this single pure green color with NO variation, NO gradients, NO shadows, NO lighting effects.
  WHITE OUTLINE: The subject MUST have a clean white outline/border (2-3 pixels wide) separating it from the green background. This white border prevents color bleeding between the subject and background.
  NO GREEN ON SUBJECT: The subject itself should NOT contain any green colors to avoid confusion with the chromakey. If the subject needs green (like leaves), use a distinctly different shade like dark forest green or teal.
  SHARP EDGES: The subject should have crisp, sharp, well-defined edges - no soft or blurry boundaries. 
  CENTERED: Subject should be centered with padding around all sides.
  STYLE: Vibrant, clean, cartoon/illustration sticker style with bold colors. This is for chromakey extraction - the green background will be removed programmatically.`;

  const base64File = Utilities.base64Encode(file.getBlob().getBytes());
  
  const contents = [{
    parts: [
      { "text": prompt },
      { "inline_data": { "mime_type": file.getMimeType(), "data": base64File } },
    ]
  }];

  const generationConfig = {
    "responseModalities": ["IMAGE", "TEXT"], // Ask for image output
    "imageConfig": { "image_size": "2K" }
  };

  const response = callGeminiApi(
    contents, 
    null, // No tools needed here
    "You are a specialized image processor app.", 
    CONFIG.MODEL_IMAGE_GEN, 
    generationConfig
  );

  const fileName = `temp_sticker_${file.getName()}`;
  return processResponseAndSaveFile(response, fileName);
}

/**
 * Step 2: Calls Gemini to write and execute Python code to remove the green background.
 */
function stepRemoveBackground(imageFile) {
  const prompt = `USE CODE EXECUTION.You are an expert in computer vision and Python image processing. 
  Your task is to implement a green screen removal pipeline using the PIL (Pillow) and NumPy libraries. Follow this three-step methodology for maximum accuracy: 
  Precision HSV Detection: Convert RGB images to the HSV color space to decouple chromaticity from intensity. Target the green (hex color #00FF00 (RGB 0, 255, 0)) hue (centered at 120°) with configurable thresholds for saturation and value to handle shadows and uneven lighting effectively. 
  Morphological Edge Polish: Apply morphological dilation to the detection mask to eliminate anti-aliased green artifacts ("halos") on object borders, ensuring crisp edges. 
  Lossless RGBA Export: Process the alpha channel directly to generate a high-quality RGBA image and save it as a transparent PNG to preserve the cutout fidelity. 
  When providing code, prioritize vectorization with NumPy for performance and ensure type hinting is used.`;

  const base64Image = Utilities.base64Encode(imageFile.getBlob().getBytes());

  const contents = [{
    parts: [
      { "text": prompt },
      { "inline_data": { "mime_type": imageFile.getMimeType(), "data": base64Image } },
    ]
  }];

  const tools = [{ "code_execution": {} }];
  
  // Important: Do not use responseModalities: ["IMAGE"] here.
  // We want the Python environment to generate a file, not the model to generate a pixel image.
  const generationConfig = {  "thinkingConfig": {"thinkingLevel": "HIGH",},
  "temperature": 1 };

  const response = callGeminiApi(
    contents, 
    tools, 
    "You are a Python image processing expert.", 
    CONFIG.MODEL_CODE_EXEC,
    generationConfig
  );

  const fileName = `final_transparent_${imageFile.getName()}`;
  return processResponseAndSaveFile(response, fileName);
}

// ==========================================
// 🛠️ HELPER FUNCTIONS
// ==========================================

/**
 * Processes Gemini API response: Logs code/text and saves any generated files.
 * Returns the Drive File object if a file was created.
 */
function processResponseAndSaveFile(response, outputFileName) {
  if (!response || !response.candidates || !response.candidates[0].content) {
    console.error("⚠️ Empty API Response");
    return null;
  }

  const parts = response.candidates[0].content.parts;
  let savedFile = null;

  parts.forEach(part => {
    if (part.executableCode) {
      console.log(`💻 [Code] Generating Python script...`);
    } 
    else if (part.codeExecutionResult) {
      // console.log(`⚙️ [Exec] Output: ${part.codeExecutionResult.output}`); // Uncomment for debug
    } 
    else if (part.inlineData) {
      console.log(`💾 [File] Saving generated image (${part.inlineData.mimeType})...`);
      const decoded = Utilities.base64Decode(part.inlineData.data);
      const blob = Utilities.newBlob(decoded, part.inlineData.mimeType, outputFileName);
      savedFile = DriveApp.createFile(blob);
    }
  });

  return savedFile;
}

/**
 * Standardized API Call Wrapper with Retry Logic
 */
function callGeminiApi(contents, tools, systemInstruction, model, config) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
  
  const payload = {
    "contents": contents,
    "generationConfig": config || {}
  };

  if (systemInstruction) payload.systemInstruction = { "parts": [{ "text": systemInstruction }] };
  if (tools) payload.tools = tools;

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true,
  };

  // Simple retry mechanism for robustness
  for (let i = 0; i < 3; i++) {
    try {
      const response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() === 200) {
        return JSON.parse(response.getContentText());
      }
      console.warn(`⚠️ Attempt ${i+1} failed: ${response.getResponseCode()} ${response.getContentText()}`);
      if (response.getResponseCode() === 400) break; // Don't retry bad requests
      Utilities.sleep(1000 * (i + 1));
    } catch (e) {
      console.error(`❌ Network error: ${e.message}`);
      Utilities.sleep(1000);
    }
  }
  return null;
}
