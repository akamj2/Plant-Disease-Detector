// Configuration flags
const USE_MOCK = true; // Set to false to use backend API
const BACKEND_URL = ""; // e.g., "http://localhost:8000/predict"

// Preview uploaded image
document.getElementById("fileInput").addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById("previewImage").src = e.target.result;
    }
    reader.readAsDataURL(file);
  }
});

function getRemedyFor(label) {
  const remedies = {
    "Powdery Mildew": "Use fungicide sprays, ensure proper air circulation.",
    "Leaf Spot": "Avoid overhead watering, remove infected leaves.",
    "Blight": "Apply copper-based sprays, crop rotation helps.",
    "Healthy": "No disease detected. Maintain regular care!"
  };
  return remedies[label] || "Follow best agronomic practices and consult local guidance.";
}

async function predictDisease() {
  const fileInput = document.getElementById("fileInput");
  const predictionEl = document.getElementById("prediction");
  const remediesEl = document.getElementById("remedies");

  if (!fileInput.files || !fileInput.files[0]) {
    predictionEl.innerText = "Please select an image first";
    remediesEl.innerText = "";
    return;
  }

  if (USE_MOCK) {
    const labels = ["Powdery Mildew", "Leaf Spot", "Blight", "Healthy"];
    const label = labels[Math.floor(Math.random() * labels.length)];
    predictionEl.innerText = label;
    remediesEl.innerText = getRemedyFor(label);
    return;
  }

  if (!BACKEND_URL) {
    predictionEl.innerText = "Backend URL not configured";
    remediesEl.innerText = "Set BACKEND_URL in script.js";
    return;
  }

  try {
    predictionEl.innerText = "Predicting...";
    remediesEl.innerText = "";

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const response = await fetch(BACKEND_URL, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Normalize various response shapes (A, B, C from README)
    let label = "";
    let probability = undefined;

    if (Array.isArray(data?.predictions) && data.predictions.length > 0) {
      // Shape A
      label = data.predictions[0].label;
      probability = data.predictions[0].probability;
    } else if (Array.isArray(data?.top_k) && data.top_k.length > 0) {
      // Shape B
      label = data.top_k[0];
      probability = Array.isArray(data.probs) ? data.probs[0] : undefined;
    } else if (typeof data?.class === "string") {
      // Shape C
      label = data.class;
      probability = typeof data.confidence === "number" ? data.confidence / 100 : undefined;
    } else if (typeof data?.label === "string") {
      // Fallback common shape
      label = data.label;
      probability = data.probability;
    } else {
      throw new Error("Unrecognized response format");
    }

    const probText = typeof probability === "number" ? ` (${Math.round(probability * 100)}%)` : "";
    predictionEl.innerText = `${label}${probText}`;
    remediesEl.innerText = getRemedyFor(label);
  } catch (err) {
    predictionEl.innerText = "Prediction failed";
    remediesEl.innerText = String(err);
    console.error(err);
  }
}
