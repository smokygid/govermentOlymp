/* =========================
   MOBILE MENU
========================= */

const menuButton = document.getElementById("menuButton");
const menu = document.querySelector(".menu");

menuButton.addEventListener("click", () => {
    menu.classList.toggle("active");
});


/* Закрытие меню после нажатия */

document.querySelectorAll(".menu a").forEach(link => {

    link.addEventListener("click", () => {

        menu.classList.remove("active");

    });

});


/* =========================
   SERVICE MODAL
========================= */

const modal = document.getElementById("serviceModal");
const modalTitle = document.getElementById("modalTitle");


function openService(serviceName) {

    modalTitle.textContent = serviceName;

    modal.classList.add("active");

    document.body.style.overflow = "hidden";

}


function closeService() {

    modal.classList.remove("active");

    document.body.style.overflow = "";

}


/* Закрытие при клике по фону */

modal.addEventListener("click", (event) => {

    if (event.target === modal) {

        closeService();

    }

});


/* Закрытие клавишей ESC */

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        closeService();

    }

});


/* =========================
   HEADER SCROLL
========================= */

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        header.style.boxShadow =
            "0 5px 30px rgba(0,0,0,0.25)";

    } else {

        header.style.boxShadow = "none";

    }

});


/* =========================
   SIMPLE SCROLL ANIMATION
========================= */

const animatedElements =
    document.querySelectorAll(
        ".service-card, .government-card, .news-card, .law-card"
    );


const observer = new IntersectionObserver(

    entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.style.opacity = "1";
                entry.target.style.transform =
                    "translateY(0)";

            }

        });

    },

    {
        threshold: 0.1
    }

);


animatedElements.forEach(element => {

    element.style.opacity = "0";
    element.style.transform = "translateY(20px)";
    element.style.transition = "opacity .5s ease, transform .5s ease";

    observer.observe(element);

});
