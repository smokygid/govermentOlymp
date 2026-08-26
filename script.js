/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET / GOVERNMENT PORTAL
   SCRIPT.JS 6.4

   Совместим с:
   - index.html
   - Code.gs 6.1+

   ИСПРАВЛЕНО:
   - Корректное определение авторизации
   - Поддержка сохранённого профиля
   - Автоматическая синхронизация OLYMP-ID
   - Автоматическая синхронизация Session Token
   - Заявка доступна авторизованному пользователю
   - Проверка профиля перед отправкой
   - Получение реального номера заявки
   - Запись заявки в Google Sheets
   - Получение статуса заявки
   - Защита от повторной отправки
   - Черновик заявки
   - Мобильное меню
   - Поиск и фильтрация
   - Модальные окна
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

    /*
     * Дополнительные ключи,
     * которые могут использоваться
     * страницей личного кабинета.
     */

    ALT_SESSION_KEYS: [
        "sessionToken",
        "session_token",
        "token",
        "olympSessionToken",
        "olymp_session",
        "userSession"
    ],

    ALT_ID_KEYS: [
        "olympId",
        "OLYMP_ID",
        "olympID",
        "citizenId",
        "idNumber",
        "userOlympId"
    ],

    ALT_USER_KEYS: [
        "user",
        "profile",
        "citizen",
        "currentUser",
        "olymp_user",
        "userProfile"
    ]

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
            "[OLYMP 6.4]",
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
        "OLYMP Government 6.4 инициализирован."
    );

}


/* =========================================================
   AUTH STATE
========================================================= */

function initializeAuthState() {

    const auth =
        getAuthenticationData();


    log(
        "Состояние авторизации:",
        {
            authenticated:
                auth.authenticated,

            olympId:
                auth.olympId || null,

            hasToken:
                Boolean(auth.token),

            hasUser:
                Boolean(auth.user)

        }
    );


    /*
     * Если пользователь авторизован,
     * синхронизируем локальные данные.
     */

    if (
        auth.authenticated
    ) {

        synchronizeAuthentication(
            auth
        );


        /*
         * Если есть токен и ID,
         * пытаемся получить свежий профиль.
         */

        if (
            auth.token &&
            auth.olympId
        ) {

            loadCitizenProfile();

        } else {

            /*
             * Если API-данные ещё не готовы,
             * используем локальный профиль.
             */

            if (auth.user) {

                fillApplicationFromProfile(
                    auth.user
                );

            }

        }

    }

}


/* =========================================================
   GET AUTHENTICATION DATA
========================================================= */

function getAuthenticationData() {

    let token =
        getSessionToken();

    let olympId =
        getOlympId();

    let user =
        getSavedUser();


    /*
     * Если стандартные ключи пустые,
     * ищем альтернативные.
     */

    if (!token) {

        token =
            findAlternativeSessionToken();

    }


    if (!olympId) {

        olympId =
            findAlternativeOlympId();

    }


    if (!user) {

        user =
            findAlternativeUser();

    }


    /*
     * Пытаемся получить ID из профиля.
     */

    if (
        !olympId &&
        user
    ) {

        olympId =
            extractOlympId(
                user
            );

    }


    /*
     * Пытаемся получить токен из профиля.
     */

    if (
        !token &&
        user
    ) {

        token =
            extractSessionToken(
                user
            );

    }


    /*
     * Если пользователь есть в localStorage,
     * считаем его авторизованным даже если
     * старый ключ token отсутствует.
     *
     * Это важно для совместимости
     * с личным кабинетом.
     */

    const authenticated =
        Boolean(
            user ||
            (token && olympId)
        );


    return {

        authenticated,
        token: token || "",
        olympId: olympId || "",
        user: user || null

    };

}


/* =========================================================
   SYNCHRONIZE AUTHENTICATION
========================================================= */

function synchronizeAuthentication(
    auth
) {

    if (!auth) {

        return;

    }


    let token =
        auth.token || "";


    let olympId =
        auth.olympId || "";


    let user =
        auth.user || null;


    /*
     * Если есть пользователь,
     * ещё раз извлекаем ID.
     */

    if (
        !olympId &&
        user
    ) {

        olympId =
            extractOlympId(
                user
            );

    }


    /*
     * Сохраняем всё в стандартные ключи.
     */

    if (
        token ||
        olympId ||
        user
    ) {

        saveSession(
            token,
            olympId,
            user
        );

    }


    /*
     * Заполняем форму профилем.
     */

    if (user) {

        fillApplicationFromProfile(
            user
        );

    }

}


