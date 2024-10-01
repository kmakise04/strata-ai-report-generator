function initializeReport() {

  console.log(userId, 'testUserId')
  let offset = 0;
  const limit = 50;
  // const rootUrl = `${window.location.protocol}//${window.location.hostname}`;
  // const viewUrl = getParameterByName("view")

  $(document).ready(function () {
  
    createNotesButton();
    $('#noteOffcanvas').on('shown.bs.offcanvas', function () {
      $('#noteContent').val(''); // Clear the textarea on offcanvas show
    });

    setTimeout(function () {
      if (userId && unitId) {
        fetchAllNotes(userId, unitId);
      }
    }, 100);
  });

  let noteCache = {};

  function fetchAllNotes(userId, unitId) {
    if (noteCache[unitId]) {
      updateBadgesFromCache(noteCache[unitId]); // Use cached data
      return;
    }

    $.ajax({
      url: '/api/getnotes.php',
      type: 'GET',
      dataType: 'json',
      data: { userId, unitId },
      success: function (response) {
        if (response.success && response.notes) {
          noteCache[unitId] = response.notes; // Cache the notes
          const noteCounts = countNotesByQuestion(response.notes);
          updateBadges(noteCounts);
        } else {
          console.error(response.message || 'Failed to fetch notes');
        }
      },
    });
  }

  function countNotesByQuestion(notes) {
    const noteCounts = {};
    notes.forEach(note => {
      const questionId = note.question_id;
      noteCounts[questionId] = (noteCounts[questionId] || 0) + 1;
    });
    return noteCounts;
  }

  function updateBadges(noteCounts) {
    Object.keys(noteCounts).forEach(questionId => {
      updateNoteBadge(questionId, noteCounts[questionId]);
    });
  }

  function updateNoteBadge(questionId, noteCount) {
    const iconBadge = $(`#badge-${questionId}-mobile`);
    const buttonBadge = $(`#badge-${questionId}-desktop`);

    if (iconBadge.length > 0 || buttonBadge.length > 0) {
      if (noteCount > 0) {
        iconBadge.text(noteCount).show();
        buttonBadge.text(noteCount).show();
      } else {
        iconBadge.hide();
        buttonBadge.hide();
      }
    }
  }



  // Event listener for note icons
  $(document).on('click', '[id^=addNoteIcon-], [id^=addNoteButton-]', function (e) {
    e.preventDefault();
    const questionId = $(this).data('question-id');
    const unitId = $(this).data('unit-id');
    const userId = $(this).data('user-id');
    $('#add-note-question-id').val(questionId);
    $('#add-note-unit-id').val(unitId);
    $('#add-note-user-id').val(userId);
    $('#noteOffcanvas').offcanvas('show');
  });
  

$(document).ready(function() {
  // Show or hide the "Go to Top" button based on main content scroll position
  $('main').scroll(function(){
      if ($(this).scrollTop() > 100) {
          $('#goTopBtn').fadeIn();
      } else {
          $('#goTopBtn').fadeOut();
      }
  });

  // Scroll to top of the main content when button is clicked
  $('#goTopBtn').click(function(){
      $('main').animate({scrollTop: 0}, 200); // Target main container scroll
      return false;
  });
});


$(document).ready(function() {
  // Attach event listener for saving the note
  $('#saveNote').on('click', function() {
      const noteContent = $('#noteContent').val();
      const questionId = $('#add-note-question-id').val();
      const unitId = $('#add-note-unit-id').val();
      const userId = $('#add-note-user-id').val();

      if (!noteContent || !unitId || !questionId || !userId) {
          console.error('Missing data:', { noteContent, unitId, questionId, userId });
          return;
      }

      // AJAX call to send the data to the API
      $.ajax({
          url: "/api/savenote.php",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({
              note: noteContent,
              questionId: questionId,
              unitId: unitId,
              userId: userId
          }),
          success: function(response) {
              if (response.success) {
                  console.log('Note saved successfully');
                  
                  // Fetch the updated notes and count
                  fetchNotes(userId, unitId, questionId);

                  // Optionally, manually update the badge count:
                  const currentCount = parseInt($(`#badge-${questionId}-desktop`).text()) || 0;
                  updateNoteBadge(questionId, currentCount + 1);

                  // Clear the content
                  $('#noteContent').val('');

                  // Now close the modal for adding notes, since it's not the offcanvas
                  $('#addNoteModal').modal('hide');  // Close the add note modal
              } else {
                  console.error('Failed to save note:', response.message);
              }
          },
          error: function(xhr, status, error) {
              console.error('An error occurred while saving the note:', error);
          }
      });
  });

  // Trigger the fetchNotes function when the offcanvas is shown
  $('#noteOffcanvas').on('show.bs.offcanvas', function() {
      const noteQuestionTitle = $('#add-note-question-id').val(); // Get the value of the hidden input

      // Use regex to add space before each uppercase letter, except the first one
      const formattedTitle = noteQuestionTitle.replace(/([a-z])([A-Z])/g, '$1 $2') + ' Note';

      $('#noteOffcanvasLabel').text(formattedTitle); // Set it as the offcanvas title

      const userId = $('#add-note-user-id').val(); // Retrieve the user ID from the hidden field
      const unitId = $('#add-note-unit-id').val(); // Retrieve the unit ID from the hidden field
      const questionId = $('#add-note-question-id').val(); // Retrieve the question ID from the hidden field

      if (userId && unitId && questionId) {
          fetchNotes(userId, unitId, questionId);  // Fetch notes specific to the questionId
      }
  });
});




  

  

  // Function to fetch resources for a question
  function fetchResource(resourceId, questionId) {
    $.ajax({
      url: "/api/reportpageresource.php",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ resourceId: resourceId }),
      success: function (response) {
        if (response.success && response.resources.length > 0) {
          response.resources.forEach((resource) => {
            populateSource(questionId, resource);
          });
        } else {
          console.log("Error fetching resource for question ID " + questionId);
          $(`#${questionId}Source`).text("No sources found");
        }
      },
      error: function (xhr, status, error) {
        console.error("An error occurred while fetching resource: " + error);
      },
    });
  }

  // Function to populate resource sources
  function populateSource(questionId, resource) {
    const id = resource.id;
    const filename = resource.filename;
    const page = resource.page;
    let contextContent = resource.context_chunks ? resource.context_chunks.join(' ') : resource.context;

    validateUserIdAndUnitId();

    createNotesButton(questionId, id, unitId, userId);

    $(`#add-note-${questionId}`).attr('data-resource-id', id);
  }

  // Validate the presence of userId and unitId
  function validateUserIdAndUnitId() {
    if (typeof userId === 'undefined' || typeof unitId === 'undefined') {
      console.error('userId or unitId is not defined');
      return;
    }
  }



