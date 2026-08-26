/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET / GOVERNMENT PORTAL
   SCRIPT.JS 7.0

   Совместим с:
   - index.html
   - Code.gs 6.x

   ОСНОВНОЕ:
   - Государственные услуги
   - Поиск
   - Фильтрация
   - Модальные окна
   - Авторизация гражданина
   - Session Token
   - Профиль гражданина
   - Отправка заявки
   - Реальная запись в Google Sheets
   - Получение реального номера заявки
   - Получение статуса
   - Получение заявок пользователя
   - Отображение заявок в кабинете
   - Мобильное меню
   - Черновик заявки
   - Защита от повторной отправки
   - Автоматическое обновление заявок
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const OLYMP_CONFIG = {

    API_URL:
        "https://script.google.com/macros/s/AKfycbyynbAxu6A_tU5nBEUum357BCY6o8D-3e44wEtR-AlyOtV5un8mNgpmkvU6dtrIy0RvfQ/exec",

    DEBUG:
        true,

    SESSION_KEY:
        "olymp_session_token",

    USER_KEY:
        "olymp_user",

    OLYMP_ID_KEY:
        "olymp_id",

    APPLICATIONS_KEY:
        "olymp_applications",

    DRAFT_KEY:
        "olymp_application_draft_7_0"

};


/* =========================================================
   LOG
========================================================= */

function log(...args) {

    if (
        OLYMP_CONFIG.DEBUG &&
        typeof console !== "undefined"
    ) {

        console.log(
            "[OLYMP 7.0]",
            ...args
        );

    }

}


/* =========================================================
   STATE
========================================================= */

let currentService = null;

let applicationSending = false;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        log(
            "DOM загружен"
        );

        initializePortal();

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

function initializePortal() {

    initializeMobileMenu();

    initializeServiceSearch();

    initializeCategoryFilters();

    initializeApplicationForm();

    initializeModalEvents();

    initializeClearSearch();

    restoreApplicationDraft();

    updateServiceCount();

    initializeAuthState();

    initializeApplicationsRefresh();

    log(
        "OLYMP Government 7.0 инициализирован."
    );

}


/* =========================================================
   AUTH STATE
========================================================= */

function initializeAuthState() {

    const token =
        getSessionToken();

    const olympId =
        getOlympId();


    log(
        "Состояние авторизации:",
        {
            authenticated:
                Boolean(token && olympId),

            olympId:
                olympId || null,

            hasToken:
                Boolean(token)

        }
    );


    if (
        token &&
        olympId
    ) {

        loadCitizenProfile();

        loadCitizenApplications();

    }

}


/* =========================================================
   SESSION TOKEN
========================================================= */

function getSessionToken() {

    try {

        return String(
            localStorage.getItem(
                OLYMP_CONFIG.SESSION_KEY
            ) || ""
        ).trim();

    } catch (error) {

        console.warn(
            "Не удалось получить sessionToken.",
            error
        );

        return "";

    }

}


/* =========================================================
   SAVE SESSION
========================================================= */

function saveSession(
    token,
    olympId,
    citizen
) {

    try {

        if (token) {

            localStorage.setItem(
                OLYMP_CONFIG.SESSION_KEY,
                String(token)
            );

        }


        if (olympId) {

            localStorage.setItem(
                OLYMP_CONFIG.OLYMP_ID_KEY,
                String(olympId)
                    .trim()
                    .toUpperCase()
            );

        }


        if (citizen) {

            localStorage.setItem(
                OLYMP_CONFIG.USER_KEY,
                JSON.stringify(
                    citizen
                )
            );

        }


        log(
            "Сессия сохранена."
        );

    } catch (error) {

        console.warn(
            "Не удалось сохранить сессию.",
            error
        );

    }

}


/* =========================================================
   GET OLYMP ID
========================================================= */

function getOlympId() {

    try {

        return String(
            localStorage.getItem(
                OLYMP_CONFIG.OLYMP_ID_KEY
            ) || ""
        )
        .trim()
        .toUpperCase();

    } catch (error) {

        return "";

    }

}


/* =========================================================
   GET USER
========================================================= */

function getSavedUser() {

    try {

        const raw =
            localStorage.getItem(
                OLYMP_CONFIG.USER_KEY
            );


        if (!raw) {

            return null;

        }


        return JSON.parse(
            raw
        );

    } catch (error) {

        return null;

    }

}


/* =========================================================
   CLEAR SESSION
========================================================= */

function clearSession() {

    try {

        localStorage.removeItem(
            OLYMP_CONFIG.SESSION_KEY
        );

        localStorage.removeItem(
            OLYMP_CONFIG.OLYMP_ID_KEY
        );

        localStorage.removeItem(
            OLYMP_CONFIG.USER_KEY
        );

        localStorage.removeItem(
            OLYMP_CONFIG.APPLICATIONS_KEY
        );

    } catch (error) {

        console.warn(
            "Не удалось очистить сессию.",
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

    const menu =
        document.getElementById(
            "mainMenu"
        );


    if (
        !menuButton ||
        !menu
    ) {

        return;

    }


    menuButton.addEventListener(
        "click",
        function () {

            menu.classList.toggle(
                "active"
            );

        }
    );


    const links =
        menu.querySelectorAll(
            "a"
        );


    links.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    menu.classList.remove(
                        "active"
                    );

                }
            );

        }
    );

}


/* =========================================================
   SEARCH
========================================================= */

