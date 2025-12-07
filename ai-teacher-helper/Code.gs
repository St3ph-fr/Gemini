// --- CONFIGURATION ---
const ACCESS_CONTROL = {
  ENABLED: false, // Set to false to disable filtering
  ALLOWED_DOMAINS: ['school.edu', 'university.com'], // Add your workspace domains
  ALLOWED_EMAILS: ['student1@gmail.com', 'teacher@gmail.com'] // specific allowed emails
};

function doGet(e) {
  // 1. Check Access Control
  if (ACCESS_CONTROL.ENABLED) {
    const userEmail = Session.getActiveUser().getEmail();
    
    // If user is not logged in (and access is set to "Anyone"), email might be empty
    if (!userEmail) {
      return HtmlService.createHtmlOutput("<h3>Your Google Account do not have access to this tool.</h3>");
    }

    const domain = userEmail.split('@')[1];
    const isDomainAllowed = ACCESS_CONTROL.ALLOWED_DOMAINS.includes(domain);
    const isEmailAllowed = ACCESS_CONTROL.ALLOWED_EMAILS.includes(userEmail);

    if (!isDomainAllowed && !isEmailAllowed) {
       return HtmlService.createHtmlOutput(`<h3>Access Denied for: ${userEmail}</h3><p>You are not authorized to use this helper.</p>`);
    }
  }
  const template = HtmlService.createTemplateFromFile('Index');
  
  template.savedAge = getUserAge(); 

  return template.evaluate()
      .setTitle('Student Virtual Helper')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Securely retrieves the API key from Script Properties.
 * This prevents hardcoding the key in the HTML/JS.
 */
function getApiKey() {
  // const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const key = "";
  if (!key) {
    throw new Error("API Key not found. Please set GEMINI_API_KEY in Project Settings > Script Properties.");
  }
  return key;
}

/* ==========================================================================
   LUCKY LEARN DATABASE & LOGIC
   ========================================================================== */

const schoolCurriculum = {
  "items": [ 
    { subject: "French", topics: ["Grammar", "Spelling", "Conjugation", "Sentences","Vocabulary"] },
    { subject: "Math", topics: ["Number", "Calculation", "Geometric", "Measure",] },
    { subject: "History", topics: [  "Paleolithic Era (Old Stone Age)",  "Mesolithic Era (Middle Stone Age)",  "Neolithic Era (New Stone Age) & Agricultural Revolution",  "Bronze Age",  "Iron Age & Classical Antiquity",  "Punic Wars",  "Early Middle Ages (Dark Ages)",  "High Middle Ages (Feudalism, Crusades)",  "Hundred Years' War",  "Late Middle Ages & Renaissance",  "Age of Exploration & Reformation",  "Thirty Years' War",  "Age of Enlightenment & Revolutions",  "Napoleonic Wars",  "Crimean War",  "Industrial Revolution & Imperialism",  "World War I (The Great War)",  "Interwar Period",  "World War II",  "Cold War Era",  "Information Age / Digital Revolution (Present)"] },
    { subject: "Geography", topics: [  "Understanding Maps, Globes, and Basic Cartography (Scale, Symbols)",  "Local Geography: Home, Neighborhood, and Community",  "Basic Landforms (Mountains, Rivers, Oceans, Lakes)",  "Weather, Climate, and Seasons",  "The Continents and Oceans of the World",  "Human Geography: Population and Settlement Patterns",  "The Water Cycle and Hydrology",  "Types of Government and Political Systems (Basic)",  "Natural Resources and Their Distribution",  "Economic Activities and Land Use (Primary, Secondary, Tertiary Sectors)",  "Time Zones and Earth's Rotation/Revolution",  "Physical Geography: Plate Tectonics and Earthquakes/Volcanoes",  "Biomes and Ecosystems (Forests, Deserts, Tundra)",  "Geographic Information Systems (GIS) and Remote Sensing (Introduction)",  "Globalization and Interdependence",  "Urban Geography and City Planning",  "Cultural Geography (Language, Religion, Customs)",  "Migration and Human Movement",  "Environmental Issues: Pollution, Deforestation, Habitat Loss",  "Climatology: Climate Classification (e.g., Köppen System)",  "Oceanography and Marine Environments",  "Geomorphology (Study of Landform Evolution)",  "Resource Management and Sustainability",  "Development Geography (Indicators, Inequalities)",  "Political Geography: Borders, Sovereignty, and Geopolitics",  "Hazards and Disasters (Tornadoes, Floods, Tsunamis)",  "Soil Science (Pedology) and Agricultural Geography",  "Historical Geography and Landscape Change",  "Methods of Geographical Research and Fieldwork", "Contemporary Global Challenges (e.g., Climate Change, Food Security)"] },
    {subject : "Physics-Chemistry",topics: ["Matter and Its States (Solid, Liquid, Gas)","Elements, Compounds, and Mixtures","The Atom and Atomic Structure","Chemical Changes and Physical Changes","Density and Buoyancy","Basic Forces (Gravity, Friction, Magnetic)","Motion (Speed, Velocity, Acceleration)","Energy Forms (Kinetic, Potential, Thermal, Light)","Circuits and Electricity (Series and Parallel)","Heat Transfer (Conduction, Convection, Radiation)","Sound Waves and Properties","Light (Reflection, Refraction, Color)","The Periodic Table and Basic Trends","Chemical Reactions (Introduction, Types)","Acids, Bases, and pH","Oxidation and Reduction (Basic)","Pressure and Gases (Boyle's Law, Charles's Law)","Work, Power, and Simple Machines","Momentum and Conservation Laws","Radioactivity and Nuclear Energy (Introduction)","The Structure of the Earth (Layers)","The Solar System and Planetary Motion","Gravity in Space and Orbits","Telescopes and Light from Stars","The Universe and Galaxies","Environmental Chemistry (Water and Air Quality)","Polymers and Everyday Materials","Organic Chemistry (Introduction to Carbon Compounds)","Thermodynamics (Energy and Heat Flow)","Quantum Concepts (Introduction to Photons and Electrons)"]},
    {subject : "Biology",topics: ["Characteristics of Living Things (MRS GREN)","Life Cycles of Plants and Animals","Basic Anatomy (Human and Plant Parts)","The Five Senses and Body Functions","Ecosystems and Habitats (Local and Global)","Food Chains and Food Webs","Cells: The Basic Unit of Life (Plant vs. Animal)","The Scientific Method and Biological Inquiry","Photosynthesis and Cellular Respiration (Energy Flow)","Macromolecules (Carbohydrates, Lipids, Proteins, Nucleic Acids)","Enzymes and Biological Catalysis","Cellular Organelles and Their Functions (Nucleus, Mitochondria, Chloroplasts)","Cell Division (Mitosis and Meiosis)","DNA Structure and Replication","Genetics and Heredity (Mendelian Principles)","Non-Mendelian Inheritance and Gene Linkage","The Human Digestive and Respiratory Systems","The Circulatory System and Blood","The Nervous System and Homeostasis","Immunity, Disease, and Pathogens (Viruses, Bacteria)","Plant Structure, Transport, and Reproduction (Botany)","Animal Diversity and Classification (Zoology)","Evolution by Natural Selection and Adaptation","Evidence for Evolution (Fossil Record, Comparative Anatomy)","Ecology: Population, Community, and Ecosystem Dynamics","Biotechnology and Genetic Engineering (PCR, Recombinant DNA)","The Human Endocrine System and Hormones","Biogeochemical Cycles (Carbon, Nitrogen, Water)","Biodiversity and Conservation Biology","Ethology (Animal Behavior) and Neurobiology"]},{
  "subject": "Computer Science",
  "topics": [    "Digital Literacy and Device Usage (Basic functions, keyboarding, file management)",    "Online Safety, Privacy, and Cyberbullying (Digital Citizenship)",    "Computational Thinking (Decomposition, Pattern Recognition, Abstraction, Algorithms)",    "Introduction to Algorithms (Step-by-step instructions, flowcharts)",    "Data Representation (Binary, Bits, Bytes, Text, Images)",    "Basic Programming Concepts (Sequencing, Loops, Conditionals using block-based code)",    "Variables and Data Types",    "Debugging and Error Handling (Finding and fixing mistakes)",    "Operating Systems (OS) and Hardware Basics (CPU, RAM, Storage)",    "Spreadsheets and Data Analysis (Formulas, charts, filtering)",    "Networking Fundamentals (What is the Internet, LAN/WAN)",    "Internet Protocols (HTTP, HTTPS, Introduction to IP Addresses)",    "Web Development Basics (HTML, CSS for structure and style)",    "Cybersecurity Basics (Passwords, Malware, Phishing)",    "Social Media and Online Communication Ethics",    "Functions, Procedures, and Modularity in Programming",    "Data Structures (Arrays, Lists, Stacks, Queues, Dictionaries)",    "Advanced Algorithms (Sorting, Searching - Binary Search, Bubble Sort)",    "Object-Oriented Programming (OOP) Concepts (Classes, Objects, Inheritance)",    "Databases and SQL (Introduction to relational data)",    "Computer Architecture (Von Neumann Model, Fetch-Decode-Execute Cycle)",    "Introduction to Artificial Intelligence (AI) and its applications",    "Machine Learning (ML): Concept of training data and prediction",    "Ethical Implications of AI (Bias, Fairness, Accountability)",    "Generative AI: Definition and how it differs from traditional AI",    "Large Language Models (LLMs) and How They Work (Basic overview)",    "Prompt Engineering (Crafting effective instructions for Generative AI)",    "Applications of Generative AI (Text, Image, and Code generation)",    "The Digital Divide and Socio-Economic Impact of Technology"  ]}
  ],
  
};

/**
 * Picks a random topic. 
 */
function getRandomTopic() {
  const items = schoolCurriculum.items;
  
  // 1. Pick Random Subject Object
  const randomSubjectData = items[Math.floor(Math.random() * items.length)];
  
  // 2. Pick Random Topic String
  const randomTopic = randomSubjectData.topics[Math.floor(Math.random() * randomSubjectData.topics.length)];
  
  return {
    subject: randomSubjectData.subject,
    topic: randomTopic
  };
}

// --- GESTION DES PRÉFÉRENCES UTILISATEUR ---

function saveUserAge(age) {
  try {
    const email = Session.getActiveUser().getEmail();
    if (email) {
      // On sauvegarde l'âge associé à l'email spécifique
      PropertiesService.getScriptProperties().setProperty('PREF_AGE_' + email, (age));
    }
  } catch (e) {
    console.error("Erreur sauvegarde age", e);
  }
}

function getUserAge() {
  try {
    const email = Session.getActiveUser().getEmail();
    if (email) {
      const saved = PropertiesService.getScriptProperties().getProperty('PREF_AGE_' + email);
      console.log(saved)
      return saved ? parseInt(saved) : 12; // 12 est le défaut si rien n'est trouvé
    }
  } catch (e) {
    console.error("Erreur lecture age", e);
  }
  return 12; // Défaut de sécurité
}
