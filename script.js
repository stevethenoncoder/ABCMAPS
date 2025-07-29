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
const tooltipRefs = [];  // store tooltips here


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
// Function to sanitise
function sanitize(str) {
    return String(str || '')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')  // Remove control chars
        .trim();
}

// Function to populate the filter dropdowns with unique values
function populateFilters() {
    const countyFilter = document.getElementById('county-filter');
    const categoryFilter = document.getElementById('category-filter');

    const countyCounts = {};
    const categoryCounts = {};

    allData.forEach(item => {
        const county = item.County || 'Unknown';
        const category = item.Category || 'Unknown';
        const visited = item.Visited && item.Visited.trim().toLowerCase() === 'yes';

        if (!(county in countyCounts)) countyCounts[county] = 0;
        if (!(category in categoryCounts)) categoryCounts[category] = 0;

        if (visited) {
            countyCounts[county]++;
            categoryCounts[category]++;
        }
    });

    const counties = Object.keys(countyCounts).sort();
    const categories = Object.keys(categoryCounts).sort();

    countyFilter.innerHTML = '<option value="all">All Counties</option>';
    counties.forEach(county => {
        countyFilter.innerHTML += `<option value="${sanitize(county)}">${sanitize(county)} (${countyCounts[county]})</option>`;
    });

    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(category => {
        categoryFilter.innerHTML += `<option value="${sanitize(category)}">${sanitize(category)} (${categoryCounts[category]})</option>`;
    });

    countyFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
}



// Function to display markers on the map
function displayMarkers(data) {
    markers.clearLayers();
    const latLngs = [];
    const showLabels = document.getElementById('toggle-labels').checked;

    data.forEach(item => {
        const lat = parseFloat(item.Lat);
        const lng = parseFloat(item.Long);

        if (!isNaN(lat) && !isNaN(lng)) {
            const firstLetter = (item.Category || 'A').charAt(0).toUpperCase();
            const color = categoryColors[firstLetter] || "#333";
            const icon = L.divIcon({
                className: "custom-category-icon",
                html: `<div style="background:${color};color:#fff;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;border-radius:50%;">${firstLetter}</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const marker = L.marker([lat, lng], { icon });
            const popupContent = `<b>${item.Place}</b><br>${item.Category}<br>Visited: ${item.Date}`;
            marker.bindPopup(popupContent);

            // Only bind tooltip if checkbox is checked
            if (showLabels) {
                marker.bindTooltip(item.Place, {
                    permanent: true,
                    direction: 'right',
                    offset: [10, 0],
                    className: 'map-label'
                }).openTooltip();
            }

            markers.addLayer(marker);
            latLngs.push([lat, lng]);
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
}


document.getElementById('toggle-labels').addEventListener('change', () => {
    displayMarkers(filteredData); // or your current dataset variable
});

