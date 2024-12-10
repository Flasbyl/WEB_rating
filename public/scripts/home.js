let chartInstance = null;
let originalOptions = {
    firstDropdown: [],
    secondDropdown: [],
};

document.addEventListener('DOMContentLoaded', function () {
    console.log('Eventlistnener loadSemester triggered');
    loadSemester();
});
document.addEventListener('DOMContentLoaded', function () {
    console.log('Eventlistener Modal triggered');
    const toggler = document.querySelector('.menu__toggler');
    const loginModal = document.getElementById('loginModal');
    const closeModalButton = loginModal.querySelector('.close');
    const isLoggedIn = typeof user !== 'undefined' && user; // Replace with actual user check logic

    if (toggler && !isLoggedIn) {
        toggler.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent opening the sliding panel
            if (loginModal) {
                loginModal.style.display = 'block';
            }
        });
    }

    // Close modal when clicking the "X" button
    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (loginModal && event.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });
});
document.addEventListener('DOMContentLoaded', function () {
    console.log('Eventlistener Comments triggered');
    const loadCommentsButton = document.getElementById('loadCommentsButton');
    const commentsContainer = document.getElementById('commentsContainer');
    console.log('Comments loading: ', loadCommentsButton, commentsContainer);

    if (loadCommentsButton && commentsContainer) {
        loadCommentsButton.addEventListener('click', function () {
            const profId = document.getElementById('prof_id_hidden').value;
            const moduleId = document.getElementById('module_id_hidden').value;

            if (!profId || !moduleId) {
                commentsContainer.innerHTML = '<p>Please select both a professor and a module to load comments.</p>';
                return;
            }

            axios
                .get(`/comments?prof_id_hidden=${profId}&module_id_hidden=${moduleId}`)
                .then((response) => {
                    const comments = response.data;
                    console.log('comment data: ', comments);

                    if (comments.length === 0) {
                        commentsContainer.innerHTML = '<p>No comments available for this selection.</p>';
                        return;
                    }

                    commentsContainer.innerHTML = ''; // Clear existing comments

                    comments.forEach((comment) => {
                        // Translations for grade, workload, and semester
                        const gradeTranslation =
                            window.gradeTranslations[comment.grade] || 'N/A';
                        const workloadTranslation =
                            window.workloadTranslations[comment.workload] || 'N/A';
                        const semesterTranslation =
                            window.translateSemester(comment.sem_id);
                        console.log('sem_id passed to translation:', comment.sem_id);
                        console.log('output from translatoin: ', semesterTranslation);

                        // Create comment tile
                        const commentTile = document.createElement('div');
                        commentTile.style.display = 'flex';
                        commentTile.style.flexDirection = 'column';
                        commentTile.style.justifyContent = 'space-between';
                        commentTile.style.padding = '15px';
                        commentTile.style.border = '1px solid #ccc';
                        commentTile.style.borderRadius = '8px';
                        commentTile.style.marginBottom = '15px';
                        commentTile.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        commentTile.style.backgroundColor = '#f9f9f9';
                        commentTile.style.position = 'relative';

                        // Header section
                        const header = document.createElement('div');
                        header.style.display = 'flex';
                        header.style.justifyContent = 'space-between';
                        header.style.width = '100%';

                        const rating = document.createElement('div');
                        rating.textContent = `Rating: ${comment.rating || 'N/A'}`;
                        rating.style.fontSize = '1.5rem';
                        rating.style.fontWeight = 'bold';
                        rating.style.color = '#007BFF';

                        const date = document.createElement('div');
                        date.textContent = new Date(comment.created_at).toLocaleDateString();
                        date.style.fontSize = '0.9rem';
                        date.style.color = '#555';
                        date.style.position = 'absolute';
                        date.style.top = '15px';
                        date.style.right = '15px';

                        header.appendChild(rating);
                        header.appendChild(date);

                        // Comment section
                        const commentText = document.createElement('div');
                        commentText.textContent = comment.comment || '';
                        commentText.style.fontSize = '1rem';
                        commentText.style.margin = '10px 0';
                        commentText.style.color = '#333';

                        // Details section
                        const details = document.createElement('div');
                        details.style.fontSize = '0.9rem';
                        details.style.color = '#666';

                        const semester = document.createElement('span');
                        semester.textContent = `Semester: ${semesterTranslation}`;

                        const grade = document.createElement('span');
                        grade.textContent = `Grade: ${gradeTranslation}`;

                        const workload = document.createElement('span');
                        workload.textContent = `Workload: ${workloadTranslation}`;

                        details.appendChild(semester);
                        details.appendChild(document.createElement('br')); // Line break for spacing
                        details.appendChild(grade);
                        details.appendChild(document.createElement('br'));
                        details.appendChild(workload);

                        // Append everything to the comment tile
                        commentTile.appendChild(header);
                        commentTile.appendChild(commentText);
                        commentTile.appendChild(details);

                        // Append the tile to the container
                        commentsContainer.appendChild(commentTile);
                    });
                })
                .catch((error) => {
                    console.error('Error loading comments:', error);
                    commentsContainer.innerHTML =
                        '<p>Failed to load comments. Please try again later.</p>';
                });
        });
    }
});

