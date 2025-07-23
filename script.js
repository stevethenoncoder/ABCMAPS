// --- CONFIGURATION ---
// Paste the published Google Sheet CSV URL here
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQyRVGJUzbjaaqh6JFCSjo22E8TWflgfwhDY2NIR6JiZdZufAg7Ny66l73hU9Lo-vHRq-O730-N-pTp/pub?gid=1842473880&single=true&output=csv';

// --- INITIALIZE MAP ---
// Set initial coordinates and zoom level (e.g., centered on the UK)
const map = L.map('map').setView([54.5, -2.5], 6);

// Add a tile layer from OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const categoryColors = {
    A: "#e6194b", B: "#3cb44b", C: "#ffe119", D: "#0082c8", E: "#f58231",
    F: "#911eb4", G: "#46f0f0", H: "#f032e6", I: "#d2f53c", J: "#fabebe",
    K: "#008080", L: "#e6beff", M: "#aa6e28", N: "#fffac8", O: "#800000",
    P: "#aaffc3", Q: "#808000", R: "#ffd8b1", S: "#000080", T: "#808080",
    U: "#bcf5a9", V: "#fdcce5", W: "#9a6324", X: "#fff", Y: "#000", Z: "#f0f"
};

// --- GLOBAL VARIABLES ---
let allData = []; // To store all location data
const markers = L.layerGroup().addTo(map); // A layer group to hold markers for easy clearing

const labelLayer = L.layerGroup().addTo(map);
let showLabels = true;

// --- FETCH AND PROCESS DATA ---
fetch(sheetUrl)
    .then(response => response.text())
    .then(csvText => {
        // Parse the CSV data
        allData = parseCSV(csvText);
        // Populate filters and display all markers initially
        populateFilters();
        displayMarkers(allData);
    });

// --- HELPER FUNCTIONS ---

// A simple function to parse CSV text into an array of objects
function parseCSV(text) {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',').map(d => d.trim());
        if (data.length === headers.length) {
            const row = {};
            for (let j = 0; j < headers.length; j++) {
                row[headers[j]] = data[j];
            }
            rows.push(row);
        }
    }
    return rows;
}

// Function to populate the filter dropdowns with unique values
function populateFilters() {
    const countyFilter = document.getElementById('county-filter');
    const categoryFilter = document.getElementById('category-filter');

    // Get unique values for county and category
    const counties = [...new Set(allData.map(item => item.County))];
    const categories = [...new Set(allData.map(item => item.Category))];

    // Populate County Filter
    countyFilter.innerHTML = '<option value="all">All Counties</option>';
    counties.sort().forEach(county => {
        countyFilter.innerHTML += `<option value="${county}">${county}</option>`;
    });

    // Populate Category Filter
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    categories.sort().forEach(category => {
        categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
    });

    // Add event listeners to trigger filtering
    countyFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
}

// Function to display markers on the map
function displayMarkers(data) {
    markers.clearLayers();
    labelLayer.clearLayers();
    const latLngs = [];

    data.forEach(item => {
        const lat = parseFloat(item.Lat);
        const lng = parseFloat(item.Long);

        if (!isNaN(lat) && !isNaN(lng)) {
            // ... your existing marker code ...

            const marker = L.marker([lat, lng], { icon });
            const popupContent = `<b>${item.Place}</b><br>${item.Category}<br>Visited: ${item.Date}`;
            marker.bindPopup(popupContent);
            markers.addLayer(marker);

            latLngs.push([lat, lng]);

            // Add label if toggled on
            if (showLabels) {
                const label = L.marker([lat, lng], {
                    icon: L.divIcon({
                        className: 'place-label',
                        html: `<span>${item.Place}</span>`,
                        iconSize: [100, 24],
                        iconAnchor: [0, 12]
                    }),
                    interactive: false // so clicking label doesn't pop up the marker
                });
                labelLayer.addLayer(label);
            }
        }
    });

    if (latLngs.length > 0) {
        map.fitBounds(latLngs, { padding: [30, 30] });
    }
}

// Function to apply filters based on dropdown selections
function applyFilters() {
    const selectedCounty = document.getElementById('county-filter').value;
    const selectedCategory = document.getElementById('category-filter').value;

    const filteredData = allData.filter(item => {
        const countyMatch = (selectedCounty === 'all' || item.County === selectedCounty);
        const categoryMatch = (selectedCategory === 'all' || item.Category === selectedCategory);
        return countyMatch && categoryMatch;
    });

    displayMarkers(filteredData);

    document.getElementById('toggle-labels').addEventListener('change', function(e) {
    showLabels = e.target.checked;
    displayMarkers(getCurrentFilteredData()); // Or pass the correct filtered data here
});
}
