const HEART_COLORS = [
    '#ff4d6d',
    '#ff758f',
    '#ff85a1',
    '#ffa0b4',
    '#ffb3c1',
    '#c9184a',
    '#ff0054',
    '#ff477e',
    '#ff6b9d',
    '#ff90bb',
    '#ffccd5',
    '#ffffff',
];

const HEART_COUNT = 60;

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function createHeart(container) {
    const heart = document.createElement('span');
    heart.textContent = '\u2665';

    const size          = randomBetween(10, 42);
    const left          = randomBetween(0, 100);
    const duration      = randomBetween(9, 26);
    const delay         = randomBetween(0, 28);
    const color         = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
    const opacity       = randomBetween(0.25, 0.75);
    const spin          = `${randomBetween(-540, 540)}deg`;
    const endScale      = randomBetween(0.3, 1.1);

    heart.className = 'heart';
    heart.style.cssText = [
        `left: ${left}%`,
        `font-size: ${size}px`,
        `color: ${color}`,
        `animation-duration: ${duration}s`,
        `animation-delay: ${delay}s`,
        `--heart-opacity: ${opacity}`,
        `--heart-spin: ${spin}`,
        `--heart-end-scale: ${endScale}`,
    ].join(';');

    container.appendChild(heart);
}

function initHearts() {
    const container = document.createElement('div');
    container.id = 'hearts-container';
    document.body.prepend(container);

    for (let i = 0; i < HEART_COUNT; i++) {
        createHeart(container);
    }
}

export { initHearts };