function toggleSelection() {
    console.log('toggleSelection triggered');
    const category = document.getElementById('categorySelector').value;
    if (!category) return;

    axios
        .get(`/${category}s`)
        .then(function (response) {
            const dropdown = document.getElementById('firstDropdown');
            dropdown.innerHTML = '<option value="">Make selection</option>';
            originalOptions.firstDropdown = response.data;

            response.data.forEach((item) => {
                const option = new Option(item.name, item.id);
                dropdown.appendChild(option);
            });
        })
        .catch(function (error) {
            console.error('Error loading data:', error);
        });
}

function updateSecondDropdown() {
    console.log('updateSecondDropdown triggered');
    const firstDropdown = document.getElementById('firstDropdown');
    const selectedId = firstDropdown.value;
    if (!selectedId) return;

    const category = document.getElementById('categorySelector').value;
    const relatedType = category === 'professor' ? 'module' : 'professor';

    axios
        .get(`/relations/${relatedType}/${selectedId}`)
        .then(function (response) {
            const secondDropdown = document.getElementById('secondDropdown');
            secondDropdown.innerHTML = '<option value="">Make selection</option>';
            originalOptions.secondDropdown = response.data;

            response.data.forEach((item) => {
                const option = new Option(item.name, item.id);
                secondDropdown.appendChild(option);
            });
        })
        .catch(function (error) {
            console.error('Error updating second dropdown:', error);
        });
}

function filterDropdown(dropdownId, searchTerm) {
    console.log('filterDropdown triggered');
    const dropdown = document.getElementById(dropdownId);
    const originalList = originalOptions[dropdownId];
    const filteredList = originalList.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    dropdown.innerHTML = '<option value="">Make selection</option>';
    filteredList.forEach((item) => {
        const option = new Option(item.name, item.id);
        dropdown.appendChild(option);
    });
}

function loadChart() {
    console.log('loadChart triggered');
    const category = document.getElementById('categorySelector').value;
    const firstId = document.getElementById('firstDropdown').value;
    const secondId = document.getElementById('secondDropdown').value;
    if (!category || !firstId || !secondId) return;

    const ctx = document.getElementById('ratingChart')?.getContext('2d');
    if (!ctx) {
        console.error('Canvas element with id "ratingChart" is not found in the DOM.');
        return;
    }

    axios
        .get(`/chart?category=${category}&firstId=${firstId}&secondId=${secondId}`)
        .then(function (response) {
            const { ratingData, profIdValue, moduleIdValue } = response.data;

            document.getElementById('prof_id_hidden').value = profIdValue;
            document.getElementById('module_id_hidden').value = moduleIdValue;

            if (chartInstance) {
                chartInstance.destroy();
            }

            ratingData.scatter.forEach((d) => (d.x = Number(d.x)));
            ratingData.curve.forEach((d) => (d.x = Number(d.x)));

            chartInstance = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            type: 'scatter',
                            label: 'Individual Ratings',
                            data: ratingData.scatter,
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            showLine: false,
                        },
                        {
                            type: 'line',
                            label: 'Average Ratings',
                            data: ratingData.curve,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            fill: false,
                            tension: 0.25,
                        },
                    ],
                },
                options: {
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: {
                                display: true,
                                text: 'Semester ID',
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Rating',
                            },
                        },
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                        },
                    },
                },
            });
        })
        .catch(function (error) {
            console.error('Error loading chart data:', error);
        });
}