function initializeServiceSearch() {

    const search =
        document.getElementById(
            "serviceSearch"
        );


    if (!search) {

        return;

    }


    search.addEventListener(
        "input",
        filterServices
    );

}


/* =========================================================
   CLEAR SEARCH
========================================================= */

function initializeClearSearch() {

    const button =
        document.getElementById(
            "clearSearch"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function () {

            const search =
                document.getElementById(
                    "serviceSearch"
                );


            if (search) {

                search.value = "";

                search.focus();

            }


            filterServices();

        }
    );

}


/* =========================================================
   CATEGORY FILTER
========================================================= */

function initializeCategoryFilters() {

    const buttons =
        document.querySelectorAll(
            ".category-btn"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    buttons.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    filterServices();

                }
            );

        }
    );

}


/* =========================================================
   FILTER SERVICES
========================================================= */

function filterServices() {

    const search =
        document.getElementById(
            "serviceSearch"
        );


    const query =
        search
            ? search.value
                .trim()
                .toLowerCase()
            : "";


    const activeCategory =
        document.querySelector(
            ".category-btn.active"
        );


    const category =
        activeCategory
            ? String(
                activeCategory.dataset.category ||
                "all"
              ).toLowerCase()
            : "all";


    const services =
        document.querySelectorAll(
            ".service-item"
        );


    const noResults =
        document.getElementById(
            "noResults"
        );


    let visibleCount = 0;


    services.forEach(
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


            const serviceCategory =
                (
                    service.dataset.category ||
                    ""
                ).toLowerCase();


            const content =
                title +
                " " +
                description +
                " " +
                requirements;


            const matchesSearch =
                !query ||
                content.includes(
                    query
                );


            const matchesCategory =
                category === "all" ||
                serviceCategory === category;


            if (
                matchesSearch &&
                matchesCategory
            ) {

                service.style.display =
                    "";

                visibleCount++;

            } else {

                service.style.display =
                    "none";

            }

        }
    );


    if (noResults) {

        noResults.classList.toggle(
            "active",
            visibleCount === 0
        );

    }

}


/* =========================================================
   SERVICE COUNT
========================================================= */

