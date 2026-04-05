const HEART_COLORS = [
    '#ff4d6d',
    '#ff758f',
    '#ff8fa3',
    '#c9184a',
    '#ff006e',
    '#ff4d94',
    '#2ceef0',
    '#ff85a1',
];

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function createHeart() {
    const container = document.getElementById('hearts-bg');
    if (!container) return;

    const heart = document.createElement('div');
    heart.classList.add('floating-heart');

    const size = randomBetween(12, 42);
    const left = randomBetween(0, 100);
    const duration = randomBetween(7, 16);
    const delay = randomBetween(0, 3);
    const opacity = randomBetween(0.12, 0.45);
    const drift = randomBetween(-40, 40);
    const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
    const rotation = randomBetween(-30, 30);

    heart.style.setProperty('--heart-drift', `${drift}px`);
    heart.style.setProperty('--heart-rotation', `${rotation}deg`);
    heart.style.setProperty('--heart-opacity', opacity);

    heart.style.left = `${left}%`;
    heart.style.fontSize = `${size}px`;
    heart.style.color = color;
    heart.style.animationDuration = `${duration}s`;
    heart.style.animationDelay = `${delay}s`;

    heart.textContent = '\u2665';

    container.appendChild(heart);

    const totalLifetime = (duration + delay) * 1000;
    setTimeout(() => heart.remove(), totalLifetime + 200);
}

export function initHearts() {
    const staggerCount = 30;
    for (let i = 0; i < staggerCount; i++) {
        const staggerDelay = randomBetween(0, 8000);
        setTimeout(createHeart, staggerDelay);
    }

    setInterval(createHeart, 600);
}
