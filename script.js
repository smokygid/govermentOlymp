/* =========================================================
   OLYMP GOVERNMENT
   Frontend JavaScript 4.0
   Державний портал

   СИСТЕМА:
   • Державні послуги
   • Пошук послуг
   • Категорії
   • Модальні вікна
   • Створення заявки
   • Google Apps Script
   • Автоматичний номер заявки
   • Автоматичний код доступу
   • Особистий кабінет
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT
========================================================= */

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyynbAxu6A_tU5nBEUum357BCY6o8D-3e44wEtR-AlyOtV5un8mNgpmkvU6dtrIy0RvfQ/exec";


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeGovernmentPortal();

    }
);


/* =========================================================
   INITIALIZATION
========================================================= */

function initializeGovernmentPortal() {

    try {

        initializeMobileMenu();

        initializeHeader();

        initializeServices();

        initializeApplicationForm();

        initializeModals();

        initializeApplyButton();

        initializeScrollAnimations();

        updateServiceCounter();

        console.log(
            "OLYMP Government 4.0 запущено."
        );

    } catch (error) {

        console.error(
            "OLYMP Government initialization error:",
            error
        );

    }

}


/* =========================================================
   MOBILE MENU
========================================================= */

function initializeMobileMenu() {

    const menuButton =
        document.getElementById(
            "menuButton"
        );

    const mainMenu =
        document.getElementById(
            "mainMenu"
        );


    if (!menuButton || !mainMenu) {

        return;

    }


    menuButton.addEventListener(
        "click",
        function () {

            mainMenu.classList.toggle(
                "active"
            );


            const isOpen =
                mainMenu.classList.contains(
                    "active"
                );


            menuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );


    const menuLinks =
        mainMenu.querySelectorAll(
            "a"
        );


    menuLinks.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    mainMenu.classList.remove(
                        "active"
                    );


                    menuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }
            );

        }
    );

}


/* =========================================================
   HEADER
========================================================= */

function initializeHeader() {

    const header =
        document.getElementById(
            "header"
        );


    if (!header) {

        return;

    }


    function updateHeader() {

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


    window.addEventListener(
        "scroll",
        updateHeader,
        {
            passive: true
        }
    );


    updateHeader();

}


/* =========================================================
   SERVICES
========================================================= */

let currentCategory = "all";

let selectedService = "";


function initializeServices() {

    const searchInput =
        document.getElementById(
            "serviceSearch"
        );


    const clearSearch =
        document.getElementById(
            "clearSearch"
        );


    const categoryButtons =
        document.querySelectorAll(
            ".category-btn"
        );


    syncApplicationServices();


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterServices
        );

    }


    if (clearSearch) {

        clearSearch.addEventListener(
            "click",
            function () {

                if (searchInput) {

                    searchInput.value = "";

                    searchInput.focus();

                }


                filterServices();

            }
        );

    }


    categoryButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    categoryButtons.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    currentCategory =
                        button.dataset.category ||
                        "all";


                    filterServices();

                }
            );

        }
    );


    filterServices();

}


/* =========================================================
   SERVICE FILTER
========================================================= */

