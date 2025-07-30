document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded: Stresformance Tracker script is running.");

  // Get references to elements
  const stressAssessmentSection = document.getElementById("stress-assessment");
  const performanceAssessmentSection = document.getElementById(
    "performance-assessment"
  );
  const resultsDisplaySection = document.getElementById("results-display");

  const continueButton = document.getElementById("continue-to-performance");
  const calculateResultsButton = document.getElementById("calculate-results");
  const startNewAssessmentButton = document.getElementById(
    "start-new-assessment"
  );

  const stressLevelText = document.getElementById("stress-level-text");
  const stressMeanValue = document.getElementById("stress-mean-value");
  const performanceLevelText = document.getElementById(
    "performance-level-text"
  );
  const performanceMeanValue = document.getElementById(
    "performance-mean-value"
  );
  const employerRecommendation = document.getElementById(
    "employer-recommendation"
  );

  const stressGaugeFill = (document =
    document.getElementById("stress-gauge-fill"));
  const stressGaugeValue = document.getElementById("stress-gauge-value");
  const performanceGaugeFill = document.getElementById(
    "performance-gauge-fill"
  );
  const performanceGaugeValue = document.getElementById(
    "performance-gauge-value"
  );

  // Custom Modal elements
  const customModal = document.getElementById("custom-modal");
  const modalMessage = document.getElementById("modal-message");
  const modalOkButton = document.getElementById("modal-ok-button");
  const closeModalButton = document.querySelector(".close-button");

  // Debugging for modal elements
  console.log("Modal elements found:", {
    customModal: customModal,
    modalMessage: modalMessage,
    modalOkButton: modalOkButton,
    closeModalButton: closeModalButton,
  });

  let stressAnswers = {};
  let performanceAnswers = {};

  // --- Data and Logic ---

  // Define variables for question counts
  const numStressQuestions = 5;
  const numPerformanceQuestions = 6;
  const totalQuestions = numStressQuestions + numPerformanceQuestions; // Overall total questions

  // Define the value mapping for radio buttons (already 1-5, simple)
  // Define the level thresholds
  const LEVEL_THRESHOLDS = {
    "Very Low": 1.5,
    Low: 2.5,
    Moderate: 3.5,
    High: 4.5,
    "Very High": 5.0, // Or anything above 4.5
  };

  // Mapping for Stress Levels (Higher mean = Worse)
  function getStressLevel(mean) {
    if (mean <= LEVEL_THRESHOLDS["Very Low"]) return "Very Low";
    if (mean <= LEVEL_THRESHOLDS["Low"]) return "Low";
    if (mean <= LEVEL_THRESHOLDS["Moderate"]) return "Moderate";
    if (mean <= LEVEL_THRESHOLDS["High"]) return "High";
    return "Very High";
  }

  // Mapping for Performance Levels (Higher mean = Worse)
  function getPerformanceLevel(mean) {
    // Performance is inverse: lower mean is better (less issues)
    // So, if mean is low, performance is High/Very High
    if (mean <= LEVEL_THRESHOLDS["Very Low"]) return "Very High"; // Fewest issues means very high performance
    if (mean <= LEVEL_THRESHOLDS["Low"]) return "High";
    if (mean <= LEVEL_THRESHOLDS["Moderate"]) return "Moderate";
    if (mean <= LEVEL_THRESHOLDS["High"]) return "Low";
    return "Very Low"; // Most issues means very low performance
  }

  // Recommendation Table (from your screenshot) - REVISED FOR LOGIC
  const recommendations = {
    "Very Low_Very High":
      "Mental health is excellent and performance is excellent",
    "Very Low_High":
      "Mental health is excellent, but performance needs training",
    "Very Low_Moderate":
      "Mental health is excellent, but performance needs monitoring",
    "Very Low_Low":
      "Mental health is excellent, and performance needs training", // Revised for consistency
    "Very Low_Very Low":
      "Mental health is excellent, and performance needs training", // Revised for consistency

    "Low_Very High": "Mental health is good and performance is excellent",
    Low_High: "Mental health is good and performance are good",
    Low_Moderate: "Mental health is good, but performance needs monitoring",
    Low_Low: "Mental health is good, and performance needs training", // Revised for consistency
    "Low_Very Low": "Mental health is good, and performance needs training", // Revised for consistency

    "Moderate_Very High":
      "Mental health needs monitoring, but performance is excellent",
    Moderate_High:
      "Mental health needs monitoring and performance needs training",
    Moderate_Moderate: "Mental health and performance need monitoring",
    Moderate_Low: "Mental health and performance need training", // Revised for consistency
    "Moderate_Very Low": "Mental health and performance need training", // Revised for consistency

    "High_Very High":
      "Mental health needs counseling, but performance is excellent",
    High_High: "Mental health needs counseling and performance needs training",
    High_Moderate:
      "Mental health needs counseling and performance needs monitoring",
    High_Low: "Mental health needs counseling and performance needs training", // Revised for consistency
    "High_Very Low":
      "Mental health needs counselling, and performance needs training",

    "Very High_Very High":
      "Mental health needs counseling, but performance is excellent",
    "Very High_High":
      "Mental health needs counseling and performance needs training",
    "Very High_Moderate":
      "Mental health needs counseling and performance needs monitoring",
    "Very High_Low":
      "Mental health needs counseling and performance needs training", // Revised for consistency
    "Very High_Very Low":
      "Mental health needs counselling, and performance needs training",
  };

  // Helper function to show custom modal
  function showModal(message) {
    if (customModal) {
      modalMessage.textContent = message;
      customModal.classList.remove("hidden");
      customModal.classList.add("flex"); // Ensure flexbox for centering
    } else {
      console.error("Custom modal element not found. Cannot show modal.");
      alert(message); // Fallback to alert if modal not found, for debugging purposes
    }
  }

  // Helper function to hide custom modal
  function hideModal() {
    if (customModal) {
      customModal.classList.add("hidden");
      customModal.classList.remove("flex");
    }
  }

  // Event listeners for custom modal
  if (modalOkButton) {
    modalOkButton.addEventListener("click", hideModal);
  } else {
    console.error("modalOkButton not found. Cannot attach event listener.");
  }

  if (closeModalButton) {
    closeModalButton.addEventListener("click", hideModal);
  } else {
    console.error("closeModalButton not found. Cannot attach event listener.");
  }

  if (customModal) {
    window.addEventListener("click", (event) => {
      if (event.target == customModal) {
        hideModal();
      }
    });
  } else {
    console.error(
      "customModal not found. Cannot attach window click listener."
    );
  }

  // Updated function to control tank fill and color for correct level representation
  function updateGauge(gaugeFillElement, gaugeValueElement, mean, type) {
    let minVal, maxVal;
    if (type === "stress") {
      minVal = 1;
      maxVal = 5;
    } else if (type === "performance") {
      minVal = 1;
      maxVal = 5; // Max value for performance questions is 5
    }

    let fillPercentage;
    if (type === "stress") {
      // Stress: higher mean = higher fill (bad state)
      fillPercentage = ((mean - minVal) / (maxVal - minVal)) * 100;
    } else if (type === "performance") {
      // Performance: lower mean = higher fill (good state)
      fillPercentage = 100 - ((mean - minVal) / (maxVal - minVal)) * 100;
    }

    // Ensure percentage is within 0-100 range
    const clampedFillPercentage = Math.max(0, Math.min(100, fillPercentage));

    gaugeFillElement.style.height = `${clampedFillPercentage}%`;
    gaugeValueElement.textContent = mean.toFixed(2);

    // Determine color based on mean and type (stress/performance) for the fill
    let color = "";
    if (type === "stress") {
      // Stress: lower mean (less stress) is good (green), higher mean (more stress) is bad (red)
      // Since fill is directly proportional to mean (high mean = high fill),
      // we want green at low fill, yellow at moderate, red at high fill.
      if (mean <= 2.0)
        color = "#22c55e"; // green-500 (low stress, low fill, good)
      else if (mean <= 3.5)
        color = "#facc15"; // yellow-500 (moderate stress, moderate fill)
      else color = "#ef4444"; // red-500 (high stress, high fill, bad)
    } else if (type === "performance") {
      // Performance: lower mean (better performance) is good (green), higher mean (worse performance) is bad (red)
      // Since fill is now inversely proportional to mean (low mean = high fill),
      // we want green at high fill, yellow at moderate, red at low fill.
      if (mean <= 2.0)
        color = "#22c55e"; // green-500 (high performance, high fill, good)
      else if (mean <= 3.5)
        color = "#facc15"; // yellow-500 (moderate performance, moderate fill)
      else color = "#ef4444"; // red-500 (low performance, low fill, bad)
    }
    gaugeFillElement.style.backgroundColor = color;
  }

  // --- Event Listeners and Flow Control ---

  continueButton.addEventListener("click", () => {
    console.log("Continue button clicked!");

    const stressRadios = document.querySelectorAll(
      '#stress-assessment input[type="radio"]:checked'
    );
    console.log("Stress radios checked:", stressRadios.length);

    // Use numStressQuestions variable for validation
    if (stressRadios.length !== numStressQuestions) {
      showModal(
        `Please answer all ${numStressQuestions} stress assessment questions before continuing.`
      );
      return;
    }

    // Save stress answers
    stressAnswers = {};
    stressRadios.forEach((radio) => {
      stressAnswers[radio.name] = parseInt(radio.value);
    });

    stressAssessmentSection.classList.add("hidden");
    performanceAssessmentSection.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top of new section
  });

  calculateResultsButton.addEventListener("click", () => {
    const performanceRadios = document.querySelectorAll(
      '#performance-assessment input[type="radio"]:checked'
    );
    // Use numPerformanceQuestions variable for validation
    if (performanceRadios.length !== numPerformanceQuestions) {
      showModal(
        `Please answer all ${numPerformanceQuestions} performance assessment questions before calculating results.`
      );
      return;
    }

    // Save performance answers
    performanceAnswers = {};
    performanceRadios.forEach((radio) => {
      performanceAnswers[radio.name] = parseInt(radio.value);
    });

    // Calculate means
    const allStressValues = Object.values(stressAnswers);
    // Use numStressQuestions variable for mean calculation
    const stressMean =
      allStressValues.reduce((a, b) => a + b, 0) / numStressQuestions;

    const allPerformanceValues = Object.values(performanceAnswers);
    // Use numPerformanceQuestions variable for mean calculation
    const performanceMean =
      allPerformanceValues.reduce((a, b) => a + b, 0) / numPerformanceQuestions;

    // Determine levels
    const calculatedStressLevel = getStressLevel(stressMean);
    const calculatedPerformanceLevel = getPerformanceLevel(performanceMean);

    // Get recommendation
    const recommendationKey = `${calculatedStressLevel}_${calculatedPerformanceLevel}`;
    const finalRecommendation =
      recommendations[recommendationKey] ||
      "No specific recommendation found. Please review scores.";

    // Update UI
    stressLevelText.textContent = calculatedStressLevel;
    stressMeanValue.textContent = stressMean.toFixed(2);
    performanceLevelText.textContent = calculatedPerformanceLevel;
    performanceMeanValue.textContent = performanceMean.toFixed(2);
    employerRecommendation.textContent = finalRecommendation;

    updateGauge(stressGaugeFill, stressGaugeValue, stressMean, "stress");
    updateGauge(
      performanceGaugeFill,
      performanceGaugeValue,
      performanceMean,
      "performance"
    );

    performanceAssessmentSection.classList.add("hidden");
    resultsDisplaySection.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top of results
  });

  startNewAssessmentButton.addEventListener("click", () => {
    // Reset all radio buttons
    document
      .querySelectorAll('input[type="radio"]')
      .forEach((radio) => (radio.checked = false));

    // Reset stored answers
    stressAnswers = {};
    performanceAnswers = {};

    // Hide results, hide performance, show stress
    resultsDisplaySection.classList.add("hidden");
    performanceAssessmentSection.classList.add("hidden");
    stressAssessmentSection.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top
  });

  // Initial state: Only stress assessment is visible
  stressAssessmentSection.classList.remove("hidden");
  performanceAssessmentSection.classList.add("hidden");
  resultsDisplaySection.classList.add("hidden");
});
