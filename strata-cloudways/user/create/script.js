let dropArea = $("#drag-and-drop-area");
let fileInput = $("#formFile")[0];
let fileListContainer = $("#fileList");
let filesArray = [];
let client_id = null; // Initialize client_id as null
let unitId;
let localurl = "http://localhost:8000/upload-and-process";
let cloudurl = "https://strata.oceanswelldigital.net/upload-and-process";
let progressInterval; // Interval ID for polling progress
let unitAddress;
let unitNumber;
let polling;

$("#loading").hide();

$(document).ready(function() {
  let userFullName = `${fname} ${lname}`;

   console.log(userFullName, 'userFullName')

$('#userFullName').text(userFullName);
$('#userFullNameOffCanvas').text(userFullName);

});

function updateFileList() {
  fileListContainer.empty();
  filesArray.forEach((file, index) => {
    let fileCard = $('<div class="file-card"></div>');
    fileCard.append("<span>" + file.name + "</span>");
    let removeButton = $('<button type="button">&times;</button>');
    removeButton.on("click", function () {
      filesArray.splice(index, 1);
      updateFileInput();
      updateFileList();
    });
    fileCard.append(removeButton);
    fileListContainer.append(fileCard);
  });
}

function updateFileInput() {
  let dataTransfer = new DataTransfer();
  filesArray.forEach((file) => dataTransfer.items.add(file));
  fileInput.files = dataTransfer.files;
}

fileInput.addEventListener("change", function (e) {
  filesArray = Array.from(e.target.files);
  updateFileList();
});

dropArea.on("dragover", function (e) {
  e.preventDefault();
  e.stopPropagation();
  dropArea.addClass("dragover");
});

dropArea.on("dragleave", function (e) {
  e.preventDefault();
  e.stopPropagation();
  dropArea.removeClass("dragover");
});

dropArea.on("drop", function (e) {
  e.preventDefault();
  e.stopPropagation();
  dropArea.removeClass("dragover");

  let newFiles = e.originalEvent.dataTransfer.files;
  filesArray = Array.from(newFiles);
  updateFileInput();
  updateFileList();
});

function showModal() {
  let myModal = new bootstrap.Modal(document.getElementById("myModal"), {
    keyboard: false,
  });
  myModal.show();
}

function hideModal() {
  let myModalEl = document.getElementById("myModal");
  let modal = bootstrap.Modal.getInstance(myModalEl);
  modal.hide();
}

function animateDots() {
  let dotCount = 0;
  setInterval(function () {
    dotCount = (dotCount + 1) % 4; // Cycle from 0 to 3
    let dots = ".".repeat(dotCount); // Create string of dots
    $(".loading-dots").text(dots); // Update the text of the dots
  }, 500); // Change dots every 500ms
}
// Call the animate function
animateDots();

$("#create").on("submit", function (e) {
  e.preventDefault(); // Prevent the normal submission action

  unitNumber = $("#unit-number").val();
  unitAddress = $("#unit-address").val();
  let files = $("#formFile")[0].files;

  if (files.length === 0) {
    notify("Please select at least one file.");
    return;
  }
  client_id = Date.now(); // Now client_id is set
  // Send unit data via AJAX
  sendUnitData(unitNumber, unitAddress, userId, files, client_id);
});

function sendUnitData(unitNumber, unitAddress, userId, files, client_id) {
  let requestData = {
    userId: userId,
    address: unitAddress,
    unit: unitNumber,
  };

  $.ajax({
    url: "/api/unitsave.php", // Replace with your actual API endpoint
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(requestData),
    success: function (response) {
      let data = JSON.parse(response);
      if (data.success) {
        unitId = data.unitId; // Store the unit ID in the global variable
        console.log("Unit registered successfully with ID:", unitId);
        sendDataViaAjax(files, client_id); // Use the stored client_id
      } else {
        console.error("Registration failed:", data.error);
        notify("Error: " + data.error);
      }
    },
    error: function (xhr, status, error) {
      console.error("AJAX error:", status, error);
      notify("AJAX error: " + error);
    },
  });
}

// Updated sendDataViaAjax function with retry logic and progress polling
function sendDataViaAjax(files, client_id) {
  let formData = new FormData();
  formData.append("userId", userId);
  formData.append("unitId", unitId);
  formData.append("client_id", client_id); // Use the same client_id

  for (let file of files) {
    formData.append("files", file);
  }

  showModal(); // Show the modal with progress bar

  let attempt = 0;
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds

  function attemptUpload() {
    startProgressPolling(client_id);
    $.ajax({
      url: cloudurl, // Use your FastAPI upload endpoint URL
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      cache: false,
      success: function (data) {
        console.log("Upload success:", data);
        notify("Files uploaded successfully!");
        hideModal(); // Hide the modal
        filesArray = [];
        updateFileList();
        processAndSendData(data);

        // Start polling for progress updates after successful upload
      },
      error: function (xhr, status, error) {
        console.error("Upload failed:", error);
        if (attempt < maxRetries) {
          attempt++;
          console.log(`Retrying upload... Attempt ${attempt} of ${maxRetries}`);
          setTimeout(attemptUpload, retryDelay); // Retry after 2 seconds
        } else {
          notify("Failed to upload files after multiple attempts.");
          hideModal(); // Hide the modal
        }
      },
    });
    polling = false;
  }

  attemptUpload(); // Start the first attempt
}

