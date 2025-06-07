document.addEventListener("DOMContentLoaded", () => {
  // --- Intersection Observer for Section Animations ---
  const sections = document.querySelectorAll(".section");
  const animationOptions = { threshold: 0.25 };
  const animationObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("active-section");
    });
  }, animationOptions);
  sections.forEach((section) => animationObserver.observe(section));


  // --- Flower Petal Animation ---
  const petalContainer = document.body;
  const activePetals = [];
  const landedPetals = [];
  const maxActivePetals = 35;
  const maxLandedPetals = 100;
  const petalColors = ["#FFB6C1", "#FFC0CB", "#FFDAB9", "#FFE4E1", "#FFACC7", "#FF91AF"];
  let obstacleElements = [];

  function updateObstacleRects() {
    obstacleElements = [];
    document.querySelectorAll(".petal-obstacle").forEach((el) => {
      if (el.offsetParent !== null && window.getComputedStyle(el).visibility !== "hidden") {
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

    const size = Math.random() * 6 + 8;
    petalEl.style.width = `${size}px`;
    const petalHeight = size * (Math.random() * 0.4 + 1.15);
    petalEl.style.height = `${petalHeight}px`;
    petalEl.style.backgroundColor = petalColors[Math.floor(Math.random() * petalColors.length)];
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
      speedY: Math.random() * 0.4 + 0.2,
      speedX: (Math.random() - 0.5) * 0.6,
      swayAmplitude: Math.random() * 10 + 5,
      swayFrequency: Math.random() * 0.02 + 0.01,
      swayPhase: Math.random() * Math.PI * 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
      landed: false,
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

  // === ROBUST COLLISION & PHYSICS LOGIC ===
  function animatePetals() {
    for (let i = activePetals.length - 1; i >= 0; i--) {
        const petal = activePetals[i];

        if (petal.landed) continue;

        let onObstacleTop = false;

        // --- Collision Detection and Response ---
        for (const obs of obstacleElements) {
            if (checkCollision(petal, obs.rect)) {
                // Determine collision direction
                const pCenterX = petal.x + petal.width / 2;
                const pCenterY = petal.y + petal.height / 2;
                const oRect = obs.rect;

                const deltaX = pCenterX - (oRect.left + oRect.width / 2);
                const deltaY = pCenterY - (oRect.top + oRect.height / 2);
                
                const overlapX = (petal.width / 2 + oRect.width / 2) - Math.abs(deltaX);
                const overlapY = (petal.height / 2 + oRect.height / 2) - Math.abs(deltaY);

                // Check if it's a vertical or horizontal collision
                if (overlapY < overlapX) {
                    // Top or bottom collision
                    if (deltaY < 0 && petal.speedY > 0) { // Coming from top, landing
                        onObstacleTop = true;
                        petal.y = oRect.top - petal.height;
                        petal.speedY = 0; // Stop falling

                        // Apply slide logic
                        const slideForce = 0.1;
                        petal.speedX += Math.sign(deltaX || (Math.random() - 0.5)) * slideForce;
                    } else { // Coming from bottom, bounce down
                        petal.y = oRect.bottom;
                        petal.speedY *= -0.4;
                    }
                } else {
                    // Side collision, bounce horizontally
                    petal.speedX *= -0.6;
                    petal.x += Math.sign(deltaX) * overlapX; // Push it out
                }
                petal.rotationSpeed += (Math.random() - 0.5) * 2;
                break; // Handle one collision per frame
            }
        }

        // --- Standard Gravity & Physics Update ---
        if (!onObstacleTop) {
            const gravityEffect = 0.02;
            petal.speedY += gravityEffect;
            petal.speedY = Math.min(petal.speedY, 1.6);
        }
        
        // Apply friction
        petal.speedX *= 0.98;

        petal.y += petal.speedY;
        petal.x += petal.speedX;
        
        petal.swayPhase += petal.swayFrequency;
        const swayOffset = Math.sin(petal.swayPhase) * petal.swayAmplitude;
        petal.rotation += petal.rotationSpeed;

        petal.element.style.transform = `translate(${swayOffset}px, 0px) rotate(${petal.rotation}deg)`;
        petal.element.style.left = `${petal.x}px`;
        petal.element.style.top = `${petal.y}px`;


        // --- Landing & Cleanup Logic ---
        const petalBottomEdge = petal.y + petal.height;
        if (!onObstacleTop && petalBottomEdge >= window.innerHeight - 8) {
            petal.landed = true;
            petal.y = window.innerHeight - petal.height - (Math.random() * 8);
            petal.element.style.top = `${petal.y}px`;
            petal.element.style.transform = `translateY(0px) rotate(${Math.random() * 50 - 25}deg)`;
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


  // --- FAQ Accordion Logic ---
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const questionButton = item.querySelector(".faq-question");
    if (questionButton) {
      questionButton.addEventListener("click", () => {
        const isOpening = !item.classList.contains("active");
        if (isOpening) {
          faqItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('active')) {
              otherItem.classList.remove('active');
            }
          });
        }
        item.classList.toggle("active");
        setTimeout(updateObstacleRects, 300);
      });
    }
  });


  // --- PETAL INTERACTION (CLICK/TOUCH) --- THIS SHOULD NOW WORK CORRECTLY
  function handlePetalInteraction(e) {
      const targetEl = e.target;
      if (!targetEl.classList.contains('petal')) return;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      let foundPetal = null;
      let wasLanded = false;
      let foundIndex = -1;

      foundIndex = activePetals.findIndex(p => p.element === targetEl);
      if (foundIndex !== -1) {
          foundPetal = activePetals[foundIndex];
      } else {
          foundIndex = landedPetals.findIndex(p => p.element === targetEl);
          if (foundIndex !== -1) {
              foundPetal = landedPetals[foundIndex];
              wasLanded = true;
          }
      }

      if (foundPetal) {
          e.preventDefault();
          const force = 4 + Math.random() * 4;
          const dx = (foundPetal.x + foundPetal.width / 2) - clientX;
          const dy = (foundPetal.y + foundPetal.height / 2) - clientY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          foundPetal.speedX = (dx / dist) * force;
          foundPetal.speedY = (dy / dist) * force;
          foundPetal.rotationSpeed += (Math.random() - 0.5) * 15;

          if (wasLanded) {
              foundPetal.landed = false;
              activePetals.push(foundPetal);
              landedPetals.splice(foundIndex, 1);
          }
      }
  }
  document.body.addEventListener('mousedown', handlePetalInteraction);
  document.body.addEventListener('touchstart', handlePetalInteraction, { passive: false });

});