// Helper function to build menu items
function buildMenuItem(item, isActive) {
  // Handle submenus if present
  if (item.submenu) {
    return `
      <li class="sidebar-item">
        <a class="sidebar-link ${isActive}" data-bs-toggle="collapse" href="#${item.href}" role="button" aria-expanded="false" aria-controls="submenu1">
          ${item.name}
        </a>
        <div class="collapse" id="${item.href}">
          <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
            ${item.submenu.map(subItem => `<li><a href="${subItem.href}" class="link-dark rounded">${subItem.name}</a></li>`).join('')}
          </ul>
        </div>
      </li>`;
  } else {
    return `
      <li class="sidebar-item">
        <a href="${item.href}" class="sidebar-link ${isActive}">
          <i class="${item.icon} fw"></i>
          <span>${item.name}</span>
        </a>
      </li>`;
  }
}

// Helper function to build offcanvas items
function buildOffcanvasItem(item, isActive) {
  if (item.submenu) {
    return `
      <li class="offcanvas-item">
        <a class="offcanvas-link ${isActive}" data-bs-toggle="collapse" href="#${item.href}" role="button" aria-expanded="false" aria-controls="submenu1">
          ${item.name}
        </a>
        <div class="collapse" id="${item.href}">
          <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
            ${item.submenu.map(subItem => `<li><a href="${subItem.href}" class="link-dark rounded">${subItem.name}</a></li>`).join('')}
          </ul>
        </div>
      </li>`;
  } else {
    return `
      <li class="offcanvas-item w-100 pb-1 mb-2 text-start">
        <a href="${item.href}" class="btn btn-primary text-start offcanvas-link w-100 py-2 px-3 fs-4 ${isActive}">
          <i class="${item.icon} fw"></i>
          <span>${item.name}</span>
        </a>
      </li>`;
  }
}

// Fetch and load menu items
fetch("../../js/menuItems.json")
  .then(response => response.json())
  .then(menuItems => {
    const list = $("#ui-nav");
    const list2 = $("#ui-nav2");
    const currentPath = window.location.pathname;

    menuItems.forEach(item => {
      // Check if the current path matches the item's href
      const itemPath = new URL(item.href, window.location.origin).pathname;
      const isActive = currentPath.includes(itemPath) ? "active" : "";

      // Build the list items for sidebar and offcanvas
      const listItem = buildMenuItem(item, isActive);
      const listItem2 = buildOffcanvasItem(item, isActive);

      // Append the items to the respective lists
      list.append(listItem);
      list2.append(listItem2);
    });
  })
  .catch(err => {
    console.error("Error loading the menu items:", err);
  });