function createNotesButton(questionId, resourceId, unitId, userId) {

    if ($(`#addNoteIcon-${questionId}`).length === 0) {
      $(`#${questionId}Notes`).append(`
        <div class="notes-section position-relative">
          <!-- Add Note Button for Larger Screens -->
          <button class="btn btn-outline-primary btn-sm d-none d-md-inline" id="addNoteButton-${questionId}" data-question-id="${questionId}" data-resource-id="${resourceId}" data-unit-id="${unitId}" data-user-id="${userId}" style="cursor: pointer;" title="Notes">
            <i class="fas fa-sticky-note me-2"></i>Notes
            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="badge-${questionId}-desktop" style="font-size: 0.6rem; padding: 3px 6px; display: none;"></span>
          </button>
          <!-- Add Note Icon for Smaller Screens -->
          <button class="btn btn-outline-primary btn-sm d-inline d-md-none position-relative" id="addNoteIcon-${questionId}" data-question-id="${questionId}" data-resource-id="${resourceId}" data-unit-id="${unitId}" data-user-id="${userId}" style="cursor: pointer;" title="Notes">
            <i class="fas fa-sticky-note"></i>
            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="badge-${questionId}-mobile" style="font-size: 0.6rem; padding: 3px 6px; display: none;"></span>
          </button>
        </div>
      `);

      // Event delegation for add note button/icon
      $(document).on('click', `[id^=addNoteIcon-], [id^=addNoteButton-]`, function (e) {
        e.preventDefault();

        const clickedQuestionId = $(this).data('question-id');
        const clickedResourceId = $(this).data('resource-id');
        const clickedUnitId = $(this).data('unit-id');
        const clickedUserId = $(this).data('user-id');

        $('#add-note-question-id').val(clickedQuestionId);
        $('#add-note-resource-id').val(clickedResourceId);
        $('#add-note-unit-id').val(clickedUnitId);
        $('#add-note-user-id').val(clickedUserId);

        $('#noteOffcanvas').offcanvas('show');
        $('#noteContent').val(''); // Clear the note content input
      });
    }
 
}


  // Helper to get URL parameters
  function getParameterByName(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
 
  // Get unit details from the URL
  const urlParams = getParameterByName("view").split('/');
  const unitId = urlParams[0];
  const unitAddress = decodeURIComponent(urlParams[1]);
  const unitName = urlParams[2];

  $('#unit-display').text(unitName);
  $('#address-display').text(unitAddress);
  $('#unit-display2').text(unitName);
  $('#address-display2').text(unitAddress);

  // Fetch questions if unitId exists
  if (unitId) {
    fetchQuestions(unitId, offset, limit);
  } else {
    $("#results").html('<div class="alert alert-warning">No unit ID specified in URL.</div>');
  }

  // Fetch questions from the server
  function fetchQuestions(unitId, offset, limit) {
    $.ajax({
      url: "/api/reportpagequestions.php",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ unitId: unitId, limit: limit, offset: offset }),
      success: function (response) {
        if (response.success) {
          populateAnswers(response.questions);
          if (response.questions.length === limit) {
            offset += limit;
            fetchQuestions(unitId, offset, limit);
          }
        } else {
          $("#results").html('<div class="alert alert-danger">Error: ' + response.error + "</div>");
        }
      },
      error: function (xhr, status, error) {
        $("#results").html('<div class="alert alert-danger">An error occurred: ' + error + "</div>");
      },
    });
  }


  // Populate answers
  function populateAnswers(questions) {
    questions.forEach((question) => {
      const questionId = question.questionId;
      let answerContent = "";

      if (question.answer_chunks) {
        question.answer_chunks.forEach((chunk) => {
          answerContent += chunk;
        });
      } else {
        answerContent = question.answer;
      }

      $(`#${questionId}Answer`).html(marked.parse(answerContent));
      $(`#${questionId}Answer2`).html(marked.parse(answerContent));

      const resourceId = question.resourceId;
      fetchResource(resourceId, questionId);

      if (questionId === 'StrataPlanNumber2') {
        $(`#StrataPlanNumber2Answer`).text('');
      }
    });
  }

  var $mainContent = $('#main-content');

  // Initialize ScrollSpy
  const scrollSpyTopnav = new bootstrap.ScrollSpy($mainContent[0], {
    target: '#topnav',
    rootMargin: '0px 0px -40%'
  });

  const scrollSpySidebar = new bootstrap.ScrollSpy($mainContent[0], {
    target: '#sidebarnav',
    rootMargin: '0px 0px -40%'
  });

  $(window).on('resize', function() {
    scrollSpyTopnav.refresh();
    scrollSpySidebar.refresh();
  });

  // Handle PDF download
  document.querySelectorAll('.download-btn').forEach(button => {
    button.addEventListener('click', function () {
      const unitNo = document.getElementById('unit-display').innerText || 'Unit';
      const unitAddress = document.getElementById('address-display').innerText || 'Address';
      const strataPlanNumber = document.getElementById('StrataPlanNumberAnswer').innerText || 'Strata Plan Number';

      const element = document.getElementById('report-sections-content');
      
      html2pdf()
        .from(element)
        .set({
          margin: [0.5, 0.5, 0.5, 0.5],
          filename: `${strataPlanNumber} - ${unitNo} ${unitAddress}.pdf`,
          html2canvas: { scale: 1 },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        })
        .save();
    });
  });

  // Initialize tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));






  // Add the modal HTML for adding notes
  $('body').append(`
    <!-- Add Note Offcanvas -->
    <div class="offcanvas offcanvas-end" tabindex="-1" id="noteOffcanvas" aria-labelledby="noteOffcanvasLabel">
    <div class="offcanvas-header">
        <h5 class="offcanvas-title" id="noteOffcanvasLabel"></h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body d-flex flex-column">

        <!-- Button to add a new note aligned to the right -->
        <div class="d-flex justify-content-end mb-4">
            <button type="button" class="btn btn-primary" id="addNoteButton">Add Note</button>
        </div>

        <!-- Section to display existing notes -->
        <div id="existingNotes" class="mb-4">
            <!-- Notes will be dynamically inserted here -->
        </div>

    </div>
</div>

  
    <!-- Add Note Modal -->
    <div class="modal fade" id="addNoteModal" tabindex="-1" aria-labelledby="addNoteModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="addNoteModalLabel">Add New Note</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="addNoteForm">
                        <div class="mb-3">
                            <label for="noteContent" class="form-label">Note</label>
                            <textarea class="form-control" id="noteContent" rows="3" placeholder="Type your note here..."></textarea>
                        </div>
                        <input id="add-note-question-id" type="hidden" />
                        <input type="hidden" id="add-note-unit-id" />
                        <input type="hidden" id="add-note-user-id" />
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="saveNote">Save Note</button>
                </div>
            </div>
        </div>
    </div>
  `);
  
  // Show the modal when the "Add Note" button is clicked
  $(document).on('click', '#addNoteButton', function () {
      $('#addNoteModal').modal('show');  // Show the modal
  });
  
