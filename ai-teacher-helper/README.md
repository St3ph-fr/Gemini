# 🎓 AI Teacher Helper

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Tech Stack](https://img.shields.io/badge/Built%20With-Google%20Apps%20Script-4285F4?logo=google)
![AI Model](https://img.shields.io/badge/AI-Gemini%203%20%2B%20Nano%20Banana-8E44AD)
![License](https://img.shields.io/badge/License-MIT-blue)

> **A personalized, multimodal AI Tutor built with Google Apps Script, Gemini 3, and Nano Banana Pro.**  
> *Built for the Google AI Sprint.*

**AI Teacher Helper** is a web application designed to help students understand concepts rather than just giving them the answers. It leverages the new **Gemini 3 Thinking Modes** to balance pedagogical quality with cost efficiency, acting as a virtual tutor that adapts to the student's age and language.

---

## 🌟 Features

*   **🧒 Age-Adaptive Learning:** Content is tailored for students aged 6 to 20. The AI adjusts complexity, tone, and examples based on the selected age.
*   **🧠 Cost-Efficient Architecture:** Uses Gemini 3 `Thinking Level: Low` for analysis and `Thinking Level: High` for deep explanations to optimize token usage.
*   **🎨 AI Visualization:** Generates educational illustrations on the fly using **Nano Banana Pro** (2K resolution) to help visualize abstract concepts.
*   **📷 Multimodal Input:** Students can type questions or upload photos of exercises/textbooks.
*   **🗣️ Built-in Text-to-Speech:** Uses the browser's native Speech API to read explanations aloud (Zero API cost).
*   **🍀 Lucky Learn:** A "I'm Feeling Lucky" mode that generates a random curriculum-based topic and questions to spark curiosity.
*   **🔄 Continuous Learning:** A "Continue Learning" flow that prompts follow-up questions to deepen understanding.
*   **🌍 Multi-language Support:** Fully localized in English, French, Spanish, Portuguese, Italian, and German.
*   **🔢 Math Support:** Renders complex mathematical formulas beautifully using **MathJax**.
*   **🔒 Secure Deployment:** Includes backend filtering to restrict access to specific emails or Google Workspace domains (e.g., `school.edu`).

---

## 🏗️ Architecture & Logic

This project demonstrates how to build a robust AI app without a complex server infrastructure, using Google Apps Script as the backend.

### The 3-Step Generation Process
To ensure high quality while controlling costs, the app processes requests in stages:

1.  **Analysis (Thinking: Low):** The AI scans the text/image to identify the core topic and generate an image prompt.
2.  **Pedagogy (Thinking: High):** The AI acts as a teacher. It builds an explanation that guides the student without revealing the direct answer.
3.  **Visualization (Nano Banana Pro):** Simultaneously, an image is generated to illustrate the topic.

> **Note:** Steps 2 and 3 run in parallel to reduce latency.

---

## 🚀 Installation & Setup

Since this is a Google Apps Script project, you don't need a traditional server. You can deploy it directly from your Google Drive.

### Prerequisites
*   A Google Account.
*   A [Google Cloud Project with Gemini API enabled](https://aistudio.google.com/).
*   A valid **Gemini API Key**.

### Step 1: Create the Project
1.  Go to [script.google.com](https://script.google.com/).
2.  Click **New Project**.
3.  Name it "AI Teacher Helper".

### Step 2: Project Structure
Create the following files in the editor and copy the source code from this repository:

| Filename | Type | Description |
| :--- | :--- | :--- |
| `Code.gs` | Script | Backend logic, API calls, and Access Control. |
| `Index.html` | HTML | Main frontend interface, CSS, and JS logic. |
| `Locales.html`| HTML | Translation dictionaries for UI localization. |

### Step 3: Set Environment Variables
**Crucial Security Step:** Do not hardcode your API key in the code.
1.  In the Apps Script editor, go to **Project Settings** (⚙️ icon on the left).
2.  Scroll to **Script Properties**.
3.  Click **Add script property**.
    *   **Property:** `GEMINI_API_KEY`
    *   **Value:** `Your_Actual_Gemini_API_Key_Here`
4.  Click **Save script properties**.

### Step 4: Configure Access Control (Optional)
In `Code.gs`, you can restrict who can use your app:

```javascript
const ACCESS_CONTROL = {
  ENABLED: false, // Set to true to enable filtering
  ALLOWED_DOMAINS: ['myschool.edu'], // Restrict to workspace domains
  ALLOWED_EMAILS: ['teacher@gmail.com'] // Restrict to specific users
};
```

### Step 5: Deploy
1.  Click the blue **Deploy** button > **New deployment**.
2.  Select type: **Web app**.
3.  **Description:** `v1.0`.
4.  **Execute as:** `Me` (This allows the script to access your API key property).
5.  **Who has access:** 
    *   Choose `Anyone with a Google Account` (Recommended if using Access Control).
    *   Choose `Anyone` (if you want it public and disable Access Control).
6.  Click **Deploy** and copy the **Web App URL**.

---

## 📖 Usage Guide

1.  **Open the Web App URL.**
2.  **Setup:** On the left panel, select your **Age** (e.g., 12 years old). The app remembers this for next time.
3.  **Ask:** 
    *   Type a question (e.g., "How does gravity work?").
    *   Or click the **Camera** icon to upload a picture of a homework problem.
    *   Or click **Lucky Learn 🍀** to explore a random topic.
4.  **Learn:** 
    *   Read the teacher's explanation.
    *   View the generated concept image.
    *   Click **Listen** 🔊 to hear the explanation.
    *   Click **Continue Learning** to dive deeper.

---

## 🛠️ Tech Stack

*   **Backend:** Google Apps Script (V8 Runtime)
*   **Frontend:** HTML5, CSS3 (Grid/Flexbox), Vanilla JavaScript (ES6 Modules)
*   **AI Models:** 
    *   `gemini-3-pro-preview` (Text & Reasoning)
    *   `gemini-3-pro-image-preview` (Image Generation)
*   **Libraries:** 
    *   Google GenAI SDK (via ImportMap)
    *   `marked.js` (Markdown parsing)
    *   `MathJax` (LaTeX Math rendering)

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features (e.g., PDF export, chat history saving), feel free to fork the repo and submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*This project was created by [Your Name] for the Google Developer Experts AI Sprint.*