/* =========================================================
   SESSION TOKEN
========================================================= */

function getSessionToken() {

    try {

        /*
         * Сначала стандартный ключ.
         */

        let token =
            localStorage.getItem(
                OLYMP_CONFIG.SESSION_KEY
            );


        if (
            token
        ) {

            return String(
                token
            ).trim();

        }


        /*
         * Затем альтернативные ключи.
         */

        token =
            findAlternativeSessionToken();


        return token || "";

    } catch (error) {

        console.warn(
            "Не удалось получить sessionToken.",
            error
        );

        return "";

    }

}


/* =========================================================
   FIND ALTERNATIVE SESSION TOKEN
========================================================= */

function findAlternativeSessionToken() {

    try {

        for (
            const key
            of OLYMP_CONFIG.ALT_SESSION_KEYS
        ) {

            const value =
                localStorage.getItem(
                    key
                );


            if (
                value
            ) {

                const token =
                    String(
                        value
                    ).trim();


                if (
                    token
                ) {

                    log(
                        "Найден альтернативный session token:",
                        key
                    );


                    return token;

                }

            }

        }


        /*
         * Иногда token хранится
         * внутри объекта пользователя.
         */

        const user =
            getSavedUser();


        if (
            user
        ) {

            const token =
                extractSessionToken(
                    user
                );


            if (
                token
            ) {

                return token;

            }

        }

    } catch (error) {

        console.warn(
            "Ошибка поиска альтернативного токена.",
            error
        );

    }


    return "";

}


/* =========================================================
   EXTRACT SESSION TOKEN
========================================================= */

function extractSessionToken(
    user
) {

    if (
        !user ||
        typeof user !== "object"
    ) {

        return "";

    }


    const possibleKeys = [

        "sessionToken",
        "session_token",
        "token",
        "accessToken",
        "access_token",
        "authToken",
        "auth_token"

    ];


    for (
        const key
        of possibleKeys
    ) {

        if (
            user[key]
        ) {

            return String(
                user[key]
            ).trim();

        }

    }


    return "";

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

        if (
            token
        ) {

            localStorage.setItem(
                OLYMP_CONFIG.SESSION_KEY,
                String(token)
            );

        }


        if (
            olympId
        ) {

            localStorage.setItem(
                OLYMP_CONFIG.OLYMP_ID_KEY,
                normalizeOlympIdClient(
                    olympId
                )
            );

        }


        if (
            citizen
        ) {

            localStorage.setItem(
                OLYMP_CONFIG.USER_KEY,
                JSON.stringify(
                    citizen
                )
            );

        }


        log(
            "Сессия синхронизирована."
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

        /*
         * Стандартный ключ.
         */

        let id =
            localStorage.getItem(
                OLYMP_CONFIG.OLYMP_ID_KEY
            );


        if (
            id
        ) {

            return normalizeOlympIdClient(
                id
            );

        }


        /*
         * Альтернативные ключи.
         */

        id =
            findAlternativeOlympId();


        if (
            id
        ) {

            return normalizeOlympIdClient(
                id
            );

        }


        /*
         * Пробуем взять ID
         * из сохранённого пользователя.
         */

        const user =
            getSavedUser();


        if (
            user
        ) {

            id =
                extractOlympId(
                    user
                );


            if (
                id
            ) {

                return normalizeOlympIdClient(
                    id
                );

            }

        }

    } catch (error) {

        console.warn(
            "Ошибка получения OLYMP-ID.",
            error
        );

    }


    return "";

}


/* =========================================================
   FIND ALTERNATIVE OLYMP ID
========================================================= */

function findAlternativeOlympId() {

    try {

        for (
            const key
            of OLYMP_CONFIG.ALT_ID_KEYS
        ) {

            const value =
                localStorage.getItem(
                    key
                );


            if (
                value
            ) {

                const id =
                    String(
                        value
                    ).trim();


                if (
                    id
                ) {

                    log(
                        "Найден альтернативный OLYMP-ID:",
                        key,
                        id
                    );


                    return normalizeOlympIdClient(
                        id
                    );

                }

            }

        }

    } catch (error) {

        console.warn(
            "Ошибка поиска OLYMP-ID.",
            error
        );

    }


    return "";

}


