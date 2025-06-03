document.addEventListener("DOMContentLoaded", () => {
  // --- Intersection Observer for Section Animations ---
  // ... (your existing Intersection Observer code) ...
  const sections = document.querySelectorAll(".section");
  const animationOptions = { threshold: 0.25 };
  const animationObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("active-section");
      // else entry.target.classList.remove('active-section'); // Optional: replay
    });
  }, animationOptions);
  sections.forEach((section) => animationObserver.observe(section));


  // --- Flower Petal Falling Animation ---
  // ... (your existing petal animation code, including updateObstacleRects function) ...
  const petalContainer = document.body;
  const activePetals = [];
  const landedPetals = [];
  const maxActivePetals = 35;
  const maxLandedPetals = 100;
  const petalColors = [
    "#FFB6C1",
    "#FFC0CB",
    "#FFDAB9",
    "#FFE4E1",
    "#FFACC7",
    "#FF91AF",
  ];

  let obstacleElements = [];

  function updateObstacleRects() { // THIS FUNCTION IS KEY
    obstacleElements = [];
    document.querySelectorAll(".petal-obstacle").forEach((el) => {
      if (
        el.offsetParent !== null &&
        window.getComputedStyle(el).visibility !== "hidden"
      ) {
        obstacleElements.push({
          element: el,
          rect: el.getBoundingClientRect(),
        });
      }
    });
  }

  updateObstacleRects();
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateObstacleRects, 250);
  });

  function createPetal() {
    if (activePetals.length >= maxActivePetals) return;

    const petalEl = document.createElement("div");
    petalEl.classList.add("petal");

    const size = Math.random() * 6 + 8; // Slightly smaller: 8px to 14px
    petalEl.style.width = `${size}px`;
    const petalHeight = size * (Math.random() * 0.4 + 1.15);
    petalEl.style.height = `${petalHeight}px`;
    petalEl.style.backgroundColor =
      petalColors[Math.floor(Math.random() * petalColors.length)];
    petalEl.style.opacity = Math.random() * 0.3 + 0.65;

    const initialX = Math.random() * window.innerWidth;
    petalEl.style.left = `${initialX}px`;
    petalEl.style.top = `-${petalHeight * 3}px`;

    petalContainer.appendChild(petalEl);

    activePetals.push({
      element: petalEl,
      x: initialX,
      y: -petalHeight * 3,
      width: size,
      height: petalHeight,
      speedY: Math.random() * 0.4 + 0.2, // SLOWED DOWN: Initial vertical speed
      speedX: (Math.random() - 0.5) * 0.6, // SLOWED DOWN: Initial horizontal drift
      swayAmplitude: Math.random() * 10 + 5,
      swayFrequency: Math.random() * 0.02 + 0.01,
      swayPhase: Math.random() * Math.PI * 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
      landed: false,
      bounceCooldown: 0,
    });
  }

  function checkCollision(petal, obstacleRect) {
    const pLeft = petal.x;
    const pRight = petal.x + petal.width;
    const pTop = petal.y;
    const pBottom = petal.y + petal.height;
    return (
      pLeft < obstacleRect.right &&
      pRight > obstacleRect.left &&
      pTop < obstacleRect.bottom &&
      pBottom > obstacleRect.top
    );
  }

