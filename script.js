// --- Configuration ---
const USE_MOCK = false; // Set to false to use your backend
const BACKEND_URL = http://127.0.0.1:5000/predict

// --- Event Listener for Image Preview ---
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

// --- Event Listener for the Predict Button ---
// We find the button on the page and tell it to run the
// predictDisease function when someone clicks it.
document.querySelector(".upload-section button").addEventListener("click", predictDisease);


// --- Main Prediction Function ---
async function predictDisease() {
  const fileInput = document.getElementById("fileInput");
  const predictionEl = document.getElementById("prediction");

  // Check if a file was selected
  if (!fileInput.files || !fileInput.files[0]) {
    predictionEl.innerText = "Please select an image first.";
    return;
  }
  

}

  // MOCK MODE: Use fake data for frontend testing
  if (USE_MOCK) {
    const labels = ["Powdery Mildew", "Leaf Spot", "Blight", "Healthy"];
    const label = labels[Math.floor(Math.random() * labels.length)];
    predictionEl.innerText = `Prediction: ${label}`;
    return;
  }

  // LIVE MODE: Check if backend URL is configured in Vercel
  if (!BACKEND_URL) {
    predictionEl.innerText = "Error: Backend URL is not configured.";
    return;
  }

  // --- API Call Logic ---
  try {
    predictionEl.innerText = "Analyzing leaf...";

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    // Fetch prediction from the backend API
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();

    // The following code tries to find the disease label from various possible API response formats.
    let label = "";
    let probability = undefined;

    if (Array.isArray(data?.predictions) && data.predictions.length > 0) {
      label = data.predictions[0].label;
      probability = data.predictions[0].probability;
    } else if (Array.isArray(data?.top_k) && data.top_k.length > 0) {
      label = data.top_k[0];
      probability = Array.isArray(data.probs) ? data.probs[0] : undefined;
    } else if (typeof data?.class === "string") {
      label = data.class;
      probability = typeof data.confidence === "number" ? data.confidence / 100 : undefined;
    } else if (typeof data?.label === "string") {
      label = data.label;
      probability = data.probability;
    } else {
      throw new Error("Could not understand the response format from the server.");
    }

    // Display the final prediction
    const probText = typeof probability === "number" ? ` (${Math.round(probability * 100)}%)` : "";
    predictionEl.innerText = `${label}${probText}`;

  } catch (err) {
    // Display any errors that happen during the API call
    predictionEl.innerText = `Prediction failed: ${err.message}`;
    console.error("Prediction Error:", err);
  }
}
