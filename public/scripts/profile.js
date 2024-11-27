
document.addEventListener('DOMContentLoaded', () => {
    const historyCommentsContainer = document.getElementById('historyCommentsContainer');
    if (historyCommentsContainer) {
        loadUserHistory(); // Automatically load user history on page load
    }
});

function loadUserHistory() {
    axios
        .get('/profile/history')
        .then((response) => {
            const comments = response.data;

            // Clear existing comments
            const historyCommentsContainer = document.getElementById('historyCommentsContainer');
            historyCommentsContainer.innerHTML = '';

            if (comments.length === 0) {
                historyCommentsContainer.innerHTML = '<p>No ratings found in your history.</p>';
                return;
            }

            comments.forEach((comment) => {
                const commentTile = document.createElement('div');
                commentTile.classList.add('comment-tile');
                commentTile.innerHTML = `
                    <div class="comment-header">
                        <span class="rating">Rating: ${comment.rating}</span>
                    </div>
                    <div class="comment-header">
                        <span class="date">${new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p class="comment-text">${comment.comment}</p>
                    <div class="comment-details">
                        <span>Grade: ${comment.grade || 'N/A'}</span>
                        <span>Workload: ${comment.workload || 'N/A'}</span>
                        <span>Prof: ${comment.prof_id || 'N/A'}</span>
                        <span>Module: ${comment.module_id || 'N/A'}</span>
                    </div>
                    <button class="edit-comment-button" data-id="${comment.rating_id}" data-comment="${comment.comment}" data-rating="${comment.rating}" data-grade="${comment.grade}" data-workload="${comment.workload}">Edit</button>
                `;
                historyCommentsContainer.appendChild(commentTile);
            });

            attachEditButtons(); // Add event listeners to edit buttons
        })
        .catch((error) => {
            console.error('Error loading user ratings history:', error);
            document.getElementById('historyCommentsContainer').innerHTML = '<p>Failed to load your ratings history.</p>';
        });
}

function attachEditButtons() {
    const editButtons = document.querySelectorAll('.edit-comment-button');

    editButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            const { id, comment, rating, grade, workload } = event.target.dataset;

            // Populate modal fields with existing data
            const editModal = document.getElementById('editModal');
            editModal.querySelector('#editComment').value = comment;
            editModal.querySelector('#editRating').value = rating;
            editModal.querySelector('#editGrade').value = grade || '';
            editModal.querySelector('#editWorkload').value = workload || '';
            editModal.dataset.id = id; // Store rating_id for submission
            editModal.style.display = 'block';
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const editModal = document.getElementById('editModal');
    const closeModalButton = editModal?.querySelector('.close');

    if (editModal && closeModalButton) {
        // Add click event listener for the close button
        closeModalButton.addEventListener('click', () => {
            editModal.style.display = 'none';
        });

        // Close the modal when clicking outside of it
        window.addEventListener('click', (event) => {
            if (event.target === editModal) {
                editModal.style.display = 'none';
            }
        });
    }

    // Function to open the modal and populate fields
    function openEditModal(rating) {
        const { rating_id, comment, rating: ratingValue, grade, workload } = rating;

        document.getElementById('editRatingId').value = rating_id;
        document.getElementById('editComment').value = comment;
        document.getElementById('editRating').value = ratingValue || '';
        document.getElementById('editGrade').value = grade || '';
        document.getElementById('editWorkload').value = workload || '';

        editModal.style.display = 'block';
    }

    // Add click event listeners for edit buttons (assuming they are already rendered)
    document.querySelectorAll('.edit-button').forEach((button) => {
        button.addEventListener('click', (event) => {
            const ratingId = event.target.getAttribute('data-id');
            
            // Fetch the specific rating data and populate the modal
            axios
                .get(`/profile/history/${ratingId}`)
                .then((response) => {
                    const rating = response.data;
                    openEditModal(rating);
                })
                .catch((error) => {
                    console.error('Error fetching rating data:', error);
                });
        });
    });
});
