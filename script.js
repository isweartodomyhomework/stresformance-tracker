document.addEventListener("DOMContentLoaded", () => {
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

  const stressGaugeFill = document.getElementById("stress-gauge-fill");
  const stressGaugeValue = document.getElementById("stress-gauge-value");
  const performanceGaugeFill = document.getElementById(
    "performance-gauge-fill"
  );
  const performanceGaugeValue = document.getElementById(
    "performance-gauge-value"
  );

  const stressGaugeNeedle = document.getElementById("stress-gauge-needle");
  const performanceGaugeNeedle = document.getElementById(
    "performance-gauge-needle"
  );

  let stressAnswers = {};
  let performanceAnswers = {};

  // --- Data and Logic ---

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

  // Recommendation Table (from your screenshot)
  const recommendations = {
    "Very Low_Very High":
      "Mental health is excellent and performance is excellent",
    "Very Low_High":
      "Mental health is excellent, but performance needs training",
    "Very Low_Moderate":
      "Mental health is excellent, but performance needs monitoring",
    "Very Low_Low":
      "Mental health is excellent, but performance needs monitoring",
    "Very Low_Very Low":
      "Mental health is excellent, but performance needs monitoring",

    "Low_Very High": "Mental health is good and performance is excellent",
    Low_High: "Mental health is good, but performance needs training",
    Low_Moderate: "Mental health is good, but performance needs monitoring",
    Low_Low: "Mental health is good, but performance needs monitoring",
    "Low_Very Low": "Mental health is good, but performance needs monitoring",

    "Moderate_Very High":
      "Mental health needs monitoring, but performance is excellent",
    Moderate_High:
      "Mental health needs monitoring and performance needs training",
    Moderate_Moderate: "Mental health and performance need monitoring",
    Moderate_Low: "Mental health and performance need monitoring",
    "Moderate_Very Low": "Mental health and performance need monitoring",

    "High_Very High":
      "Mental health needs counseling, but performance is excellent",
    High_High: "Mental health needs counseling and performance needs training",
    High_Moderate:
      "Mental health needs counseling and performance needs monitoring",
    High_Low: "Mental health needs counseling, but performance is good",
    "High_Very Low":
      "Mental health needs counseling, but performance is excellent", // Typo in screenshot? Should be low perf

    "Very High_Very High":
      "Mental health needs counseling, but performance is excellent",
    "Very High_High":
      "Mental health needs counseling and performance needs training",
    "Very High_Moderate":
      "Mental health needs counseling and performance needs monitoring",
    "Very High_Low": "Mental health needs counseling, but performance is good",
    "Very High_Very Low":
      "Mental health needs counseling and performance is excellent", // Typo in screenshot? Should be low perf
  };

  function calculateMean(questionsPrefix) {
    let sum = 0;
    let count = 0;
    const radios = document.querySelectorAll(
      `input[name^="${questionsPrefix}"]`
    );
    let allAnswered = true;

    radios.forEach((radio) => {
      if (radio.checked) {
        sum += parseInt(radio.value);
        // Ensure each question is counted only once, even if multiple radio buttons are for the same question
        // For this, we can check if the question group has been answered
        const qName = radio.name;
        if (!answers[`${questionsPrefix}_${qName}`]) {
          count++;
          answers[`${questionsPrefix}_${qName}`] = true; // Mark question as answered
        }
      }
    });

    // Reset the answers tracking object for the current calculation
    let answers = {};
    for (let i = 1; i <= (questionsPrefix === "q" ? 5 : 10); i++) {
      // For stress (q1-q5) or performance (q6-q10)
      const questionRadios = document.querySelectorAll(
        `input[name="${questionsPrefix}${i}"]:checked`
      );
      if (questionRadios.length === 0) {
        allAnswered = false;
        break;
      }
      sum += parseInt(questionRadios[0].value);
      count++;
    }

    if (!allAnswered) {
      return null; // Indicates not all questions were answered
    }
    return sum / count || 0; // Return 0 if count is 0 to avoid NaN
  }

  // New function to update gauge visually
  function updateGauge(gaugeFillElement, gaugeValueElement, mean, type) {
    // Map mean (1-5) to a rotation angle (0-180 degrees)
    // Mean 1 = 0 degrees, Mean 5 = 180 degrees
    const angle = (mean - 1) * (180 / 4); // (mean - min) * (max_angle / range)
    gaugeFillElement.style.transform = `rotate(${angle}deg)`;
    gaugeValueElement.textContent = mean.toFixed(2);

    // Determine color based on mean and type (stress/performance)
    let color = "";
    if (type === "stress") {
      if (mean <= 2) color = "#22c55e"; // green-500 (low stress)
      else if (mean <= 3.5) color = "#facc15"; // yellow-500 (moderate stress)
      else color = "#ef4444"; // red-500 (high stress)
    } else if (type === "performance") {
      // For performance, low mean (few issues) is good (green), high mean (many issues) is bad (red)
      if (mean <= 2) color = "#22c55e"; // green-500 (high performance)
      else if (mean <= 3.5)
        color = "#facc15"; // yellow-500 (moderate performance)
      else color = "#ef4444"; // red-500 (low performance)
    }
    gaugeFillElement.style.backgroundColor = color;
  }

  // --- Event Listeners and Flow Control ---

  continueButton.addEventListener("click", () => {
    const stressRadios = document.querySelectorAll(
      '#stress-assessment input[type="radio"]:checked'
    );
    if (stressRadios.length !== 5) {
      // Assuming 5 stress questions
      alert("Please answer all stress assessment questions before continuing.");
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
    if (performanceRadios.length !== 5) {
      // Assuming 5 performance questions (Q6-Q10)
      alert(
        "Please answer all performance assessment questions before calculating results."
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
    const stressMean =
      allStressValues.reduce((a, b) => a + b, 0) / allStressValues.length;

    const allPerformanceValues = Object.values(performanceAnswers);
    const performanceMean =
      allPerformanceValues.reduce((a, b) => a + b, 0) /
      allPerformanceValues.length;

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

    // Update Gauges
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