function animatePetals() {
    for (let i = activePetals.length - 1; i >= 0; i--) {
        const petal = activePetals[i];

        if (petal.landed) continue;
        if (petal.bounceCooldown > 0) petal.bounceCooldown--;

        let collisionHappenedThisFrame = false;

        // --- Collision Detection and Response Block ---
        if (petal.bounceCooldown <= 0) {
            for (const obs of obstacleElements) {
                // IMPORTANT: Use obs.rect which is updated by updateObstacleRects()
                // If performance becomes an issue with many dynamic obstacles,
                // you might get a fresh rect here: const currentRect = obs.element.getBoundingClientRect();
                // But for now, relying on updateObstacleRects() called on accordion toggle is better.
                if (checkCollision(petal, obs.rect)) {
                    collisionHappenedThisFrame = true;

                    const pCenterX = petal.x + petal.width / 2;
                    const pCenterY = petal.y + petal.height / 2;
                    const oRect = obs.rect;
                    const ejectSpeedBase = 1.5;
                    const pushOutFactor = 0.6;

                    const deltaX = pCenterX - (oRect.left + oRect.width / 2);
                    const deltaY = pCenterY - (oRect.top + oRect.height / 2);
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    let normalX = 0, normalY = 0;

                    if (distance > 0) {
                        normalX = deltaX / distance;
                        normalY = deltaY / distance;
                    } else {
                        normalX = (Math.random() - 0.5) * 2; normalY = (Math.random() - 0.5) * 2;
                        const tempDist = Math.sqrt(normalX * normalX + normalY * normalY);
                        if (tempDist > 0) { normalX /= tempDist; normalY /= tempDist; }
                        else { normalX = 1; }
                    }

                    const overlapX = (petal.width / 2 + oRect.width / 2) - Math.abs(deltaX);
                    const overlapY = (petal.height / 2 + oRect.height / 2) - Math.abs(deltaY);

                    if (overlapX < overlapY) {
                        petal.x += normalX * overlapX * pushOutFactor;
                        petal.speedX = normalX * ejectSpeedBase * (Math.random() * 0.5 + 0.75);
                        petal.speedY = normalY * ejectSpeedBase * 0.3 + petal.speedY * 0.3;
                    } else {
                        petal.y += normalY * overlapY * pushOutFactor;
                        petal.speedY = normalY * ejectSpeedBase * (Math.random() * 0.5 + 0.75);
                        petal.speedX = normalX * ejectSpeedBase * 0.3 + petal.speedX * 0.3;
                    }

                    if (normalY < -0.5 && petal.speedY > -0.3) {
                        petal.speedY = - (Math.random() * 0.5 + 0.5);
                    }

                    petal.rotationSpeed += (Math.random() - 0.5) * 4.0;
                    petal.bounceCooldown = 10;
                    break;
                }
            }
        }
        // --- End Collision Block ---

        if (!petal.landed) {
            const gravityEffect = 0.02;
            petal.speedY += gravityEffect;
            petal.speedY = Math.min(petal.speedY, 1.6);
        }

        petal.y += petal.speedY;
        petal.x += petal.speedX;
        petal.swayPhase += petal.swayFrequency;
        const swayOffset = Math.sin(petal.swayPhase) * petal.swayAmplitude;
        petal.rotation += petal.rotationSpeed;

        petal.element.style.transform = `translate(${swayOffset}px, 0px) rotate(${petal.rotation}deg)`;
        petal.element.style.left = `${petal.x}px`;
        petal.element.style.top = `${petal.y}px`;

        const petalBottomEdge = petal.y + petal.height;
        if (!collisionHappenedThisFrame && petalBottomEdge >= window.innerHeight - 8) {
            petal.landed = true;
            petal.y = window.innerHeight - petal.height - (Math.random() * 8);
            petal.element.style.left = `${petal.x + (Math.random() * 15 - 7.5)}px`;
            petal.element.style.top = `${petal.y}px`;
            petal.element.style.transform = `translateY(0px) rotate(${Math.random() * 50 - 25}deg)`;
            petal.element.style.zIndex = 9998 - landedPetals.length;
            landedPetals.push(petal);
            activePetals.splice(i, 1);
            if (landedPetals.length > maxLandedPetals) {
                const oldestLanded = landedPetals.shift();
                if (oldestLanded && oldestLanded.element) oldestLanded.element.remove();
            }
        } else if (petal.y > window.innerHeight + 70 || petal.x < -petal.width - 70 || petal.x > window.innerWidth + 70) {
            if(petal.element) petal.element.remove();
            activePetals.splice(i, 1);
        }
    }
    requestAnimationFrame(animatePetals);
}

  setInterval(createPetal, 500);
  animatePetals();


  // --- NEW: FAQ Accordion Logic ---
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const questionButton = item.querySelector(".faq-question");
    if (questionButton) {
      questionButton.addEventListener("click", () => {
        const isOpening = !item.classList.contains("active");
        
        // Optional: Close other open items for a classic accordion behavior
        if (isOpening) {
          faqItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('active')) {
              otherItem.classList.remove('active');
              otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            }
          });
        }

        item.classList.toggle("active");
        questionButton.setAttribute('aria-expanded', item.classList.contains("active").toString());

        // Update obstacle rects for petal collision after the accordion animation might have started
        // A small delay can help ensure new dimensions are registered if animations affect layout immediately
        setTimeout(updateObstacleRects, 50); // Call after a brief delay
      });
    }
  });
});