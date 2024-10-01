let reportsPerPage = 5;  // Number of reports to display per page
let currentPage = 1;
let totalReports = 0;
let reports = [];  // Array to hold the fetched reports
let filteredReports = [];  // Array to hold the filtered reports (used for searching)




$(document).ready(function() {
    let dynamicEmail = email; // Use the session email variable
    let firstName = fname;     // Use the session first name variable
    let lastName = lname;      // Use the session last name variable

    // Log the data to ensure it's being retrieved correctly
    console.log(dynamicEmail, 'email');
    console.log(firstName, lastName, 'Full Name');

    // Update the email input field
    $('#email-input').val(dynamicEmail);

    // Update the full name in both elements
    $('#userFullName').text(`${firstName} ${lastName}`);
    $('#userFullNameOffCanvas').text(`${firstName} ${lastName}`);

    
});

$(document).ready(function() {
    // Click handler for Edit button
    $('#editEmailBtn').on('click', function() {
        // Enable the email input for editing
        $('#email-input').removeAttr('readonly');
        
        // Show Save button, hide Edit button
        $('#saveEmailBtn').removeClass('d-none');
        $('#editEmailBtn').addClass('d-none');
    });

    // Click handler for Save button
    $('#saveEmailBtn').on('click', function() {
        let updatedEmail = $('#email-input').val();

        // Validate email format
        if (!validateEmail(updatedEmail)) {
            alert('Please enter a valid email address.');
            return;
        }

       

        $.ajax({
            url: "/api/updateEmail.php",  // Your PHP API endpoint to update email
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                id: userId,  // The user's ID
                email: updatedEmail  // The updated email address
            }),
            success: function(response) {
                if (response.success) {
                    alert(response.message);  // Notify the user of success
                    
                    // Revert to read-only mode
                    $('#email-input').attr('readonly', 'readonly');
                    
                    // Show Edit button, hide Save button
                    $('#editEmailBtn').removeClass('d-none');
                    $('#saveEmailBtn').addClass('d-none');
                } else {
                    alert('Error: ' + response.error);  // Show error if any
                }
            },
            error: function() {
                alert('There was an error updating the email.');
            }
        });
    });

    // Optional: Email validation function
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
});

$(document).ready(function() {
    // When the "Change Password" button is clicked
    $('#changePasswordBtn').on('click', function() {
        // Show the modal with ID '#changePasswordModal'
        $('#changePasswordModal').modal('show');
    });
});




// function getUrlParameter(name) {
//     let urlParams = new URLSearchParams(window.location.search);
//     return urlParams.get(name);
//   }

// token = getUrlParameter('token');

// if (token) {
//     console.log(token, 'token')
// }

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
function initializeActions() {
    $(document).on('click', '.share-btn', function() {
        var reportLink = $(this).data('link');
        var unitId = $(this).closest('.card').data('unit-id');

        var unit = $(this).closest('.card').find('h5').text();  // Fetch the unit
        var address = $(this).closest('.card').find('p').text();  // Fetch the address

        // Update modal title with unit and address
        $('#unit-unit').text(unit);
        $('#unit-address').text(address);
    
        // Request the server to generate the token
        $.ajax({
            url: "/api/generate-token.php",  // This is the PHP script for generating the token
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ userId: userId, reportId: unitId, expiryMinutes: 1440 }),  // 1440 = 1 day expiry
            success: function(response) {
                let data = JSON.parse(response);
                if (data.success) {
                    // Fix: Use & instead of ? to append the token
                    // let tokenizedLink = reportLink + "&token=" + data.token;
                    let code = data.code
    
                    // Update the input field with the tokenized link
                    $('#reportLink').val(code);
    
    
                    // Show the modal
                    $('#reportModal').modal('show');
                } else {
                    alert("Error generating access link.");
                }
            }
        });
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
  copyButton.html('<i class="fas fa-check"></i> Code Copied');

  // Reset button text after a few seconds
  setTimeout(function() {
      copyButton.html('<i class="fas fa-copy"></i> Copy Code');
  }, 3000);
});

// Wait for userId and call getReports
let checkUserId = setInterval(function () {
    if (userId) {
        getReports(userId);
        clearInterval(checkUserId);
    }
}, 100);
