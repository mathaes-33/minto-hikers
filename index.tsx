
import { GoogleGenAI, Type } from "@google/genai";

// --- API KEY HANDLING ---
// The API key is expected to be available as process.env.API_KEY.
// This is typically handled by the build/deployment environment (e.g., Netlify).
const API_KEY = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
  ? process.env.API_KEY 
  : undefined;

// --- CRITICAL: API KEY CHECK ---
// Stop execution immediately if the API key is not configured.
if (!API_KEY) {
  // Clear the body and show a user-friendly error message.
  document.body.innerHTML = `
    <div style="font-family: sans-serif; text-align: center; padding: 2rem; background-color: #ffebee; color: #c62828; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box;">
      <h1 style="margin-bottom: 1rem;">Configuration Error</h1>
      <p style="max-width: 600px; line-height: 1.6;">The <strong>API_KEY</strong> is not set. The application cannot function without it.</p>
      <p style="max-width: 600px; line-height: 1.6;">Please ensure the <code>API_KEY</code> environment variable is configured correctly in your hosting provider's settings (e.g., Netlify, Vercel).</p>
    </div>
  `;
  // Stop further script execution.
  throw new Error("API_KEY environment variable is not set or not accessible in the client-side build.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });


// --- TYPE DEFINITIONS ---
interface Hike {
  title: string;
  date: string;
  distance: string;
  difficulty: string;
  description: string;
}

interface AITrailResponse {
  trailName: string;
  difficulty: string;
  distance: string;
  description: string;
  whyItMatches: string;
}


// --- DATA ---
const hikesData: Hike[] = [
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


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Main function to initialize all interactive parts of the application.
 */
function initializeApp() {
  const revealObserver = initializeScrollReveal();
  initializeHeaderAndNav();
  initializeSmoothScroll();
  populateHikesGrid(revealObserver);
  initializeAITrailFinder();
  initializeHikeCalculator();
  initializeContactForm();
}


// --- CORE UI MODULES ---

/**
 * Sets up the IntersectionObserver to reveal elements on scroll.
 * @returns The configured IntersectionObserver instance.
 */
function initializeScrollReveal(): IntersectionObserver {
  const revealElements = document.querySelectorAll<HTMLElement>('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => revealObserver.observe(el));
  return revealObserver;
}

/**
 * Initializes header scroll effects and mobile menu functionality.
 */
function initializeHeaderAndNav() {
  const header = document.getElementById('header');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuCloseBtn = document.getElementById('mobile-menu-close-btn');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  if (mobileMenuBtn && mobileMenu && mobileMenuCloseBtn) {
    mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.add('open'));
    mobileMenuCloseBtn.addEventListener('click', () => mobileMenu.classList.remove('open'));
  }
}

/**
 * Sets up smooth scrolling for all anchor links with the .nav-link class.
 */
function initializeSmoothScroll() {
  const mobileMenu = document.getElementById('mobile-menu');
  document.querySelectorAll('a.nav-link').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      // Handle internal links for smooth scrolling
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
          mobileMenu?.classList.remove('open'); // Close mobile menu on nav
        }
      } else if (href === '#') { // Special case for logo/top link
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

/**
 * Populates the upcoming hikes grid from the hikesData array.
 * @param observer The IntersectionObserver to apply to newly created cards.
 */
function populateHikesGrid(observer: IntersectionObserver) {
  const hikesGrid = document.getElementById('hikes-grid');
  if (!hikesGrid) return;
  
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
    observer.observe(hikeCard); // Make the new card reveal on scroll
  });
}


// --- AI TRAIL FINDER MODULE ---

/**
 * Initializes the AI Trail Finder form.
 */
function initializeAITrailFinder() {
  const form = document.getElementById('trail-finder-form') as HTMLFormElement;
  const button = document.getElementById('trail-finder-btn') as HTMLButtonElement;
  const resultEl = document.getElementById('trail-finder-result') as HTMLElement;

  if (form && button && resultEl) {
    form.addEventListener('submit', (e) => handleAITrailFinderSubmit(e, form, button, resultEl));
  }
}

/**
 * Handles the submission of the AI Trail Finder form, including the Gemini API call.
 */
async function handleAITrailFinderSubmit(e: SubmitEvent, form: HTMLFormElement, button: HTMLButtonElement, resultEl: HTMLElement) {
    e.preventDefault();

    const selectedDifficulties = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="difficulty"]:checked')).map(cb => cb.value);
    const selectedVibes = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="vibe"]:checked')).map(cb => cb.value);

    if (selectedDifficulties.length === 0 && selectedVibes.length === 0) {
        resultEl.innerHTML = `
            <h3>Please select some options!</h3>
            <p class="ai-hike-description">Choose a difficulty or vibe to get a personalized trail suggestion.</p>
        `;
        resultEl.classList.add('visible');
        return;
    }

    const btnText = button.querySelector<HTMLElement>('.btn-text');
    button.disabled = true;
    button.classList.add('loading');
    if(btnText) btnText.textContent = 'Generating...';
    resultEl.classList.remove('visible');

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
        
        const jsonResponse: AITrailResponse = JSON.parse(response.text);
        resultEl.innerHTML = `
            <h3>Your AI-Generated Trail:</h3>
            <div class="ai-hike-info">
                <div class="info-item"><span class="material-symbols-outlined">signpost</span> ${jsonResponse.trailName}</div>
                <div class="info-item"><span class="material-symbols-outlined">straighten</span> ${jsonResponse.distance}</div>
                <div class="info-item"><span class="material-symbols-outlined">trending_up</span> ${jsonResponse.difficulty}</div>
            </div>
            <p class="ai-hike-description">${jsonResponse.description}</p>
            <p class="ai-hike-description"><strong>Why it's a great match:</strong> ${jsonResponse.whyItMatches}</p>
        `;
    } catch (error) {
        console.error("AI Trail Finder Error:", error);
        resultEl.innerHTML = `
            <h3>Oops! Something went wrong.</h3>
            <p class="ai-hike-description">We couldn't generate a trail for you at the moment. This might be due to a network issue or a problem with the AI service. Please try again in a few moments.</p>
        `;
    } finally {
        button.disabled = false;
        button.classList.remove('loading');
        if(btnText) btnText.textContent = 'Generate My AI Trail';
        resultEl.classList.add('visible');
    }
}


