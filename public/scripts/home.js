let chartInstance = null;
let originalOptions = {
    firstDropdown: [],
    secondDropdown: [],
};

document.addEventListener('DOMContentLoaded', function () {
    loadSemester();
});

function toggleSelection() {
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
