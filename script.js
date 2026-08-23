/* =========================================================
   OLYMP GOVERNMENT
   Frontend JavaScript 3.0
========================================================= */


/*
 * ВАЖНО:
 *
 * СЮДА ВСТАВЬ URL WEB APP,
 * КОТОРЫЙ ТЫ ПОЛУЧИШЬ ПОСЛЕ
 * РАЗВЁРТЫВАНИЯ GOOGLE APPS SCRIPT.
 *
 * Например:
 *
 * https://script.google.com/macros/s/XXXXXXXX/exec
 */

const GOOGLE_SCRIPT_URL =
    "ВСТАВЬ_СЮДА_URL_GOOGLE_APPS_SCRIPT";


/* =========================================================
   MOBILE MENU
========================================================= */

const menuButton =
    document.getElementById("menuButton");

const mainMenu =
    document.getElementById("mainMenu");


if (menuButton) {

    menuButton.addEventListener(
        "click",
        () => {

            mainMenu.classList.toggle(
                "active"
            );

        }
    );

}


document
    .querySelectorAll(".menu a")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                mainMenu.classList.remove(
                    "active"
                );

            }
        );

    });


/* =========================================================
   HEADER
========================================================= */

const header =
    document.getElementById("header");


window.addEventListener(
    "scroll",
    () => {

        if (
            window.scrollY > 50
        ) {

            header.classList.add(
                "scrolled"
            );

        } else {

            header.classList.remove(
                "scrolled"
            );

        }

    }
);


/* =========================================================
   SERVICE SEARCH
========================================================= */

const searchInput =
    document.getElementById(
        "serviceSearch"
    );

const clearSearch =
    document.getElementById(
        "clearSearch"
    );

const serviceItems =
    document.querySelectorAll(
        ".service-item"
    );

const categoryButtons =
    document.querySelectorAll(
        ".category-btn"
    );

const noResults =
    document.getElementById(
        "noResults"
    );


let currentCategory =
    "all";


function filterServices() {

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    let visibleCount = 0;


    serviceItems.forEach(
        service => {

            const title =
                service.dataset.title
                    .toLowerCase();


            const description =
                service.dataset.description
                    .toLowerCase();


            const category =
                service.dataset.category;


            const matchesSearch =
                title.includes(
                    searchText
                ) ||
                description.includes(
                    searchText
                );


            const matchesCategory =
                currentCategory === "all" ||
                category === currentCategory;


            if (
                matchesSearch &&
                matchesCategory
            ) {

                service.classList.remove(
                    "hidden"
                );

                visibleCount++;

            } else {

                service.classList.add(
                    "hidden"
                );

            }

        }
    );


    if (
        visibleCount === 0
    ) {

        noResults.classList.add(
            "visible"
        );

    } else {

        noResults.classList.remove(
            "visible"
        );

    }


    if (
        searchText.length > 0
    ) {

        clearSearch.classList.add(
            "visible"
        );

    } else {

        clearSearch.classList.remove(
            "visible"
        );

    }

}


if (searchInput) {

    searchInput.addEventListener(
        "input",
        filterServices
    );

}


if (clearSearch) {

    clearSearch.addEventListener(
        "click",
        () => {

            searchInput.value = "";

            filterServices();

            searchInput.focus();

        }
    );

}


/* =========================================================
   CATEGORY FILTER
========================================================= */

categoryButtons.forEach(
    button => {

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


                button.classList.add(
                    "active"
                );


                currentCategory =
                    button.dataset.category;


                filterServices();

            }
        );

    }
);


/* =========================================================
   SERVICE MODAL
========================================================= */

const serviceModal =
    document.getElementById(
        "serviceModal"
    );

const modalTitle =
    document.getElementById(
        "modalTitle"
    );

const modalDescription =
    document.getElementById(
        "modalDescription"
    );

const modalRequirements =
    document.getElementById(
        "modalRequirements"
    );

const modalCategory =
    document.getElementById(
        "modalCategory"
    );

const modalIcon =
    document.getElementById(
        "modalIcon"
    );

const applyFromService =
    document.getElementById(
        "applyFromService"
    );


let selectedService = "";


