/* =========================================================
   OLYMP GOVERNMENT
   Frontend JavaScript 4.0
   Google Apps Script
   БЕЗ DISCORD
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT
========================================================= */

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzET7X9XsoUnCZlhGv8YEiv1NAoCmu13U4AP3WMlmo5sFXiwlBKhfLkXBfQKcFJh-RGog/exec";


/* =========================================================
   DOM
========================================================= */

const menuButton =
    document.getElementById("menuButton");

const mainMenu =
    document.getElementById("mainMenu");

const header =
    document.getElementById("header");

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

const serviceModal =
    document.getElementById("serviceModal");

const applicationModal =
    document.getElementById("applicationModal");

const applicationForm =
    document.getElementById("applicationForm");

const applicationService =
    document.getElementById("applicationService");

const successMessage =
    document.getElementById("successMessage");

const applicationNumber =
    document.getElementById("applicationNumber");

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

const serviceCount =
    document.getElementById("serviceCount");


/* =========================================================
   СОСТОЯНИЕ
========================================================= */

let currentCategory = "all";

let selectedService = "";

let isSubmitting = false;


/* =========================================================
   MOBILE MENU
========================================================= */

if (menuButton && mainMenu) {

    menuButton.addEventListener("click", () => {

        mainMenu.classList.toggle("active");

    });

}


document
    .querySelectorAll(".menu a")
    .forEach(link => {

        link.addEventListener("click", () => {

            if (mainMenu) {

                mainMenu.classList.remove("active");

            }

        });

    });


/* =========================================================
   HEADER SCROLL
========================================================= */

function updateHeader() {

    if (!header) {
        return;
    }

    if (window.scrollY > 50) {

        header.classList.add("scrolled");

    } else {

        header.classList.remove("scrolled");

    }

}


window.addEventListener(
    "scroll",
    updateHeader,
    { passive: true }
);

updateHeader();


/* =========================================================
   SERVICES COUNT
========================================================= */

if (serviceCount) {

    serviceCount.textContent =
        serviceItems.length;

}


/* =========================================================
   SERVICE SEARCH
========================================================= */