// --- HIKE CALCULATOR MODULE ---

/**
 * Initializes the Hike Time & Difficulty Calculator form.
 */
function initializeHikeCalculator() {
  const form = document.getElementById('calculator-form') as HTMLFormElement;
  const resultEl = document.getElementById('calculator-result') as HTMLElement;

  if (form && resultEl) {
      form.addEventListener('submit', (e) => handleCalculatorSubmit(e, form, resultEl));
  }
}

/**
 * Handles the submission of the calculator form and displays the result.
 */
function handleCalculatorSubmit(e: SubmitEvent, form: HTMLFormElement, resultEl: HTMLElement) {
    e.preventDefault();
    
    const distanceInput = form.querySelector('#hike-distance') as HTMLInputElement;
    const elevationInput = form.querySelector('#hike-elevation') as HTMLInputElement;
    const paceSelect = form.querySelector('#hike-pace') as HTMLSelectElement;

    const distance = parseFloat(distanceInput.value);
    const elevation = parseFloat(elevationInput.value) || 0;
    const pace = paceSelect.value;

    if (isNaN(distance) || distance <= 0) {
        resultEl.innerHTML = `<p class="error-message">Please enter a valid positive number for distance.</p>`;
        resultEl.classList.add('visible');
        return;
    }

    const paceSpeed = pace === 'slow' ? 3 : pace === 'fast' ? 5 : 4; // km/h
    
    const timeForDistance = (distance / paceSpeed) * 60; // time in minutes
    const timeForElevation = (elevation / 100) * 10; // add 10 min per 100m ascent
    const totalMinutes = Math.round(timeForDistance + timeForElevation);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const formattedTime = `${hours}h ${minutes}m`;

    const score = (distance / 4) + (elevation / 300);
    const difficulty = score < 5 ? 'Easy' : score <= 10 ? 'Moderate' : 'Challenging';
    const difficultyIcon = score < 5 ? 'directions_walk' : score <= 10 ? 'hiking' : 'filter_hdr';
    
    resultEl.innerHTML = `
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
    resultEl.classList.add('visible');
}


// --- CONTACT FORM MODULE ---

/**
 * Initializes the Netlify contact form.
 */
function initializeContactForm() {
  const form = document.getElementById('contact-form') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', (e) => handleContactFormSubmit(e, form));
  }
}

/**
 * Handles the submission of the contact form via fetch for an AJAX experience.
 */
function handleContactFormSubmit(e: SubmitEvent, form: HTMLFormElement) {
    e.preventDefault();

    const formData = new FormData(form);
    const formBody = new URLSearchParams(formData as any).toString();
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const formMessage = document.getElementById('formMessage') as HTMLElement;
    
    if(!formMessage) return;
    if(submitButton) submitButton.disabled = true;

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody
    })
    .then(() => {
      form.reset();
      formMessage.className = 'success';
      formMessage.textContent = 'Thanks for your message! We\'ll get back to you soon.';
    })
    .catch(() => {
      formMessage.className = 'error';
      formMessage.textContent = 'Oops! Something went wrong. We couldn\'t send your message.';
    })
    .finally(() => {
      formMessage.style.display = 'block';
      if(submitButton) submitButton.disabled = false;
    });
}