// Function to fetch notes using AJAX
function fetchNotes(userId, unitId, questionId) {
  let requestData = {
    userId: userId,
    unitId: unitId
  };

  // Add questionId to the request data only if it's provided (for specific notes)
  if (questionId) {
    requestData.questionId = questionId;
  }

  console.log("Fetching notes with data:", requestData);  // Debugging log

  $.ajax({
    url: '/api/getnotes.php',  // Update this with the actual path to your API file
    type: 'GET',
    dataType: 'json',
    data: requestData,
    success: function(response) {
      $('#existingNotes').empty(); // Clear existing notes

      if (response.success) {
        if (response.notes.length > 0) {
          // Filter notes by questionId and display only matching ones
          const filteredNotes = response.notes.filter(note => note.question_id == questionId);

          if (filteredNotes.length > 0) {
            filteredNotes.forEach(note => {
              $('#existingNotes').append(`
                <div class="card mb-3 shadow-sm" style="position: relative; background-color: white; border-radius: 8px; padding: 20px;">
                <div class="card-body">
                  <h6 class="card-subtitle mb-2 text-muted">Realtor: ${note.fname} ${note.lname}</h6>
                  <hr class="my-2">
                  <p class="card-text" style="font-size: 1.1rem; line-height: 1.5;">${note.note_content}</p>
                  <hr class="my-2">
                  <small class="text-muted">Added on: ${note.created_at}</small>
                  <div class="action-icons" style="position: absolute; top: 10px; right: 10px;">
                    <i class="fas fa-edit edit-icon" data-id="${note.id}" data-question-id="${questionId}" data-user-id="${userId}" data-unit-id="${unitId}" style="cursor: pointer; margin-right: 6px;"></i>
                    <i class="fas fa-trash delete-icon" data-id="${note.id}" data-question-id="${questionId}" data-user-id="${userId}" data-unit-id="${unitId}" style="cursor: pointer;"></i>
                  </div>
                </div>
              </div>
              `);
            });
          } else {
            $('#existingNotes').html('<p>No notes found .</p>');
          }
        } else {
          // Handle no notes found
          $('#existingNotes').html('<p>No notes found.</p>');
        }
      } else {
        alert(response.message || 'Failed to fetch the notes');
      }
    },
    error: function(xhr, status, error) {
      console.error('Error fetching notes:', error);
      alert('An error occurred while fetching the notes. Please try again.');
    }
  });
}


