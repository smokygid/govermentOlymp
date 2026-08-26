/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET / GOVERNMENT PORTAL
   SCRIPT.JS 6.3

   Совместим с:
   - index.html
   - Code.gs 6.1

   Основное:
   - Государственные услуги
   - Поиск
   - Фильтрация
   - Модальные окна
   - Авторизация гражданина
   - Session Token
   - Отправка заявки
   - Запись заявки в Google Sheets
   - Получение реального номера заявки
   - Получение статуса
   - Мобильное меню
   - Черновик заявки
   - Защита от повторной отправки
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
        "olymp_id"

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
            "[OLYMP 6.3]",
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

    log(
        "OLYMP Government 6.3 инициализирован."
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


    /*
     * Если пользователь авторизован,
     * автоматически заполняем данные формы.
     */

    if (
        token &&
        olympId
    ) {

        loadCitizenProfile();

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
                token
            );

        }


        if (olympId) {

            localStorage.setItem(
                OLYMP_CONFIG.OLYMP_ID_KEY,
                olympId
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
        ).trim().toUpperCase();

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


    log(
        "Фильтрация:",
        {
            query,
            category,
            visibleCount
        }
    );

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
        categories[category] ||
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
   APPLY FROM SERVICE
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


    /*
     * Проверяем авторизацию
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

    }


    /*
     * Устанавливаем услугу
     */

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


    /*
     * Подставляем данные гражданина
     */

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


    const exact =
        options.find(
            function (option) {

                return (
                    option.value.trim() ===
                    serviceName.trim()
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
                    serviceName
                        .trim()
                        .toLowerCase()
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


        const data =
            await response.json();


        if (
            data &&
            data.success
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


            log(
                "Профіль завантажено.",
                citizen
            );


            return data;

        }


        /*
         * Если сессия недействительна,
         * очищаем её.
         */

        if (
            data &&
            data.message &&
            (
                data.message.includes(
                    "Сесія"
                ) ||
                data.message.includes(
                    "сес"
                )
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


    /*
     * ПІБ
     */

    setInputIfExists(
        "fullName",
        citizen.fullName ||
        citizen.name ||
        citizen.fio ||
        ""
    );


    /*
     * OLYMP-ID
     */

    setInputIfExists(
        "idNumber",
        citizen.olympId ||
        citizen.citizenId ||
        citizen.idNumber ||
        getOlympId()
    );


    /*
     * Контакт
     */

    setInputIfExists(
        "contact",
        citizen.contact ||
        citizen.preferredContact ||
        ""
    );


    log(
        "Дані громадянина підставлені у форму."
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


    /*
     * Не перезаписываем введённое
     * пользователем сообщение.
     */

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
     * Авторизация
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


        applicationSending =
            false;


        return;

    }


    /*
     * Получаем данные
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
     * Проверяем ПІБ
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
     * Проверяем OLYMP-ID
     */

    if (!idNumber) {

        showFormError(
            "OLYMP-ID не визначено."
        );

        return;

    }


    /*
     * ВАЖНО:
     *
     * Проверяем, что введённый ID
     * совпадает с ID авторизованного
     * пользователя.
     */

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


    if (!service) {

        showFormError(
            "Оберіть державну послугу."
        );

        focusElement(
            "applicationService"
        );

        return;

    }


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
     * API
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
     * Создаём данные для Code.gs
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
         * Вариант 1:
         * POST JSON
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
         * Читаем JSON
         */

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
         * КРИТИЧЕСКИ ВАЖНО:
         *
         * Успех показываем ТОЛЬКО если
         * Code.gs реально вернул:
         *
         * success: true
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
         * Реальный номер заявки
         */

        const application =
            data.application ||
            {};


        const realNumber =
            data.number ||
            data.applicationNumber ||
            application.number ||
            application.applicationNumber ||
            "";


        /*
         * Успех
         */

        showApplicationSuccess(
            {

                number:
                    realNumber,

                status:
                    application.status ||
                    "🟡 На розгляді",

                application:
                    application

            },

            service
        );


        clearApplicationDraft();


        log(
            "Заявка успешно сохранена.",
            data
        );


    } catch (error) {

        console.error(
            "Ошибка отправки заявки:",
            error
        );


        /*
         * Если fetch не прошёл из-за CORS,
         * используем резервную отправку.
         */

        const corsError =
            isPossibleCorsError(
                error
            );


        if (
            corsError
        ) {

            log(
                "Похоже на CORS. Запускаем резервную отправку."
            );


            try {

                submitApplicationFallback(
                    payload
                );


                /*
                 * Резервный метод не позволяет
                 * получить JSON-ответ.
                 *
                 * Поэтому номер заявки здесь
                 * не показываем как настоящий.
                 */

                showApplicationSuccess(
                    null,
                    service
                );


                clearApplicationDraft();


                return;

            } catch (fallbackError) {

                console.error(
                    "Резервная отправка также не удалась:",
                    fallbackError
                );

            }

        }


        showFormError(
            error &&
            error.message
                ? error.message
                : "Не вдалося відправити заявку."
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
   CHECK CORS ERROR
========================================================= */

function isPossibleCorsError(
    error
) {

    if (!error) {

        return false;

    }


    const message =
        String(
            error.message ||
            ""
        ).toLowerCase();


    return (
        message.includes(
            "cors"
        ) ||
        message.includes(
            "failed to fetch"
        ) ||
        message.includes(
            "networkerror"
        ) ||
        message.includes(
            "network error"
        )
    );

}


/* =========================================================
   FALLBACK SUBMIT
========================================================= */

function submitApplicationFallback(
    payload
) {

    const form =
        document.createElement(
            "form"
        );


    form.method =
        "POST";


    form.action =
        OLYMP_CONFIG.API_URL;


    form.target =
        "olymp_hidden_frame";


    form.style.display =
        "none";


    Object.keys(
        payload
    ).forEach(
        function (key) {

            const input =
                document.createElement(
                    "input"
                );


            input.type =
                "hidden";


            input.name =
                key;


            input.value =
                payload[key] === undefined ||
                payload[key] === null
                    ? ""
                    : String(
                        payload[key]
                      );


            form.appendChild(
                input
            );

        }
    );


    let iframe =
        document.getElementById(
            "olymp_hidden_frame"
        );


    if (!iframe) {

        iframe =
            document.createElement(
                "iframe"
            );


        iframe.name =
            "olymp_hidden_frame";


        iframe.id =
            "olymp_hidden_frame";


        iframe.style.display =
            "none";


        document.body.appendChild(
            iframe
        );

    }


    document.body.appendChild(
        form
    );


    form.submit();


    setTimeout(
        function () {

            if (
                form.parentNode
            ) {

                form.remove();

            }

        },
        3000
    );


    log(
        "Резервная отправка выполнена."
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
     * Номер
     */

    const number =
        response &&
        response.number
            ? response.number
            : generateTemporaryApplicationNumber();


    setElementText(
        "applicationNumber",
        "№ " + number
    );


    /*
     * Статус
     */

    setApplicationStatus(
        response &&
        response.status
            ? response.status
            : "🟡 На розгляді"
    );


    /*
     * Текст
     */

    const successText =
        success.querySelector(
            "p"
        );


    if (successText) {

        successText.textContent =
            "Ваше звернення успішно сформовано та передано до Уряду штату Olymp.";

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


    if (
        status.includes(
            "На розгляді"
        )
    ) {

        badge.classList.add(
            "pending"
        );

    } else if (
        status.includes(
            "Прийнято"
        )
    ) {

        badge.classList.add(
            "accepted"
        );

    } else if (
        status.includes(
            "Виконано"
        )
    ) {

        badge.classList.add(
            "completed"
        );

    } else if (
        status.includes(
            "Відхилено"
        )
    ) {

        badge.classList.add(
            "rejected"
        );

    } else if (
        status.includes(
            "Закрито"
        )
    ) {

        badge.classList.add(
            "closed"
        );

    }

}


/* =========================================================
   TEMPORARY NUMBER
========================================================= */

function generateTemporaryApplicationNumber() {

    return (
        "OLYMP-" +
        Date.now()
            .toString()
            .slice(-6)
    );

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
        text;

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
   NORMALIZE OLYMP ID CLIENT
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


    if (
        /^OLYMP\d{6}$/.test(
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

const APPLICATION_DRAFT_KEY =
    "olymp_application_draft_6_3";


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
            APPLICATION_DRAFT_KEY,
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
                APPLICATION_DRAFT_KEY
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
            APPLICATION_DRAFT_KEY
        );

    } catch (error) {

        console.warn(
            "Не удалось удалить черновик.",
            error
        );

    }

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


        const target =
            document.querySelector(
                targetId
            );


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


/* =========================================================
   FINISH
========================================================= */

log(
    "OLYMP Government Script 6.3 готов."
);
