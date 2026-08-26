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
   • Перевірка авторизації
   • OLYMP-ID
   • Автоматичне заповнення профілю
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
   SESSION
========================================================= */

const CITIZEN_SESSION_KEY =
    "olympCitizenSession";


const LAST_APPLICATION_KEY =
    "olymp_last_application";


const LAST_ACCESS_CODE_KEY =
    "olymp_last_access_code";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentCategory =
    "all";


let selectedService =
    "";


/*
   Данные авторизованного гражданина
*/

let currentCitizen =
    null;


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

        restoreCitizenSession();

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
   SESSION
========================================================= */


/*
   Получение сохранённой сессии.
*/

function getCitizenSession() {

    try {

        const raw =
            localStorage.getItem(
                CITIZEN_SESSION_KEY
            );


        if (!raw) {

            return null;

        }


        const session =
            JSON.parse(
                raw
            );


        if (
            !session ||
            typeof session !== "object"
        ) {

            return null;

        }


        if (
            !session.olympId ||
            !session.password
        ) {

            return null;

        }


        return session;

    } catch (error) {

        console.error(
            "SESSION READ ERROR:",
            error
        );


        return null;

    }

}


/*
   Восстановление гражданина из сохранённой сессии.

   ВАЖНО:
   Мы не считаем наличие localStorage
   полной авторизацией.

   Сначала используем данные сессии,
   затем при необходимости профиль кабинета
   обновит их.
*/

function restoreCitizenSession() {

    const session =
        getCitizenSession();


    if (!session) {

        currentCitizen =
            null;

        updateHeaderAuthorization();

        return;

    }


    currentCitizen = {

        olympId:
            clean(
                session.olympId
            ).toUpperCase(),

        fullName:
            clean(
                session.fullName ||
                ""
            ),

        birthDate:
            clean(
                session.birthDate ||
                ""
            ),

        phone:
            clean(
                session.phone ||
                ""
            ),

        email:
            clean(
                session.email ||
                ""
            ),

        discord:
            clean(
                session.discord ||
                ""
            ),

        contact:
            clean(
                session.contact ||
                ""
            )

    };


    updateHeaderAuthorization();

}


/*
   Проверка авторизации.

   Главная функция для заявки.
*/

function isCitizenAuthorized() {

    const session =
        getCitizenSession();


    if (!session) {

        return false;

    }


    if (
        !session.olympId ||
        !session.password
    ) {

        return false;

    }


    const olympId =
        clean(
            session.olympId
        ).toUpperCase();


    /*
       Проверяем формат ID.
    */

    if (
        !/^OLYMP-\d{6}$/.test(
            olympId
        )
    ) {

        return false;

    }


    return true;

}


/*
   Получение OLYMP-ID.
*/

function getCurrentOlympId() {

    const session =
        getCitizenSession();


    if (
        session &&
        session.olympId
    ) {

        return clean(
            session.olympId
        ).toUpperCase();

    }


    if (
        currentCitizen &&
        currentCitizen.olympId
    ) {

        return clean(
            currentCitizen.olympId
        ).toUpperCase();

    }


    return "";

}


/*
   Получение пароля сессии.
*/

function getCurrentPassword() {

    const session =
        getCitizenSession();


    if (
        session &&
        session.password
    ) {

        return String(
            session.password
        );

    }


    return "";

}


/*
   Сохраняем дополнительные данные
   гражданина в существующую сессию.
*/

function updateSessionCitizenData(
    citizen
) {

    if (!citizen) {

        return;

    }


    try {

        const session =
            getCitizenSession();


        if (!session) {

            return;

        }


        session.fullName =
            citizen.fullName ||
            session.fullName ||
            "";


        session.birthDate =
            citizen.birthDate ||
            session.birthDate ||
            "";


        session.phone =
            citizen.phone ||
            session.phone ||
            "";


        session.email =
            citizen.email ||
            session.email ||
            "";


        session.discord =
            citizen.discord ||
            session.discord ||
            "";


        session.contact =
            citizen.contact ||
            session.contact ||
            "";


        session.savedAt =
            Date.now();


        localStorage.setItem(
            CITIZEN_SESSION_KEY,
            JSON.stringify(
                session
            )
        );


    } catch (error) {

        console.warn(
            "SESSION UPDATE ERROR:",
            error
        );

    }

}


/* =========================================================
   AUTHORIZATION UI
========================================================= */