function updateServiceCount() {

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
   OPEN SERVICE
========================================================= */

function openService(button) {

    if (!button) {

        return;

    }


    const card =
        button.closest(
            ".service-card"
        );


    if (!card) {

        return;

    }


    const title =
        card.dataset.title ||
        card.querySelector("h3")?.textContent.trim() ||
        "Державна послуга";


    const description =
        card.dataset.description ||
        card.querySelector("p")?.textContent.trim() ||
        "Інформація про державну послугу.";


    const requirements =
        card.dataset.requirements ||
        "Не вказано.";


    const category =
        card.dataset.category ||
        "government";


    const iconElement =
        card.querySelector(
            ".service-icon"
        );


    const icon =
        iconElement
            ? iconElement.textContent.trim()
            : "🏛️";


    currentService = {

        title,
        description,
        requirements,
        category,
        icon

    };


    setElementText(
        "modalIcon",
        icon
    );


    setElementText(
        "modalTitle",
        title
    );


    setElementText(
        "modalDescription",
        description
    );


    setElementText(
        "modalRequirements",
        requirements
    );


    setElementText(
        "modalCategory",
        getCategoryName(
            category
        )
    );


    const modal =
        document.getElementById(
            "serviceModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   CATEGORY NAME
========================================================= */

function getCategoryName(
    category
) {

    const categories = {

        documents:
            "ДЕРЖАВНІ ДОКУМЕНТИ",

        transport:
            "ТРАНСПОРТ",

        business:
            "БІЗНЕС",

        legal:
            "ЮРИДИЧНІ ПОСЛУГИ",

        government:
            "УРЯДОВІ ПОСЛУГИ"

    };


    return (
        categories[
            String(category)
                .toLowerCase()
        ] ||
        "ДЕРЖАВНА ПОСЛУГА"
    );

}


/* =========================================================
   CLOSE SERVICE MODAL
========================================================= */

function closeServiceModal() {

    const modal =
        document.getElementById(
            "serviceModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   SERVICE APPLICATION BUTTON
========================================================= */

function initializeServiceApplicationButton() {

    const button =
        document.getElementById(
            "applyFromService"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function () {

            const selectedService =
                currentService
                    ? currentService.title
                    : "Звернення громадянина";


            closeServiceModal();


            openApplicationModal(
                selectedService
            );

        }
    );

}


/* =========================================================
   OPEN APPLICATION MODAL
========================================================= */

function openApplicationModal(
    serviceName
) {

    const modal =
        document.getElementById(
            "applicationModal"
        );


    if (!modal) {

        return;

    }


    const form =
        document.getElementById(
            "applicationForm"
        );


    const success =
        document.getElementById(
            "successMessage"
        );


    if (success) {

        success.classList.remove(
            "active"
        );

        success.style.display =
            "none";

    }


    if (form) {

        form.style.display =
            "";

    }


    const token =
        getSessionToken();

    const olympId =
        getOlympId();


    if (
        !token ||
        !olympId
    ) {

        showFormError(
            "Для подання заявки необхідно увійти до особистого кабінету."
        );

    }


    if (
        serviceName
    ) {

        const select =
            document.getElementById(
                "applicationService"
            );


        if (select) {

            setServiceSelectValue(
                select,
                serviceName
            );

        }

    }


    fillApplicationFromSavedProfile();


    modal.classList.add(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );


    setTimeout(
        function () {

            const firstInput =
                document.getElementById(
                    "message"
                );


            if (firstInput) {

                firstInput.focus();

            }

        },
        150
    );

}


/* =========================================================
   SET SERVICE SELECT
========================================================= */

function setServiceSelectValue(
    select,
    serviceName
) {

    const options =
        Array.from(
            select.options
        );


    const normalized =
        String(
            serviceName || ""
        )
        .trim()
        .toLowerCase();


    const exact =
        options.find(
            function (option) {

                return (
                    option.value
                        .trim()
                        .toLowerCase() ===
                    normalized
                );

            }
        );


    if (exact) {

        select.value =
            exact.value;

        return;

    }


    const textMatch =
        options.find(
            function (option) {

                return (
                    option.textContent
                        .trim()
                        .toLowerCase() ===
                    normalized
                );

            }
        );


    if (textMatch) {

        select.value =
            textMatch.value;

        return;

    }


    select.value =
        "";

}


/* =========================================================
   CLOSE APPLICATION MODAL
========================================================= */

function closeApplicationModal() {

    const modal =
        document.getElementById(
            "applicationModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );


    applicationSending =
        false;


    const submitButton =
        document.querySelector(
            "#applicationForm button[type='submit']"
        );


    if (submitButton) {

        submitButton.disabled =
            false;

        submitButton.textContent =
            submitButton.dataset.originalText ||
            "Надіслати заявку";

    }

}


/* =========================================================
   MODAL EVENTS
========================================================= */

function initializeModalEvents() {

    initializeServiceApplicationButton();


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !== "Escape"
            ) {

                return;

            }


            closeServiceModal();

            closeApplicationModal();

        }
    );


    const serviceModal =
        document.getElementById(
            "serviceModal"
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


    const applicationModal =
        document.getElementById(
            "applicationModal"
        );


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
        submitApplication
    );


    const fields =
        form.querySelectorAll(
            "input, select, textarea"
        );


    fields.forEach(
        function (field) {

            field.addEventListener(
                "input",
                saveApplicationDraft
            );


            field.addEventListener(
                "change",
                saveApplicationDraft
            );

        }
    );

}


/* =========================================================
   LOAD CITIZEN PROFILE
========================================================= */

async function loadCitizenProfile() {

    const token =
        getSessionToken();

    const olympId =
        getOlympId();


    if (
        !token ||
        !olympId
    ) {

        return null;

    }


    try {

        const params =
            new URLSearchParams();


        params.append(
            "action",
            "profile"
        );


        params.append(
            "olympId",
            olympId
        );


        params.append(
            "sessionToken",
            token
        );


        const response =
            await fetch(
                OLYMP_CONFIG.API_URL +
                "?" +
                params.toString(),
                {

                    method:
                        "GET",

                    cache:
                        "no-store"

                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        log(
            "Ответ profile:",
            data
        );


        if (
            data &&
            data.success === true
        ) {

            const citizen =
                data.citizen ||
                data.profile ||
                data.user;


            if (citizen) {

                saveSession(
                    token,
                    olympId,
                    citizen
                );


                fillApplicationFromProfile(
                    citizen
                );

            }


            return data;

        }


        if (
            isSessionError(
                data
            )
        ) {

            clearSession();

        }


        return null;

    } catch (error) {

        console.warn(
            "Не вдалося завантажити профіль.",
            error
        );

        return null;

    }

}


/* =========================================================
   LOAD CITIZEN APPLICATIONS
========================================================= */

async function loadCitizenApplications() {

    const token =
        getSessionToken();

    const olympId =
        getOlympId();


    if (
        !token ||
        !olympId
    ) {

        return [];

    }


    if (
        !OLYMP_CONFIG.API_URL
    ) {

        return [];

    }


    try {

        const params =
            new URLSearchParams();


        /*
         * Основной action.
         */

        params.append(
            "action",
            "applications"
        );


        params.append(
            "olympId",
            olympId
        );


        params.append(
            "sessionToken",
            token
        );


        const response =
            await fetch(
                OLYMP_CONFIG.API_URL +
                "?" +
                params.toString(),
                {

                    method:
                        "GET",

                    cache:
                        "no-store"

                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        log(
            "Ответ applications:",
            data
        );


        if (
            !data ||
            data.success !== true
        ) {

            if (
                isSessionError(
                    data
                )
            ) {

                clearSession();

            }


            renderApplications(
                []
            );


            return [];

        }


        const applications =
            normalizeApplicationsResponse(
                data
            );


        try {

            localStorage.setItem(
                OLYMP_CONFIG.APPLICATIONS_KEY,
                JSON.stringify(
                    applications
                )
            );

        } catch (storageError) {

            console.warn(
                "Не удалось сохранить заявки локально.",
                storageError
            );

        }


        renderApplications(
            applications
        );


        updateApplicationStatistics(
            applications
        );


        return applications;

    } catch (error) {

        console.warn(
            "Не вдалося завантажити заявки громадянина.",
            error
        );


        /*
         * Если ранее уже были сохранённые заявки,
         * показываем их.
         */

        const cached =
            getCachedApplications();


        if (
            cached.length
        ) {

            renderApplications(
                cached
            );

            updateApplicationStatistics(
                cached
            );

            return cached;

        }


        renderApplications(
            []
        );


        return [];

    }

}


/* =========================================================
   NORMALIZE APPLICATION RESPONSE
========================================================= */

function normalizeApplicationsResponse(
    data
) {

    if (
        !data
    ) {

        return [];

    }


    let applications =
        data.applications ||
        data.data ||
        data.items ||
        data.requests ||
        [];


    if (
        !Array.isArray(
            applications
        )
    ) {

        applications = [];

    }


    return applications.map(
        function (item) {

            if (!item) {

                return null;

            }


            return {

                number:
                    item.number ||
                    item.applicationNumber ||
                    item.id ||
                    item.requestNumber ||
                    "",

                service:
                    item.service ||
                    item.serviceName ||
                    item.category ||
                    "Звернення громадянина",

                status:
                    item.status ||
                    "🟡 На розгляді",

                fullName:
                    item.fullName ||
                    item.name ||
                    item.fio ||
                    "",

                olympId:
                    item.olympId ||
                    item.citizenId ||
                    item.idNumber ||
                    getOlympId(),

                contact:
                    item.contact ||
                    "",

                message:
                    item.message ||
                    item.description ||
                    "",

                createdAt:
                    item.createdAt ||
                    item.date ||
                    item.created ||
                    item.timestamp ||
                    "",

                updatedAt:
                    item.updatedAt ||
                    item.updated ||
                    "",

                raw:
                    item

            };

        }
    )
    .filter(
        function (item) {

            return Boolean(
                item
            );

        }
    );

}


/* =========================================================
   CACHED APPLICATIONS
========================================================= */

function getCachedApplications() {

    try {

        const raw =
            localStorage.getItem(
                OLYMP_CONFIG.APPLICATIONS_KEY
            );


        if (!raw) {

            return [];

        }


        const data =
            JSON.parse(
                raw
            );


        return Array.isArray(
            data
        )
            ? data
            : [];

    } catch (error) {

        return [];

    }

}


/* =========================================================
   RENDER APPLICATIONS
========================================================= */

function renderApplications(
    applications
) {

    if (
        !Array.isArray(
            applications
        )
    ) {

        applications = [];

    }


    /*
     * Ищем возможные контейнеры,
     * чтобы script.js работал с разными версиями index.html.
     */

    const container =
        document.getElementById(
            "applicationsList"
        ) ||
        document.getElementById(
            "userApplications"
        ) ||
        document.getElementById(
            "applications"
        );


    if (!container) {

        log(
            "Контейнер заявок не найден."
        );

        return;

    }


    container.innerHTML =
        "";


    if (
        applications.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-applications">
                <div class="empty-applications-icon">📄</div>
                <h3>Заявок поки немає</h3>
                <p>Ваші звернення до Уряду штату з'являться тут.</p>
            </div>
        `;

        return;

    }


    /*
     * Сначала новые.
     */

    applications =
        [...applications].sort(
            function (a, b) {

                const dateA =
                    new Date(
                        a.createdAt || 0
                    ).getTime();

                const dateB =
                    new Date(
                        b.createdAt || 0
                    ).getTime();


                return dateB - dateA;

            }
        );


    applications.forEach(
        function (application) {

            const card =
                createApplicationCard(
                    application
                );


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CREATE APPLICATION CARD
========================================================= */

function createApplicationCard(
    application
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "application-card";


    const number =
        application.number ||
        "Номер не визначено";


    const service =
        application.service ||
        "Звернення громадянина";


    const status =
        application.status ||
        "🟡 На розгляді";


    const date =
        formatApplicationDate(
            application.createdAt
        );


    card.innerHTML = `
        <div class="application-card-header">
            <div>
                <div class="application-number">
                    № ${escapeHtml(number)}
                </div>

                <div class="application-date">
                    ${escapeHtml(date)}
                </div>
            </div>

            <span class="status-badge ${getStatusClass(status)}">
                ${escapeHtml(status)}
            </span>
        </div>

        <div class="application-card-body">

            <div class="application-service">
                ${escapeHtml(service)}
            </div>

            ${
                application.message
                    ? `
                        <div class="application-message">
                            ${escapeHtml(
                                truncateText(
                                    application.message,
                                    180
                                )
                            )}
                        </div>
                    `
                    : ""
            }

        </div>

        <div class="application-card-footer">

            <button
                type="button"
                class="application-view-btn"
            >
                Переглянути
            </button>

        </div>
    `;


    const button =
        card.querySelector(
            ".application-view-btn"
        );


    if (button) {

        button.addEventListener(
            "click",
            function () {

                openApplicationDetails(
                    application
                );

            }
        );

    }


    return card;

}


/* =========================================================
   OPEN APPLICATION DETAILS
========================================================= */

function openApplicationDetails(
    application
) {

    if (!application) {

        return;

    }


    /*
     * Если в index.html уже есть модальное окно заявки,
     * используем его.
     */

    const modal =
        document.getElementById(
            "applicationViewModal"
        ) ||
        document.getElementById(
            "viewApplicationModal"
        );


    if (
        modal
    ) {

        setElementText(
            "viewApplicationNumber",
            application.number
                ? "№ " +
                  application.number
                : "Номер не визначено"
        );


        setElementText(
            "viewApplicationService",
            application.service ||
            "Звернення громадянина"
        );


        setElementText(
            "viewApplicationStatus",
            application.status ||
            "🟡 На розгляді"
        );


        setElementText(
            "viewApplicationMessage",
            application.message ||
            "Опис відсутній."
        );


        setElementText(
            "viewApplicationDate",
            formatApplicationDate(
                application.createdAt
            )
        );


        modal.classList.add(
            "active"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "modal-open"
        );


        return;

    }


    /*
     * Если отдельного модального окна в HTML нет,
     * создаём его автоматически.
     */

    createApplicationDetailsModal(
        application
    );

}


/* =========================================================
   CREATE DETAILS MODAL
========================================================= */

function createApplicationDetailsModal(
    application
) {

    const old =
        document.getElementById(
            "olympDynamicApplicationModal"
        );


    if (old) {

        old.remove();

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "olympDynamicApplicationModal";


    modal.className =
        "modal olymp-dynamic-modal active";


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    modal.innerHTML = `

        <div class="modal-content">

            <button
                type="button"
                class="modal-close"
                aria-label="Закрити"
            >
                ×
            </button>

            <div class="modal-header">

                <div class="modal-icon">
                    📄
                </div>

                <div>
                    <h2>
                        Заявка
                    </h2>

                    <div class="application-number">
                        № ${escapeHtml(
                            application.number ||
                            "Номер не визначено"
                        )}
                    </div>
                </div>

            </div>

            <div class="application-detail">

                <strong>
                    Послуга
                </strong>

                <span>
                    ${escapeHtml(
                        application.service ||
                        "Звернення громадянина"
                    )}
                </span>

            </div>

            <div class="application-detail">

                <strong>
                    Статус
                </strong>

                <span class="status-badge ${getStatusClass(application.status)}">
                    ${escapeHtml(
                        application.status ||
                        "🟡 На розгляді"
                    )}
                </span>

            </div>

            <div class="application-detail">

                <strong>
                    Дата подання
                </strong>

                <span>
                    ${escapeHtml(
                        formatApplicationDate(
                            application.createdAt
                        )
                    )}
                </span>

            </div>

            <div class="application-detail application-detail-message">

                <strong>
                    Опис звернення
                </strong>

                <p>
                    ${escapeHtml(
                        application.message ||
                        "Опис відсутній."
                    )}
                </p>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const closeButton =
        modal.querySelector(
            ".modal-close"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function () {

                modal.remove();

                document.body.classList.remove(
                    "modal-open"
                );

            }
        );

    }


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modal
            ) {

                modal.remove();

                document.body.classList.remove(
                    "modal-open"
                );

            }

        }
    );


    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   UPDATE APPLICATION STATISTICS
========================================================= */

function updateApplicationStatistics(
    applications
) {

    if (
        !Array.isArray(
            applications
        )
    ) {

        applications = [];

    }


    const total =
        applications.length;


    const pending =
        applications.filter(
            function (item) {

                return String(
                    item.status || ""
                ).includes(
                    "На розгляді"
                );

            }
        ).length;


    const accepted =
        applications.filter(
            function (item) {

                return String(
                    item.status || ""
                ).includes(
                    "Прийнято"
                );

            }
        ).length;


    const completed =
        applications.filter(
            function (item) {

                return String(
                    item.status || ""
                ).includes(
                    "Виконано"
                );

            }
        ).length;


    const rejected =
        applications.filter(
            function (item) {

                return String(
                    item.status || ""
                ).includes(
                    "Відхилено"
                );

            }
        ).length;


    const closed =
        applications.filter(
            function (item) {

                return String(
                    item.status || ""
                ).includes(
                    "Закрито"
                );

            }
        ).length;


    setFirstExistingText(
        [
            "applicationsCount",
            "totalApplications",
            "statTotalApplications"
        ],
        total
    );


    setFirstExistingText(
        [
            "pendingApplications",
            "statPendingApplications"
        ],
        pending
    );


    setFirstExistingText(
        [
            "acceptedApplications",
            "statAcceptedApplications"
        ],
        accepted
    );


    setFirstExistingText(
        [
            "completedApplications",
            "statCompletedApplications"
        ],
        completed
    );


    setFirstExistingText(
        [
            "rejectedApplications",
            "statRejectedApplications"
        ],
        rejected
    );


    setFirstExistingText(
        [
            "closedApplications",
            "statClosedApplications"
        ],
        closed
    );

}


/* =========================================================
   REFRESH APPLICATIONS
========================================================= */

function initializeApplicationsRefresh() {

    const buttons =
        document.querySelectorAll(
            "[data-refresh-applications]"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    loadCitizenApplications();

                }
            );

        }
    );


    /*
     * Если на странице есть список заявок,
     * можно обновить его событием.
     */

    window.addEventListener(
        "olymp:refresh-applications",
        function () {

            loadCitizenApplications();

        }
    );

}


/* =========================================================
   FILL FROM SAVED PROFILE
========================================================= */

function fillApplicationFromSavedProfile() {

    const user =
        getSavedUser();


    if (
        user
    ) {

        fillApplicationFromProfile(
            user
        );

    }

}


/* =========================================================
   FILL APPLICATION FROM PROFILE
========================================================= */

function fillApplicationFromProfile(
    citizen
) {

    if (!citizen) {

        return;

    }


    setInputIfExists(
        "fullName",
        citizen.fullName ||
        citizen.name ||
        citizen.fio ||
        ""
    );


    setInputIfExists(
        "idNumber",
        citizen.olympId ||
        citizen.citizenId ||
        citizen.idNumber ||
        getOlympId()
    );


    setInputIfExists(
        "contact",
        citizen.contact ||
        citizen.preferredContact ||
        ""
    );


    log(
        "Данные гражданина подставлены в форму."
    );

}


/* =========================================================
   SET INPUT IF EXISTS
========================================================= */

function setInputIfExists(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    if (
        value !== undefined &&
        value !== null
    ) {

        element.value =
            String(value);

    }

}


/* =========================================================
   SUBMIT APPLICATION
========================================================= */

async function submitApplication(
    event
) {

    event.preventDefault();


    if (
        applicationSending
    ) {

        return;

    }


    const form =
        document.getElementById(
            "applicationForm"
        );


    if (!form) {

        return;

    }


    /*
     * Авторизация.
     */

    const token =
        getSessionToken();


    const olympId =
        getOlympId();


    if (
        !token ||
        !olympId
    ) {

        showFormError(
            "Для подання заявки необхідно увійти до особистого кабінету."
        );


        return;

    }


    /*
     * Данные.
     */

    const fullName =
        getInputValue(
            "fullName"
        );


    const idNumber =
        getInputValue(
            "idNumber"
        );


    const service =
        getInputValue(
            "applicationService"
        );


    const contact =
        getInputValue(
            "contact"
        );


    const message =
        getInputValue(
            "message"
        );


    /*
     * Проверка ПІБ.
     */

    if (!fullName) {

        showFormError(
            "Вкажіть ПІБ."
        );

        focusElement(
            "fullName"
        );

        return;

    }


    /*
     * Проверка ID.
     */

    if (!idNumber) {

        showFormError(
            "OLYMP-ID не визначено."
        );

        focusElement(
            "idNumber"
        );

        return;

    }


    if (
        normalizeOlympIdClient(
            idNumber
        ) !==
        normalizeOlympIdClient(
            olympId
        )
    ) {

        showFormError(
            "OLYMP-ID не відповідає поточному користувачу."
        );

        return;

    }


    /*
     * Услуга.
     */

    if (!service) {

        showFormError(
            "Оберіть державну послугу."
        );

        focusElement(
            "applicationService"
        );

        return;

    }


    /*
     * Сообщение.
     */

    if (!message) {

        showFormError(
            "Вкажіть опис звернення."
        );

        focusElement(
            "message"
        );

        return;

    }


    /*
     * API.
     */

    if (
        !OLYMP_CONFIG.API_URL
    ) {

        showFormError(
            "URL Google Apps Script не налаштований."
        );

        return;

    }


    applicationSending =
        true;


    const submitButton =
        form.querySelector(
            "button[type='submit']"
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.dataset.originalText =
            submitButton.textContent;

        submitButton.textContent =
            "Відправлення...";

    }


    /*
     * PAYLOAD
     */

    const payload = {

        action:
            "createapplication",

        olympId:
            olympId,

        idNumber:
            olympId,

        sessionToken:
            token,

        token:
            token,

        fullName:
            fullName,

        service:
            service,

        contact:
            contact,

        message:
            message

    };


    log(
        "Отправляем заявку:",
        payload
    );


    try {

        /*
         * Google Apps Script Web App.
         *
         * Content-Type text/plain используется,
         * чтобы не создавать лишний CORS preflight.
         */

        const response =
            await fetch(
                OLYMP_CONFIG.API_URL,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify(
                            payload
                        ),

                    redirect:
                        "follow",

                    cache:
                        "no-store"

                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const responseText =
            await response.text();


        log(
            "Ответ Code.gs:",
            responseText
        );


        let data;


        try {

            data =
                JSON.parse(
                    responseText
                );

        } catch (jsonError) {

            console.error(
                "Code.gs вернул не JSON:",
                responseText
            );


            throw new Error(
                "Сервер повернув некоректну відповідь."
            );

        }


        /*
         * =====================================================
         * КРИТИЧЕСКИ ВАЖНО
         *
         * Только success === true означает,
         * что заявка действительно принята сервером.
         * =====================================================
         */

        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data &&
                data.message
                    ? data.message
                    : "Не вдалося зберегти заявку."
            );

        }


        /*
         * Получаем реальную заявку.
         */

        const application =
            data.application ||
            data.request ||
            data.data ||
            {};


        /*
         * Получаем реальный номер.
         */

        const realNumber =
            data.number ||
            data.applicationNumber ||
            application.number ||
            application.applicationNumber ||
            application.requestNumber ||
            "";


        /*
         * ВАЖНО:
         *
         * Если сервер сообщил success=true,
         * но не передал номер — не придумываем
         * настоящий номер.
         */

        if (!realNumber) {

            log(
                "Сервер подтвердил заявку, но номер не передан.",
                data
            );

        }


        const realStatus =
            application.status ||
            data.status ||
            "🟡 На розгляді";


        /*
         * Показываем подтверждение.
         */

        showApplicationSuccess(
            {

                number:
                    realNumber,

                status:
                    realStatus,

                application:
                    application

            },

            service
        );


        /*
         * Удаляем черновик.
         */

        clearApplicationDraft();


        /*
         * Разрешаем новую отправку.
         */

        applicationSending =
            false;


        /*
         * Восстанавливаем кнопку.
         */

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                submitButton.dataset.originalText ||
                "Надіслати заявку";

        }


        /*
         * После создания заявки
         * сразу обновляем список.
         */

        setTimeout(
            function () {

                loadCitizenApplications();

            },
            500
        );


        log(
            "Заявка успешно сохранена сервером.",
            data
        );


    } catch (error) {

        console.error(
            "Ошибка отправки заявки:",
            error
        );


        /*
         * НИКАКОГО ЛОЖНОГО УСПЕХА.
         *
         * Если fetch не получил подтверждение
         * success:true — заявка считается
         * НЕ подтверждённой.
         */

        showFormError(
            getApplicationErrorMessage(
                error
            )
        );


        applicationSending =
            false;


        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                submitButton.dataset.originalText ||
                "Надіслати заявку";

        }

    }

}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getApplicationErrorMessage(
    error
) {

    if (!error) {

        return "Не вдалося відправити заявку.";

    }


    const message =
        String(
            error.message ||
            ""
        ).trim();


    if (
        message.includes(
            "Failed to fetch"
        ) ||
        message.includes(
            "NetworkError"
        ) ||
        message.includes(
            "Network Error"
        )
    ) {

        return (
            "Не вдалося отримати відповідь від сервера. " +
            "Заявку НЕ підтверджено. Перевірте підключення " +
            "до Google Apps Script."
        );

    }


    return (
        message ||
        "Не вдалося відправити заявку."
    );

}


