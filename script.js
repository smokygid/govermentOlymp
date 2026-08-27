/* =========================================================
   OLYMP GOVERNMENT
   MAIN SCRIPT
========================================================= */


/* =========================================================
   MOBILE MENU
========================================================= */

const menuButton = document.getElementById("menuButton");
const menu = document.querySelector(".menu");

if (menuButton && menu) {

    menuButton.addEventListener("click", () => {
        menu.classList.toggle("active");
    });

}


/* Закрытие мобильного меню */

if (menu) {

    document.querySelectorAll(".menu a").forEach(link => {

        link.addEventListener("click", () => {
            menu.classList.remove("active");
        });

    });

}


/* =========================================================
   SERVICE MODAL
========================================================= */

const serviceModal = document.getElementById("serviceModal");

const modalTitle =
    document.getElementById("modalTitle");

const modalDescription =
    document.getElementById("modalDescription");

const modalRequirements =
    document.getElementById("modalRequirements");

const modalIcon =
    document.getElementById("modalIcon");

const modalCategory =
    document.getElementById("modalCategory");

const applyFromService =
    document.getElementById("applyFromService");


/*
   Текущая выбранная услуга
*/

let selectedService = "";


/*
   Открытие информации об услуге
*/

window.openService = function (button) {

    if (!serviceModal) {
        console.error("serviceModal не найден");
        return;
    }


    /*
       Получаем карточку услуги
    */

    const card = button.closest(".service-item");

    if (!card) {

        console.error(
            "Карточка услуги не найдена"
        );

        return;
    }


    /*
       Получаем данные из data-атрибутов
    */

    const title =
        card.dataset.title || "Державна послуга";

    const description =
        card.dataset.description || "";

    const requirements =
        card.dataset.requirements || "—";


    selectedService = title;


    /*
       Заполняем модальное окно
    */

    if (modalTitle) {
        modalTitle.textContent = title;
    }

    if (modalDescription) {
        modalDescription.textContent = description;
    }

    if (modalRequirements) {
        modalRequirements.textContent = requirements;
    }

    if (modalCategory) {

        const category =
            card.dataset.category || "government";

        const categories = {

            documents: "ДОКУМЕНТИ",

            transport: "ТРАНСПОРТ",

            business: "БІЗНЕС",

            legal: "ЮРИДИЧНІ",

            government: "УРЯДОВІ"

        };

        modalCategory.textContent =
            categories[category] ||
            "ДЕРЖАВНА ПОСЛУГА";

    }


    /*
       Открываем окно
    */

    serviceModal.classList.add("active");

    serviceModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";

};


/*
   Закрытие окна услуги
*/

window.closeServiceModal = function () {

    if (!serviceModal) {
        return;
    }

    serviceModal.classList.remove("active");

    serviceModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow = "";

};


/*
   Совместимость со старым названием
*/

window.closeService = function () {
    window.closeServiceModal();
};


/* Закрытие услуги по фону */

if (serviceModal) {

    serviceModal.addEventListener("click", event => {

        if (event.target === serviceModal) {
            window.closeServiceModal();
        }

    });

}


/* =========================================================
   APPLICATION MODAL
========================================================= */

const applicationModal =
    document.getElementById("applicationModal");

const applicationForm =
    document.getElementById("applicationForm");

const applicationService =
    document.getElementById("applicationService");


/*
   Открытие формы заявки
*/

window.openApplicationModal = function (serviceName) {

    if (!applicationModal) {

        console.error(
            "applicationModal не найден"
        );

        return;
    }


    /*
       Если передали услугу —
       автоматически выбираем её
    */

    if (
        serviceName &&
        applicationService
    ) {

        let optionExists = false;

        for (
            const option
            of applicationService.options
        ) {

            if (
                option.textContent.trim() ===
                serviceName.trim()
            ) {

                optionExists = true;
                break;
            }

        }


        if (optionExists) {

            applicationService.value =
                serviceName;

        }

    }


    /*
       Открываем модальное окно
    */

    applicationModal.classList.add("active");

    applicationModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";

};


/*
   Закрытие формы заявки
*/

window.closeApplicationModal = function () {

    if (!applicationModal) {
        return;
    }

    applicationModal.classList.remove("active");

    applicationModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow = "";

};


/*
   Закрытие по фону
*/