function openService(button) {

    const card =
        button.closest(
            ".service-item"
        );


    selectedService =
        card.dataset.title;


    modalTitle.textContent =
        card.dataset.title;


    modalDescription.textContent =
        card.dataset.description;


    modalRequirements.textContent =
        card.dataset.requirements;


    modalCategory.textContent =
        card.querySelector(
            ".service-category"
        ).textContent;


    modalIcon.textContent =
        card.querySelector(
            ".service-icon"
        ).textContent.trim();


    serviceModal.classList.add(
        "active"
    );


    serviceModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function closeServiceModal() {

    serviceModal.classList.remove(
        "active"
    );


    serviceModal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   APPLICATION MODAL
========================================================= */

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


/* =========================================================
   SUBMIT APPLICATION
========================================================= */

applicationForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        /*
         * Защита от двойной отправки
         */

        const submitButton =
            applicationForm.querySelector(
                ".form-submit"
            );


        submitButton.disabled =
            true;


        submitButton.textContent =
            "Відправлення...";


        /*
         * Получаем значения
         */

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


        /*
         * Проверяем
         */

        if (
            !fullName ||
            !idNumber ||
            !service ||
            !message
        ) {

            alert(
                "Будь ласка, заповніть усі обов'язкові поля."
            );


            resetSubmitButton(
                submitButton
            );


            return;

        }


        /*
         * Проверяем URL
         */

        if (
            !GOOGLE_SCRIPT_URL ||
            GOOGLE_SCRIPT_URL.includes(
                "ВСТАВЬ"
            )
        ) {

            alert(
                "Система заявок ще не налаштована. Адміністратору необхідно додати URL Google Apps Script."
            );


            resetSubmitButton(
                submitButton
            );


            return;

        }


        /*
         * Создаём данные
         */

        const formData =
            new URLSearchParams();


        formData.append(
            "fullName",
            fullName
        );


        formData.append(
            "idNumber",
            idNumber
        );


        formData.append(
            "service",
            service
        );


        formData.append(
            "contact",
            contact
        );


        formData.append(
            "message",
            message
        );


        /*
         * Отправляем в Google Apps Script
         *
         * Используем URLSearchParams,
         * чтобы не создавать CORS preflight.
         */

        try {

            await fetch(
                GOOGLE_SCRIPT_URL,
                {

                    method:
                        "POST",

                    body:
                        formData,

                    mode:
                        "no-cors"

                }
            );


            /*
             * При no-cors браузер не даёт
             * прочитать ответ Google.
             *
             * Но Apps Script получает
             * заявку и записывает её
             * в Google Sheets.
             *
             * Поэтому показываем успешную
             * отправку после fetch.
             */


            const fakeNumber =
                generateLocalNumber();


            applicationNumber.textContent =
                "Заявку № " +
                fakeNumber;


            applicationForm.style.display =
                "none";


            successMessage.classList.add(
                "active"
            );


        } catch (error) {

            console.error(
                "Помилка:",
                error
            );


            alert(
                "Не вдалося відправити заявку. Спробуйте ще раз."
            );


            resetSubmitButton(
                submitButton
            );

        }

    }
);


/* =========================================================
   ЛОКАЛЬНЫЙ НОМЕР
========================================================= */

function generateLocalNumber() {

    const number =
        Math.floor(
            100000 +
            Math.random() * 900000
        );


    return "OLYMP-" + number;

}


/* =========================================================
   RESET BUTTON
========================================================= */

function resetSubmitButton(
    button
) {

    button.disabled =
        false;

    button.textContent =
        "Надіслати заявку";

}


/* =========================================================
   APPLY FROM SERVICE
========================================================= */

if (applyFromService) {

    applyFromService.addEventListener(
        "click",
        () => {

            closeServiceModal();

            openApplicationModal(
                selectedService
            );

        }
    );

}


/* =========================================================
   CLOSE MODALS
========================================================= */

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


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeServiceModal();

            closeApplicationModal();

        }

    }
);


/* =========================================================
   RESET APPLICATION MODAL
========================================================= */

function resetApplicationModal() {

    applicationForm.reset();

    applicationForm.style.display =
        "";

    successMessage.classList.remove(
        "active"
    );


    const button =
        applicationForm.querySelector(
            ".form-submit"
        );


    if (button) {

        resetSubmitButton(
            button
        );

    }

}


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


/* =========================================================
   SCROLL ANIMATION
========================================================= */

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

            entries.forEach(
                entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "show"
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

        element.classList.add(
            "animate-element"
        );


        observer.observe(
            element
        );

    }
);
