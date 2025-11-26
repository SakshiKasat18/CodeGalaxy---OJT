// ==================== GALAXY VISUALIZATION ====================
let canvas, ctx;
let galaxyObjects = [];
let rotation = 0;
let animationId = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('galaxyCanvas');
    if (!canvas) return;

    ctx = canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load galaxy data
    loadGalaxy();

    // Start animation
    animate();
});

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = 300;
}

// ==================== LOAD GALAXY DATA ====================
async function loadGalaxy() {
    try {
        const response = await fetch('/api/galaxy');
        const objects = await response.json();

        galaxyObjects = objects.map(obj => ({
            x: obj.position_x,
            y: obj.position_y,
            z: obj.position_z,
            color: obj.color,
            size: obj.size,
            type: obj.type
        }));

        updateGalaxyStats();
    } catch (error) {
        console.error('Error loading galaxy:', error);
    }
}

// Make loadGalaxy available globally for task completion
window.loadGalaxy = loadGalaxy;

function updateGalaxyStats() {
    const starCount = galaxyObjects.filter(obj => obj.type === 'star').length;
    const planetCount = galaxyObjects.filter(obj => obj.type === 'planet').length;

    let statsText = '';
    if (starCount > 0) statsText += `${starCount} star${starCount !== 1 ? 's' : ''}`;
    if (planetCount > 0) {
        if (statsText) statsText += ', ';
        statsText += `${planetCount} planet${planetCount !== 1 ? 's' : ''}`;
    }
    if (!statsText) statsText = '0 stars';

    document.getElementById('galaxyCount').textContent = statsText;
}

// ==================== ANIMATION ====================
function animate() {
    rotation += 0.002;
    drawGalaxy();
    animationId = requestAnimationFrame(animate);
}

function drawGalaxy() {
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background stars
    drawBackgroundStars();

    // Draw galaxy objects
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Sort objects by z-index for proper depth
    const sortedObjects = [...galaxyObjects].sort((a, b) => a.z - b.z);

    sortedObjects.forEach(obj => {
        // Apply rotation
        const rotatedX = obj.x * Math.cos(rotation) - obj.z * Math.sin(rotation);
        const rotatedZ = obj.x * Math.sin(rotation) + obj.z * Math.cos(rotation);

        // Project 3D to 2D
        const scale = 300 / (300 + rotatedZ);
        const x2d = centerX + rotatedX * scale * 0.3;
        const y2d = centerY + obj.y * scale * 0.3;

        // Calculate size based on depth
        const size = obj.size * scale;

        // Draw object
        if (obj.type === 'star') {
            drawStar(x2d, y2d, size, obj.color);
        } else {
            drawPlanet(x2d, y2d, size, obj.color);
        }
    });
}

function drawBackgroundStars() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137.5) % canvas.width;
        const y = (i * 73.7) % canvas.height;
        const size = (i % 3) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawStar(x, y, size, color) {
    // Draw glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
    gradient.addColorStop(0, color + '80');
    gradient.addColorStop(1, color + '00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw star core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Draw star points
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - size * 2, y);
    ctx.lineTo(x + size * 2, y);
    ctx.moveTo(x, y - size * 2);
    ctx.lineTo(x, y + size * 2);
    ctx.stroke();
}

function drawPlanet(x, y, size, color) {
    // Draw planet shadow
    const shadowGradient = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size);
    shadowGradient.addColorStop(0, color);
    shadowGradient.addColorStop(1, '#000000');
    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Draw planet highlight
    const highlightGradient = ctx.createRadialGradient(x - size * 0.5, y - size * 0.5, 0, x, y, size);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Draw planet ring (for some planets)
    if (Math.random() > 0.7) {
        ctx.strokeStyle = color + '80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, size * 1.5, size * 0.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// ==================== INTERACTION ====================
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Slight rotation based on mouse position
    const deltaX = (mouseX - canvas.width / 2) / canvas.width;
    rotation += deltaX * 0.001;
});

// ==================== CLEANUP ====================
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});