if (applicationModal) {

    applicationModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                applicationModal
            ) {

                window.closeApplicationModal();

            }

        }
    );

}


/* =========================================================
   ПОДАТИ ЗАЯВКУ З КАРТКИ ПОСЛУГИ
========================================================= */

if (applyFromService) {

    applyFromService.addEventListener(
        "click",
        () => {

            window.closeServiceModal();

            window.openApplicationModal(
                selectedService
            );

        }
    );

}


/* =========================================================
   APPLICATION FORM
========================================================= */

if (applicationForm) {

    applicationForm.addEventListener(
        "submit",
        event => {

            /*
               Пока только предотвращаем
               перезагрузку страницы.
            */

            event.preventDefault();

            console.log(
                "Форма заявки отправлена"
            );

        }
    );

}


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }


        if (serviceModal) {

            serviceModal.classList.remove(
                "active"
            );

            serviceModal.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        if (applicationModal) {

            applicationModal.classList.remove(
                "active"
            );

            applicationModal.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        document.body.style.overflow = "";

    }
);


/* =========================================================
   HEADER SCROLL
========================================================= */

const header =
    document.querySelector(".header");

if (header) {

    window.addEventListener(
        "scroll",
        () => {

            if (window.scrollY > 50) {

                header.style.boxShadow =
                    "0 5px 30px rgba(0,0,0,0.25)";

            } else {

                header.style.boxShadow =
                    "none";

            }

        }
    );

}


/* =========================================================
   SERVICE SEARCH
========================================================= */

const serviceSearch =
    document.getElementById("serviceSearch");

const clearSearch =
    document.getElementById("clearSearch");

const servicesGrid =
    document.getElementById("servicesGrid");

const noResults =
    document.getElementById("noResults");

const categoryButtons =
    document.querySelectorAll(".category-btn");

const serviceItems =
    document.querySelectorAll(".service-item");


let currentCategory = "all";


function filterServices() {

    const searchText =
        serviceSearch
            ? serviceSearch.value
                .toLowerCase()
                .trim()
            : "";


    let visibleCount = 0;


    serviceItems.forEach(item => {

        const title =
            (
                item.dataset.title ||
                ""
            ).toLowerCase();

        const description =
            (
                item.dataset.description ||
                ""
            ).toLowerCase();

        const category =
            item.dataset.category ||
            "";


        const matchesSearch =
            !searchText ||
            title.includes(searchText) ||
            description.includes(searchText);


        const matchesCategory =
            currentCategory === "all" ||
            category === currentCategory;


        if (
            matchesSearch &&
            matchesCategory
        ) {

            item.style.display = "";

            visibleCount++;

        } else {

            item.style.display = "none";

        }

    });


    if (noResults) {

        noResults.style.display =
            visibleCount === 0
                ? "block"
                : "none";

    }

}


/*
   Поиск
*/

if (serviceSearch) {

    serviceSearch.addEventListener(
        "input",
        filterServices
    );

}


/*
   Очистка поиска
*/

if (clearSearch) {

    clearSearch.addEventListener(
        "click",
        () => {

            if (serviceSearch) {
                serviceSearch.value = "";
            }

            filterServices();

        }
    );

}


/*
   Категории
*/

categoryButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            categoryButtons.forEach(
                btn => {
                    btn.classList.remove(
                        "active"
                    );
                }
            );


            button.classList.add("active");


            currentCategory =
                button.dataset.category ||
                "all";


            filterServices();

        }
    );

});


/* =========================================================
   SIMPLE SCROLL ANIMATION
========================================================= */

const animatedElements =
    document.querySelectorAll(
        ".service-card, " +
        ".government-card, " +
        ".news-card, " +
        ".law-card"
    );


if (
    "IntersectionObserver"
    in window
) {

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.style.opacity =
                                "1";

                            entry.target.style.transform =
                                "translateY(0)";

                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.1
            }
        );


    animatedElements.forEach(
        element => {

            element.style.opacity = "0";

            element.style.transform =
                "translateY(20px)";

            element.style.transition =
                "opacity .5s ease, " +
                "transform .5s ease";

            observer.observe(element);

        }
    );

} else {

    animatedElements.forEach(
        element => {

            element.style.opacity = "1";

            element.style.transform =
                "translateY(0)";

        }
    );

}


/* =========================================================
   INITIAL FILTER
========================================================= */

filterServices();


console.log(
    "OLYMP Government script loaded successfully"
);
