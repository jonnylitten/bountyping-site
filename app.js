// BountyPing Frontend JavaScript

// API Configuration
const API_URL = 'https://web-production-372c2.up.railway.app';

// State
let allPrograms = [];
let platforms = [];
let currentSort = { column: null, direction: 'asc' };

// DOM elements
const programsContainer = document.getElementById('programs');
const searchInput = document.getElementById('search');
const platformSelect = document.getElementById('platform');
const sortSelect = document.getElementById('sort');
const bountiesOnlyCheckbox = document.getElementById('bounties-only');
const newOnlyCheckbox = document.getElementById('new-only');
const resultsCount = document.getElementById('results-count');

// Fetch and display stats
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/api/stats`);
        const stats = await response.json();

        document.getElementById('stat-total').textContent = stats.total_programs.toLocaleString();
        document.getElementById('stat-new').textContent = stats.new_this_week.toLocaleString();
        document.getElementById('stat-paid').textContent = stats.paid_programs.toLocaleString();
        document.getElementById('stat-platforms').textContent = stats.platforms;
    } catch (error) {
        console.error('Failed to load stats:', error);
        // Set placeholder values on error
        document.getElementById('stat-total').textContent = '-';
        document.getElementById('stat-new').textContent = '-';
        document.getElementById('stat-paid').textContent = '-';
        document.getElementById('stat-platforms').textContent = '-';
    }
}

// Fetch platforms for filter
async function loadPlatforms() {
    try {
        const response = await fetch(`${API_URL}/api/platforms`);
        const data = await response.json();
        platforms = data.platforms;

        // Populate platform dropdown
        platforms.forEach(platform => {
            const option = document.createElement('option');
            option.value = platform.name;
            option.textContent = `${platform.name} (${platform.count})`;
            platformSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load platforms:', error);
    }
}

// Fetch programs with current filters
async function loadPrograms() {
    const params = new URLSearchParams();

    if (searchInput.value) params.set('search', searchInput.value);
    if (platformSelect.value) params.set('platform', platformSelect.value);
    if (sortSelect.value) params.set('sort_by', sortSelect.value);
    if (bountiesOnlyCheckbox.checked) params.set('bounties_only', 'true');
    if (newOnlyCheckbox.checked) params.set('new_only', 'true');

    try {
        const response = await fetch(`${API_URL}/api/programs?${params}`);
        const data = await response.json();

        allPrograms = data.programs;
        displayPrograms(allPrograms);
        resultsCount.textContent = `${data.count} program${data.count !== 1 ? 's' : ''}`;
    } catch (error) {
        console.error('Failed to load programs:', error);
        programsContainer.innerHTML = `
            <div class="error-state">
                <h3>Failed to load programs</h3>
                <p>Please try again later or check if the API is running.</p>
            </div>
        `;
    }
}

// Display programs in the UI
function displayPrograms(programs) {
    if (programs.length === 0) {
        programsContainer.innerHTML = `
            <div class="no-results">
                <h3>No programs found</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }

    programsContainer.innerHTML = programs.map(program => {
        const isNew = program.first_seen &&
            (new Date() - new Date(program.first_seen)) < 7 * 24 * 60 * 60 * 1000;

        const bountyText = program.vdp_only ?
            'No bounty (VDP)' :
            (program.bounty_max ?
                `$${(program.bounty_min || 0).toLocaleString()} - $${program.bounty_max.toLocaleString()}` :
                (program.bounty_min ?
                    `From $${program.bounty_min.toLocaleString()}` :
                    'Bounty available'));

        return `
            <div class="program-card ${isNew ? 'new-program' : ''}">
                <div class="program-header">
                    ${isNew ? '<span class="new-badge">NEW</span>' : ''}
                    <h2 class="program-name">
                        <a href="${program.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(program.name)}</a>
                    </h2>
                </div>

                <span class="platform-badge">${escapeHtml(program.platform)}</span>

                <span class="bounty-value ${program.vdp_only ? 'vdp' : 'bounty'}">${bountyText}</span>
            </div>
        `;
    }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Column sorting
function setupColumnSorting() {
    const headers = document.querySelectorAll('.th[data-sort]');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;

            // Toggle direction if clicking same column
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'desc'; // Default to descending for new column
            }

            // Update UI
            headers.forEach(h => h.classList.remove('sorted', 'asc', 'desc'));
            header.classList.add('sorted', currentSort.direction);

            // Sort and display
            sortPrograms();
        });
    });
}

function sortPrograms() {
    if (!currentSort.column || allPrograms.length === 0) return;

    const sorted = [...allPrograms].sort((a, b) => {
        let valA, valB;

        switch (currentSort.column) {
            case 'name':
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
                break;
            case 'platform':
                valA = a.platform.toLowerCase();
                valB = b.platform.toLowerCase();
                break;
            case 'bounty':
                valA = a.bounty_max || a.bounty_min || 0;
                valB = b.bounty_max || b.bounty_min || 0;
                break;
            case 'scope':
                valA = a.assets ? a.assets.length : 0;
                valB = b.assets ? b.assets.length : 0;
                break;
            default:
                return 0;
        }

        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    displayPrograms(sorted);
}

// Event listeners
searchInput.addEventListener('input', debounce(loadPrograms, 300));
platformSelect.addEventListener('change', loadPrograms);
sortSelect.addEventListener('change', loadPrograms);
bountiesOnlyCheckbox.addEventListener('change', loadPrograms);
newOnlyCheckbox.addEventListener('change', loadPrograms);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadPlatforms();
    loadPrograms();
    setupColumnSorting();
});
