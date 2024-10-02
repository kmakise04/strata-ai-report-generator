let reportsPerPage = 5;  // Number of reports to display per page
let currentPage = 1;
let totalReports = 0;
let reports = [];  // Array to hold the fetched reports
let filteredReports = [];  // Array to hold the filtered reports (used for searching)

// Fetch reports and implement pagination
function getReports(userId) {
    $("#reports").empty();

    $.ajax({
        url: "/api/unitlist.php",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ userId: userId }),
        success: function (response) {
            let data = JSON.parse(response);

            if (data.success) {
                reports = data.units;  // Store the fetched reports
                console.log(reports, 'reports')
                filteredReports = reports; // Initially, show all reports
                totalReports = reports.length;  // Set total number of reports
                currentPage = 1; // Reset to the first page
                loadReports(currentPage);  // Load the first page of reports
                createPagination();  // Create pagination controls
            } else {
                $("#reports").html("<div>No units found or an error occurred.</div>");
            }
        },
        error: function () {
            $("#reports").html("<div>Error fetching reports. Please try again later.</div>");
        }
    });
}

 

// Load reports for the current page
function loadReports(page) {
    const startIndex = (page - 1) * reportsPerPage;
    const endIndex = startIndex + reportsPerPage;
    const reportsToShow = filteredReports.slice(startIndex, endIndex);  // Use filteredReports
    const rootUrl = window.location.protocol + "//" + window.location.hostname;

    // Clear the current reports
    $('#reports').empty();

    // Add new set of reports
    $.each(reportsToShow, function(index, unit) {
        let cardHtml = `
            <div class="card mb-3 p-3 mx-auto clickable-card" data-unit-id="${unit.id}" style="max-width: 950px;" data-view="${rootUrl}/user/generate-report/?view=${unit.id}/${unit.address}/${unit.unit}">
                <div class="row align-items-center">
                    <div class="col-12 col-md-8 d-flex align-items-center">
                        <div class="me-3">
                            <i class="fa-solid fa-file-alt" style="font-size: 40px; color: #007bff;"></i>
                        </div>
                        <div>
                            <h5 class="mb-0">${unit.unit}</h5>
                            <p class="text-muted mb-0">${unit.address}</p>
                            <span class="text-muted" style="font-size: smaller;">Date Created: ${unit.created}</span>
                        </div>
                    </div>
                    <div class="col-12 col-md-4 d-flex justify-content-end align-items-center mt-3 mt-md-0">
                        <div class="dropdown">
                            <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="dropdownMenuButton${unit.id}" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton${unit.id}">
                                <li>
                                    <button class="dropdown-item share-btn" data-link="${rootUrl}/user/generate-report/?view=${unit.id}/${unit.address}/${unit.unit}">
                                        <i class="fas fa-share"></i> Share Report
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item delete-btn" data-unitid="${unit.id}">
                                        <i class="fa-solid fa-eraser"></i> Delete
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>`;
        $('#reports').append(cardHtml);
    });

    // Initialize actions after loading reports
    initializeActions();
}

//clickable cards
$(document).on('click', '.clickable-card', function(e) {
  if ($(e.target).closest('button, a').length === 0) {
      window.location.href = $(this).data('view');
  }
});

// Create pagination controls dynamically
function createPagination() {
    const paginationContainer = $('#pagination');
    paginationContainer.empty();  // Clear current pagination
    const totalPages = Math.ceil(filteredReports.length / reportsPerPage);  // Based on filteredReports

    // Add 'Previous' button
    paginationContainer.append(`
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" id="prev-page">Previous</a>
        </li>
    `);

    // Add page number buttons
    for (let i = 1; i <= totalPages; i++) {
        paginationContainer.append(`
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `);
    }

    // Add 'Next' button
    paginationContainer.append(`
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" id="next-page">Next</a>
        </li>
    `);

    // Event listeners for page links
    $('.page-link').off('click').on('click', function (e) {
        e.preventDefault();

        const page = $(this).data('page');
        if (page) {
            currentPage = page; // Go to selected page
        } else if ($(this).attr('id') === 'prev-page' && currentPage > 1) {
            currentPage--; // Go to previous page
        } else if ($(this).attr('id') === 'next-page' && currentPage < totalPages) {
            currentPage++; // Go to next page
        }

        // Reload the reports for the new currentPage
        loadReports(currentPage);
        createPagination(); // Recreate pagination with the updated current page
    });
}

