// Responsive navigation, reveal animations, project details, and page utilities.
const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const navItems = document.querySelectorAll(".nav-link");
const header = document.querySelector(".site-header");

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation menu");
    });
  });
}

// Reveal content as it enters the viewport, with a graceful fallback.
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

// Highlight the navigation item for the section currently in view.
const sections = document.querySelectorAll("main section[id]");
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navItems.forEach((link) => {
        const active = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("active", active);
      });
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  sections.forEach((section) => sectionObserver.observe(section));
}

// Add a slightly stronger header surface after leaving the top of the page.
const updateHeader = () => {
  if (header) header.classList.toggle("scrolled", window.scrollY > 24);
};
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

// Project detail content reflects the supplied resume and clearly identifies planned work.
const projectDetails = {
  cleaning: {
    category: "PYTHON · DATA AUTOMATION",

    title: "Smart Data Cleaner Pro",
    github: "https://github.com/LakhandRathod/smart-data-cleaner-pro",

    description:
      "Smart Data Cleaner Pro is a Python-based desktop application " +
      "built with Tkinter and Pandas. It helps users import Excel and " +
      "CSV files, apply automated data-cleaning operations, preview " +
      "datasets, compare original and cleaned data, maintain cleaning " +
      "history, and export cleaned files.",

    bullets: [
      "Import Excel (.xlsx, .xls) and CSV files.",
      "Select an output folder for cleaned files.",
      "Remove duplicate rows automatically.",
      "Remove completely blank rows.",
      "Trim leading and trailing whitespace.",
      "Convert text into Title Case.",
      "Remove rows containing missing values.",
      "Preview original and cleaned datasets.",
      "Compare data before and after cleaning.",
      "View cleaning history and previous operations.",
      "Export cleaned datasets to the selected folder."
    ],

    status:
      "Status: Desktop application built using Python, Pandas, and Tkinter. " +
      "Local file processing with configurable cleaning options."
  },

  sales: {
    category: "BUSINESS INTELLIGENCE · PORTFOLIO PLAN",
    title: "Sales Data Analysis & Dashboard",
    description: "A planned portfolio analysis to examine sales by date, product, and region and present useful business measures.",
    bullets: ["Prepare and validate the sales dataset.", "Calculate revenue, order count, and average order value.", "Explore time, product, and regional trends.", "Create KPI visuals and summarize findings after completing the analysis."],
    status: "Status: portfolio project plan. No results or dashboard link are claimed yet."
  },
  employee: {
    category: "PYTHON · DATA QUALITY PRACTICE",
    title: "Employee Data Cleaning & Analysis",
    description: "A practice workflow for standardizing employee data and checking data quality before analysis.",
    bullets: ["Standardize text fields and inspect duplicates.", "Derive experience values from joining-year data where appropriate.", "Document data-quality rules and assumptions.", "Compare row counts before and after cleaning."],
    status: "Status: practice workflow; add dataset source and verified results when available."
  }
};
const modal = document.querySelector("#project-modal");
const modalTitle = document.querySelector("#modal-title");
const modalCategory = document.querySelector("#modal-category");
const modalDescription = document.querySelector("#modal-description");
const modalList = document.querySelector("#modal-list");
const modalStatus = document.querySelector("#modal-status");
let lastModalTrigger = null;

document.querySelectorAll(".project-detail").forEach((button) => {
  button.addEventListener("click", () => {
    const detail = projectDetails[button.dataset.project];
    if (!detail || !modal) return;
    lastModalTrigger = button;
    modalCategory.textContent = detail.category;
    modalTitle.textContent = detail.title;
    modalDescription.textContent = detail.description;
    modalList.replaceChildren(...detail.bullets.map((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      return li;
    }));
    modalStatus.textContent = detail.status;
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  });
});

const closeModal = () => {
  if (modal?.open) modal.close();
  lastModalTrigger?.focus();
};
document.querySelector(".modal-close")?.addEventListener("click", closeModal);
modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
modal?.addEventListener("close", () => lastModalTrigger?.focus());

// Keep the displayed copyright year current.
const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

// Full Screen Project Screenshot Preview

const projectScreenshot = document.querySelector("#projectScreenshot");
const imageLightbox = document.querySelector("#image-lightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxClose = document.querySelector("#lightboxClose");

function openImagePreview() {
  if (!projectScreenshot || !imageLightbox) return;

  lightboxImage.src = projectScreenshot.src;
  lightboxImage.alt = projectScreenshot.alt;

  imageLightbox.showModal();
}

projectScreenshot?.addEventListener("click", openImagePreview);

projectScreenshot?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openImagePreview();
  }
});

lightboxClose?.addEventListener("click", () => {
  imageLightbox.close();
});

imageLightbox?.addEventListener("click", (event) => {
  if (event.target === imageLightbox) {
    imageLightbox.close();
  }
});