$(document).on('click', '.edit-icon', function() {
  const noteId = $(this).data('id');
  const questionId = $(this).data('question-id');
  const userId = $(this).data('user-id');
  const unitId = $(this).data('unit-id');

  // Fetch the current note content from the card body
  const currentNoteContent = $(this).closest('.card').find('.card-text').text().trim();

  // Set the note content into the modal textarea
  $('#editNoteContent').val(currentNoteContent);
  $('#edit-note-id').val(noteId);
  $('#edit-note-question-id').val(questionId);
  $('#edit-note-user-id').val(userId);
  $('#edit-note-unit-id').val(unitId);

  // Show the modal
  $('#editNoteModal').modal('show');
});

// Event listener for the "Update Note" button in the modal
$('#updateNote').on('click', function() {
  const noteId = $('#edit-note-id').val();
  const questionId = $('#edit-note-question-id').val();
  const userId = $('#edit-note-user-id').val();
  const unitId = $('#edit-note-unit-id').val();
  const newNoteContent = $('#editNoteContent').val().trim();

  if (!newNoteContent) {
    alert('Note content cannot be empty');
    return;
  }

  // Prepare the data to send in the AJAX request
  const requestData = JSON.stringify({
    noteId: noteId,
    note_content: newNoteContent,
    userId: userId,
    questionId: questionId
  });

  $.ajax({
    url: '/api/editnote.php',
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    data: requestData,
    success: function(response) {
      if (response.success) {
        alert('Note updated successfully');
        // Update the UI with the new note content
        $(`.edit-icon[data-id="${noteId}"]`).closest('.card').find('.card-text').text(newNoteContent);
        $('#editNoteModal').modal('hide'); // Close the modal
      } else {
        alert(response.message || 'Failed to update the note');
      }
    },
    error: function(xhr, status, error) {
      console.error('Error editing note:', error);
      alert('An error occurred while editing the note. Please try again.');
    }
  });
});
$(document).on('click', '.edit-icon', function() {
  const noteId = $(this).data('id');
  const questionId = $(this).data('question-id');
  const userId = $(this).data('user-id');
  const unitId = $(this).data('unit-id');

  // Populate the modal fields
  $('#edit-note-id').val(noteId);
  $('#edit-note-question-id').val(questionId);
  $('#edit-note-user-id').val(userId);
  $('#edit-note-unit-id').val(unitId);

  // Show the edit modal
  $('#editNoteModal').modal('show');
});



