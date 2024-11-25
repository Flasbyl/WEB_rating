document.addEventListener('DOMContentLoaded', function () {
    const toggler = document.querySelector('.menu__toggler');
    const slidingPanel = document.getElementById('slidingPanel');
    const sidebar = document.querySelector('.sidebar');
    const textarea = document.querySelector('#slidingPanel form textarea');

    if (textarea) {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto'; // Reset the height to calculate the correct new height
            this.style.height = `${this.scrollHeight}px`; // Set height to the scroll height
        });
    }

    if (!toggler || !slidingPanel || !sidebar) {
        console.error('Sliding panel, toggler button, or sidebar is missing.');
        return;
    }

    // Open/Close panel and toggle button text
    toggler.addEventListener('click', () => {
        const isOpen = slidingPanel.classList.toggle('active'); // Toggle sliding panel visibility
        toggler.classList.toggle('active'); // Toggle button's active state
        toggler.textContent = isOpen ? 'Close' : 'Post'; // Update button text
    });

    // Optional: Close panel and reset button text when form is submitted
    const form = slidingPanel.querySelector('form');
    if (form) {
        form.addEventListener('submit', () => {
            toggler.classList.remove('active');
            slidingPanel.classList.remove('active');
            toggler.textContent = 'Post'; // Reset text to 'Post' after submission
        });
    }

    // Function to update the sliding panel's width and position
    function updateSlidingPanelWidth() {
        if (sidebar) {
            const sidebarWidth = sidebar.offsetWidth;
            const sidebarLeft = sidebar.offsetLeft;

            slidingPanel.style.width = `${sidebarWidth}px`; // Match the width of the sidebar
            slidingPanel.style.left = `${sidebarLeft}px`; // Align to sidebar's position
        }
    }

    // Adjust sliding panel on window resize
    window.addEventListener('resize', updateSlidingPanelWidth);

    // Initialize the sliding panel's width and position
    updateSlidingPanelWidth();
});
