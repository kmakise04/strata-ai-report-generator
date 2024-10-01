document.addEventListener("DOMContentLoaded", () => {
  const pdfjsLib = window["pdfjs-dist/build/pdf"];
  let offset = 0;
  const limit = 50; // Number of questions to fetch per request

  function getParameterByName(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  const unitId = getParameterByName("view");

  if (unitId) {
    fetchQuestions(unitId, offset, limit);
  } else {
    $("#results").html(
      '<div class="alert alert-warning">No unit ID specified in URL.</div>'
    );
  }

  function fetchQuestions(unitId, offset, limit) {
    $.ajax({
      url: "/api/reportpagequestions.php", // Corrected endpoint to fetch questions in batches
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ unitId: unitId, limit: limit, offset: offset }),
      success: function (response) {
        if (response.success) {
          populateAnswers(response.questions);

          // If we fetched the maximum number of items, there might be more to load
          if (response.questions.length === limit) {
            offset += limit;
            fetchQuestions(unitId, offset, limit); // Fetch next batch
          }
        } else {
          $("#results").html(
            '<div class="alert alert-danger">Error: ' +
              response.error +
              "</div>"
          );
        }
      },
      error: function (xhr, status, error) {
        $("#results").html(
          '<div class="alert alert-danger">An error occurred: ' +
            error +
            "</div>"
        );
      },
    });
  }

  function populateAnswers(questions) {
    questions.forEach((question) => {
      const questionId = question.questionId;
      let answerContent = "";

      // Check if answer_chunks exists and reassemble the chunks if necessary
      if (question.answer_chunks) {
        question.answer_chunks.forEach((chunk) => {
          answerContent += chunk;
        });
      } else {
        // Use the non-chunked answer directly if no chunks exist
        answerContent = question.answer;
      }

      // Populate the answer in the appropriate HTML element
      $(`#${questionId}Answer`).html(marked.parse(answerContent));

      // Fetch the resource details for this question using the resource ID
      const resourceId = question.resourceId;
      fetchResource(resourceId, questionId);
    });
  }

  function fetchResource(resourceId, questionId) {
    $.ajax({
      url: "/api/reportpageresource.php", // Corrected endpoint to fetch resource details
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
          $(`#${questionId}Source`).text("no sources found");
        }
      },
      error: function (xhr, status, error) {
        console.error("An error occurred while fetching resource: " + error);
      },
    });
  }


  // function populateSource(questionId, resource) {
  //   const id = resource.id; // Use the 'id' field as the unique identifier
  //   const filename = resource.filename;
  //   const page = resource.page;
  //   let contextContent = "";
  
  //   // Check if context_chunks exists and reassemble the chunks if necessary
  //   if (resource.context_chunks) {
  //     resource.context_chunks.forEach((chunk) => {
  //       contextContent += chunk;
  //     });
  //   } else {
  //     // Use the non-chunked context directly if no chunks exist
  //     contextContent = resource.context;
  //   }
  
  //   // Ensure userId and unitId are defined
  //   if (typeof userId === 'undefined' || typeof unitId === 'undefined') {
  //     console.error('userId or unitId is not defined');
  //     return;
  //   }
  
  //   const pdfUrl = `https://strata-reader.s3.ap-southeast-2.amazonaws.com/${userId}/units/${unitId}/${filename}`;
  
  //   // Append button with a unique ID based on the 'id' field
  //   $(`#${questionId}Source`).append(
  //     `<button id="resource-${id}" class="btn btn-primary view-pdf m-2 d-inline" style="font-size:10px" data-pdf-url="${pdfUrl}" data-pdf-page="${page}" data-context="${contextContent}">View PDF (${filename} - Page ${page})</button>`
  //   );
  
  //   // Attach event handler only to the newly added button
  //   $(`#resource-${id}`).on("click", function () {
  //     let offcanvasElement = $("#pdfViewerOffcanvas");
  //     const baseUrl = "https:strata-reader.s3.ap-southeast-2.amazonaws.com/pdfjs-4.5.136-dist/web/viewer.html?file=";
  //     let pdf_url = $(this).data("pdf-url");
  //     let pdf_page = $(this).data("pdf-page");
  //     let query = encodeURIComponent($(this).data("context"));
  
  //     // Construct the URL with the search query
  //     const url = `${baseUrl}${pdf_url}#page=${pdf_page}&search=${query}&phrase=true`;
  //     console.log("URL:", url);
  //     console.log("pdf_url:", pdf_url);
  //     console.log("pdf_page:", pdf_page);
  //     console.log("query:", query);
  //     // Clear previous content
  //     offcanvasElement.html(null);
  
  //     // Append the iframe with the constructed URL
  //     let iframe = '<iframe src="' + url + ' "></iframe>';
  //     offcanvasElement.html(iframe);
  
  //     const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
  //     offcanvas.show();
  //   });
  // }

  function populateSource(questionId, resource) {
    const id = resource.id; // Use the 'id' field as the unique identifier
    const filename = resource.filename;
    const page = resource.page;
    let contextContent = "";

    // Reassemble context chunks if available, or use the context directly
    if (resource.context_chunks) {
        contextContent = resource.context_chunks.join(' ');
    } else {
        contextContent = resource.context;
    }

    // Ensure userId and unitId are defined
    if (typeof userId === 'undefined' || typeof unitId === 'undefined') {
        console.error('userId or unitId is not defined');
        return;
    }
    
    const pdfUrl = `https://strata-reader.s3.ap-southeast-2.amazonaws.com/strata/${userId}/units/${unitId}/${filename}`;

    // Append button with a unique ID based on the 'id' field
    $(`#${questionId}Source`).append(
        `<button id="resource-${id}" class="btn btn-primary view-pdf m-2 d-inline" style="font-size:10px" data-pdf-url="${pdfUrl}" data-pdf-page="${page}" data-context="${contextContent}">View PDF (${filename} - Page ${page})</button>`
    );

    // Attach event handler only to the newly added button
    $(`#resource-${id}`).on("click", function () {
        let offcanvasElement = $("#pdfViewerOffcanvas");
        
        const baseUrl = "https://strata-reader.s3.ap-southeast-2.amazonaws.com/pdfjs-4.6.82-dist/web/viewer.html?file=";
        let pdf_url = $(this).data("pdf-url");
        let pdf_page = $(this).data("pdf-page");
        let query = encodeURIComponent(contextContent.trim());

        // Construct the URL with the search query
        const url = `${baseUrl}${pdf_url}#page=${pdf_page}&search=${query}&phrase=true&caseSensitive=true&wholeWord=false`;
        console.log("URL:", url);
        console.log("pdf_url:", pdf_url);
        console.log("pdf_page:", pdf_page);
        console.log("query:", query);

        // Clear previous content
        offcanvasElement.html(null);

        // Append the iframe with the constructed URL
        let iframe = `<iframe src="${url}" style="width: 100%; height: 100%;"></iframe>`;
        offcanvasElement.html(iframe);

        const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
        offcanvas.show();
    });
}

  

  
});