$(document).on('click', '.delete-icon', function() {
  const noteId = $(this).data('id');
  const questionId = $(this).data('question-id');
  const userId = $(this).data('user-id');
  const unitId = $(this).data('unit-id') || null;

  if (confirm('Are you sure you want to delete this note?')) {
    // Prepare the data to be sent in the AJAX request
    const requestData = JSON.stringify({
      noteId: noteId,
      userId: userId,
      questionId: questionId
    });

    $.ajax({
      url: '/api/deletenote.php',
      type: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: requestData,
      success: function(response) {
        if (response.success) {
          console.log('Note deleted successfully');
          // Fetch the updated notes and count
          fetchNotes(userId, unitId, questionId);

          // Optionally, you can also manually update the badge count:
          const currentCount = parseInt($(`#badge-${questionId}-desktop`).text()) || 0;
          updateNoteBadge(questionId, currentCount - 1);
        } else {
          console.error('Failed to delete the note:', response.message);
        }
      },
      error: function(xhr, status, error) {
        console.error('An error occurred while deleting the note:', error);
      }
    });
  }
});


// Trigger the fetchNotes function when the offcanvas is shown
$(document).ready(function() {
  $('#noteOffcanvas').on('show.bs.offcanvas', function () {
    var noteQuestionTitle = $('#add-note-question-id').val(); // Get the value of the hidden input

  // Use regex to add space before each uppercase letter, except the first one
  noteQuestionTitle = noteQuestionTitle.replace(/([a-z])([A-Z])/g, '$1 $2');

  var additionalText = " Note"; // Define the additional text you want to add

  // Concatenate the additional text to noteQuestionTitle
  noteQuestionTitle += additionalText; 

  $('#noteOffcanvasLabel').text(noteQuestionTitle); // Set it as the offcanvas title

    const userId = $('#add-note-user-id').val(); // Retrieve the user ID from the hidden field
    const unitId = $('#add-note-unit-id').val(); // Retrieve the unit ID from the hidden field
    const questionId = $('#add-note-question-id').val(); // Retrieve the question ID from the hidden field

    if (userId && unitId && questionId) {
        fetchNotes(userId, unitId, questionId);  // Fetch notes specific to the questionId
    }
  });
});


}


