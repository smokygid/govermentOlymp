/* =====================================================
   OLYMP GOVERNMENT
   JavaScript 2.0
===================================================== */


/* =====================================================
   MOBILE MENU
===================================================== */

const menuButton =
    document.getElementById("menuButton");

const mainMenu =
    document.getElementById("mainMenu");


menuButton.addEventListener("click", () => {

    mainMenu.classList.toggle("active");

});


document
    .querySelectorAll(".menu a")
    .forEach(link => {

        link.addEventListener("click", () => {

            mainMenu.classList.remove("active");

        });

    });


/* =====================================================
   HEADER SCROLL
===================================================== */

const header =
    document.getElementById("header");


window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        header.classList.add("scrolled");

    } else {

        header.classList.remove("scrolled");

    }

});


/* =====================================================
   SERVICES SEARCH
===================================================== */

const searchInput =
    document.getElementById("serviceSearch");

const clearSearch =
    document.getElementById("clearSearch");

const serviceItems =
    document.querySelectorAll(".service-item");

const categoryButtons =
    document.querySelectorAll(".category-btn");

const noResults =
    document.getElementById("noResults");


let currentCategory = "all";


function filterServices() {

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    let visibleCount = 0;


    serviceItems.forEach(service => {

        const title =
            service.dataset.title
                .toLowerCase();

        const description =
            service.dataset.description
                .toLowerCase();

        const category =
            service.dataset.category;


        const matchesSearch =
            title.includes(searchText) ||
            description.includes(searchText);


        const matchesCategory =
            currentCategory === "all" ||
            category === currentCategory;


        if (
            matchesSearch &&
            matchesCategory
        ) {

            service.classList.remove("hidden");

            visibleCount++;

        } else {

            service.classList.add("hidden");

        }

    });


    if (visibleCount === 0) {

        noResults.classList.add("visible");

    } else {

        noResults.classList.remove("visible");

    }


    if (searchText.length > 0) {

        clearSearch.classList.add("visible");

    } else {

        clearSearch.classList.remove("visible");

    }

}


searchInput.addEventListener(
    "input",
    filterServices
);


clearSearch.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        filterServices();

        searchInput.focus();

    }
);


/* =====================================================
   CATEGORY FILTER
===================================================== */

categoryButtons.forEach(button => {

    button.addEventListener("click", () => {

        categoryButtons.forEach(btn => {

            btn.classList.remove("active");

        });


        button.classList.add("active");


        currentCategory =
            button.dataset.category;


        filterServices();

    });

});


/* =====================================================
   SERVICE MODAL
===================================================== */

const serviceModal =
    document.getElementById("serviceModal");

const modalTitle =
    document.getElementById("modalTitle");

const modalDescription =
    document.getElementById("modalDescription");

const modalRequirements =
    document.getElementById("modalRequirements");

const modalCategory =
    document.getElementById("modalCategory");

const modalIcon =
    document.getElementById("modalIcon");

const applyFromService =
    document.getElementById("applyFromService");


let selectedService = "";


function openService(button) {

    const card =
        button.closest(".service-item");


    selectedService =
        card.dataset.title;


    modalTitle.textContent =
        card.dataset.title;


    modalDescription.textContent =
        card.dataset.description;


    modalRequirements.textContent =
        card.dataset.requirements;


    const category =
        card.querySelector(
            ".service-category"
        ).textContent;


    modalCategory.textContent =
        category;


    modalIcon.textContent =
        card.querySelector(
            ".service-icon"
        ).textContent.trim();


    serviceModal.classList.add("active");

    serviceModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

}


function closeServiceModal() {

    serviceModal.classList.remove("active");

    serviceModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

}


/* =====================================================
   APPLY FROM SERVICE
===================================================== */

applyFromService.addEventListener(
    "click",
    () => {

        closeServiceModal();

        openApplicationModal(
            selectedService
        );

    }
);


/* =====================================================
   APPLICATION MODAL
===================================================== */

const applicationModal =
    document.getElementById(
        "applicationModal"
    );

const applicationForm =
    document.getElementById(
        "applicationForm"
    );

const applicationService =
    document.getElementById(
        "applicationService"
    );

const successMessage =
    document.getElementById(
        "successMessage"
    );

const applicationNumber =
    document.getElementById(
        "applicationNumber"
    );


function openApplicationModal(
    serviceName = ""
) {

    applicationModal.classList.add(
        "active"
    );

    applicationModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );


    if (serviceName) {

        const options =
            Array.from(
                applicationService.options
            );


        const option =
            options.find(
                item =>
                    item.text === serviceName
            );


        if (option) {

            applicationService.value =
                serviceName;

        }

    }

}


function closeApplicationModal() {

    applicationModal.classList.remove(
        "active"
    );

    applicationModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

}


/* =====================================================
   APPLICATION FORM
===================================================== */

applicationForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const fullName =
            document.getElementById(
                "fullName"
            ).value.trim();


        const idNumber =
            document.getElementById(
                "idNumber"
            ).value.trim();


        const service =
            applicationService.value;


        const contact =
            document.getElementById(
                "contact"
            ).value.trim();


        const message =
            document.getElementById(
                "message"
            ).value.trim();


        if (
            !fullName ||
            !idNumber ||
            !service ||
            !message
        ) {

            alert(
                "Будь ласка, заповніть усі обов'язкові поля."
            );

            return;

        }


        /* Генерация номера заявки */

        const randomNumber =
            Math.floor(
                100000 +
                Math.random() * 900000
            );


        const requestNumber =
            "OLYMP-" +
            randomNumber;


        applicationNumber.textContent =
            "№ " + requestNumber;


        /* Временное хранение заявки */

        const application = {

            number: requestNumber,

            fullName: fullName,

            idNumber: idNumber,

            service: service,

            contact: contact,

            message: message,

            date:
                new Date()
                    .toLocaleString(
                        "uk-UA"
                    )

        };


        console.log(
            "НОВА ЗАЯВКА:",
            application
        );


        /*
         =================================================
         ВАЖНО

         Здесь позже можно подключить:

         Google Sheets
         Discord Webhook
         Firebase
         MySQL
         API

         =================================================
        */


        applicationForm.style.display =
            "none";


        successMessage.classList.add(
            "active"
        );

    }
);


/* =====================================================
   MODAL CLICK OUTSIDE
===================================================== */

serviceModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            serviceModal
        ) {

            closeServiceModal();

        }

    }
);


applicationModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            applicationModal
        ) {

            closeApplicationModal();

        }

    }
);


/* =====================================================
   ESC
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }


        closeServiceModal();

        closeApplicationModal();

    }
);


/* =====================================================
   RESET APPLICATION FORM
===================================================== */

applicationModal.addEventListener(
    "transitionend",
    () => {

        if (
            !applicationModal.classList.contains(
                "active"
            )
        ) {

            resetApplicationModal();

        }

    }
);


function resetApplicationModal() {

    applicationForm.reset();

    applicationForm.style.display =
        "";

    successMessage.classList.remove(
        "active"
    );

}


/* =====================================================
   SCROLL ANIMATION
===================================================== */

const animatedElements =
    document.querySelectorAll(
        ".service-card, " +
        ".government-card, " +
        ".news-card, " +
        ".law-card, " +
        ".contact-card"
    );


const observer =
    new IntersectionObserver(
        entries => {

            entries.forEach(entry => {

                if (
                    entry.isIntersecting
                ) {

                    entry.target.classList.add(
                        "show"
                    );

                }

            });

        },
        {
            threshold: 0.1
        }
    );


animatedElements.forEach(element => {

    element.classList.add(
        "animate-element"
    );

    observer.observe(element);

});