function filterServices() {

    const searchInput =
        document.getElementById(
            "serviceSearch"
        );


    const noResults =
        document.getElementById(
            "noResults"
        );


    const serviceItems =
        document.querySelectorAll(
            ".service-item"
        );


    const searchText =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    let visibleCount = 0;


    serviceItems.forEach(
        function (service) {

            const title =
                (
                    service.dataset.title ||
                    ""
                ).toLowerCase();


            const description =
                (
                    service.dataset.description ||
                    ""
                ).toLowerCase();


            const requirements =
                (
                    service.dataset.requirements ||
                    ""
                ).toLowerCase();


            const category =
                service.dataset.category ||
                "all";


            const matchesSearch =
                !searchText ||
                title.includes(searchText) ||
                description.includes(searchText) ||
                requirements.includes(searchText);


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


    if (noResults) {

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

    }


    if (clearSearch) {

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

}


/* =========================================================
   SERVICE COUNTER
========================================================= */

function updateServiceCounter() {

    const counter =
        document.getElementById(
            "serviceCount"
        );


    if (!counter) {

        return;

    }


    const services =
        document.querySelectorAll(
            ".service-item"
        );


    counter.textContent =
        services.length;

}


/* =========================================================
   SYNCHRONIZE APPLICATION SERVICES
========================================================= */

function syncApplicationServices() {

    const select =
        document.getElementById(
            "applicationService"
        );


    if (!select) {

        return;

    }


    const services =
        document.querySelectorAll(
            ".service-item"
        );


    const previousValue =
        select.value;


    select.innerHTML = "";


    const firstOption =
        document.createElement(
            "option"
        );


    firstOption.value = "";

    firstOption.textContent =
        "Оберіть послугу";


    select.appendChild(
        firstOption
    );


    services.forEach(
        function (service) {

            const title =
                (
                    service.dataset.title ||
                    ""
                ).trim();


            if (!title) {

                return;

            }


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                title;


            option.textContent =
                title;


            select.appendChild(
                option
            );

        }
    );


    if (previousValue) {

        const exists =
            Array.from(
                select.options
            ).some(
                function (option) {

                    return (
                        option.value ===
                        previousValue
                    );

                }
            );


        if (exists) {

            select.value =
                previousValue;

        }

    }

}


/* =========================================================
   OPEN SERVICE
========================================================= */

function openService(button) {

    if (!button) {

        return;

    }


    const card =
        button.closest(
            ".service-item"
        );


    if (!card) {

        return;

    }


    const serviceModal =
        document.getElementById(
            "serviceModal"
        );


    if (!serviceModal) {

        return;

    }


    selectedService =
        card.dataset.title ||
        "";


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


    if (modalTitle) {

        modalTitle.textContent =
            card.dataset.title ||
            "Державна послуга";

    }


    if (modalDescription) {

        modalDescription.textContent =
            card.dataset.description ||
            "Інформація про послугу.";

    }


    if (modalRequirements) {

        modalRequirements.textContent =
            card.dataset.requirements ||
            "Не вказано.";

    }


    if (modalCategory) {

        const category =
            card.querySelector(
                ".service-category"
            );


        modalCategory.textContent =
            category
                ? category.textContent.trim()
                : "ДЕРЖАВНА ПОСЛУГА";

    }


    if (modalIcon) {

        const icon =
            card.querySelector(
                ".service-icon"
            );


        modalIcon.textContent =
            icon
                ? icon.textContent.trim()
                : "🏛️";

    }


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


/* =========================================================
   CLOSE SERVICE MODAL
========================================================= */

function closeServiceModal() {

    const serviceModal =
        document.getElementById(
            "serviceModal"
        );


    if (!serviceModal) {

        return;

    }


    serviceModal.classList.remove(
        "active"
    );


    serviceModal.setAttribute(
        "aria-hidden",
        "true"
    );


    updateBodyModalState();

}


/* =========================================================
   OPEN APPLICATION MODAL
========================================================= */

function openApplicationModal(
    serviceName = ""
) {

    const applicationModal =
        document.getElementById(
            "applicationModal"
        );


    if (!applicationModal) {

        console.error(
            "applicationModal не найден."
        );

        return;

    }


    syncApplicationServices();


    const applicationService =
        document.getElementById(
            "applicationService"
        );


    if (
        serviceName &&
        applicationService
    ) {

        const normalizedService =
            serviceName.trim();


        const option =
            Array.from(
                applicationService.options
            ).find(
                function (item) {

                    return (
                        item.value ===
                        normalizedService
                    );

                }
            );


        if (option) {

            applicationService.value =
                normalizedService;

        }

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

}


/* =========================================================
   CLOSE APPLICATION MODAL
========================================================= */

function closeApplicationModal() {

    const applicationModal =
        document.getElementById(
            "applicationModal"
        );


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


    resetApplicationModal();


    updateBodyModalState();

}


/* =========================================================
   BODY MODAL STATE
========================================================= */

function updateBodyModalState() {

    const serviceModal =
        document.getElementById(
            "serviceModal"
        );


    const applicationModal =
        document.getElementById(
            "applicationModal"
        );


    const serviceActive =
        serviceModal &&
        serviceModal.classList.contains(
            "active"
        );


    const applicationActive =
        applicationModal &&
        applicationModal.classList.contains(
            "active"
        );


    if (
        serviceActive ||
        applicationActive
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
   APPLICATION FORM
========================================================= */

function initializeApplicationForm() {

    const form =
        document.getElementById(
            "applicationForm"
        );


    if (!form) {

        console.warn(
            "applicationForm не найден."
        );

        return;

    }


    form.addEventListener(
        "submit",
        handleApplicationSubmit
    );

}


/* =========================================================
   SUBMIT APPLICATION
========================================================= */

async function handleApplicationSubmit(
    event
) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const submitButton =
        form.querySelector(
            ".form-submit"
        );


    if (
        submitButton &&
        submitButton.disabled
    ) {

        return;

    }


    /* =====================================================
       ПОЛЯ ФОРМЫ
    ===================================================== */

    const fullNameInput =
        document.getElementById(
            "fullName"
        );


    const birthDateInput =
        document.getElementById(
            "birthDate"
        );


    const phoneInput =
        document.getElementById(
            "phone"
        );


    const emailInput =
        document.getElementById(
            "email"
        );


    const discordInput =
        document.getElementById(
            "discord"
        );


    const serviceInput =
        document.getElementById(
            "applicationService"
        );


    const contactInput =
        document.getElementById(
            "contact"
        );


    const messageInput =
        document.getElementById(
            "message"
        );


    /* =====================================================
       ЗНАЧЕНИЯ
    ===================================================== */

    const fullName =
        fullNameInput
            ? fullNameInput.value.trim()
            : "";


    const birthDate =
        birthDateInput
            ? birthDateInput.value.trim()
            : "";


    const phone =
        phoneInput
            ? phoneInput.value.trim()
            : "";


    const email =
        emailInput
            ? emailInput.value.trim()
            : "";


    const discord =
        discordInput
            ? discordInput.value.trim()
            : "";


    const service =
        serviceInput
            ? serviceInput.value.trim()
            : "";


    const contact =
        contactInput
            ? contactInput.value.trim()
            : "";


    const message =
        messageInput
            ? messageInput.value.trim()
            : "";


    /* =====================================================
       ПРОВЕРКА ПІБ
    ===================================================== */

    if (!fullName) {

        showFormError(
            "Будь ласка, вкажіть ПІБ."
        );


        focusElement(
            fullNameInput
        );


        return;

    }


    /* =====================================================
       ПРОВЕРКА УСЛУГИ
    ===================================================== */

    if (!service) {

        showFormError(
            "Будь ласка, оберіть державну послугу."
        );


        focusElement(
            serviceInput
        );


        return;

    }


    /* =====================================================
       ПРОВЕРКА ОПИСАНИЯ
    ===================================================== */

    if (!message) {

        showFormError(
            "Будь ласка, опишіть ваше звернення."
        );


        focusElement(
            messageInput
        );


        return;

    }


    /* =====================================================
       КОНТАКТ
    ===================================================== */

    if (
        !phone &&
        !email &&
        !discord &&
        !contact
    ) {

        showFormError(
            "Вкажіть хоча б один спосіб зв'язку."
        );


        if (phoneInput) {

            focusElement(
                phoneInput
            );

        }


        return;

    }


    /* =====================================================
       GOOGLE SCRIPT URL
    ===================================================== */

    if (
        !GOOGLE_SCRIPT_URL ||
        GOOGLE_SCRIPT_URL.includes(
            "ВСТАВЬ"
        )
    ) {

        showFormError(
            "Google Apps Script ще не підключено."
        );


        return;

    }


    /* =====================================================
       БЛОКИРОВКА КНОПКИ
    ===================================================== */

    setSubmitState(
        submitButton,
        true
    );


    /* =====================================================
       ДАННЫЕ
    ===================================================== */

    const formData =
        new URLSearchParams();


    formData.append(
        "action",
        "application"
    );


    formData.append(
        "fullName",
        fullName
    );


    formData.append(
        "birthDate",
        birthDate
    );


    formData.append(
        "phone",
        phone
    );


    formData.append(
        "email",
        email
    );


    formData.append(
        "discord",
        discord
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


    formData.append(
        "source",
        "OLYMP Government Website"
    );


    /* =====================================================
       ОТПРАВКА
    ===================================================== */

    try {

        const response =
            await fetch(
                GOOGLE_SCRIPT_URL,
                {
                    method: "POST",

                    body: formData
                }
            );


        if (
            !response.ok
        ) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const responseText =
            await response.text();


        console.log(
            "Google Apps Script response:",
            responseText
        );


        let result;


        try {

            result =
                JSON.parse(
                    responseText
                );

        } catch (parseError) {

            console.error(
                "JSON parse error:",
                parseError
            );


            throw new Error(
                "Google Apps Script повернув некоректну відповідь."
            );

        }


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Заявку не було зареєстровано."
            );

        }


        /* =================================================
           УСПЕШНО
        ================================================= */

        showApplicationSuccess(
            result
        );


    } catch (error) {

        console.error(
            "OLYMP Government submit error:",
            error
        );


        showFormError(
            error.message ||
            "Не вдалося відправити заявку. Спробуйте ще раз."
        );


        setSubmitState(
            submitButton,
            false
        );

    }

}


/* =========================================================
   APPLICATION SUCCESS
========================================================= */

function showApplicationSuccess(
    result
) {

    const form =
        document.getElementById(
            "applicationForm"
        );


    const successMessage =
        document.getElementById(
            "successMessage"
        );


    const applicationNumber =
        document.getElementById(
            "applicationNumber"
        );


    const number =
        result &&
        result.application &&
        result.application.number
            ? result.application.number
            : result.number
                ? result.number
                : "OLYMP-000000";


    const accessCode =
        result &&
        result.application &&
        result.application.accessCode
            ? result.application.accessCode
            : result.accessCode
                ? result.accessCode
                : "";


    if (form) {

        form.style.display =
            "none";

    }


    if (applicationNumber) {

        applicationNumber.textContent =
            "№ " +
            number;

    }


    /* =====================================================
       КОД ДОСТУПА
    ===================================================== */

    let accessCodeElement =
        document.getElementById(
            "applicationAccessCode"
        );


    if (
        accessCode &&
        successMessage
    ) {

        if (!accessCodeElement) {

            accessCodeElement =
                document.createElement(
                    "div"
                );


            accessCodeElement.id =
                "applicationAccessCode";


            accessCodeElement.className =
                "success-access-code";


            successMessage.insertBefore(
                accessCodeElement,
                successMessage.querySelector(
                    "button"
                )
            );

        }


        accessCodeElement.innerHTML =
            `
                <strong>
                    Код доступу:
                </strong>

                <span>
                    ${escapeHtml(accessCode)}
                </span>

                <br>

                <small>
                    Збережіть цей код. Він потрібен
                    для входу до особистого кабінету.
                </small>
            `;

    }


    if (successMessage) {

        let statusElement =
            document.getElementById(
                "applicationStatus"
            );


        if (!statusElement) {

            statusElement =
                document.createElement(
                    "div"
                );


            statusElement.id =
                "applicationStatus";


            statusElement.style.margin =
                "10px 0";


            statusElement.style.fontWeight =
                "600";


            successMessage.insertBefore(
                statusElement,
                successMessage.querySelector(
                    "button"
                )
            );

        }


        const status =
            result &&
            result.application &&
            result.application.status
                ? result.application.status
                : result.status
                    ? result.status
                    : "🟡 На розгляді";


        statusElement.textContent =
            "Статус: " +
            status;


        successMessage.classList.add(
            "active"
        );

    }


    /* =====================================================
       СОХРАНЕНИЕ ДАННЫХ
    ===================================================== */

    try {

        localStorage.setItem(
            "olymp_last_application",
            number
        );


        if (accessCode) {

            localStorage.setItem(
                "olymp_last_access_code",
                accessCode
            );

        }

    } catch (error) {

        console.warn(
            "LocalStorage unavailable:",
            error
        );

    }

}


/* =========================================================
   RESET APPLICATION MODAL
========================================================= */

function resetApplicationModal() {

    const form =
        document.getElementById(
            "applicationForm"
        );


    const successMessage =
        document.getElementById(
            "successMessage"
        );


    if (form) {

        form.reset();

        form.style.display =
            "";

    }


    if (successMessage) {

        successMessage.classList.remove(
            "active"
        );

    }


    const accessCodeElement =
        document.getElementById(
            "applicationAccessCode"
        );


    if (accessCodeElement) {

        accessCodeElement.remove();

    }


    const statusElement =
        document.getElementById(
            "applicationStatus"
        );


    if (statusElement) {

        statusElement.remove();

    }


    if (form) {

        const button =
            form.querySelector(
                ".form-submit"
            );


        if (button) {

            setSubmitState(
                button,
                false
            );

        }

    }


    syncApplicationServices();

}


/* =========================================================
   FORM ERROR
========================================================= */

function showFormError(
    message
) {

    alert(
        message
    );

}


/* =========================================================
   FOCUS
========================================================= */

function focusElement(
    element
) {

    if (
        element &&
        typeof element.focus ===
        "function"
    ) {

        element.focus();

    }

}


/* =========================================================
   SUBMIT BUTTON STATE
========================================================= */

function setSubmitState(
    button,
    loading
) {

    if (!button) {

        return;

    }


    if (loading) {

        button.disabled =
            true;


        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent.trim();

        }


        button.textContent =
            "Відправлення...";

    } else {

        button.disabled =
            false;


        button.textContent =
            button.dataset.originalText ||
            "Надіслати заявку";

    }

}


/* =========================================================
   MODALS
========================================================= */

function initializeModals() {

    const serviceModal =
        document.getElementById(
            "serviceModal"
        );


    const applicationModal =
        document.getElementById(
            "applicationModal"
        );


    if (serviceModal) {

        serviceModal.addEventListener(
            "click",
            function (event) {

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
            function (event) {

                if (
                    event.target ===
                    applicationModal
                ) {

                    closeApplicationModal();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            closeServiceModal();

            closeApplicationModal();

        }
    );

}


/* =========================================================
   APPLY BUTTON
========================================================= */

function initializeApplyButton() {

    const applyFromService =
        document.getElementById(
            "applyFromService"
        );


    if (!applyFromService) {

        return;

    }


    applyFromService.addEventListener(
        "click",
        function () {

            const service =
                selectedService;


            closeServiceModal();


            setTimeout(
                function () {

                    openApplicationModal(
                        service
                    );

                },
                100
            );

        }
    );

}


/* =========================================================
   SCROLL ANIMATIONS
========================================================= */

function initializeScrollAnimations() {

    const animatedElements =
        document.querySelectorAll(
            ".service-card, " +
            ".government-card, " +
            ".news-card, " +
            ".law-card, " +
            ".contact-card"
        );


    if (
        !animatedElements.length
    ) {

        return;

    }


    if (
        !("IntersectionObserver" in window)
    ) {

        animatedElements.forEach(
            function (element) {

                element.classList.add(
                    "show"
                );

            }
        );


        return;

    }


    const observer =
        new IntersectionObserver(
            function (entries) {

                entries.forEach(
                    function (entry) {

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

                    }
                );

            },
            {
                threshold: 0.1
            }
        );


    animatedElements.forEach(
        function (element) {

            element.classList.add(
                "animate-element"
            );


            observer.observe(
                element
            );

        }
    );

}


/* =========================================================
   SMOOTH SCROLL
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const link =
            event.target.closest(
                'a[href^="#"]'
            );


        if (!link) {

            return;

        }


        const targetId =
            link.getAttribute(
                "href"
            );


        if (
            !targetId ||
            targetId === "#"
        ) {

            return;

        }


        let target;


        try {

            target =
                document.querySelector(
                    targetId
                );

        } catch (error) {

            return;

        }


        if (!target) {

            return;

        }


        event.preventDefault();


        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
);


/* =========================================================
   LAST APPLICATION
========================================================= */

function getLastApplicationNumber() {

    try {

        return localStorage.getItem(
            "olymp_last_application"
        );

    } catch (error) {

        return null;

    }

}


/* =========================================================
   COPY APPLICATION NUMBER
========================================================= */

function copyApplicationNumber() {

    const applicationNumber =
        document.getElementById(
            "applicationNumber"
        );


    if (!applicationNumber) {

        return;

    }


    const text =
        applicationNumber.textContent
            .replace(
                "№",
                ""
            )
            .trim();


    if (!text) {

        return;

    }


    if (
        navigator.clipboard
    ) {

        navigator.clipboard
            .writeText(text)
            .then(
                function () {

                    console.log(
                        "Номер заявки скопійовано."
                    );

                }
            )
            .catch(
                function (error) {

                    console.warn(
                        "Не вдалося скопіювати номер:",
                        error
                    );

                }
            );

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   PUBLIC API
========================================================= */

window.openService =
    openService;


window.closeServiceModal =
    closeServiceModal;


window.openApplicationModal =
    openApplicationModal;


window.closeApplicationModal =
    closeApplicationModal;


window.copyApplicationNumber =
    copyApplicationNumber;


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "%cOLYMP Government",
    "font-weight:bold;font-size:18px;"
);

console.log(
    "%cFrontend JavaScript 4.0 запущено.",
    "font-weight:bold;"
);