/* =========================================================
   SESSION ERROR
========================================================= */

function isSessionError(
    data
) {

    if (!data) {

        return false;

    }


    const message =
        String(
            data.message ||
            data.error ||
            ""
        ).toLowerCase();


    return (
        message.includes(
            "сес"
        ) ||
        message.includes(
            "session"
        ) ||
        message.includes(
            "token"
        ) ||
        message.includes(
            "авториза"
        )
    );

}


/* =========================================================
   SUCCESS
========================================================= */

function showApplicationSuccess(
    response,
    service
) {

    const form =
        document.getElementById(
            "applicationForm"
        );


    const success =
        document.getElementById(
            "successMessage"
        );


    if (!success) {

        return;

    }


    if (form) {

        form.style.display =
            "none";

    }


    success.style.display =
        "block";


    success.classList.add(
        "active"
    );


    /*
     * Реальный номер.
     *
     * Если сервер не передал номер,
     * НЕ создаём фальшивый номер.
     */

    const number =
        response &&
        response.number
            ? response.number
            : "Очікується";


    setElementText(
        "applicationNumber",
        number === "Очікується"
            ? "№ Очікується"
            : "№ " + number
    );


    /*
     * Статус.
     */

    setApplicationStatus(
        response &&
        response.status
            ? response.status
            : "🟡 На розгляді"
    );


    /*
     * Текст.
     */

    const successText =
        success.querySelector(
            "p"
        );


    if (successText) {

        successText.textContent =
            number === "Очікується"
                ? "Заявку прийнято сервером. Номер заявки буде доступний після оновлення даних."
                : "Ваше звернення успішно зареєстровано та передано до Уряду штату Olymp.";

    }


    log(
        "Успішна заявка:",
        {
            number,
            service
        }
    );

}


