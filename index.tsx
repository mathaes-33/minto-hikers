import { GoogleGenAI, Type } from "@google/genai";

// Quick check for API key
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

document.addEventListener('DOMContentLoaded', function () {

  // --- REVEAL ON SCROLL ---
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

  // --- HEADER & NAVIGATION ---
  const header = document.getElementById('header');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuCloseBtn = document.getElementById('mobile-menu-close-btn');

  // Header scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // Mobile Menu Toggle
  if (mobileMenuBtn && mobileMenu && mobileMenuCloseBtn) {
    mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.add('open'));
    mobileMenuCloseBtn.addEventListener('click', () => mobileMenu.classList.remove('open'));
  }
  
  // Smooth scrolling for all nav links
  document.querySelectorAll('a.nav-link').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      // Ensure it's an internal link
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
          mobileMenu?.classList.remove('open');
        }
      } else if (href === '#') { // Special case for logo scroll to top
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
  
  // --- UPCOMING HIKES ---
  const hikesData = [
    // ... (hike data remains the same)
      {
          title: "White's Junction Trail Loop",
          date: "Saturday, July 20, 2024",
          distance: "5 km",
          difficulty: "Easy",
          description: "A gentle loop perfect for families and beginners. Enjoy well-maintained paths through a mix of forest and open fields.",
      },
      {
          title: "Clifford Rotary Park Trail",
          date: "Sunday, July 28, 2024",
          distance: "3.5 km",
          difficulty: "Easy",
          description: "A beautiful, accessible walk along the river. Great for a quick morning hike and bird watching.",
      },
      {
          title: "Harriston Greenway Full Circuit",
          date: "Saturday, August 10, 2024",
          distance: "8 km",
          difficulty: "Moderate",
          description: "Explore the full length of the Harriston Greenway. This trail offers varied scenery and a slightly longer distance for a good workout.",
      },
      {
          title: "Minto-Saugeen Exploration",
          date: "Saturday, August 24, 2024",
          distance: "12 km",
          difficulty: "Challenging",
          description: "A more demanding hike for experienced members, connecting local trails for a longer, more rugged adventure.",
      },
      {
          title: "Fall Colours at White's Junction",
          date: "Saturday, October 5, 2024",
          distance: "5 km",
          difficulty: "Easy",
          description: "Revisit this popular trail to experience the spectacular autumn colours. A perfect photo opportunity!",
      },
      {
          title: "Historic Palmerston Railway Hike",
          date: "Sunday, October 20, 2024",
          distance: "7 km",
          difficulty: "Moderate",
          description: "Walk along the old railway lines near Palmerston, discovering local history and enjoying the crisp autumn air.",
      }
  ];

  const hikesGrid = document.getElementById('hikes-grid');
  if (hikesGrid) {
    hikesData.forEach((hike, index) => {
      const hikeCard = document.createElement('li');
      hikeCard.className = `hike-card reveal delay-${(index % 3) + 1}`;
      hikeCard.innerHTML = `
        <h3>${hike.title}</h3>
        <div class="info-item date">
            <span class="material-symbols-outlined">calendar_month</span>
            <span>${hike.date}</span>
        </div>
        <div class="info-item">
            <span class="material-symbols-outlined">straighten</span>
            <span>${hike.distance}</span>
        </div>
        <div class="info-item">
            <span class="material-symbols-outlined">trending_up</span>
            <span>${hike.difficulty}</span>
        </div>
        <p class="description">${hike.description}</p>
      `;
      hikesGrid.appendChild(hikeCard);
      revealObserver.observe(hikeCard);
    });
  }

  // --- GEMINI AI TRAIL FINDER ---
  const trailFinderForm = document.getElementById('trail-finder-form') as HTMLFormElement;
  const trailFinderBtn = document.getElementById('trail-finder-btn') as HTMLButtonElement;
  const trailFinderResult = document.getElementById('trail-finder-result');

  if (trailFinderForm && trailFinderBtn && trailFinderResult) {
    trailFinderForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const selectedDifficulties = Array.from(trailFinderForm.querySelectorAll<HTMLInputElement>('input[name="difficulty"]:checked')).map(cb => cb.value);
        const selectedVibes = Array.from(trailFinderForm.querySelectorAll<HTMLInputElement>('input[name="vibe"]:checked')).map(cb => cb.value);

        if (selectedDifficulties.length === 0 && selectedVibes.length === 0) {
            trailFinderResult.innerHTML = `
                <h3>Please select some options!</h3>
                <p class="ai-hike-description">Choose a difficulty or vibe to get a personalized trail suggestion.</p>
            `;
            trailFinderResult.classList.add('visible');
            return;
        }

        // --- Set loading state ---
        trailFinderBtn.disabled = true;
        trailFinderBtn.classList.add('loading');
        const btnText = trailFinderBtn.querySelector('.btn-text') as HTMLElement;
        if(btnText) btnText.textContent = 'Generating...';
        trailFinderResult.innerHTML = '';
        trailFinderResult.classList.remove('visible');

        try {
            const difficultiesText = selectedDifficulties.join(', ') || 'any';
            const vibesText = selectedVibes.join(', ') || 'any';

            const prompt = `You are a creative trail guide for the Minto, Ontario area in Canada. A hiker is looking for a trail with the following characteristics: difficulty of ${difficultiesText}, and vibes of ${vibesText}. Generate a single, plausible-sounding but fictional trail suggestion. The trail should feel like it belongs in the Minto/Wellington County region. Be creative and encouraging in your description. Provide your response in JSON format according to the provided schema.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            trailName: { type: Type.STRING, description: "A creative and plausible name for the trail." },
                            difficulty: { type: Type.STRING, description: "The difficulty level (e.g., Easy, Moderate, Challenging)." },
                            distance: { type: Type.STRING, description: "The estimated length of the trail (e.g., '5 km loop')." },
                            description: { type: Type.STRING, description: "A one-paragraph, engaging description of the trail experience." },
                            whyItMatches: { type: Type.STRING, description: "A short sentence explaining why this trail is a good match for the user's preferences." }
                        },
                        required: ["trailName", "difficulty", "distance", "description", "whyItMatches"]
                    },
                },
            });

            // Defensive JSON parsing
            try {
                const jsonResponse = JSON.parse(response.text);
                trailFinderResult.innerHTML = `
                    <h3>Your AI-Generated Trail:</h3>
                    <div class="ai-hike-info">
                        <div class="info-item"><span class="material-symbols-outlined">signpost</span> ${jsonResponse.trailName}</div>
                        <div class="info-item"><span class="material-symbols-outlined">straighten</span> ${jsonResponse.distance}</div>
                        <div class="info-item"><span class="material-symbols-outlined">trending_up</span> ${jsonResponse.difficulty}</div>
                    </div>
                    <p class="ai-hike-description">${jsonResponse.description}</p>
                    <p class="ai-hike-description"><strong>Why it's a great match:</strong> ${jsonResponse.whyItMatches}</p>
                `;
            } catch(jsonError) {
                console.error("JSON Parsing Error:", jsonError, "Raw text:", response.text);
                throw new Error("Failed to parse AI response."); // Trigger the generic error display
            }

        } catch (error) {
            console.error("Gemini API Error:", error);
            trailFinderResult.innerHTML = `
                <h3>Oops! Something went wrong.</h3>
                <p class="ai-hike-description">We couldn't generate a trail for you at the moment. This might be due to a network issue or a problem with the AI service. Please try again in a few moments.</p>
            `;
        } finally {
            // --- Reset button state ---
            trailFinderBtn.disabled = false;
            trailFinderBtn.classList.remove('loading');
            if(btnText) btnText.textContent = 'Generate My AI Trail';
            trailFinderResult.classList.add('visible');
        }
    });
  }
      
  // --- HIKE CALCULATOR ---
  const calculatorForm = document.getElementById('calculator-form');
  const calculatorResultEl = document.getElementById('calculator-result');

  if (calculatorForm) {
      calculatorForm.addEventListener('submit', function(e) {
          e.preventDefault();

          const distanceInput = document.getElementById('hike-distance') as HTMLInputElement;
          const elevationInput = document.getElementById('hike-elevation') as HTMLInputElement;
          const paceSelect = document.getElementById('hike-pace') as HTMLSelectElement;

          const distance = parseFloat(distanceInput.value);
          const elevation = parseFloat(elevationInput.value) || 0;
          const pace = paceSelect.value;

          if (isNaN(distance) || distance <= 0) {
              if (calculatorResultEl) {
                calculatorResultEl.innerHTML = `<p class="error-message">Please enter a valid positive number for distance.</p>`;
                calculatorResultEl.classList.add('visible');
              }
              return;
          }

          let paceSpeed; // km/h
          switch (pace) {
              case 'slow': paceSpeed = 3; break;
              case 'fast': paceSpeed = 5; break;
              default: paceSpeed = 4;
          }
          
          // Estimate time based on a modified Naismith's Rule
          const timeForDistance = (distance / paceSpeed) * 60; // time in minutes for flat distance
          const timeForElevation = (elevation / 100) * 10; // add 10 minutes for every 100m of ascent
          const totalMinutes = Math.round(timeForDistance + timeForElevation);
          
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          const formattedTime = `${hours}h ${minutes}m`;

          // Heuristic score for difficulty. These values are chosen to provide a reasonable scale.
          const score = (distance / 4) + (elevation / 300);
          let difficulty;
          let difficultyIcon;

          if (score < 5) {
              difficulty = 'Easy';
              difficultyIcon = 'directions_walk';
          } else if (score >= 5 && score <= 10) {
              difficulty = 'Moderate';
              difficultyIcon = 'hiking';
          } else {
              difficulty = 'Challenging';
              difficultyIcon = 'filter_hdr';
          }
          
          if (calculatorResultEl) {
            calculatorResultEl.innerHTML = `
                <h3>Your Estimated Hike</h3>
                <div class="calc-hike-info">
                    <div class="info-item">
                        <span class="material-symbols-outlined">schedule</span>
                        <div><strong>Time:</strong> ${formattedTime}</div>
                    </div>
                    <div class="info-item">
                        <span class="material-symbols-outlined">${difficultyIcon}</span>
                        <div><strong>Difficulty:</strong> ${difficulty}</div>
                    </div>
                </div>
                <p class="calc-hike-description">This is an estimate. Actual time may vary based on trail conditions, weather, and personal fitness. Always plan accordingly and hike safely!</p>
            `;
            calculatorResultEl.classList.add('visible');
          }
      });
  }

  // --- CONTACT FORM (NETLIFY) ---
  const contactForm = document.getElementById('contact-form') as HTMLFormElement;
  const formMessage = document.getElementById('formMessage') as HTMLElement;

  if (contactForm && formMessage) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const formBody = new URLSearchParams(formData as any).toString();
      const submitButton = contactForm.querySelector('button[type="submit"]') as HTMLButtonElement;
      
      // Disable button and show loading state if desired
      if(submitButton) submitButton.disabled = true;

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody
      })
      .then(() => {
        contactForm.reset();
        formMessage.className = 'success';
        formMessage.textContent = 'Thanks for your message! We\'ll get back to you soon.';
        formMessage.style.display = 'block';
      })
      .catch(() => {
        formMessage.className = 'error';
        formMessage.textContent = 'Oops! Something went wrong. We couldn\'t send your message.';
        formMessage.style.display = 'block';
      })
      .finally(() => {
        if(submitButton) submitButton.disabled = false;
      })
    });
  }

});