function filterServices() {

    if (!searchInput) {
        return;
    }

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    let visibleCount = 0;


    serviceItems.forEach(service => {

        const title =
            (
                service.dataset.title || ""
            ).toLowerCase();


        const description =
            (
                service.dataset.description || ""
            ).toLowerCase();


        const category =
            service.dataset.category || "";


        const matchesSearch =
            title.includes(searchText) ||
            description.includes(searchText);


        const matchesCategory =
            currentCategory === "all" ||
            category === currentCategory;


        const visible =
            matchesSearch &&
            matchesCategory;


        if (visible) {

            service.classList.remove("hidden");

            visibleCount++;

        } else {

            service.classList.add("hidden");

        }

    });


    if (noResults) {

        if (visibleCount === 0) {

            noResults.classList.add("visible");

        } else {

            noResults.classList.remove("visible");

        }

    }


    if (clearSearch) {

        if (searchText.length > 0) {

            clearSearch.classList.add("visible");

        } else {

            clearSearch.classList.remove("visible");

        }

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

categoryButtons.forEach(button => {

    button.addEventListener("click", () => {

        categoryButtons.forEach(btn => {

            btn.classList.remove("active");

        });


        button.classList.add("active");


        currentCategory =
            button.dataset.category || "all";


        filterServices();

    });

});


/* =========================================================
   SERVICE MODAL
========================================================= */

function openService(button) {

    if (!button) {
        return;
    }


    const card =
        button.closest(".service-item");


    if (!card) {
        return;
    }


    selectedService =
        card.dataset.title || "";


    if (modalTitle) {

        modalTitle.textContent =
            card.dataset.title || "Державна послуга";

    }


    if (modalDescription) {

        modalDescription.textContent =
            card.dataset.description || "";

    }


    if (modalRequirements) {

        modalRequirements.textContent =
            card.dataset.requirements ||
            "Інформація відсутня.";

    }


    const category =
        card.querySelector(".service-category");


    if (modalCategory) {

        modalCategory.textContent =
            category
                ? category.textContent.trim()
                : "ДЕРЖАВНА ПОСЛУГА";

    }


    const icon =
        card.querySelector(".service-icon");


    if (modalIcon) {

        modalIcon.textContent =
            icon
                ? icon.textContent.trim()
                : "🏛️";

    }


    if (serviceModal) {

        serviceModal.classList.add("active");

        serviceModal.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    document.body.classList.add("modal-open");

}


window.openService =
    openService;


/* =========================================================
   CLOSE SERVICE MODAL
========================================================= */

function closeServiceModal() {

    if (!serviceModal) {
        return;
    }


    serviceModal.classList.remove("active");


    serviceModal.setAttribute(
        "aria-hidden",
        "true"
    );


    updateBodyModalState();

}


window.closeServiceModal =
    closeServiceModal;


/* =========================================================
   APPLICATION MODAL
========================================================= */

function openApplicationModal(
    serviceName = ""
) {

    if (!applicationModal) {
        return;
    }


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


    /*
     * Если пользователь открыл
     * заявку из конкретной услуги,
     * автоматически выбираем услугу.
     */

    if (
        serviceName &&
        applicationService
    ) {

        const option =
            Array.from(
                applicationService.options
            ).find(
                item =>
                    item.text.trim() ===
                    serviceName.trim()
            );


        if (option) {

            applicationService.value =
                option.value;

        }

    }


    /*
     * Ставим курсор
     * в первое поле.
     */

    setTimeout(() => {

        const fullName =
            document.getElementById("fullName");


        if (fullName) {

            fullName.focus();

        }

    }, 150);

}


window.openApplicationModal =
    openApplicationModal;


/* =========================================================
   CLOSE APPLICATION MODAL
========================================================= */

function closeApplicationModal() {

    if (!applicationModal) {
        return;
    }


    applicationModal.classList.remove(
        "active"
    );


    applicationModal.setAttribute(
        "aria-hidden",
        "true"
    );


    updateBodyModalState();

}


window.closeApplicationModal =
    closeApplicationModal;


/* =========================================================
   BODY MODAL STATE
========================================================= */

function updateBodyModalState() {

    const serviceOpen =
        serviceModal &&
        serviceModal.classList.contains("active");


    const applicationOpen =
        applicationModal &&
        applicationModal.classList.contains("active");


    if (
        serviceOpen ||
        applicationOpen
    ) {

        document.body.classList.add(
            "modal-open"
        );

    } else {

        document.body.classList.remove(
            "modal-open"
        );

    }

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
   VALIDATION
========================================================= */

function validateApplication(
    fullName,
    idNumber,
    service,
    message
) {

    if (!fullName) {

        return {
            valid: false,
            message: "Вкажіть ПІБ."
        };

    }


    if (!idNumber) {

        return {
            valid: false,
            message:
                "Вкажіть номер посвідчення."
        };

    }


    if (!service) {

        return {
            valid: false,
            message:
                "Оберіть державну послугу."
        };

    }


    if (!message) {

        return {
            valid: false,
            message:
                "Вкажіть опис звернення."
        };

    }


    return {
        valid: true
    };

}


/* =========================================================
   SUBMIT APPLICATION
========================================================= */

if (applicationForm) {

    applicationForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            /*
             * Защита от двойной отправки
             */

            if (isSubmitting) {
                return;
            }


            /*
             * Получаем кнопку
             */

            const submitButton =
                applicationForm.querySelector(
                    ".form-submit"
                );


            /*
             * Получаем поля
             */

            const fullNameInput =
                document.getElementById(
                    "fullName"
                );


            const idNumberInput =
                document.getElementById(
                    "idNumber"
                );


            const contactInput =
                document.getElementById(
                    "contact"
                );


            const messageInput =
                document.getElementById(
                    "message"
                );


            const fullName =
                fullNameInput
                    ? fullNameInput.value.trim()
                    : "";


            const idNumber =
                idNumberInput
                    ? idNumberInput.value.trim()
                    : "";


            const service =
                applicationService
                    ? applicationService.value.trim()
                    : "";


            const contact =
                contactInput
                    ? contactInput.value.trim()
                    : "";


            const message =
                messageInput
                    ? messageInput.value.trim()
                    : "";


            /*
             * Проверка данных
             */

            const validation =
                validateApplication(
                    fullName,
                    idNumber,
                    service,
                    message
                );


            if (!validation.valid) {

                showFormError(
                    validation.message
                );

                return;

            }


            /*
             * Проверка Google Apps Script
             */

            if (
                !GOOGLE_SCRIPT_URL ||
                GOOGLE_SCRIPT_URL.includes(
                    "ВСТАВЬ"
                )
            ) {

                showFormError(
                    "Система заявок ще не налаштована. Адміністратору необхідно додати URL Google Apps Script."
                );

                return;

            }


            /*
             * Начинаем отправку
             */

            isSubmitting = true;


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Відправлення...";

            }


            /*
             * Создаём POST данные
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
             * Отправляем Google Apps Script
             *
             * no-cors используется для того,
             * чтобы браузер не блокировал
             * POST-запрос.
             */

            try {

                await fetch(
                    GOOGLE_SCRIPT_URL,
                    {
                        method: "POST",

                        body: formData,

                        mode: "no-cors"
                    }
                );


                /*
                 * ВАЖНО:
                 *
                 * При no-cors браузер не может
                 * прочитать JSON-ответ Apps Script.
                 *
                 * Поэтому здесь НЕ создаём
                 * фальшивый номер заявки.
                 */


                showSuccess();

            } catch (error) {

                console.error(
                    "Google Apps Script error:",
                    error
                );


                showFormError(
                    "Не вдалося відправити заявку. Перевірте підключення до інтернету та спробуйте ще раз."
                );


                resetSubmitButton();

            }

        }
    );

}


/* =========================================================
   SUCCESS
========================================================= */

function showSuccess() {

    if (!applicationForm) {
        return;
    }


    /*
     * Скрываем форму
     */

    applicationForm.style.display =
        "none";


    /*
     * Показываем сообщение
     */

    if (successMessage) {

        successMessage.classList.add(
            "active"
        );

    }


    /*
     * Пока Google Apps Script
     * работает через no-cors,
     * нельзя достоверно показать
     * серверный номер.
     */

    if (applicationNumber) {

        applicationNumber.textContent =
            "Заявку успішно зареєстровано";

    }


    isSubmitting = false;

}


/* =========================================================
   FORM ERROR
========================================================= */

function showFormError(
    message
) {

    alert(message);

}


/* =========================================================
   RESET SUBMIT BUTTON
========================================================= */

function resetSubmitButton() {

    isSubmitting = false;


    if (!applicationForm) {
        return;
    }


    const button =
        applicationForm.querySelector(
            ".form-submit"
        );


    if (button) {

        button.disabled =
            false;

        button.textContent =
            "Надіслати заявку";

    }

}


/* =========================================================
   RESET APPLICATION
========================================================= */

function resetApplicationModal() {

    if (!applicationForm) {
        return;
    }


    applicationForm.reset();


    applicationForm.style.display =
        "";


    if (successMessage) {

        successMessage.classList.remove(
            "active"
        );

    }


    resetSubmitButton();

}


/* =========================================================
   CLOSE BY BACKDROP
========================================================= */

if (serviceModal) {

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

}


if (applicationModal) {

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

}


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Escape"
        ) {
            return;
        }


        if (
            serviceModal &&
            serviceModal.classList.contains(
                "active"
            )
        ) {

            closeServiceModal();

        }


        if (
            applicationModal &&
            applicationModal.classList.contains(
                "active"
            )
        ) {

            closeApplicationModal();

        }

    }
);


