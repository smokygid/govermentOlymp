/* =========================================================
   OLYMP GOVERNMENT
   Frontend JavaScript 4.0
   Державний портал
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT
========================================================= */

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzET7X9XsoUnCZlhGv8YEiv1NAoCmu13U4AP3WMlmo5sFXiwlBKhfLkXBfQKcFJh-RGog/exec";


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

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

        initializeScrollAnimations();

        updateServiceCounter();

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
        () => {

            mainMenu.classList.toggle(
                "active"
            );


            const isOpen =
                mainMenu.classList.contains(
                    "active"
                );


            menuButton.setAttribute(
                "aria-expanded",
                isOpen
            );

        }
    );


    const menuLinks =
        mainMenu.querySelectorAll(
            "a"
        );


    menuLinks.forEach(
        link => {

            link.addEventListener(
                "click",
                () => {

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

let currentCategory =
    "all";


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


    /*
     * Автоматически собираем
     * услуги из карточек.
     */

    syncApplicationServices();


    /*
     * Поиск
     */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterServices
        );

    }


    /*
     * Очистка поиска
     */

    if (clearSearch) {

        clearSearch.addEventListener(
            "click",
            () => {

                if (searchInput) {

                    searchInput.value = "";

                    searchInput.focus();

                }


                filterServices();

            }
        );

    }


    /*
     * Категории
     */

    categoryButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    categoryButtons.forEach(
                        item => {

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


    /*
     * Первичная фильтрация
     */

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
        service => {

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

                title.includes(
                    searchText
                ) ||

                description.includes(
                    searchText
                ) ||

                requirements.includes(
                    searchText
                );


            const matchesCategory =
                currentCategory === "all" ||

                category ===
                currentCategory;


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


    /*
     * Сообщение "не найдено"
     */

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


    /*
     * Кнопка очистки
     */

    const clearSearch =
        document.getElementById(
            "clearSearch"
        );


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

/*
 * Берём названия услуг непосредственно
 * из data-title карточек.
 *
 * Поэтому больше не нужно вручную
 * поддерживать <select>.
 */

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


    /*
     * Очищаем select
     */

    select.innerHTML = "";


    /*
     * Первая опция
     */

    const firstOption =
        document.createElement(
            "option"
        );


    firstOption.value =
        "";


    firstOption.textContent =
        "Оберіть послугу";


    select.appendChild(
        firstOption
    );


    /*
     * Добавляем услуги
     */

    services.forEach(
        service => {

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


    /*
     * Восстанавливаем выбранное значение
     */

    if (previousValue) {

        const exists =
            Array.from(
                select.options
            ).some(
                option =>
                    option.value ===
                    previousValue
            );


        if (exists) {

            select.value =
                previousValue;

        }

    }

}


/* =========================================================
   SERVICE MODAL
========================================================= */

let selectedService = "";


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
   APPLICATION MODAL
========================================================= */

function openApplicationModal(
    serviceName = ""
) {

    const applicationModal =
        document.getElementById(
            "applicationModal"
        );


    const applicationService =
        document.getElementById(
            "applicationService"
        );


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
     * Синхронизируем услуги
     */

    syncApplicationServices();


    /*
     * Устанавливаем услугу
     */

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
                item =>
                    item.value ===
                    normalizedService
            );


        if (option) {

            applicationService.value =
                normalizedService;

        }

    }

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


    /*
     * Защита от повторной отправки
     */

    if (
        submitButton &&
        submitButton.disabled
    ) {

        return;

    }


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


    const fullName =
        fullNameInput
            ? fullNameInput.value.trim()
            : "";


    const idNumber =
        idNumberInput
            ? idNumberInput.value.trim()
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


    /*
     * Проверка
     */

    if (!fullName) {

        showFormError(
            "Будь ласка, вкажіть ПІБ."
        );


        focusElement(
            fullNameInput
        );


        return;

    }


    if (!idNumber) {

        showFormError(
            "Будь ласка, вкажіть номер посвідчення."
        );


        focusElement(
            idNumberInput
        );


        return;

    }


    if (!service) {

        showFormError(
            "Будь ласка, оберіть державну послугу."
        );


        focusElement(
            serviceInput
        );


        return;

    }


    if (!message) {

        showFormError(
            "Будь ласка, опишіть ваше звернення."
        );


        focusElement(
            messageInput
        );


        return;

    }


    /*
     * Проверка URL
     */

    if (
        !GOOGLE_SCRIPT_URL ||
        GOOGLE_SCRIPT_URL.includes(
            "ВСТАВЬ"
        )
    ) {

        showFormError(
            "Система заявок ще не налаштована."
        );


        return;

    }


    /*
     * Блокируем кнопку
     */

    setSubmitState(
        submitButton,
        true
    );


    /*
     * Формируем данные
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
     * Дополнительные данные
     */

    formData.append(
        "source",
        "OLYMP Government Website"
    );


    formData.append(
        "userAgent",
        navigator.userAgent
    );


    try {

        /*
         * Отправляем POST
         */

        const response =
            await fetch(
                GOOGLE_SCRIPT_URL,
                {
                    method: "POST",

                    body: formData
                }
            );


        /*
         * Проверяем HTTP
         */

        if (
            !response.ok
        ) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        /*
         * Получаем JSON
         */

        const result =
            await response.json();


        /*
         * Проверяем результат
         */

        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Сервер не підтвердив реєстрацію заявки."
            );

        }


        /*
         * Успешная заявка
         */

        showApplicationSuccess(
            result
        );


    } catch (error) {

        console.error(
            "OLYMP Government:",
            error
        );


        /*
         * Если браузер блокирует
         * CORS Google Apps Script,
         * показываем понятную ошибку.
         */

        showFormError(
            "Не вдалося отримати відповідь від сервера. Перевірте підключення Google Apps Script та спробуйте ще раз."
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


    if (form) {

        form.style.display =
            "none";

    }


    if (applicationNumber) {

        const number =
            result.number ||
            "OLYMP-000000";


        applicationNumber.textContent =
            "№ " +
            number;

    }


    if (successMessage) {

        /*
         * Добавляем информацию
         * о статусе, если возможно.
         */

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


        statusElement.textContent =
            "Статус: " +
            (
                result.status ||
                "🟡 На розгляді"
            );


        successMessage.classList.add(
            "active"
        );

    }


    /*
     * Сохраняем номер локально
     */

    if (
        result.number
    ) {

        try {

            localStorage.setItem(
                "olymp_last_application",
                result.number
            );

        } catch (error) {

            console.warn(
                "LocalStorage unavailable:",
                error
            );

        }

    }

}


/* =========================================================
   FORM ERROR
========================================================= */

function showFormError(
    message
) {

    /*
     * На первом этапе используем
     * обычное alert.
     *
     * Позже можно заменить
     * на красивый toast.
     */

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


        button.dataset.originalText =
            button.textContent;


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


    /*
     * Восстанавливаем список услуг
     */

    syncApplicationServices();

}


/* =========================================================
   MODALS INITIALIZATION
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


    /*
     * Клик по фону
     */

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


    /*
     * Закрытие после transition
     */

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
     * ESC
     */

    document.addEventListener(
        "keydown",
        event => {

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
   APPLY FROM SERVICE
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
        () => {

            closeServiceModal();

            openApplicationModal(
                selectedService
            );

        }
    );

}


/*
 * Запускаем отдельно,
 * потому что кнопка уже существует
 * в HTML.
 */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeApplyButton();

    }
);


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


    /*
     * Если браузер не поддерживает
     * IntersectionObserver,
     * просто показываем элементы.
     */

    if (
        !("IntersectionObserver" in window)
    ) {

        animatedElements.forEach(
            element => {

                element.classList.add(
                    "show"
                );

            }
        );


        return;

    }


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
   SMOOTH ANCHOR SCROLL
========================================================= */

document.addEventListener(
    "click",
    event => {

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


        const target =
            document.querySelector(
                targetId
            );


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
   SERVICE BUTTONS
========================================================= */

/*
 * Для inline onclick:
 *
 * openService(this)
 * openApplicationModal(...)
 * closeServiceModal()
 * closeApplicationModal()
 *
 * функции объявлены глобально.
 *
 * Поэтому дополнительно ничего
 * подключать в HTML не требуется.
 */


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


    if (
        !text ||
        !navigator.clipboard
    ) {

        return;

    }


    navigator.clipboard
        .writeText(text)
        .then(
            () => {

                console.log(
                    "Номер заявки скопійовано."
                );

            }
        )
        .catch(
            error => {

                console.warn(
                    "Не вдалося скопіювати номер:",
                    error
                );

            }
        );

}


/* =========================================================
   PUBLIC API
========================================================= */

/*
 * Оставляем функции доступными
 * для onclick="" из HTML.
 */

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
    "Frontend JavaScript 4.0 запущено."
);
