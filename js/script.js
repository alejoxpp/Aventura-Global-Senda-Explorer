const mainBubble = document.querySelector("#mainParallax");
const secondaryBubble = document.querySelector("#secondaryParallax");
const dropBubble = document.querySelector("#dropParallax");

const PARALLAX_INTENSITY = 0.5;
const PARALLAX_SMOOTHNESS = 0.025;

let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

window.addEventListener("pointermove", (event) => {
  const normalizedX = event.clientX / window.innerWidth - 0.5;
  const normalizedY = event.clientY / window.innerHeight - 0.5;

  targetX = normalizedX * 180 * PARALLAX_INTENSITY;
  targetY = normalizedY * 130 * PARALLAX_INTENSITY;
});

document.documentElement.addEventListener("mouseleave", () => {
  targetX = 0;
  targetY = 0;
});

function render() {
  currentX += (targetX - currentX) * PARALLAX_SMOOTHNESS;
  currentY += (targetY - currentY) * PARALLAX_SMOOTHNESS;

  if (mainBubble) {
    mainBubble.style.transform = `translate(${currentX}px, ${currentY}px)`;
  }

  if (secondaryBubble) {
    secondaryBubble.style.transform = `translate(${currentX * 1.55}px, ${currentY * 1.55}px)`;
  }

  if (dropBubble) {
    dropBubble.style.transform = `translate(${currentX * 2.15}px, ${currentY * 2.15}px)`;
  }

  requestAnimationFrame(render);
}

if (window.matchMedia("(pointer: fine)").matches) {
  render();
}
