/* ==========================================================================
   STACKLY TELECOM - MAIN INTERACTIVE FRONTEND & ANIMATIONS
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initHeroBackgroundSlider();
  initNavbarScroll();
  initMobileMenu();
  initFAQAccordion();
  initReviewsSlider();
  initPlansTabs();
  initGSAPAnimations();
  updateAuthHeaderState();
});

// --- Hero Section 5 Background Images Slider ---
function initHeroBackgroundSlider() {
  const slides = document.querySelectorAll(".hero-bg-slide");
  const dots = document.querySelectorAll("#heroSliderDots .dot");
  const prevBtn = document.getElementById("heroSliderPrev");
  const nextBtn = document.getElementById("heroSliderNext");

  if (!slides.length) return;

  let currentSlide = 0;
  let slideInterval;

  const goToSlide = (index) => {
    slides[currentSlide].classList.remove("active");
    if (dots[currentSlide]) dots[currentSlide].classList.remove("active");

    currentSlide = (index + slides.length) % slides.length;

    slides[currentSlide].classList.add("active");
    if (dots[currentSlide]) dots[currentSlide].classList.add("active");
  };

  const nextSlide = () => goToSlide(currentSlide + 1);
  const prevSlide = () => goToSlide(currentSlide - 1);

  const startAutoSlide = () => {
    stopAutoSlide();
    slideInterval = setInterval(nextSlide, 4500);
  };

  const stopAutoSlide = () => {
    if (slideInterval) clearInterval(slideInterval);
  };

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextSlide();
      startAutoSlide();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevSlide();
      startAutoSlide();
    });
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener("click", () => {
      goToSlide(idx);
      startAutoSlide();
    });
  });

  // Pause auto-slide when hovering over slider controls
  const controls = document.querySelector(".hero-slider-controls");
  if (controls) {
    controls.addEventListener("mouseenter", stopAutoSlide);
    controls.addEventListener("mouseleave", startAutoSlide);
  }

  startAutoSlide();
}

// --- Navbar Scrolled State ---
function initNavbarScroll() {
  const navbar = document.querySelector(".navbar-header");
  if (!navbar) return;

  const checkScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  };

  window.addEventListener("scroll", checkScroll);
  checkScroll(); // Initial check
}

// --- Mobile Hamburger Menu ---
function initMobileMenu() {
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");

  if (!hamburger || !navMenu) return;

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
  });

  // Close menu when links are clicked
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      navMenu.classList.remove("active");
    });
  });
}

// --- Check Login Session to display Dashboard Link on Navbar ---
function updateAuthHeaderState() {
  // Disabled as per user request: Navbar always displays the "Login" button.
}

// --- FAQ Accordion ---
function initFAQAccordion() {
  const faqHeaders = document.querySelectorAll(".faq-header");
  faqHeaders.forEach(header => {
    header.addEventListener("click", () => {
      const item = header.parentElement;
      const body = item.querySelector(".faq-body");
      const content = item.querySelector(".faq-content");
      const isActive = item.classList.contains("active");

      // Close all other FAQs
      document.querySelectorAll(".faq-item").forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove("active");
          otherItem.querySelector(".faq-body").style.maxHeight = "0px";
        }
      });

      if (!isActive) {
        item.classList.add("active");
        // Animate open using max-height of content scrollHeight
        body.style.maxHeight = content.scrollHeight + "px";
        // Simple GSAP micro-animation on icon
        gsap.to(header.querySelector(".faq-icon-box i"), {
          duration: 0.3,
          ease: "power2.out"
        });
      } else {
        item.classList.remove("active");
        body.style.maxHeight = "0px";
      }
    });
  });
}

// --- Customer Testimonials Carousel ---
function initReviewsSlider() {
  const track = document.querySelector(".reviews-track");
  const slides = document.querySelectorAll(".review-slide");
  const prevBtn = document.querySelector(".carousel-nav-btn.prev");
  const nextBtn = document.querySelector(".carousel-nav-btn.next");
  const dotsContainer = document.querySelector(".carousel-dots");

  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  const slideCount = slides.length;

  // Create dot indicators
  dotsContainer.innerHTML = "";
  for (let i = 0; i < slideCount; i++) {
    const dot = document.createElement("div");
    dot.classList.add("carousel-dot");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => {
      goToSlide(i);
    });
    dotsContainer.appendChild(dot);
  }

  const dots = document.querySelectorAll(".carousel-dot");

  const updateDots = () => {
    dots.forEach((dot, idx) => {
      if (idx === currentIndex) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
  };

  const goToSlide = (index) => {
    if (index < 0) index = slideCount - 1;
    if (index >= slideCount) index = 0;
    currentIndex = index;
    // Translate the track container
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    updateDots();
  };

  if (prevBtn) prevBtn.addEventListener("click", () => goToSlide(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => goToSlide(currentIndex + 1));

  // Autoplay review carousel every 7 seconds
  setInterval(() => {
    goToSlide(currentIndex + 1);
  }, 7000);
}

// --- Plan List Filtering (Tabs) ---
function initPlansTabs() {
  const tabBtns = document.querySelectorAll(".plans-tabs .tab-btn");
  const planCards = document.querySelectorAll(".plans-grid .plan-card");

  if (tabBtns.length === 0 || planCards.length === 0) return;

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Prevent double trigger on already active tab
      if (btn.classList.contains("active")) return;

      // Remove active class from all tabs
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filterValue = btn.getAttribute("data-filter");

      // Kill any active card animations to prevent rendering clashes
      gsap.killTweensOf(".plans-grid .plan-card");

      // GSAP animate plans exit, then toggle visibility, then slide in
      gsap.to(".plans-grid .plan-card", {
        opacity: 0,
        y: 20,
        duration: 0.2,
        stagger: 0.03,
        onComplete: () => {
          planCards.forEach(card => {
            const cardType = card.getAttribute("data-type");
            if (filterValue === "all" || cardType === filterValue) {
              card.style.display = "block";
            } else {
              card.style.display = "none";
            }
          });

          // Animate only the visible cards
          const visibleCards = Array.from(planCards).filter(card => card.style.display !== "none");
          gsap.set(visibleCards, { opacity: 0, y: 15 });

          // GSAP fade in filtered cards
          gsap.to(visibleCards, {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.05,
            ease: "power2.out"
          });
        }
      });
    });
  });
}

// --- GSAP ScrollTrigger & Entrance Animations ---
function initGSAPAnimations() {
  // Ensure GSAP and ScrollTrigger are loaded
  if (typeof gsap === "undefined") return;
  
  // Register ScrollTrigger plugin
  if (typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  // 1. Hero Reveal timelines
  const heroTl = gsap.timeline();
  
  if (document.querySelector(".hero-banner")) {
    heroTl.from(".hero-bg-wrapper", {
      opacity: 0,
      scale: 1.1,
      duration: 1.5,
      ease: "power3.out"
    })
    .from(".hero-badge", {
      opacity: 0,
      y: -20,
      duration: 0.5,
      ease: "back.out(1.7)"
    }, "-=1.0")
    .from(".hero-title", {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: "power3.out"
    }, "-=0.8")
    .from(".hero-subtitle", {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.6")
    .from(".hero-ctas .btn", {
      opacity: 0,
      x: -20,
      stagger: 0.15,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.4")
    .from(".floating-card", {
      opacity: 0,
      scale: 0.8,
      y: 30,
      stagger: 0.2,
      duration: 0.8,
      ease: "back.out(1.2)"
    }, "-=0.3");
  }

  // 2. Subpages Hero Reveal
  if (document.querySelector(".page-hero")) {
    gsap.from(".page-hero-title", {
      opacity: 0,
      y: -30,
      duration: 0.8,
      ease: "power3.out"
    });
    gsap.from(".page-hero-subtitle", {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: "power3.out",
      delay: 0.2
    });
  }

  // 3. Stats Counter Animation (ScrollTrigger)
  const statNumbers = document.querySelectorAll(".stat-number");
  if (statNumbers.length > 0 && typeof ScrollTrigger !== "undefined") {
    statNumbers.forEach(num => {
      const targetVal = parseFloat(num.getAttribute("data-target"));
      const isDecimal = num.getAttribute("data-decimal") === "true";
      const suffix = num.getAttribute("data-suffix") || "";
      
      const counterObj = { value: 0 };
      
      gsap.to(counterObj, {
        value: targetVal,
        scrollTrigger: {
          trigger: num,
          start: "top 85%",
          toggleActions: "play none none none"
        },
        duration: 2.0,
        ease: "power2.out",
        onUpdate: () => {
          if (isDecimal) {
            num.innerText = counterObj.value.toFixed(1) + suffix;
          } else {
            num.innerText = Math.floor(counterObj.value) + suffix;
          }
        }
      });
    });
  }

  // 4. Reveal Why Choose Us Cards on scroll (fromTo style for stability)
  if (document.querySelector(".features-grid") && typeof ScrollTrigger !== "undefined") {
    gsap.fromTo(".feature-card", 
      { opacity: 0, y: 40 },
      {
        scrollTrigger: {
          trigger: ".features-grid",
          start: "top 80%",
          toggleActions: "play none none none"
        },
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out"
      }
    );
  }

  // 5. Showcase Rows Reveal (fromTo style for stability)
  const showcaseRows = document.querySelectorAll(".showcase-row");
  if (showcaseRows.length > 0 && typeof ScrollTrigger !== "undefined") {
    showcaseRows.forEach(row => {
      const img = row.querySelector(".showcase-image-wrapper");
      const content = row.querySelector(".showcase-content");

      if (img) {
        gsap.fromTo(img, 
          { opacity: 0, x: row.classList.contains("reverse") ? 50 : -50 },
          {
            scrollTrigger: {
              trigger: row,
              start: "top 80%",
              toggleActions: "play none none none"
            },
            opacity: 1,
            x: 0,
            duration: 1.0,
            ease: "power3.out"
          }
        );
      }

      if (content) {
        gsap.fromTo(content, 
          { opacity: 0, y: 40 },
          {
            scrollTrigger: {
              trigger: row,
              start: "top 75%",
              toggleActions: "play none none none"
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            delay: 0.2
          }
        );
      }
    });
  }

  // 6. Popular Plans Grid Reveal (fromTo style for stability)
  if (document.querySelector(".plans-grid") && typeof ScrollTrigger !== "undefined") {
    gsap.fromTo(".plans-grid .plan-card", 
      { opacity: 0, y: 40 },
      {
        scrollTrigger: {
          trigger: ".plans-grid",
          start: "top 80%",
          toggleActions: "play none none none"
        },
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out"
      }
    );
  }

  // 7. Stackly Mobile App Preview Reveal (fromTo style for stability)
  if (document.querySelector(".app-grid") && typeof ScrollTrigger !== "undefined") {
    gsap.fromTo(".app-content", 
      { opacity: 0, x: -50 },
      {
        scrollTrigger: {
          trigger: ".app-section",
          start: "top 80%",
          toggleActions: "play none none none"
        },
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: "power2.out"
      }
    );

    gsap.fromTo(".app-mockup", 
      { opacity: 0, y: 60 },
      {
        scrollTrigger: {
          trigger: ".app-section",
          start: "top 75%",
          toggleActions: "play none none none"
        },
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: "power3.out"
      }
    );
  }
}