/* =========================================================
   EXTRACT OLYMP ID
========================================================= */

function extractOlympId(
    user
) {

    if (
        !user ||
        typeof user !== "object"
    ) {

        return "";

    }


    const possibleKeys = [

        "olympId",
        "OLYMP_ID",
        "olympID",
        "citizenId",
        "idNumber",
        "userOlympId",
        "userId",
        "id"

    ];


    for (
        const key
        of possibleKeys
    ) {

        if (
            user[key]
        ) {

            const value =
                String(
                    user[key]
                ).trim();


            /*
             * Проверяем,
             * действительно ли это OLYMP-ID.
             */

            if (
                value.toUpperCase().includes(
                    "OLYMP"
                )
            ) {

                return normalizeOlympIdClient(
                    value
                );

            }

        }

    }


    return "";

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


        if (
            raw
        ) {

            try {

                return JSON.parse(
                    raw
                );

            } catch (error) {

                console.warn(
                    "Стандартный профиль повреждён."
                );

            }

        }


        /*
         * Ищем альтернативный профиль.
         */

        return findAlternativeUser();

    } catch (error) {

        console.warn(
            "Не удалось получить пользователя.",
            error
        );

        return null;

    }

}


/* =========================================================
   FIND ALTERNATIVE USER
========================================================= */