function updateHeaderAuthorization() {

    /*
       Не обязательная функция.

       Если в HTML есть:
       #cabinetLoginStatus
       #authUserName
       #authOlympId

       они автоматически обновятся.
    */

    const status =
        document.getElementById(
            "cabinetLoginStatus"
        );


    const name =
        document.getElementById(
            "authUserName"
        );


    const olympId =
        document.getElementById(
            "authOlympId"
        );


    if (
        !isCitizenAuthorized()
    ) {

        if (status) {

            status.textContent =
                "Не авторизовано";

        }


        if (name) {

            name.textContent =
                "Гість";

        }


        if (olympId) {

            olympId.textContent =
                "—";

        }


        return;

    }


    const currentId =
        getCurrentOlympId();


    const currentName =
        currentCitizen &&
        currentCitizen.fullName
            ? currentCitizen.fullName
            : "Громадянин";


    if (status) {

        status.textContent =
            "Авторизовано";

    }


    if (name) {

        name.textContent =
            currentName;

    }


    if (olympId) {

        olympId.textContent =
            currentId ||
            "—";

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


    if (
        !menuButton ||
        !mainMenu
    ) {

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

                    searchInput.value =
                        "";

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


    const clearSearch =
        document.getElementById(
            "clearSearch"
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


    let visibleCount =
        0;


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


    select.innerHTML =
        "";


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

    /*
       КРИТИЧЕСКАЯ ПРОВЕРКА.

       Пользователь должен быть авторизован.
    */

    if (
        !isCitizenAuthorized()
    ) {

        showAuthorizationRequired();

        return;

    }


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


    /*
       Обновляем данные пользователя.
    */

    restoreCitizenSession();


    /*
       Синхронизируем услуги.
    */

    syncApplicationServices();


    /*
       Автоматически заполняем
       форму данными гражданина.
    */

    fillApplicationFormFromCitizen();


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
   AUTHORIZATION REQUIRED
========================================================= */

function showAuthorizationRequired() {

    const confirmed =
        window.confirm(
            "Для подання заявки необхідно увійти до особистого кабінету.\n\nПерейти до входу?"
        );


    if (!confirmed) {

        return;

    }


    /*
       Если на странице есть loginSection —
       показываем его.
    */

    const loginSection =
        document.getElementById(
            "loginSection"
        );


    if (loginSection) {

        loginSection.scrollIntoView({
            behavior:
                "smooth",

            block:
                "start"
        });


        const olympId =
            document.getElementById(
                "olympId"
            );


        if (olympId) {

            setTimeout(
                function () {

                    olympId.focus();

                },
                500
            );

        }


        return;

    }


    /*
       Если отдельная страница login.html.
    */

    window.location.href =
        "login.html";

}


/* =========================================================
   FILL APPLICATION FORM
========================================================= */

function fillApplicationFormFromCitizen() {

    if (
        !currentCitizen
    ) {

        return;

    }


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


    const contactInput =
        document.getElementById(
            "contact"
        );


    if (
        fullNameInput &&
        !fullNameInput.value
    ) {

        fullNameInput.value =
            currentCitizen.fullName ||
            "";

    }


    if (
        birthDateInput &&
        !birthDateInput.value
    ) {

        birthDateInput.value =
            currentCitizen.birthDate ||
            "";

    }


    if (
        phoneInput &&
        !phoneInput.value
    ) {

        phoneInput.value =
            currentCitizen.phone ||
            "";

    }


    if (
        emailInput &&
        !emailInput.value
    ) {

        emailInput.value =
            currentCitizen.email ||
            "";

    }


    if (
        discordInput &&
        !discordInput.value
    ) {

        discordInput.value =
            currentCitizen.discord ||
            "";

    }


    if (
        contactInput &&
        !contactInput.value
    ) {

        contactInput.value =
            currentCitizen.contact ||
            "";

    }


    /*
       Если в форме есть OLYMP-ID,
       заполняем автоматически.
    */

    const olympIdInput =
        document.getElementById(
            "applicationOlympId"
        );


    if (olympIdInput) {

        olympIdInput.value =
            getCurrentOlympId();

    }


    const olympIdInput2 =
        document.getElementById(
            "olympId"
        );


    if (
        olympIdInput2 &&
        olympIdInput2.closest(
            "#applicationForm"
        )
    ) {

        olympIdInput2.value =
            getCurrentOlympId();

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


    /*
       ======================================================
       ГЛАВНАЯ ПРОВЕРКА АВТОРИЗАЦИИ
       ======================================================
    */

    if (
        !isCitizenAuthorized()
    ) {

        showAuthorizationRequired();

        return;

    }


    /*
       Восстанавливаем актуальные данные.
    */

    restoreCitizenSession();


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
       OLYMP-ID
    ===================================================== */

    const olympId =
        getCurrentOlympId();


    if (!olympId) {

        showFormError(
            "Не вдалося визначити ваш OLYMP-ID. Увійдіть до особистого кабінету повторно."
        );


        return;

    }


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
       ПІБ
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
       УСЛУГА
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
       ОПИСАНИЕ
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


        focusElement(
            phoneInput
        );


        return;

    }


    /* =====================================================
       GOOGLE SCRIPT
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
       LOCK
    ===================================================== */

    setSubmitState(
        submitButton,
        true
    );


    /* =====================================================
       DATA
    ===================================================== */

    const formData =
        new URLSearchParams();


    /*
       Основное действие.
    */

    formData.append(
        "action",
        "application"
    );


    /*
       Авторизованный пользователь.
    */

    formData.append(
        "olympId",
        olympId
    );


    formData.append(
        "idNumber",
        olympId
    );


    /*
       Данные гражданина.
    */

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


    /*
       Версия системы.
    */

    formData.append(
        "cabinetVersion",
        "4.0"
    );


    /* =====================================================
       SEND
    ===================================================== */

    try {

        const response =
            await fetch(
                GOOGLE_SCRIPT_URL,
                {

                    method:
                        "POST",

                    body:
                        formData

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

        } catch (
            parseError
        ) {

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

                    ?

                result.message

                    :

                "Заявку не було зареєстровано."

            );

        }


        /* =================================================
           SUCCESS
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

            ?

        result.application.number

            :

        result &&
        result.number

            ?

        result.number

            :

        "OLYMP-000000";


    const accessCode =
        result &&
        result.application &&
        result.application.accessCode

            ?

        result.application.accessCode

            :

        result &&
        result.accessCode

            ?

        result.accessCode

            :

        "";


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
       ACCESS CODE
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
                    Збережіть цей код.
                    Він потрібен для входу
                    до особистого кабінету.
                </small>
            `;

    }


    /* =====================================================
       STATUS
    ===================================================== */

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

                ?

            result.application.status

                :

            result &&
            result.status

                ?

            result.status

                :

            "🟡 На розгляді";


        statusElement.textContent =
            "Статус: " +
            status;


        successMessage.classList.add(
            "active"
        );

    }


    /* =====================================================
       LOCAL STORAGE
    ===================================================== */

    try {

        localStorage.setItem(
            LAST_APPLICATION_KEY,
            number
        );


        if (accessCode) {

            localStorage.setItem(
                LAST_ACCESS_CODE_KEY,
                accessCode
            );

        }

    } catch (error) {

        console.warn(
            "LocalStorage unavailable:",
            error
        );

    }


    /*
       Обновляем данные текущего гражданина,
       если API вернул их.
    */

    if (
        result &&
        result.citizen
    ) {

        currentCitizen =
            normalizeCitizen(
                result.citizen
            );


        updateSessionCitizenData(
            currentCitizen
        );

    }


    /*
       Уведомление.
    */

    console.log(
        "Заявка успішно зареєстрована:",
        number
    );

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


    /*
       После reset снова заполняем
       личные данные пользователя.
    */

    if (
        isCitizenAuthorized()
    ) {

        restoreCitizenSession();

        fillApplicationFormFromCitizen();

    }

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

            /*
               Проверка авторизации
               ДО открытия формы.
            */

            if (
                !isCitizenAuthorized()
            ) {

                closeServiceModal();

                showAuthorizationRequired();

                return;

            }


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
        !(
            "IntersectionObserver"
            in
            window
        )
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
                threshold:
                    0.1
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
            behavior:
                "smooth",

            block:
                "start"
        });

    }
);


/* =========================================================
   LAST APPLICATION
========================================================= */

function getLastApplicationNumber() {

    try {

        return localStorage.getItem(
            LAST_APPLICATION_KEY
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
            .writeText(
                text
            )
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

    return String(
        value
    )
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
   CLEAN
========================================================= */

function clean(
    value
) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(
        value
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        );

}


/* =========================================================
   NORMALIZE CITIZEN
========================================================= */

function normalizeCitizen(
    citizen
) {

    if (
        !citizen ||
        typeof citizen !==
        "object"
    ) {

        return null;

    }


    return {

        olympId:
            clean(
                citizen.olympId ||
                citizen.idNumber ||
                citizen.number ||
                ""
            ).toUpperCase(),


        fullName:
            clean(
                citizen.fullName ||
                citizen.name ||
                citizen.fio ||
                ""
            ),


        birthDate:
            clean(
                citizen.birthDate ||
                citizen.dateOfBirth ||
                ""
            ),


        phone:
            clean(
                citizen.phone ||
                ""
            ),


        email:
            clean(
                citizen.email ||
                ""
            ).toLowerCase(),


        discord:
            clean(
                citizen.discord ||
                ""
            ),


        contact:
            clean(
                citizen.contact ||
                citizen.preferredContact ||
                ""
            ),


        status:
            clean(
                citizen.status ||
                "Активний"
            ),


        registrationDate:
            clean(
                citizen.registrationDate ||
                citizen.createdAt ||
                ""
            )

    };

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


window.isCitizenAuthorized =
    isCitizenAuthorized;


window.getCurrentOlympId =
    getCurrentOlympId;


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


/*
   Показываем состояние авторизации
   в консоли для проверки.
*/

console.log(
    "OLYMP AUTH:",
    isCitizenAuthorized()
        ? "AUTHORIZED"
        : "NOT AUTHORIZED"
);


console.log(
    "OLYMP-ID:",
    getCurrentOlympId() ||
    "—"
);
