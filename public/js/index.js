
  // Add event listener to all toggle buttons
  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      // Find the answer paragraph relative to the clicked button
      const answer = btn.parentElement.nextElementSibling;

      // Toggle visibility
      if (answer.classList.contains('hidden')) {
        answer.classList.remove('hidden');
        answer.classList.add('visible');
        btn.classList.add('rotate');
      } else {
        answer.classList.remove('visible');
        answer.classList.add('hidden');
        btn.classList.remove('rotate');
      }
    });
  });


  // API endpoints for different types
const apiRoutes = {
  'pet-box': 'http://localhost:5000/pets/total-pets', // Endpoint to get total pets
  'owner-box': 'http://localhost:5000/owners/total', // Endpoint to get total owners
  'visit-box': 'http://localhost:5000/visits/total', // Endpoint to get total vet visits
  'health-box': 'http://localhost:5000/health/latest', // Endpoint to get latest health record
  'vaccine-box': 'http://localhost:5000/vaccination/latest', // Endpoint to get latest vaccination
  'vet-box': 'http://localhost:5000/vets/total', // Endpoint to get total vets
};

// Function to fetch and update the data dynamically
// Function to fetch and update the data dynamically
async function fetchAndUpdateData(boxElement, type) {
  try {
    const route = apiRoutes[type];
    if (!route) {
      console.error(`No API route defined for ${type}`);
      return;
    }

    // Fetch data from the API
    const response = await fetch(route);
    if (!response.ok) throw new Error(`Failed to fetch data for ${type}`);

    const data = await response.json();
    console.log(data)
    console.log(`Response for ${type}:`, data); // Log the API response

    // Update the <p> content dynamically based on the type
    const contentOverlay = boxElement.querySelector('.content-overlay p');
    if (type === 'health-box') {
      contentOverlay.textContent = `Condition: ${data.condition} (Pet ID: ${data.petId})`;
    } else if (type === 'vaccine-box') {
      contentOverlay.textContent = `${data.vaccine} (Pet ID: ${data.petId})`;
    } else {
      contentOverlay.textContent = `Total : ${data.total}`; // Ensure the response has a `total` key
    }
  } catch (error) {
    console.error(`Error fetching data for ${type}:`, error);

    // Display an error message in case of failure
    const contentOverlay = boxElement.querySelector('.content-overlay p');
    contentOverlay.textContent = 'Error loading data.';
  }
}


// Add event listeners for hover
document.querySelectorAll('.dashboard-box').forEach((box) => {
  const type = [...box.classList].find((cls) => apiRoutes[cls]);
  console.log(type)
  if (!type) return; // Skip if no corresponding route is found

  box.addEventListener('mouseenter', () => fetchAndUpdateData(box, type));
});