function loadSemester() {
    console.log('loadSemester2 triggered');
    axios
        .get('/semester')
        .then(function (response) {
            const dropdown = document.getElementById('sem_id');
            const selectedValue = dropdown.value;
            dropdown.innerHTML = '<option value="">Select Semester</option>';
            response.data.forEach((semester) => {
                const option = new Option(semester.sem_name, semester.sem_id);
                dropdown.appendChild(option);
            });
            dropdown.value = selectedValue;
            document.getElementById('sem_id_hidden').value = selectedValue;
        })
        .catch(function (error) {
            console.error('Error loading semesters:', error);
        });

    const dropdown = document.getElementById('sem_id');
    dropdown.addEventListener('change', function () {
        const selectedValue = dropdown.value;
        document.getElementById('sem_id_hidden').value = selectedValue;
    });
}

// Cookie Helper Functions
function setCookie(name, value, days) {
    console.log('setCookie triggered');
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    console.log('getCookie triggered');
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(name + "=") === 0) {
            return cookie.substring(name.length + 1);
        }
    }
    return "";
}

// Save dropdown selections to cookies
document.getElementById('categorySelector').addEventListener('change', function () {
    setCookie('categorySelector', this.value, 1); // Store for 1 day
});

document.getElementById('firstDropdown').addEventListener('change', function () {
    setCookie('firstDropdown', this.value, 1); // Store for 1 day
});

document.getElementById('secondDropdown').addEventListener('change', function () {
    setCookie('secondDropdown', this.value, 1); // Store for 1 day
});

// Restore dropdown selections on page load
document.addEventListener('DOMContentLoaded', function () {
    console.log('Eventlistener persistent dropdowns triggered');
    const category = getCookie('categorySelector');
    const first = getCookie('firstDropdown');
    const second = getCookie('secondDropdown');

    if (category) {
        const categorySelector = document.getElementById('categorySelector');
        categorySelector.value = category;

        // Populate the first dropdown
        toggleSelection().then(() => {
            const firstDropdown = document.getElementById('firstDropdown');
            if (first) {
                firstDropdown.value = first;

                // Populate the second dropdown
                updateSecondDropdown().then(() => {
                    const secondDropdown = document.getElementById('secondDropdown');
                    if (second) {
                        secondDropdown.value = second;

                        // Load the chart after setting all selections
                        loadChart();
                    }
                });
            }
        });
    }
});

// Update toggleSelection to return a Promise
function toggleSelection() {
    console.log('toggleSelection2 triggered');
    const category = document.getElementById('categorySelector').value;
    if (!category) return Promise.resolve();

    return axios
        .get(`/${category}s`)
        .then(function (response) {
            const dropdown = document.getElementById('firstDropdown');
            dropdown.innerHTML = '<option value="">Make selection</option>';
            originalOptions.firstDropdown = response.data;

            response.data.forEach((item) => {
                const option = new Option(item.name, item.id);
                dropdown.appendChild(option);
            });
        })
        .catch(function (error) {
            console.error('Error loading data:', error);
        });
}

// Update updateSecondDropdown to return a Promise
function updateSecondDropdown() {
    console.log('updateSecondDropdown2 triggered');
    const firstDropdown = document.getElementById('firstDropdown');
    const selectedId = firstDropdown.value;
    if (!selectedId) return Promise.resolve();

    const category = document.getElementById('categorySelector').value;
    const relatedType = category === 'professor' ? 'module' : 'professor';

    return axios
        .get(`/relations/${relatedType}/${selectedId}`)
        .then(function (response) {
            const secondDropdown = document.getElementById('secondDropdown');
            secondDropdown.innerHTML = '<option value="">Make selection</option>';
            originalOptions.secondDropdown = response.data;

            response.data.forEach((item) => {
                const option = new Option(item.name, item.id);
                secondDropdown.appendChild(option);
            });
        })
        .catch(function (error) {
            console.error('Error updating second dropdown:', error);
        });
}