function findAlternativeUser() {

    try {

        for (
            const key
            of OLYMP_CONFIG.ALT_USER_KEYS
        ) {

            const raw =
                localStorage.getItem(
                    key
                );


            if (
                !raw
            ) {

                continue;

            }


            try {

                const parsed =
                    JSON.parse(
                        raw
                    );


                if (
                    parsed &&
                    typeof parsed === "object"
                ) {

                    log(
                        "Найден альтернативный профиль:",
                        key
                    );


                    return parsed;

                }

            } catch (error) {

                /*
                 * Иногда ключ содержит просто ID,
                 * поэтому JSON не требуется.
                 */

                continue;

            }

        }

    } catch (error) {

        console.warn(
            "Ошибка поиска альтернативного профиля.",
            error
        );

    }


    return null;

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


        /*
         * Не удаляем альтернативные ключи,
         * чтобы случайно не уничтожить сессию
         * другого модуля кабинета.
         */

        log(
            "Основная сессия очищена."
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


    if (
        !search
    ) {

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


    if (
        !button
    ) {

        return;

    }


    button.addEventListener(
        "click",
        function () {

            const search =
                document.getElementById(
                    "serviceSearch"
                );


            if (
                search
            ) {

                search.value =
                    "";

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


    let visibleCount =
        0;


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


    if (
        noResults
    ) {

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


    if (
        !counter
    ) {

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

function openService(
    button
) {

    if (
        !button
    ) {

        return;

    }


    const card =
        button.closest(
            ".service-card"
        );


    if (
        !card
    ) {

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


    if (
        !modal
    ) {

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
            String(
                category || ""
            ).toLowerCase()
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


    if (
        !modal
    ) {

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


    if (
        !button
    ) {

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


    if (
        !modal
    ) {

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


    if (
        success
    ) {

        success.classList.remove(
            "active"
        );

        success.style.display =
            "none";

    }


    if (
        form
    ) {

        form.style.display =
            "";

    }


    /*
     * =====================================================
     * ИСПРАВЛЕНИЕ 6.4
     *
     * Получаем авторизацию не только из двух ключей,
     * а из всей системы авторизации.
     * =====================================================
     */

    const auth =
        getAuthenticationData();


    log(
        "Проверка авторизации перед открытием заявки:",
        auth
    );


    /*
     * Если пользователь реально не найден.
     */

    if (
        !auth.authenticated
    ) {

        showFormError(
            "Для подання заявки необхідно увійти до особистого кабінету."
        );

    } else {

        /*
         * Пользователь авторизован.
         * Синхронизируем данные.
         */

        synchronizeAuthentication(
            auth
        );

    }


    /*
     * Устанавливаем услугу.
     */

    if (
        serviceName
    ) {

        const select =
            document.getElementById(
                "applicationService"
            );


        if (
            select
        ) {

            setServiceSelectValue(
                select,
                serviceName
            );

        }

    }


    /*
     * Подставляем профиль.
     */

    fillApplicationFromSavedProfile();


    /*
     * Если ID есть в системе авторизации,
     * обязательно устанавливаем его в форму.
     */

    if (
        auth.olympId
    ) {

        setInputIfExists(
            "idNumber",
            auth.olympId
        );

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


    setTimeout(
        function () {

            const firstInput =
                document.getElementById(
                    "message"
                );


            if (
                firstInput
            ) {

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


    const normalizedService =
        String(
            serviceName || ""
        )
        .trim()
        .toLowerCase();


    const exact =
        options.find(
            function (option) {

                return (
                    option.value.trim() ===
                    serviceName.trim()
                );

            }
        );


    if (
        exact
    ) {

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
                    normalizedService
                );

            }
        );


    if (
        textMatch
    ) {

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


    if (
        !modal
    ) {

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


    if (
        submitButton
    ) {

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


    if (
        serviceModal
    ) {

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


    if (
        applicationModal
    ) {

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


    if (
        !form
    ) {

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

    const auth =
        getAuthenticationData();


    const token =
        auth.token;


    const olympId =
        auth.olympId;


    if (
        !token ||
        !olympId
    ) {

        /*
         * Если API-данных недостаточно,
         * используем локальный профиль.
         */

        if (
            auth.user
        ) {

            fillApplicationFromProfile(
                auth.user
            );

        }


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


        params.append(
            "token",
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


            if (
                citizen
            ) {

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
         * Не очищаем сессию сразу.
         *
         * Иногда Google Apps Script может
         * временно вернуть ошибку сети/API.
         *
         * Поэтому локальный профиль сохраняем.
         */

        if (
            auth.user
        ) {

            fillApplicationFromProfile(
                auth.user
            );

        }


        if (
            data &&
            data.message
        ) {

            const message =
                String(
                    data.message
                ).toLowerCase();


            /*
             * Только явное сообщение
             * о недействительной сессии.
             */

            if (
                message.includes(
                    "недействитель"
                ) ||
                message.includes(
                    "неверный токен"
                ) ||
                message.includes(
                    "invalid session"
                )
            ) {

                clearSession();

            }

        }


        return null;

    } catch (error) {

        console.warn(
            "Не вдалося завантажити профіль.",
            error
        );


        /*
         * Ошибка сети НЕ означает,
         * что пользователь вышел.
         */

        const savedUser =
            getSavedUser();


        if (
            savedUser
        ) {

            fillApplicationFromProfile(
                savedUser
            );

        }


        return null;

    }

}


/* =========================================================
   FILL FROM SAVED PROFILE
========================================================= */

function fillApplicationFromSavedProfile() {

    const auth =
        getAuthenticationData();


    if (
        auth.user
    ) {

        fillApplicationFromProfile(
            auth.user
        );

    }


    /*
     * Даже если объекта user нет,
     * ID пользователя всё равно подставляем.
     */

    if (
        auth.olympId
    ) {

        setInputIfExists(
            "idNumber",
            auth.olympId
        );

    }

}


/* =========================================================
   FILL APPLICATION FROM PROFILE
========================================================= */

function fillApplicationFromProfile(
    citizen
) {

    if (
        !citizen
    ) {

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
        citizen.full_name ||
        ""
    );


    /*
     * OLYMP-ID
     */

    const citizenOlympId =
        extractOlympId(
            citizen
        );


    setInputIfExists(
        "idNumber",
        citizenOlympId ||
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
        citizen.phone ||
        citizen.email ||
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


    if (
        !element
    ) {

        return;

    }


    if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
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


    if (
        !form
    ) {

        return;

    }


    /*
     * =====================================================
     * ПОВТОРНО ПОЛУЧАЕМ АВТОРИЗАЦИЮ
     *
     * Здесь больше НЕЛЬЗЯ проверять только:
     *
     * getSessionToken()
     * getOlympId()
     *
     * потому что профиль может быть сохранён
     * другим модулем кабинета.
     * =====================================================
     */

    const auth =
        getAuthenticationData();


    log(
        "Авторизация перед отправкой:",
        auth
    );


    /*
     * Если есть сохранённый пользователь,
     * синхронизируем данные.
     */

    if (
        auth.authenticated
    ) {

        synchronizeAuthentication(
            auth
        );

    }


    /*
     * Авторизация.
     *
     * Пользователь считается авторизованным,
     * если найден:
     *
     * 1. профиль
     *
     * ИЛИ
     *
     * 2. token + OLYMP-ID
     */

    if (
        !auth.authenticated
    ) {

        showFormError(
            "Для подання заявки необхідно увійти до особистого кабінету."
        );


        applicationSending =
            false;


        return;

    }


    /*
     * Получаем актуальный ID.
     */

    let olympId =
        auth.olympId ||
        getOlympId();


    /*
     * Если ID всё ещё не найден,
     * пробуем взять его из формы.
     */

    if (
        !olympId
    ) {

        olympId =
            getInputValue(
                "idNumber"
            );

    }


    olympId =
        normalizeOlympIdClient(
            olympId
        );


    /*
     * Получаем токен.
     */

    let token =
        auth.token ||
        getSessionToken();


    /*
     * Если токен находится внутри профиля.
     */

    if (
        !token &&
        auth.user
    ) {

        token =
            extractSessionToken(
                auth.user
            );

    }


    /*
     * Важный момент:
     *
     * Если профиль найден, но token ещё
     * не синхронизировался, НЕ показываем
     * ошибку "войдите".
     *
     * Сначала пытаемся обновить профиль.
     */

    if (
        !olympId
    ) {

        showFormError(
            "OLYMP-ID не визначено. Перезавантажте особистий кабінет."
        );


        return;

    }


    /*
     * Получаем данные.
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
     * Проверяем ПІБ.
     */

    if (
        !fullName
    ) {

        showFormError(
            "Вкажіть ПІБ."
        );


        focusElement(
            "fullName"
        );


        return;

    }


    /*
     * Проверяем OLYMP-ID.
     */

    if (
        !idNumber
    ) {

        showFormError(
            "OLYMP-ID не визначено."
        );


        setInputIfExists(
            "idNumber",
            olympId
        );


        return;

    }


    /*
     * Проверяем соответствие ID.
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


        setInputIfExists(
            "idNumber",
            olympId
        );


        return;

    }


    /*
     * Услуга.
     */

    if (
        !service
    ) {

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

    if (
        !message
    ) {

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


    if (
        submitButton
    ) {

        submitButton.disabled =
            true;


        submitButton.dataset.originalText =
            submitButton.textContent;


        submitButton.textContent =
            "Відправлення...";

    }


    /*
     * =====================================================
     * PAYLOAD
     * =====================================================
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
         * HTTP.
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
         * Ответ.
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
         * УСПЕХ ТОЛЬКО success === true
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
         * Реальный номер.
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
         * Успех.
         */

        showApplicationSuccess(
            {

                number:
                    realNumber,

                status:
                    application.status ||
                    data.status ||
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
         * CORS.
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
                 * ВАЖНО:
                 *
                 * Резервная отправка не подтверждает
                 * результат сервера.
                 *
                 * Поэтому НЕ говорим пользователю,
                 * что заявка точно сохранена.
                 */

                showApplicationFallbackMessage(
                    service
                );


                clearApplicationDraft();


                applicationSending =
                    false;


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


        if (
            submitButton
        ) {

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

    if (
        !error
    ) {

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


    if (
        !iframe
    ) {

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
   FALLBACK MESSAGE
========================================================= */

function showApplicationFallbackMessage(
    service
) {

    const form =
        document.getElementById(
            "applicationForm"
        );


    if (
        form
    ) {

        form.style.display =
            "none";

    }


    const success =
        document.getElementById(
            "successMessage"
        );


    if (
        !success
    ) {

        alert(
            "Заявка передана. Перевірте особистий кабінет через декілька секунд."
        );


        return;

    }


    success.style.display =
        "block";


    success.classList.add(
        "active"
    );


    setElementText(
        "applicationNumber",
        "Заявку передано"
    );


    setApplicationStatus(
        "🟡 На розгляді"
    );


    const successText =
        success.querySelector(
            "p"
        );


    if (
        successText
    ) {

        successText.textContent =
            "Заявку передано на сервер. Номер заявки з'явиться в особистому кабінеті після збереження.";
    }


    log(
        "Резервная отправка заявки:",
        service
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


    if (
        !success
    ) {

        return;

    }


    if (
        form
    ) {

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
     * Если Code.gs не вернул номер,
     * не подменяем его временным номером.
     */

    const number =
        response &&
        response.number
            ? response.number
            : "";


    if (
        number
    ) {

        setElementText(
            "applicationNumber",
            "№ " + number
        );

    } else {

        setElementText(
            "applicationNumber",
            "Заявка зареєстрована"
        );

    }


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


    if (
        successText
    ) {

        successText.textContent =
            "Ваше звернення успішно зареєстровано та передано до Уряду штату Olymp.";

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


    if (
        !container
    ) {

        return;

    }


    const badge =
        container.querySelector(
            ".status-badge"
        );


    if (
        !badge
    ) {

        return;

    }


    const normalizedStatus =
        String(
            status ||
            "🟡 На розгляді"
        );


    badge.textContent =
        normalizedStatus;


    badge.classList.remove(
        "pending",
        "accepted",
        "completed",
        "rejected",
        "closed"
    );


    if (
        normalizedStatus.includes(
            "На розгляді"
        )
    ) {

        badge.classList.add(
            "pending"
        );

    } else if (
        normalizedStatus.includes(
            "Прийнято"
        )
    ) {

        badge.classList.add(
            "accepted"
        );

    } else if (
        normalizedStatus.includes(
            "Виконано"
        )
    ) {

        badge.classList.add(
            "completed"
        );

    } else if (
        normalizedStatus.includes(
            "Відхилено"
        )
    ) {

        badge.classList.add(
            "rejected"
        );

    } else if (
        normalizedStatus.includes(
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


    if (
        old
    ) {

        old.remove();

    }


    const form =
        document.getElementById(
            "applicationForm"
        );


    if (
        !form
    ) {

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


    if (
        !element
    ) {

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


    if (
        !element
    ) {

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


    if (
        !element
    ) {

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


    /*
     * OLYMP000001
     * ->
     * OLYMP-000001
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
     * OLYMP-1
     * ->
     * OLYMP-000001
     *
     * Это позволяет системе
     * работать с короткими ID.
     */

    const shortMatch =
        result.match(
            /^OLYMP-(\d+)$/
        );


    if (
        shortMatch &&
        shortMatch[1].length < 6
    ) {

        result =
            "OLYMP-" +
            shortMatch[1].padStart(
                6,
                "0"
            );

    }


    return result;

}


/* =========================================================
   DRAFT
========================================================= */

const APPLICATION_DRAFT_KEY =
    "olymp_application_draft_6_4";


/* =========================================================
   SAVE DRAFT
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

        /*
         * Сначала новый ключ.
         */

        let saved =
            localStorage.getItem(
                APPLICATION_DRAFT_KEY
            );


        /*
         * Если нет нового,
         * пробуем старый черновик 6.3.
         */

        if (
            !saved
        ) {

            saved =
                localStorage.getItem(
                    "olymp_application_draft_6_3"
                );

        }


        if (
            !saved
        ) {

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


    if (
        !element
    ) {

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

        localStorage.removeItem(
            "olymp_application_draft_6_3"
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


        if (
            !link
        ) {

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


        if (
            !link
        ) {

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


        if (
            !target
        ) {

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


        if (
            !header
        ) {

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
   DEBUG AUTH
========================================================= */

window.OLYMP_DEBUG_AUTH =
    function () {

        const auth =
            getAuthenticationData();


        console.log(
            "========== OLYMP AUTH DEBUG =========="
        );


        console.log(
            "authenticated:",
            auth.authenticated
        );


        console.log(
            "olympId:",
            auth.olympId
        );


        console.log(
            "token:",
            auth.token
        );


        console.log(
            "user:",
            auth.user
        );


        console.log(
            "localStorage:",
            {
                session:
                    localStorage.getItem(
                        OLYMP_CONFIG.SESSION_KEY
                    ),

                olympId:
                    localStorage.getItem(
                        OLYMP_CONFIG.OLYMP_ID_KEY
                    ),

                user:
                    localStorage.getItem(
                        OLYMP_CONFIG.USER_KEY
                    )

            }
        );


        console.log(
            "======================================"
        );


        return auth;

    };


/* =========================================================
   FINISH
========================================================= */

log(
    "OLYMP Government Script 6.4 готов."
);