// Function to start polling for progress updates
// Variables to track timing and progress

function processAndSendData(response) {
  const endpoint = "/api/combinedsave.php"; // Replace with your actual endpoint for combined data

  // Prepare the data to be sent
  const dataToSend = [];

  Object.keys(response).forEach((category) => {
    response[category].forEach((question) => {
      const questionData = {
        category: category,
        unitId: unitId,
        questionId: question.id,
        answer: question.answer,
        sources: question.sources.map((source) => ({
          filename: source.filename,
          page_number: source.page_number,
          context: source.context,
          start: source.start,
          end: source.end,
          box: source.box,
        })),
      };
      dataToSend.push(questionData);
    });
  });

  // Send the combined data
  $.ajax({
    url: endpoint,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(dataToSend),
    success: function (response) {
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (e) {
        parsedResponse = response;
      }
      console.log("Data sent successfully:", parsedResponse);
      if (parsedResponse.error) {
        notify(parsedResponse.error);
      } else {
        notify("Loading Report..");
        window.location.href = `/user/generate-report/?view=${unitId}/${unitNumber}/${unitAddress}`;
      }
    },
    error: function (xhr, status, error) {
      console.error("Error sending data:", error);
    },
  });
}

// Variables to track timing and progress
let previousProgressValue = 0;
let previousTimestamp = Date.now();
let accumulatedTime = 0;
let accumulatedProgress = 0;
let responseCount = 0;

// Set a maximum speed (in percentage points per second) for the transition
const maxSpeed = 4; // 4% per second

function startProgressPolling(client_id) {
  console.log("polling");
  progressInterval = setInterval(() => {
    $.ajax({
      url: cloudurl.replace("/upload-and-process", "/latest-progress"), // Adjust the endpoint URL for latest progress
      type: "POST",
      data: { client_id: client_id }, // Use the stored client_id
      success: function (data) {
        if (data.latest_progress !== "No progress updates available yet.") {
          console.log(
            "Progress update received via POST:",
            data.latest_progress
          );

          // Split the latest_progress string to get the item and progress separately
          let [item, progress] = data.latest_progress.split(": ");

          // Call updateProgressDisplay with the item and progress
          updateProgressDisplay(progress.trim(), item.trim());

          if (data.latest_progress.includes("Processing complete")) {
            clearInterval(progressInterval); // Stop polling when processing is complete
          }
        } else {
          console.log(
            "No progress updates available yet, continuing to poll..."
          );
        }
      },
      error: function (xhr, status, error) {
        console.error("Error requesting progress update:", error);
      },
    });
  }, 2000); // Poll every 2 seconds
}

function updateProgressDisplay(progress, item) {
  // Parse the progress value from the progress string
  let progressMatch = progress.match(/(\d+(\.\d+)?)%/);
  let newProgressValue = progressMatch ? parseFloat(progressMatch[1]) : 0;

  // Calculate the time difference between responses
  let currentTimestamp = Date.now();
  let timeDifference = currentTimestamp - previousTimestamp;

  // Update tracking values
  if (newProgressValue > previousProgressValue) {
    accumulatedTime += timeDifference;
    accumulatedProgress += newProgressValue - previousProgressValue;
    responseCount++;
  }

  // Calculate the average time per percentage point
  let averageTimePerPercent =
    accumulatedProgress > 0 ? accumulatedTime / accumulatedProgress : 250; // Default to 250ms per percent

  // Determine transition steps and duration
  let totalSteps = 20; // Fixed number of steps for smooth transition
  let transitionTime = averageTimePerPercent * totalSteps;

  // Apply maximum speed limit: 4% per second (i.e., 1000ms for 4% transition)
  let maxStepDuration = 1000 / maxSpeed;
  transitionTime = Math.max(transitionTime, maxStepDuration * totalSteps);

  // Update the item being processed in the UI
  $("#loadingtext").text(`${item}: ${progress}`);

  function smoothTransition(targetValue, steps, callback) {
    let increment = (targetValue - previousProgressValue) / steps;
    let stepDuration = transitionTime / steps;

    function performStep() {
      previousProgressValue += increment;

      // Ensure the current value doesn't exceed the target
      if (
        (increment > 0 && previousProgressValue >= targetValue) ||
        (increment < 0 && previousProgressValue <= targetValue)
      ) {
        previousProgressValue = targetValue;
      }

      $("#file").val(previousProgressValue);
      $("#percentage").text(`${previousProgressValue.toFixed(2)}%`);
      $("#loadingtext").text(`${item}: ${previousProgressValue.toFixed(2)}%`);

      // Continue updating until reaching the target progress value
      if (previousProgressValue !== targetValue) {
        setTimeout(performStep, stepDuration);
      } else if (callback) {
        callback(); // Call the callback function after reaching the target
      }
    }

    performStep();
  }

  if (newProgressValue < previousProgressValue) {
    // Sequence: previousProgress -> 100 -> instant 0 -> newProgress
    smoothTransition(100, totalSteps, () => {
      previousProgressValue = 0;
      $("#file").val(previousProgressValue);
      $("#percentage").text(`0.00%`);
      $("#loadingtext").text(`${item}: 0.00%`);
      smoothTransition(newProgressValue, totalSteps);
    });
  } else {
    // Just transition to the new value if it's increasing
    smoothTransition(newProgressValue, totalSteps);
  }

  // Update previous values for the next call
  previousTimestamp = currentTimestamp;
}