/* =========================================================
   STATUS
========================================================= */

function setApplicationStatus(
    status
) {

    const container =
        document.getElementById(
            "applicationStatus"
        );


    if (!container) {

        return;

    }


    const badge =
        container.querySelector(
            ".status-badge"
        );


    if (!badge) {

        return;

    }


    badge.textContent =
        status;


    badge.classList.remove(
        "pending",
        "accepted",
        "completed",
        "rejected",
        "closed"
    );


    badge.classList.add(
        getStatusClass(
            status
        )
    );

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(
    status
) {

    const value =
        String(
            status || ""
        ).toLowerCase();


    if (
        value.includes(
            "на розгляді"
        ) ||
        value.includes(
            "pending"
        )
    ) {

        return "pending";

    }


    if (
        value.includes(
            "прийнято"
        ) ||
        value.includes(
            "accepted"
        )
    ) {

        return "accepted";

    }


    if (
        value.includes(
            "виконано"
        ) ||
        value.includes(
            "completed"
        )
    ) {

        return "completed";

    }


    if (
        value.includes(
            "відхилено"
        ) ||
        value.includes(
            "rejected"
        )
    ) {

        return "rejected";

    }


    if (
        value.includes(
            "закрито"
        ) ||
        value.includes(
            "closed"
        )
    ) {

        return "closed";

    }


    return "pending";

}


/* =========================================================
   FORM ERROR
========================================================= */

function showFormError(
    message
) {

    const old =
        document.querySelector(
            ".olymp-form-error"
        );


    if (old) {

        old.remove();

    }


    const form =
        document.getElementById(
            "applicationForm"
        );


    if (!form) {

        alert(
            message
        );

        return;

    }


    const error =
        document.createElement(
            "div"
        );


    error.className =
        "olymp-form-error";


    error.textContent =
        message;


    error.style.marginBottom =
        "15px";


    error.style.padding =
        "12px 15px";


    error.style.borderRadius =
        "8px";


    error.style.background =
        "#ffe6e6";


    error.style.color =
        "#9b1c1c";


    error.style.fontSize =
        "14px";


    error.style.fontWeight =
        "600";


    form.prepend(
        error
    );


    setTimeout(
        function () {

            if (
                error.parentNode
            ) {

                error.remove();

            }

        },
        6000
    );

}


/* =========================================================
   GET INPUT VALUE
========================================================= */

function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


/* =========================================================
   SET ELEMENT TEXT
========================================================= */

function setElementText(
    id,
    text
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.textContent =
        text === undefined ||
        text === null
            ? ""
            : String(text);

}


/* =========================================================
   SET FIRST EXISTING TEXT
========================================================= */

function setFirstExistingText(
    ids,
    value
) {

    if (
        !Array.isArray(
            ids
        )
    ) {

        return;

    }


    for (
        let i = 0;
        i < ids.length;
        i++
    ) {

        const element =
            document.getElementById(
                ids[i]
            );


        if (element) {

            element.textContent =
                String(value);

            return;

        }

    }

}


/* =========================================================
   FOCUS
========================================================= */

function focusElement(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    setTimeout(
        function () {

            element.focus();

        },
        50
    );

}


/* =========================================================
   NORMALIZE OLYMP ID
========================================================= */

function normalizeOlympIdClient(
    value
) {

    let result =
        String(
            value || ""
        )
        .toUpperCase()
        .trim()
        .replace(
            /\s+/g,
            ""
        );


    /*
     * OLYMP000001 → OLYMP-000001
     */

    if (
        /^OLYMP\d{6}$/.test(
            result
        )
    ) {

        result =
            "OLYMP-" +
            result.substring(5);

    }


    /*
     * OLYMP0001 → OLYMP-0001
     */

    if (
        /^OLYMP\d{4}$/.test(
            result
        )
    ) {

        result =
            "OLYMP-" +
            result.substring(5);

    }


    return result;

}


/* =========================================================
   DRAFT
========================================================= */

function saveApplicationDraft() {

    try {

        const data = {

            fullName:
                getInputValue(
                    "fullName"
                ),

            idNumber:
                getInputValue(
                    "idNumber"
                ),

            service:
                getInputValue(
                    "applicationService"
                ),

            contact:
                getInputValue(
                    "contact"
                ),

            message:
                getInputValue(
                    "message"
                )

        };


        localStorage.setItem(
            OLYMP_CONFIG.DRAFT_KEY,
            JSON.stringify(
                data
            )
        );

    } catch (error) {

        console.warn(
            "Не удалось сохранить черновик.",
            error
        );

    }

}


/* =========================================================
   RESTORE DRAFT
========================================================= */

function restoreApplicationDraft() {

    try {

        const saved =
            localStorage.getItem(
                OLYMP_CONFIG.DRAFT_KEY
            );


        if (!saved) {

            return;

        }


        const data =
            JSON.parse(
                saved
            );


        if (
            data.fullName
        ) {

            setInputValue(
                "fullName",
                data.fullName
            );

        }


        if (
            data.idNumber
        ) {

            setInputValue(
                "idNumber",
                data.idNumber
            );

        }


        if (
            data.service
        ) {

            setInputValue(
                "applicationService",
                data.service
            );

        }


        if (
            data.contact
        ) {

            setInputValue(
                "contact",
                data.contact
            );

        }


        if (
            data.message
        ) {

            setInputValue(
                "message",
                data.message
            );

        }


        log(
            "Черновик восстановлен."
        );

    } catch (error) {

        console.warn(
            "Не удалось восстановить черновик.",
            error
        );

    }

}


/* =========================================================
   SET INPUT VALUE
========================================================= */

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.value =
        value;

}


