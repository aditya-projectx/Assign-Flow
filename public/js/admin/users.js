// Email validation helper (same regex as backend)
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Client-side search and filter with debounce
let searchTimeout;
const searchInput = document.getElementById("searchInput");
const filterRole = document.getElementById("filterRole");
const filterDepartment = document.getElementById("filterDepartment");

// Real-time email validation for forms
document.addEventListener('DOMContentLoaded', function() {
  const emailInputs = document.querySelectorAll('input[name="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', function() {
      validateEmailInput(this);
    });
    input.addEventListener('input', function() {
      clearEmailValidation(this);
    });
  });
});

function validateEmailInput(input) {
  const email = input.value.trim();
  const feedback = input.parentElement.querySelector('.email-feedback');
  
  if (email && !isValidEmail(email)) {
    if (!feedback) {
      const div = document.createElement('div');
      div.className = 'email-feedback mt-1 text-sm text-red-600';
      div.textContent = 'Please enter a valid email address';
      input.parentElement.appendChild(div);
    }
    input.classList.add('border-red-300', 'ring-2', 'ring-red-200');
    input.classList.remove('border-gray-300');
  } else {
    clearEmailValidation(input);
  }
}

function clearEmailValidation(input) {
  const feedback = input.parentElement.querySelector('.email-feedback');
  if (feedback) feedback.remove();
  input.classList.remove('border-red-300', 'ring-2', 'ring-red-200');
  input.classList.add('border-gray-300');
}


searchInput.addEventListener("input", function (e) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 500);
});

filterRole.addEventListener("change", function () {
  applyFilters();
});

filterDepartment.addEventListener("change", function () {
  applyFilters();
});

function applyFilters() {
  const search = searchInput.value;
  const role = filterRole.value;
  const department = filterDepartment.value;
  let url = "/admin/users?";

  if (search) url += "search=" + encodeURIComponent(search) + "&";
  if (role) url += "role=" + role + "&";
  if (department) url += "department=" + encodeURIComponent(department) + "&";

  window.location.href = url;
}

function clearFilters() {
  window.location.href = "/admin/users";
}

function confirmDelete(button) {
  const id = button.dataset.id;
  const name = button.dataset.name;
  const email = button.dataset.email;
  const modal = document.getElementById("deleteModal");
  const message = document.getElementById("deleteMessage");
  const form = document.getElementById("deleteForm");

  let warning = "";
  if (email && !isValidEmail(email)) {
    warning = `<div class="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
      <p class="text-yellow-800 font-medium"><strong>⚠️ Invalid Email Warning:</strong></p>
      <p class="text-yellow-700 text-sm mt-1">${email}</p>
      <p class="text-yellow-700 text-sm">This user has invalid email. Deletion may be blocked by server.</p>
    </div>`;
  }

  message.innerHTML =
    "Are you sure you want to delete <strong>" +
    name +
    "</strong> (" + email + ")?<br>" +
    "This action cannot be undone." + warning;
  form.action = "/admin/users/delete/" + id;
  modal.classList.remove("hidden");
}


function closeDeleteModal() {
  document.getElementById("deleteModal").classList.add("hidden");
}

// Auto-highlight invalid emails in table on page load
function highlightInvalidEmails() {
  const emailCells = document.querySelectorAll('td:has(span[title*="Invalid"])');
  emailCells.forEach(cell => {
    cell.style.backgroundColor = '#fef2f2';
    cell.style.borderLeft = '4px solid #ef4444';
  });
}

// Run on load
document.addEventListener('DOMContentLoaded', highlightInvalidEmails);


// Close modal on escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeDeleteModal();
  }
});