// Search function to filter reports
function searchReports() {
    const searchTerm = $('#search-reports').val().toLowerCase();  // Get search term and convert to lowercase
    filteredReports = reports.filter(report => {
        return report.unit.toLowerCase().includes(searchTerm) || report.address.toLowerCase().includes(searchTerm);
    });

    totalReports = filteredReports.length;  // Update total reports after filtering
    currentPage = 1; // Reset to first page after search
    loadReports(currentPage);  // Load filtered reports
    createPagination();  // Recreate pagination based on filtered reports
}

// Handle search button click
$('#search-button').on('click', function() {
    searchReports();  // Call searchReports() when the search button is clicked
});

// Optional: Real-time search filtering as you type
$('#search-reports').on('input', function() {
    searchReports();  // Call searchReports() whenever the input changes (real-time search)
});


// Initialize actions (share, delete, etc.)
// Initialize actions (share, delete, etc.)
function initializeActions() {
    // Share button click event
    $(document).on('click', '.share-btn', function() {
        var reportLink = $(this).data('link');  // Fetch the report link
        var unitId = $(this).closest('.card').data('unit-id');  // Fetch the report ID (unit ID)

        var unit = $(this).closest('.card').find('h5').text();  // Fetch the unit name (from <h5>)
        var address = $(this).closest('.card').find('p').text();  // Fetch the address (from <p>)

        // Update modal title with unit and address
        $('#reportModal').modal('show');
        $('#unit-unit').text(unit);
        $('#unit-address').text(address);

        // Here you can also pass the unit ID or report link to the modal for sharing
        // Example: Store the report link or unit ID in a hidden field or use it in the modal actions
        $('#shareToUser').data('unit-id', unitId);  // Store the unit ID for Share to Other Users button

        console.log('Share button clicked for unit ID:', unitId);
        $('#shareViaEmail').data('unit-id', unitId);  // Store the unit ID for Share via Email button
    });

    // Handle delete button click
    $(document).on('click', '.delete-btn', function(e) {
        e.preventDefault();
        const unitId = $(this).data('unitid');
        $('#confirmDelete').data('unitid', unitId);
        $('#deleteConfirmationModal').modal('show');
    });

    // Confirm deletion
    $('#confirmDelete').on('click', function() {
        const unitId = $(this).data('unitid');
        $.ajax({
            url: "/api/unitremove.php",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ id: unitId }),
            success: function(response) {
                let data = JSON.parse(response);
                if (data.success) {
                    $(`button[data-unitid='${unitId}']`).closest('.card').remove();
                    alert("Unit deleted successfully");
                } else {
                    alert(data.error);
                }
                $('#deleteConfirmationModal').modal('hide');
            },
            error: function() {
                alert("Error deleting the unit.");
            }
        });
    });
}


// Copy link functionality
$('#copyReportLink').on('click', function() {
  var reportLink = $('#reportLink');

  // Select the text in the input field
  reportLink.select();
  reportLink[0].setSelectionRange(0, 99999); // For mobile devices

  // Copy the text to clipboard
  document.execCommand('copy');

  // Change button text to indicate success
  var copyButton = $('#copyReportLink');
  copyButton.html('<i class="fas fa-check"></i> Link Copied');

  // Reset button text after a few seconds
  setTimeout(function() {
      copyButton.html('<i class="fas fa-copy"></i> Copy Link');
  }, 3000);
});

// Wait for userId and call getReports
let checkUserId = setInterval(function () {
    if (userId) {
        getReports(userId);
        clearInterval(checkUserId);
    }
}, 100);
