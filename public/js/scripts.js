document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('.data-form');
  const buttons = document.querySelectorAll('.show-hide-btn');

  const apiEndpoints = {
    owners: 'http://localhost:5000/owners',
    pets: 'http://localhost:5000/pets',
    vets: 'http://localhost:5000/vets',
    visits: 'http://localhost:5000/visits',
    vaccinations: 'http://localhost:5000/vaccination',
    healths: 'http://localhost:5000/health',
    vaccine: 'http://localhost:5000/vaccine',
  };

  function createDialogBox(message, type, errorDetails = null) {
    const backdrop = document.createElement('div');
    backdrop.classList.add('dialog-backdrop');
    document.body.appendChild(backdrop);

    const dialogBox = document.createElement('div');
    dialogBox.classList.add('dialog-box');
    dialogBox.innerHTML = `
      <h3>${type === 'success' ? 'Success' : 'Error'}</h3>
      <p>${message}</p>
      ${errorDetails ? '<button class="show-reason-btn">Show Reason</button>' : ''}
      ${errorDetails ? `<div class="reason-text">${errorDetails}</div>` : ''}
      <button class="close-dialog-btn">Close</button>
    `;
    document.body.appendChild(dialogBox);

    dialogBox.querySelector('.close-dialog-btn').addEventListener('click', () => {
      document.body.removeChild(dialogBox);
      document.body.removeChild(backdrop);
    });

    if (errorDetails) {
      const reasonText = dialogBox.querySelector('.reason-text');
      const showReasonBtn = dialogBox.querySelector('.show-reason-btn');
      showReasonBtn.addEventListener('click', () => {
        reasonText.style.display = reasonText.style.display === 'none' ? 'block' : 'none';
      });
    }
  }

  forms.forEach((form) => {
    const type = form.dataset.type;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Email validation
      const emailField = form.querySelector('input[type="email"]');
      if (emailField) {
        const email = emailField.value.trim();
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email)) {
          createDialogBox('Invalid email address. Please enter a valid email.', 'error');
          return;
        }
      }

      if (!apiEndpoints[type]) {
        createDialogBox('Invalid form type. Please check your form configuration.', 'error');
        return;
      }

      try {
        const response = await fetch(`${apiEndpoints[type]}/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          createDialogBox(result.message || 'Record added successfully!', 'success');
          form.reset();
        } else {
          const error = await response.json();
          createDialogBox(error.message || 'Failed to add record.', 'error');
        }
      } catch (err) {
        console.error('Error:', err);
        createDialogBox('An error occurred while submitting the form.', 'error');
      }
    });
  });

  buttons.forEach((button) => {
    const type = button.dataset.type;

    button.addEventListener('click', async () => {
      if (!type || !apiEndpoints[type]) {
        createDialogBox('Error: Invalid type or API endpoint.', 'error');
        return;
      }

      const list = document.querySelector(`.data-list[data-type="${type}"]`);

      if (!list) {
        createDialogBox('Error: No associated list element found.', 'error');
        return;
      }

      if (list.style.display === 'none' || !list.style.display) {
        try {
          const response = await fetch(`${apiEndpoints[type]}`);
          if (response.ok) {
            const records = await response.json();
            updateList(type, records);
            list.style.display = 'block';
            button.textContent = 'Hide';
          } else {
            const error = await response.text();
            console.error('Fetch Error:', error);
            createDialogBox('Error: Failed to fetch records.', 'error');
          }
        } catch (err) {
          console.error('Error:', err);
          createDialogBox('An error occurred while fetching records.', 'error');
        }
      } else {
        list.style.display = 'none';
        button.textContent = 'Show All';
      }
    });
  });

  const updateList = (type, items) => {
    const list = document.querySelector(`.data-list[data-type="${type}"]`);

    list.innerHTML = items
      .map(
        (item) => `
      <li class="list-item">
        <div class="item-details">
          ${Object.entries(item)
            .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
            .join('')}
        </div>
        <button class="remove-btn" data-type="${type}" data-id="${item.PetID || item.OwnerID || item.id || item.VetID || item.recordId || item.VaccineID}">Remove</button>
      </li>`
      )
      .join('');

    list.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const recordId = btn.dataset.id;

        if (!recordId) {
          createDialogBox('Error: Record ID is missing.', 'error');
          return;
        }

        if (!type || !apiEndpoints[type]) {
          createDialogBox('Error: Invalid type or API endpoint.', 'error');
          return;
        }

        try {
          const response = await fetch(`${apiEndpoints[type]}/${recordId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            createDialogBox('Record deleted successfully.', 'success');
            btn.closest('li').remove();
          } else {
            const errorResponse = await response.json();
            const errorMessage = errorResponse.error || 'Failed to delete record.';
            createDialogBox('Error: Failed to delete record.', 'error', errorMessage);
          }
        } catch (err) {
          console.error('Error:', err);
          createDialogBox('An unexpected error occurred while deleting the record.', 'error', err.message);
        }
      });
    });
  };
});