/* =========================================================
   CLEAR DRAFT
========================================================= */

function clearApplicationDraft() {

    try {

        localStorage.removeItem(
            OLYMP_CONFIG.DRAFT_KEY
        );

    } catch (error) {

        console.warn(
            "Не удалось удалить черновик.",
            error
        );

    }

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatApplicationDate(
    value
) {

    if (!value) {

        return "Дата не вказана";

    }


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            value
        );

    }


    try {

        return new Intl.DateTimeFormat(
            "uk-UA",
            {

                day:
                    "2-digit",

                month:
                    "2-digit",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        ).format(
            date
        );

    } catch (error) {

        return date.toLocaleString();

    }

}


/* =========================================================
   TRUNCATE TEXT
========================================================= */

function truncateText(
    text,
    length
) {

    const value =
        String(
            text || ""
        );


    if (
        value.length <= length
    ) {

        return value;

    }


    return (
        value.substring(
            0,
            length
        ) +
        "..."
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value === undefined ||
        value === null
            ? ""
            : value
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
   HASH / URL LINKS
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const link =
            event.target.closest(
                "a[href='#']"
            );


        if (!link) {

            return;

        }


        event.preventDefault();

    }
);


/* =========================================================
   SMOOTH NAVIGATION
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
   HEADER SCROLL
========================================================= */

window.addEventListener(
    "scroll",
    function () {

        const header =
            document.getElementById(
                "header"
            );


        if (!header) {

            return;

        }


        if (
            window.scrollY > 30
        ) {

            header.classList.add(
                "scrolled"
            );

        } else {

            header.classList.remove(
                "scrolled"
            );

        }

    },
    {
        passive: true
    }
);


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.openService =
    openService;


window.openApplicationModal =
    openApplicationModal;


window.closeServiceModal =
    closeServiceModal;


window.closeApplicationModal =
    closeApplicationModal;


window.loadCitizenProfile =
    loadCitizenProfile;


window.loadCitizenApplications =
    loadCitizenApplications;


window.renderApplications =
    renderApplications;


/* =========================================================
   FINISH
========================================================= */

log(
    "OLYMP Government Script 7.0 готов."
);