/* =========================================================
   RESET AFTER CLOSING
========================================================= */

if (applicationModal) {

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

}


/*
 * Дополнительный fallback:
 * transitionend может не сработать,
 * если CSS не имеет transition.
 */

let applicationWasClosed = false;


if (applicationModal) {

    applicationModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                applicationModal
            ) {

                applicationWasClosed = true;

                setTimeout(() => {

                    if (
                        applicationWasClosed &&
                        !applicationModal.classList.contains(
                            "active"
                        )
                    ) {

                        resetApplicationModal();

                    }

                    applicationWasClosed = false;

                }, 300);

            }

        }
    );

}


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


if (
    "IntersectionObserver" in window
) {

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


                        observer.unobserve(
                            entry.target
                        );

                    }

                });

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

} else {

    animatedElements.forEach(
        element => {

            element.classList.add(
                "show"
            );

        }
    );

}


/* =========================================================
   SERVICE SEARCH — ENTER
========================================================= */

if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Enter"
            ) {
                return;
            }


            event.preventDefault();


            const firstVisible =
                Array.from(
                    serviceItems
                ).find(
                    item =>
                        !item.classList.contains(
                            "hidden"
                        )
                );


            if (firstVisible) {

                const button =
                    firstVisible.querySelector(
                        ".service-button"
                    );


                if (button) {

                    openService(button);

                }

            }

        }
    );

}


/* =========================================================
   CLOSE MOBILE MENU ON OUTSIDE CLICK
========================================================= */

document.addEventListener(
    "click",
    event => {

        if (
            !mainMenu ||
            !menuButton
        ) {
            return;
        }


        if (
            !mainMenu.contains(event.target) &&
            !menuButton.contains(event.target)
        ) {

            mainMenu.classList.remove(
                "active"
            );

        }

    }
);


/* =========================================================
   INITIAL FILTER
========================================================= */

filterServices();


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "OLYMP Government JS 4.0 loaded."
);

console.log(
    "Google Apps Script:",
    GOOGLE_SCRIPT_URL
);
