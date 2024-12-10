document.addEventListener('DOMContentLoaded', () => {
    const historyCommentsContainer = document.getElementById('historyCommentsContainer');
    if (historyCommentsContainer) {
        loadUserHistory(); // Automatically load user history on page load
    }
});

function loadUserHistory() {
    const historyCommentsContainer = document.getElementById('historyCommentsContainer');

    if (!historyCommentsContainer) return;
    console.log('loadUserHistory loaded');

    axios
        .get('/profile/history/data')
        .then((response) => {
            const comments = response.data;
            console.log('comment data: ', comments);

            if (comments.length === 0) {
                historyCommentsContainer.innerHTML =
                    '<p>No history available for this user.</p>';
                return;
            }

            historyCommentsContainer.innerHTML = ''; // Clear existing history
            comments.forEach((comment) => {
                // Translations for grade, workload, and semester
                const gradeTranslation =
                    window.gradeTranslations[comment.grade] || 'N/A';
                const workloadTranslation =
                    window.workloadTranslations[comment.workload] || 'N/A';
                const semesterTranslation =
                    window.translateSemester(comment.sem_id);

                const commentTile = document.createElement('div');
                commentTile.classList.add('comment-tile');
                commentTile.innerHTML = `
                    <div class="rating-header">
                        <span class="rating">Rating: ${comment.rating}</span>
                        <span class="semester">Semester: ${semesterTranslation}</span>
                    </div>
                    <div class="date-header">
                        <span class="date">${new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p class="comment">${comment.comment}</p>
                    <div class="grade-footer">
                        <span class="grade">Grade: ${gradeTranslation}</span>
                    </div>
                    <div class="workload-footer">
                        <span class="workload">Workload: ${workloadTranslation}</span>
                    </div>
                    <button class="edit-button" data-rating-id="${comment.rating_id}">Edit</button>
                `;
                historyCommentsContainer.appendChild(commentTile);
            });

            // Add event listeners to edit buttons
            addEditListeners();
        })
        .catch((error) => {
            console.error('Error loading user history:', error);
            historyCommentsContainer.innerHTML =
                '<p>Failed to load history. Please try again later.</p>';
        });
}

function addEditListeners() {
    const editButtons = document.querySelectorAll('.edit-button');
    editButtons.forEach((button) => {
        button.addEventListener('click', function () {
            const ratingId = this.getAttribute('data-rating-id');
            openEditModal(ratingId);
        });
    });
}

function openEditModal(ratingId) {
    axios
        .get(`/profile/history/${ratingId}`)
        .then((response) => {
            const rating = response.data;

            document.getElementById('editRatingId').value = rating.rating_id;
            document.getElementById('editComment').value = rating.comment;
            document.getElementById('editRating').value = rating.rating || '';
            document.getElementById('editGrade').value = rating.grade || '';
            document.getElementById('editWorkload').value = rating.workload || '';

            const editModal = document.getElementById('editModal');
            editModal.style.display = 'block';
        })
        .catch((error) => {
            console.error('Error fetching rating data:', error);
        });
}

// Close modal functionality
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
});
