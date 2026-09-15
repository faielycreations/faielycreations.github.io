// script.js

window.API = null;
if(!window.API)
  {
    fetch("https://faiely-backend.onrender.com/api/config")
    .then(res => res.json())
    .then(cfg => {
        window.API = cfg.api;
    });
  }

window.onload = () => {
  document.getElementById("loading-screen").style.display = "none";
};

// Mobile menu toggle
const menuBtn = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");

if(menuBtn && menuBtn.addEventListener("click", () => {
  mobileMenu.classList.toggle("active");
}));
