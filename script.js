/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET
   SCRIPT.JS 6.6
   =========================================================

   • OLYMP-ID
   • Регистрация
   • Авторизация
   • Session Token
   • Восстановление сессии
   • Личный кабинет
   • Профиль
   • Заявки / звернення
   • Просмотр заявки
   • Модальное окно заявки
   • Статусы
   • Аватар
   • Logout
   • Google Apps Script Web App
   • GET API
   ========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const OLYMP_CONFIG = {

    API_URL:
        "https://script.google.com/macros/s/AKfycbyynbAxu6A_tU5nBEUum357BCY6o8D-3e44wEtR-AlyOtV5un8mNgpmkvU6dtrIy0RvfQ/exec",

    STORAGE: {

        TOKEN:
            "OLYMP_SESSION_TOKEN",

        OLYMP_ID:
            "OLYMP_ID",

        CITIZEN:
            "OLYMP_CITIZEN",

        PROFILE:
            "OLYMP_PROFILE"

    },

    SESSION_CHECK_INTERVAL:
        5 * 60 * 1000,

    REQUEST_TIMEOUT:
        20000

};


/* =========================================================
   GLOBAL STATE
========================================================= */

const OlympState = {

    initialized:
        false,

    authenticated:
        false,

    loading:
        false,

    sessionToken:
        "",

    olympId:
        "",

    citizen:
        null,

    profile:
        null,

    applications:
        []

};


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeOlympGovernment();

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeOlympGovernment() {

    if (
        OlympState.initialized
    ) {

        return;

    }

    OlympState.initialized =
        true;

    loadStoredSession();

    updateAuthUI();

    if (
        OlympState.sessionToken &&
        OlympState.olympId
    ) {

        await restoreSession();

    }

    setupForms();

    setupCabinetLinks();

    setupApplicationButtons();

    setupApplicationModal();

    updateAuthUI();

    setInterval(
        function () {

            if (
                OlympState.sessionToken &&
                OlympState.olympId
            ) {

                validateSession();

            }

        },
        OLYMP_CONFIG.SESSION_CHECK_INTERVAL
    );

}


/* =========================================================
   STORAGE
========================================================= */

function loadStoredSession() {

    try {

        const token =
            localStorage.getItem(
                OLYMP_CONFIG.STORAGE.TOKEN
            ) || "";

        const olympId =
            localStorage.getItem(
                OLYMP_CONFIG.STORAGE.OLYMP_ID
            ) || "";

        const citizenRaw =
            localStorage.getItem(
                OLYMP_CONFIG.STORAGE.CITIZEN
            );

        const profileRaw =
            localStorage.getItem(
                OLYMP_CONFIG.STORAGE.PROFILE
            );

        OlympState.sessionToken =
            String(token).trim();

        OlympState.olympId =
            normalizeOlympId(
                olympId
            );

        if (
            citizenRaw
        ) {

            try {

                OlympState.citizen =
                    JSON.parse(
                        citizenRaw
                    );

            } catch (error) {

                OlympState.citizen =
                    null;

            }

        }

        if (
            profileRaw
        ) {

            try {

                OlympState.profile =
                    JSON.parse(
                        profileRaw
                    );

            } catch (error) {

                OlympState.profile =
                    null;

            }

        }

        OlympState.authenticated =
            Boolean(
                OlympState.sessionToken &&
                OlympState.olympId
            );

    } catch (error) {

        console.error(
            "loadStoredSession:",
            error
        );

        clearSession();

    }

}


/* =========================================================
   SAVE SESSION
========================================================= */

function saveSession(
    data
) {

    if (
        !data
    ) {

        return false;

    }

    const token =
        String(
            data.sessionToken ||
            data.token ||
            ""
        ).trim();

    const citizen =
        data.citizen ||
        data.profile ||
        data.user ||
        null;

    const olympId =
        normalizeOlympId(
            data.olympId ||
            data.citizenId ||
            data.idNumber ||
            (
                citizen
                    ? (
                        citizen.olympId ||
                        citizen.citizenId ||
                        citizen.idNumber
                    )
                    : ""
            )
        );

    if (
        !token ||
        !olympId
    ) {

        console.error(
            "Не удалось сохранить сессию:",
            data
        );

        return false;

    }

    OlympState.sessionToken =
        token;

    OlympState.olympId =
        olympId;

    OlympState.authenticated =
        true;

    if (
        citizen
    ) {

        OlympState.citizen =
            citizen;

        OlympState.profile =
            citizen;

        localStorage.setItem(
            OLYMP_CONFIG.STORAGE.CITIZEN,
            JSON.stringify(citizen)
        );

        localStorage.setItem(
            OLYMP_CONFIG.STORAGE.PROFILE,
            JSON.stringify(citizen)
        );

    }

    localStorage.setItem(
        OLYMP_CONFIG.STORAGE.TOKEN,
        token
    );

    localStorage.setItem(
        OLYMP_CONFIG.STORAGE.OLYMP_ID,
        olympId
    );

    updateAuthUI();

    return true;

}


/* =========================================================
   CLEAR SESSION
========================================================= */

function clearSession() {

    OlympState.authenticated =
        false;

    OlympState.sessionToken =
        "";

    OlympState.olympId =
        "";

    OlympState.citizen =
        null;

    OlympState.profile =
        null;

    OlympState.applications =
        [];

    try {

        localStorage.removeItem(
            OLYMP_CONFIG.STORAGE.TOKEN
        );

        localStorage.removeItem(
            OLYMP_CONFIG.STORAGE.OLYMP_ID
        );

        localStorage.removeItem(
            OLYMP_CONFIG.STORAGE.CITIZEN
        );

        localStorage.removeItem(
            OLYMP_CONFIG.STORAGE.PROFILE
        );

    } catch (error) {

        console.error(
            "clearSession:",
            error
        );

    }

    updateAuthUI();

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    action,
    params = {}
) {

    if (
        !OLYMP_CONFIG.API_URL
    ) {

        throw new Error(
            "Не указан URL Google Apps Script Web App."
        );

    }

    const query =
        new URLSearchParams();

    query.set(
        "action",
        action
    );

    Object.keys(params).forEach(
        function (key) {

            const value =
                params[key];

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {

                query.set(
                    key,
                    String(value)
                );

            }

        }
    );

    const url =
        OLYMP_CONFIG.API_URL +
        (
            OLYMP_CONFIG.API_URL.indexOf("?") >= 0
                ? "&"
                : "?"
        ) +
        query.toString();

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            function () {

                controller.abort();

            },
            OLYMP_CONFIG.REQUEST_TIMEOUT
        );

    try {

        const response =
            await fetch(
                url,
                {
                    method:
                        "GET",

                    cache:
                        "no-store",

                    redirect:
                        "follow",

                    signal:
                        controller.signal
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

        const text =
            await response.text();

        if (
            !text
        ) {

            throw new Error(
                "Сервер повернув порожню відповідь."
            );

        }

        let data;

        try {

            data =
                JSON.parse(
                    text
                );

        } catch (error) {

            console.error(
                "Невірна відповідь API:",
                text
            );

            throw new Error(
                "Сервер повернув не JSON."
            );

        }

        return data;

    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            throw new Error(
                "Час очікування сервера минув."
            );

        }

        throw error;

    } finally {

        clearTimeout(
            timeout
        );

    }

}


/* =========================================================
   RESTORE SESSION
========================================================= */

async function restoreSession() {

    if (
        !OlympState.sessionToken ||
        !OlympState.olympId
    ) {

        clearSession();

        return false;

    }

    try {

        const result =
            await apiRequest(
                "validate",
                {

                    sessionToken:
                        OlympState.sessionToken,

                    token:
                        OlympState.sessionToken,

                    olympId:
                        OlympState.olympId,

                    citizenId:
                        OlympState.olympId,

                    idNumber:
                        OlympState.olympId

                }
            );

        if (
            !result ||
            !result.success
        ) {

            clearSession();

            return false;

        }

        OlympState.authenticated =
            true;

        await loadProfile();

        await loadApplications();

        updateAuthUI();

        return true;

    } catch (error) {

        console.warn(
            "Не удалось восстановить сессию:",
            error
        );

        updateAuthUI();

        return false;

    }

}


/* =========================================================
   VALIDATE SESSION
========================================================= */

async function validateSession() {

    if (
        !OlympState.sessionToken ||
        !OlympState.olympId
    ) {

        return false;

    }

    try {

        const result =
            await apiRequest(
                "validate",
                {

                    sessionToken:
                        OlympState.sessionToken,

                    token:
                        OlympState.sessionToken,

                    olympId:
                        OlympState.olympId,

                    citizenId:
                        OlympState.olympId,

                    idNumber:
                        OlympState.olympId

                }
            );

        if (
            result &&
            result.success
        ) {

            OlympState.authenticated =
                true;

            return true;

        }

        clearSession();

        return false;

    } catch (error) {

        console.warn(
            "Ошибка проверки сессии:",
            error
        );

        return false;

    }

}


/* =========================================================
   REGISTER
========================================================= */

async function registerCitizen(
    data
) {

    data =
        data || {};

    setLoading(
        true
    );

    try {

        const result =
            await apiRequest(
                "register",
                {

                    fullName:
                        data.fullName ||
                        data.name ||
                        "",

                    birthDate:
                        data.birthDate ||
                        data.dateOfBirth ||
                        "",

                    phone:
                        data.phone ||
                        "",

                    email:
                        data.email ||
                        "",

                    discord:
                        data.discord ||
                        "",

                    contact:
                        data.contact ||
                        data.preferredContact ||
                        "",

                    password:
                        data.password ||
                        ""

                }
            );

        if (
            !result ||
            !result.success
        ) {

            showMessage(
                result &&
                result.message
                    ? result.message
                    : "Помилка реєстрації.",
                "error"
            );

            return result;

        }

        const saved =
            saveSession(
                result
            );

        if (
            !saved
        ) {

            showMessage(
                "Реєстрацію завершено, але сесію не вдалося зберегти.",
                "error"
            );

            return {
                success:
                    false
            };

        }

        if (
            Array.isArray(
                result.applications
            )
        ) {

            OlympState.applications =
                result.applications;

        }

        updateAuthUI();

        showMessage(
            "Реєстрацію успішно завершено.",
            "success"
        );

        closeAuthForms();

        setTimeout(
            function () {

                redirectToCabinet();

            },
            500
        );

        return result;

    } catch (error) {

        console.error(
            "registerCitizen:",
            error
        );

        showMessage(
            error.message ||
            "Помилка під час реєстрації.",
            "error"
        );

        return {
            success:
                false,

            message:
                error.message
        };

    } finally {

        setLoading(
            false
        );

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function loginCitizen(
    olympId,
    password
) {

    olympId =
        normalizeOlympId(
            olympId
        );

    password =
        String(
            password ||
            ""
        ).trim();

    if (
        !olympId
    ) {

        showMessage(
            "Вкажіть OLYMP-ID.",
            "error"
        );

        return {
            success:
                false
        };

    }

    if (
        !password
    ) {

        showMessage(
            "Вкажіть пароль.",
            "error"
        );

        return {
            success:
                false
        };

    }

    setLoading(
        true
    );

    try {

        const result =
            await apiRequest(
                "login",
                {

                    olympId:
                        olympId,

                    citizenId:
                        olympId,

                    idNumber:
                        olympId,

                    login:
                        olympId,

                    password:
                        password

                }
            );

        if (
            !result ||
            !result.success
        ) {

            showMessage(
                result &&
                result.message
                    ? result.message
                    : "Невірний OLYMP-ID або пароль.",
                "error"
            );

            return result;

        }

        const saved =
            saveSession(
                result
            );

        if (
            !saved
        ) {

            showMessage(
                "Вхід виконано, але сесію не вдалося зберегти.",
                "error"
            );

            return {
                success:
                    false
            };

        }

        if (
            Array.isArray(
                result.applications
            )
        ) {

            OlympState.applications =
                result.applications;

        }

        updateAuthUI();

        showMessage(
            "Вхід успішно виконано.",
            "success"
        );

        closeAuthForms();

        await loadProfile();

        await loadApplications();

        setTimeout(
            function () {

                redirectToCabinet();

            },
            300
        );

        return result;

    } catch (error) {

        console.error(
            "loginCitizen:",
            error
        );

        showMessage(
            error.message ||
            "Помилка входу.",
            "error"
        );

        return {
            success:
                false,

            message:
                error.message
        };

    } finally {

        setLoading(
            false
        );

    }

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

    if (
        !isLoggedIn()
    ) {

        return null;

    }

    try {

        const result =
            await apiRequest(
                "profile",
                {

                    olympId:
                        OlympState.olympId,

                    citizenId:
                        OlympState.olympId,

                    idNumber:
                        OlympState.olympId,

                    sessionToken:
                        OlympState.sessionToken,

                    token:
                        OlympState.sessionToken

                }
            );

        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionError(
                    result
                )
            ) {

                clearSession();

            }

            return result;

        }

        const citizen =
            result.citizen ||
            result.profile ||
            result.user;

        if (
            citizen
        ) {

            OlympState.citizen =
                citizen;

            OlympState.profile =
                citizen;

            localStorage.setItem(
                OLYMP_CONFIG.STORAGE.CITIZEN,
                JSON.stringify(citizen)
            );

            localStorage.setItem(
                OLYMP_CONFIG.STORAGE.PROFILE,
                JSON.stringify(citizen)
            );

        }

        if (
            Array.isArray(
                result.applications
            )
        ) {

            OlympState.applications =
                result.applications;

        }

        OlympState.authenticated =
            true;

        updateAuthUI();

        renderProfile(
            citizen
        );

        renderApplications(
            OlympState.applications
        );

        return result;

    } catch (error) {

        console.error(
            "loadProfile:",
            error
        );

        return {
            success:
                false,

            message:
                error.message
        };

    }

}


/* =========================================================
   LOAD APPLICATIONS
========================================================= */

async function loadApplications() {

    if (
        !isLoggedIn()
    ) {

        OlympState.applications =
            [];

        renderApplications(
            []
        );

        return [];

    }

    try {

        const result =
            await apiRequest(
                "applications",
                {

                    olympId:
                        OlympState.olympId,

                    citizenId:
                        OlympState.olympId,

                    idNumber:
                        OlympState.olympId,

                    sessionToken:
                        OlympState.sessionToken,

                    token:
                        OlympState.sessionToken

                }
            );

        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionError(
                    result
                )
            ) {

                clearSession();

            }

            return [];

        }

        OlympState.applications =
            Array.isArray(
                result.applications
            )
                ? result.applications
                : [];

        renderApplications(
            OlympState.applications
        );

        updateStatistics(
            OlympState.applications
        );

        return OlympState.applications;

    } catch (error) {

        console.error(
            "loadApplications:",
            error
        );

        return [];

    }

}


/* =========================================================
   CREATE APPLICATION
========================================================= */

async function createApplication(
    data
) {

    if (
        !isLoggedIn()
    ) {

        showLoginRequired();

        return {
            success:
                false,

            authRequired:
                true
        };

    }

    const sessionValid =
        await validateSession();

    if (
        !sessionValid
    ) {

        showLoginRequired();

        return {
            success:
                false,

            authRequired:
                true
        };

    }

    data =
        data || {};

    const service =
        String(
            data.service ||
            data.serviceName ||
            data.type ||
            ""
        ).trim();

    const message =
        String(
            data.message ||
            data.description ||
            data.text ||
            ""
        ).trim();

    const contact =
        String(
            data.contact ||
            data.preferredContact ||
            (
                OlympState.citizen
                    ? (
                        OlympState.citizen.contact ||
                        OlympState.citizen.preferredContact ||
                        ""
                    )
                    : ""
            )
        ).trim();

    if (
        !service
    ) {

        showMessage(
            "Оберіть державну послугу.",
            "error"
        );

        return {
            success:
                false
        };

    }

    if (
        !message
    ) {

        showMessage(
            "Вкажіть опис звернення.",
            "error"
        );

        return {
            success:
                false
        };

    }

    setLoading(
        true
    );

    try {

        const result =
            await apiRequest(
                "createapplication",
                {

                    olympId:
                        OlympState.olympId,

                    citizenId:
                        OlympState.olympId,

                    idNumber:
                        OlympState.olympId,

                    sessionToken:
                        OlympState.sessionToken,

                    token:
                        OlympState.sessionToken,

                    service:
                        service,

                    serviceName:
                        service,

                    type:
                        service,

                    message:
                        message,

                    description:
                        message,

                    text:
                        message,

                    contact:
                        contact,

                    preferredContact:
                        contact

                }
            );

        console.log(
            "OLYMP createapplication:",
            result
        );

        if (
            !result ||
            !result.success
        ) {

            if (
                isSessionError(
                    result
                )
            ) {

                clearSession();

                showLoginRequired();

                return result;

            }

            showMessage(
                result &&
                result.message
                    ? result.message
                    : "Не вдалося подати звернення.",
                "error"
            );

            return result;

        }

        if (
            result.application
        ) {

            OlympState.applications.unshift(
                result.application
            );

        }

        await loadApplications();

        renderApplications(
            OlympState.applications
        );

        updateStatistics(
            OlympState.applications
        );

        showMessage(
            "Звернення успішно подано.",
            "success"
        );

        return result;

    } catch (error) {

        console.error(
            "createApplication:",
            error
        );

        showMessage(
            error.message ||
            "Помилка подання звернення.",
            "error"
        );

        return {
            success:
                false,

            message:
                error.message
        };

    } finally {

        setLoading(
            false
        );

    }

}


/* =========================================================
   RENDER PROFILE
========================================================= */

function renderProfile(
    citizen
) {

    if (
        !citizen
    ) {

        return;

    }

    const map = {

        fullName:
            citizen.fullName ||
            citizen.name ||
            citizen.fio ||
            "",

        olympId:
            citizen.olympId ||
            citizen.citizenId ||
            citizen.idNumber ||
            OlympState.olympId ||
            "",

        birthDate:
            citizen.birthDate ||
            "",

        phone:
            citizen.phone ||
            "",

        email:
            citizen.email ||
            "",

        discord:
            citizen.discord ||
            "",

        contact:
            citizen.contact ||
            citizen.preferredContact ||
            "",

        status:
            citizen.status ||
            "Активний",

        registrationDate:
            citizen.registrationDate ||
            citizen.createdAt ||
            ""

    };

    document
        .querySelectorAll(
            "[data-profile]"
        )
        .forEach(
            function (element) {

                const key =
                    element.dataset.profile;

                if (
                    Object.prototype.hasOwnProperty.call(
                        map,
                        key
                    )
                ) {

                    element.textContent =
                        map[key];

                }

            }
        );

}


/* =========================================================
   RENDER APPLICATIONS
========================================================= */

function renderApplications(
    applications
) {

    applications =
        Array.isArray(
            applications
        )
            ? applications
            : [];

    const containers =
        document.querySelectorAll(
            "[data-applications-list], " +
            "#applicationsList, " +
            "#applicationsContainer"
        );

    containers.forEach(
        function (container) {

            if (
                !applications.length
            ) {

                container.innerHTML =
                    `
                    <div class="applications-empty">

                        <div class="applications-empty-icon">
                            📄
                        </div>

                        <div class="applications-empty-title">
                            Заявок поки немає
                        </div>

                        <div class="applications-empty-text">
                            Ви ще не подавали заявок.
                        </div>

                    </div>
                    `;

                return;

            }

            container.innerHTML =
                applications
                    .map(
                        function (application, index) {

                            return createApplicationHTML(
                                application,
                                index
                            );

                        }
                    )
                    .join("");

        }
    );

    updateStatistics(
        applications
    );

}


/* =========================================================
   CREATE APPLICATION HTML
========================================================= */

function createApplicationHTML(
    application,
    index
) {

    application =
        application || {};

    const number =
        escapeHTML(
            application.number ||
            application.applicationNumber ||
            application.requestNumber ||
            "—"
        );

    const service =
        escapeHTML(
            application.service ||
            application.serviceName ||
            application.type ||
            "—"
        );

    const status =
        application.status ||
        "🟡 На розгляді";

    const message =
        escapeHTML(
            application.message ||
            application.description ||
            application.text ||
            ""
        );

    const date =
        formatDate(
            application.date ||
            application.createdAt ||
            application.timestamp ||
            ""
        );

    const responsible =
        escapeHTML(
            application.responsible ||
            "Не призначено"
        );

    const comment =
        escapeHTML(
            application.comment ||
            application.response ||
            ""
        );

    const statusClass =
        getStatusClass(
            status
        );

    /*
     * ВАЖНО:
     * Теперь HTML вызывает глобальную
     * openApplicationModal().
     */

    return `
        <div
            class="application-card"
            data-application-number="${number}"
        >

            <div class="application-card-header">

                <div class="application-number">
                    ${number}
                </div>

                <div class="application-status ${statusClass}">
                    ${escapeHTML(status)}
                </div>

            </div>

            <div class="application-card-body">

                <div class="application-service">
                    ${service}
                </div>

                <div class="application-date">
                    ${date}
                </div>

                ${
                    message
                        ? `
                            <div class="application-message">
                                ${message}
                            </div>
                          `
                        : ""
                }

                ${
                    responsible &&
                    responsible !== "Не призначено"
                        ? `
                            <div class="application-responsible">
                                <strong>Відповідальний:</strong>
                                ${responsible}
                            </div>
                          `
                        : ""
                }

                ${
                    comment
                        ? `
                            <div class="application-comment">
                                <strong>Відповідь:</strong>
                                ${comment}
                            </div>
                          `
                        : ""
                }

            </div>

            <div class="application-card-footer">

                <button
                    type="button"
                    class="application-view-button"
                    onclick="openApplicationModal(${index})"
                >
                    Переглянути звернення
                </button>

            </div>

        </div>
    `;

}


/* =========================================================
   OPEN APPLICATION MODAL
   ГЛАВНАЯ ИСПРАВЛЕННАЯ ФУНКЦИЯ
========================================================= */

function openApplicationModal(
    applicationOrIndex
) {

    console.log(
        "OLYMP: openApplicationModal()",
        applicationOrIndex
    );

    let application =
        null;

    /*
     * Если передали число:
     *
     * openApplicationModal(0)
     */

    if (
        typeof applicationOrIndex ===
        "number"
    ) {

        application =
            OlympState.applications[
                applicationOrIndex
            ];

    }

    /*
     * Если передали строку:
     *
     * openApplicationModal("OLYMP-APP-0001")
     */

    else if (
        typeof applicationOrIndex ===
        "string"
    ) {

        const value =
            applicationOrIndex.trim();

        application =
            OlympState.applications.find(
                function (item) {

                    return String(
                        item.number ||
                        item.applicationNumber ||
                        item.requestNumber ||
                        ""
                    ).trim() === value;

                }
            );

    }

    /*
     * Если передали сам объект
     */

    else if (
        applicationOrIndex &&
        typeof applicationOrIndex ===
        "object"
    ) {

        application =
            applicationOrIndex;

    }

    if (
        !application
    ) {

        showMessage(
            "Звернення не знайдено.",
            "error"
        );

        console.warn(
            "OLYMP: application not found",
            applicationOrIndex,
            OlympState.applications
        );

        return false;

    }

    const modal =
        getApplicationModal();

    if (
        !modal
    ) {

        /*
         * Если в HTML нет готового modal,
         * создаём его автоматически.
         */

        createApplicationModal();

    }

    const actualModal =
        getApplicationModal();

    if (
        !actualModal
    ) {

        console.error(
            "OLYMP: не удалось создать модальное окно."
        );

        return false;

    }

    fillApplicationModal(
        actualModal,
        application
    );

    actualModal.classList.add(
        "active"
    );

    actualModal.style.display =
        "flex";

    actualModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

    return true;

}


/* =========================================================
   GLOBAL OPEN APPLICATION MODAL
========================================================= */

window.openApplicationModal =
    openApplicationModal;


/* =========================================================
   GET APPLICATION MODAL
========================================================= */

function getApplicationModal() {

    return document.querySelector(
        "#applicationModal, " +
        "#applicationViewModal, " +
        ".application-modal, " +
        "[data-application-modal]"
    );

}


/* =========================================================
   CREATE APPLICATION MODAL
========================================================= */

function createApplicationModal() {

    if (
        getApplicationModal()
    ) {

        return;

    }

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "applicationModal";

    modal.className =
        "application-modal modal-overlay";

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    modal.innerHTML =
        `
        <div
            class="application-modal-dialog modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="applicationModalTitle"
        >

            <div class="application-modal-header">

                <div>

                    <div
                        class="application-modal-label"
                    >
                        ЗВЕРНЕННЯ ГРОМАДЯНИНА
                    </div>

                    <h2
                        id="applicationModalTitle"
                    >
                        Перегляд звернення
                    </h2>

                </div>

                <button
                    type="button"
                    class="application-modal-close"
                    data-close-application-modal
                    aria-label="Закрити"
                >
                    ×
                </button>

            </div>

            <div
                class="application-modal-body"
            >

                <div
                    class="application-modal-status-row"
                >

                    <span>
                        Статус
                    </span>

                    <span
                        id="applicationModalStatus"
                    >
                        —
                    </span>

                </div>

                <div
                    class="application-modal-grid"
                >

                    <div
                        class="application-modal-field"
                    >

                        <span>
                            Номер звернення
                        </span>

                        <strong
                            id="applicationModalNumber"
                        >
                            —
                        </strong>

                    </div>

                    <div
                        class="application-modal-field"
                    >

                        <span>
                            Дата подання
                        </span>

                        <strong
                            id="applicationModalDate"
                        >
                            —
                        </strong>

                    </div>

                    <div
                        class="application-modal-field"
                    >

                        <span>
                            Послуга
                        </span>

                        <strong
                            id="applicationModalService"
                        >
                            —
                        </strong>

                    </div>

                    <div
                        class="application-modal-field"
                    >

                        <span>
                            Відповідальний
                        </span>

                        <strong
                            id="applicationModalResponsible"
                        >
                            Не призначено
                        </strong>

                    </div>

                    <div
                        class="application-modal-field"
                    >

                        <span>
                            Контакт
                        </span>

                        <strong
                            id="applicationModalContact"
                        >
                            —
                        </strong>

                    </div>

                </div>

                <div
                    class="application-modal-section"
                >

                    <div
                        class="application-modal-section-title"
                    >
                        Опис звернення
                    </div>

                    <div
                        id="applicationModalMessage"
                        class="application-modal-text"
                    >
                        —
                    </div>

                </div>

                <div
                    id="applicationModalResponseSection"
                    class="application-modal-section"
                    style="display:none;"
                >

                    <div
                        class="application-modal-section-title"
                    >
                        Відповідь уряду
                    </div>

                    <div
                        id="applicationModalResponse"
                        class="application-modal-text"
                    >
                        —
                    </div>

                </div>

            </div>

            <div
                class="application-modal-footer"
            >

                <button
                    type="button"
                    class="application-modal-button"
                    data-close-application-modal
                >
                    Закрити
                </button>

            </div>

        </div>
        `;

    document.body.appendChild(
        modal
    );

    setupApplicationModal();

}


/* =========================================================
   FILL APPLICATION MODAL
========================================================= */

function fillApplicationModal(
    modal,
    application
) {

    const number =
        application.number ||
        application.applicationNumber ||
        application.requestNumber ||
        "—";

    const service =
        application.service ||
        application.serviceName ||
        application.type ||
        "—";

    const status =
        application.status ||
        "🟡 На розгляді";

    const message =
        application.message ||
        application.description ||
        application.text ||
        "—";

    const date =
        formatDate(
            application.date ||
            application.createdAt ||
            application.timestamp ||
            ""
        );

    const responsible =
        application.responsible ||
        application.executor ||
        application.employee ||
        "Не призначено";

    const contact =
        application.contact ||
        application.preferredContact ||
        (
            OlympState.citizen
                ? (
                    OlympState.citizen.contact ||
                    OlympState.citizen.preferredContact ||
                    ""
                )
                : ""
        ) ||
        "—";

    const response =
        application.comment ||
        application.response ||
        application.answer ||
        application.adminComment ||
        "";

    setModalText(
        modal,
        "#applicationModalNumber",
        number
    );

    setModalText(
        modal,
        "#applicationModalService",
        service
    );

    setModalText(
        modal,
        "#applicationModalStatus",
        status
    );

    setModalText(
        modal,
        "#applicationModalDate",
        date
    );

    setModalText(
        modal,
        "#applicationModalResponsible",
        responsible
    );

    setModalText(
        modal,
        "#applicationModalContact",
        contact
    );

    setModalText(
        modal,
        "#applicationModalMessage",
        message
    );

    const responseSection =
        modal.querySelector(
            "#applicationModalResponseSection"
        );

    const responseElement =
        modal.querySelector(
            "#applicationModalResponse"
        );

    if (
        response
    ) {

        if (
            responseElement
        ) {

            responseElement.textContent =
                response;

        }

        if (
            responseSection
        ) {

            responseSection.style.display =
                "";

        }

    } else {

        if (
            responseElement
        ) {

            responseElement.textContent =
                "Відповідь ще не надана.";

        }

        if (
            responseSection
        ) {

            responseSection.style.display =
                "";

        }

    }

    const statusElement =
        modal.querySelector(
            "#applicationModalStatus"
        );

    if (
        statusElement
    ) {

        statusElement.className =
            "application-modal-status " +
            getStatusClass(
                status
            );

    }

}


/* =========================================================
   SET MODAL TEXT
========================================================= */

function setModalText(
    modal,
    selector,
    value
) {

    const element =
        modal.querySelector(
            selector
        );

    if (
        element
    ) {

        element.textContent =
            value === undefined ||
            value === null
                ? ""
                : String(value);

    }

}


/* =========================================================
   CLOSE APPLICATION MODAL
========================================================= */

function closeApplicationModal() {

    const modal =
        getApplicationModal();

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

    /*
     * Небольшая задержка позволяет CSS-анимации
     * нормально завершиться.
     */

    setTimeout(
        function () {

            if (
                !modal.classList.contains(
                    "active"
                )
            ) {

                modal.style.display =
                    "none";

            }

        },
        200
    );

    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   GLOBAL CLOSE MODAL
========================================================= */

window.closeApplicationModal =
    closeApplicationModal;


/* =========================================================
   SETUP APPLICATION MODAL
========================================================= */

function setupApplicationModal() {

    const modal =
        getApplicationModal();

    if (
        !modal
    ) {

        return;

    }

    if (
        modal.dataset.olympModalBound ===
        "true"
    ) {

        return;

    }

    modal.dataset.olympModalBound =
        "true";

    /*
     * Кнопки закрытия
     */

    modal
        .querySelectorAll(
            "[data-close-application-modal]"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        closeApplicationModal();

                    }
                );

            }
        );

    /*
     * Клик по затемнённому фону
     */

    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                modal
            ) {

                closeApplicationModal();

            }

        }
    );

}


/* =========================================================
   ESC — CLOSE MODAL
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            const modal =
                getApplicationModal();

            if (
                modal &&
                modal.classList.contains(
                    "active"
                )
            ) {

                closeApplicationModal();

            }

        }

    }
);


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics(
    applications
) {

    applications =
        Array.isArray(
            applications
        )
            ? applications
            : [];

    let pending =
        0;

    let approved =
        0;

    let completed =
        0;

    let rejected =
        0;

    let closed =
        0;

    applications.forEach(
        function (application) {

            const status =
                String(
                    application.status ||
                    ""
                ).toLowerCase();

            if (
                status.indexOf(
                    "розгляді"
                ) !== -1
            ) {

                pending++;

            }

            if (
                status.indexOf(
                    "прийнято"
                ) !== -1
            ) {

                approved++;

            }

            if (
                status.indexOf(
                    "виконано"
                ) !== -1
            ) {

                completed++;

            }

            if (
                status.indexOf(
                    "відхилено"
                ) !== -1
            ) {

                rejected++;

            }

            if (
                status.indexOf(
                    "закрито"
                ) !== -1
            ) {

                closed++;

            }

        }
    );

    const values = {

        total:
            applications.length,

        pending:
            pending,

        approved:
            approved,

        completed:
            completed,

        rejected:
            rejected,

        closed:
            closed

    };

    Object.keys(values).forEach(
        function (key) {

            setText(
                `[data-stat="${key}"]`,
                values[key]
            );

            setText(
                `#stat-${key}`,
                values[key]
            );

            setText(
                `#${key}Applications`,
                values[key]
            );

        }
    );

}


/* =========================================================
   SETUP FORMS
========================================================= */

function setupForms() {

    setupLoginForms();

    setupRegisterForms();

    setupApplicationForms();

    setupLogoutButtons();

}


/* =========================================================
   LOGIN FORMS
========================================================= */

function setupLoginForms() {

    const forms =
        document.querySelectorAll(
            "form[data-login-form], " +
            "#loginForm, " +
            ".login-form"
        );

    forms.forEach(
        function (form) {

            if (
                form.dataset.olympBound ===
                "true"
            ) {

                return;

            }

            form.dataset.olympBound =
                "true";

            form.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    const olympId =
                        getFormValue(
                            form,
                            [
                                "olympId",
                                "citizenId",
                                "idNumber",
                                "login"
                            ]
                        );

                    const password =
                        getFormValue(
                            form,
                            [
                                "password",
                                "pass"
                            ]
                        );

                    await loginCitizen(
                        olympId,
                        password
                    );

                }
            );

        }
    );

}


/* =========================================================
   REGISTER FORMS
========================================================= */

function setupRegisterForms() {

    const forms =
        document.querySelectorAll(
            "form[data-register-form], " +
            "#registerForm, " +
            ".register-form"
        );

    forms.forEach(
        function (form) {

            if (
                form.dataset.olympBound ===
                "true"
            ) {

                return;

            }

            form.dataset.olympBound =
                "true";

            form.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    await registerCitizen({

                        fullName:
                            getFormValue(
                                form,
                                [
                                    "fullName",
                                    "name",
                                    "fio"
                                ]
                            ),

                        birthDate:
                            getFormValue(
                                form,
                                [
                                    "birthDate",
                                    "dateOfBirth",
                                    "dob"
                                ]
                            ),

                        phone:
                            getFormValue(
                                form,
                                [
                                    "phone",
                                    "telephone"
                                ]
                            ),

                        email:
                            getFormValue(
                                form,
                                [
                                    "email",
                                    "mail"
                                ]
                            ),

                        discord:
                            getFormValue(
                                form,
                                [
                                    "discord"
                                ]
                            ),

                        contact:
                            getFormValue(
                                form,
                                [
                                    "contact",
                                    "preferredContact"
                                ]
                            ),

                        password:
                            getFormValue(
                                form,
                                [
                                    "password",
                                    "pass"
                                ]
                            )

                    });

                }
            );

        }
    );

}


/* =========================================================
   APPLICATION FORMS
========================================================= */

function setupApplicationForms() {

    const forms =
        document.querySelectorAll(
            "form[data-application-form], " +
            "form[data-application], " +
            "#applicationForm, " +
            "#requestForm, " +
            "#appealForm, " +
            ".application-form, " +
            ".request-form, " +
            ".appeal-form"
        );

    forms.forEach(
        function (form) {

            bindApplicationForm(
                form
            );

        }
    );

    document
        .querySelectorAll(
            "form"
        )
        .forEach(
            function (form) {

                if (
                    form.dataset.olympBound ===
                    "true"
                ) {

                    return;

                }

                const serviceField =
                    form.querySelector(
                        "[name='service'], " +
                        "[name='serviceName'], " +
                        "[name='type']"
                    );

                const messageField =
                    form.querySelector(
                        "[name='message'], " +
                        "[name='description'], " +
                        "[name='text']"
                    );

                if (
                    serviceField &&
                    messageField
                ) {

                    bindApplicationForm(
                        form
                    );

                }

            }
        );

}


/* =========================================================
   BIND APPLICATION FORM
========================================================= */

function bindApplicationForm(
    form
) {

    if (
        !form
    ) {

        return;

    }

    if (
        form.dataset.olympBound ===
        "true"
    ) {

        return;

    }

    form.dataset.olympBound =
        "true";

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            event.stopPropagation();

            if (
                !isLoggedIn()
            ) {

                showLoginRequired();

                return;

            }

            const data = {

                service:
                    getFormValue(
                        form,
                        [
                            "service",
                            "serviceName",
                            "type"
                        ]
                    ),

                message:
                    getFormValue(
                        form,
                        [
                            "message",
                            "description",
                            "text"
                        ]
                    ),

                contact:
                    getFormValue(
                        form,
                        [
                            "contact",
                            "preferredContact"
                        ]
                    )

            };

            const result =
                await createApplication(
                    data
                );

            if (
                result &&
                result.success
            ) {

                try {

                    form.reset();

                } catch (error) {

                    console.warn(
                        error
                    );

                }

                const modal =
                    form.closest(
                        ".modal, " +
                        ".modal-overlay, " +
                        "[role='dialog'], " +
                        "[data-modal]"
                    );

                if (
                    modal
                ) {

                    modal.classList.remove(
                        "active"
                    );

                }

            }

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogoutButtons() {

    document
        .querySelectorAll(
            "[data-logout], " +
            "#logoutButton, " +
            "#logoutBtn"
        )
        .forEach(
            function (button) {

                if (
                    button.dataset.olympBound ===
                    "true"
                ) {

                    return;

                }

                button.dataset.olympBound =
                    "true";

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        logoutCitizen();

                    }
                );

            }
        );

}


async function logoutCitizen() {

    const token =
        OlympState.sessionToken;

    try {

        if (
            token
        ) {

            await apiRequest(
                "logout",
                {

                    sessionToken:
                        token,

                    token:
                        token

                }
            );

        }

    } catch (error) {

        console.warn(
            "Logout API error:",
            error
        );

    }

    clearSession();

    showMessage(
        "Ви вийшли з особистого кабінету.",
        "success"
    );

    setTimeout(
        function () {

            const loginUrl =
                findLoginPage();

            if (
                loginUrl
            ) {

                window.location.href =
                    loginUrl;

            }

        },
        300
    );

}


/* =========================================================
   APPLICATION BUTTONS
========================================================= */

function setupApplicationButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-submit-application], " +
            "[data-application-submit], " +
            "#submitApplication, " +
            "#sendApplication, " +
            "#submitRequest, " +
            "#sendRequest, " +
            "#submitAppeal, " +
            "#sendAppeal"
        );

    buttons.forEach(
        function (button) {

            bindApplicationButton(
                button
            );

        }
    );

}


/* =========================================================
   BIND APPLICATION BUTTON
========================================================= */

function bindApplicationButton(
    button
) {

    if (
        !button
    ) {

        return;

    }

    if (
        button.dataset.olympApplicationBound ===
        "true"
    ) {

        return;

    }

    button.dataset.olympApplicationBound =
        "true";

    const type =
        String(
            button.type ||
            ""
        ).toLowerCase();

    if (
        type ===
        "submit"
    ) {

        return;

    }

    button.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            event.stopPropagation();

            if (
                !isLoggedIn()
            ) {

                showLoginRequired();

                return;

            }

            const form =
                button.closest(
                    "form"
                );

            if (
                form
            ) {

                if (
                    typeof form.requestSubmit ===
                    "function"
                ) {

                    form.requestSubmit();

                } else {

                    form.dispatchEvent(
                        new Event(
                            "submit",
                            {
                                bubbles:
                                    true,

                                cancelable:
                                    true
                            }
                        )
                    );

                }

                return;

            }

            const container =
                button.closest(
                    "[data-application], " +
                    ".application, " +
                    ".application-modal, " +
                    ".request, " +
                    ".appeal, " +
                    ".modal, " +
                    "[role='dialog']"
                ) ||
                document;

            const result =
                await createApplication({

                    service:
                        getElementValue(
                            container,
                            [
                                "service",
                                "serviceName",
                                "type"
                            ]
                        ),

                    message:
                        getElementValue(
                            container,
                            [
                                "message",
                                "description",
                                "text"
                            ]
                        ),

                    contact:
                        getElementValue(
                            container,
                            [
                                "contact",
                                "preferredContact"
                            ]
                        )

                });

            if (
                result &&
                result.success
            ) {

                clearApplicationFields(
                    container
                );

            }

        }
    );

}


/* =========================================================
   GET ELEMENT VALUE
========================================================= */

function getElementValue(
    container,
    names
) {

    if (
        !container
    ) {

        return "";

    }

    for (
        let i = 0;
        i < names.length;
        i++
    ) {

        const name =
            names[i];

        const element =
            container.querySelector(
                `[name="${name}"], #${name}, [data-field="${name}"]`
            );

        if (
            element
        ) {

            if (
                element.value !== undefined
            ) {

                const value =
                    String(
                        element.value
                    ).trim();

                if (
                    value
                ) {

                    return value;

                }

            }

        }

    }

    return "";

}


/* =========================================================
   CLEAR APPLICATION FIELDS
========================================================= */

function clearApplicationFields(
    container
) {

    if (
        !container
    ) {

        return;

    }

    container
        .querySelectorAll(
            "input, textarea, select"
        )
        .forEach(
            function (element) {

                const name =
                    String(
                        element.name ||
                        ""
                    ).toLowerCase();

                if (
                    name === "service" ||
                    name === "servicename" ||
                    name === "type" ||
                    name === "message" ||
                    name === "description" ||
                    name === "text"
                ) {

                    if (
                        element.tagName ===
                        "SELECT"
                    ) {

                        element.selectedIndex =
                            0;

                    } else {

                        element.value =
                            "";

                    }

                }

            }
        );

}


/* =========================================================
   CABINET LINKS
========================================================= */

function setupCabinetLinks() {

    document
        .querySelectorAll(
            "a[href*='cabinet'], " +
            "[data-cabinet-link]"
        )
        .forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function () {

                    }
                );

            }
        );

}


/* =========================================================
   LOGIN REQUIRED
========================================================= */

function showLoginRequired() {

    const message =
        "Для подання заявки необхідно увійти до особистого кабінету.";

    showMessage(
        message,
        "error"
    );

    const loginButton =
        document.querySelector(
            "[data-login-button], " +
            "#loginButton, " +
            "#loginBtn"
        );

    if (
        loginButton
    ) {

        loginButton.click();

        return;

    }

    const modal =
        document.querySelector(
            "#loginModal, " +
            ".login-modal, " +
            "[data-login-modal]"
        );

    if (
        modal
    ) {

        modal.classList.add(
            "active"
        );

        modal.style.display =
            "";

    }

}


/* =========================================================
   REDIRECT CABINET
========================================================= */

function redirectToCabinet() {

    const current =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    if (
        current ===
        "cabinet.html"
    ) {

        return;

    }

    const cabinetLink =
        document.querySelector(
            "a[href*='cabinet.html'], " +
            "a[href*='cabinet']"
        );

    if (
        cabinetLink &&
        cabinetLink.href
    ) {

        window.location.href =
            cabinetLink.href;

        return;

    }

    window.location.href =
        "cabinet.html";

}


/* =========================================================
   FIND LOGIN PAGE
========================================================= */

function findLoginPage() {

    const link =
        document.querySelector(
            "a[href*='login']"
        );

    if (
        link &&
        link.href
    ) {

        return link.href;

    }

    return "";

}


/* =========================================================
   CLOSE AUTH
========================================================= */

function closeAuthForms() {

    document
        .querySelectorAll(
            "#loginModal, " +
            "#registerModal, " +
            ".login-modal, " +
            ".register-modal, " +
            "[data-login-modal], " +
            "[data-register-modal]"
        )
        .forEach(
            function (modal) {

                modal.classList.remove(
                    "active"
                );

            }
        );

}


/* =========================================================
   FORM VALUE
========================================================= */

function getFormValue(
    form,
    names
) {

    for (
        let i = 0;
        i < names.length;
        i++
    ) {

        const element =
            form.querySelector(
                `[name="${names[i]}"], #${names[i]}`
            );

        if (
            element &&
            element.value !== undefined
        ) {

            const value =
                String(
                    element.value
                ).trim();

            if (
                value
            ) {

                return value;

            }

        }

    }

    return "";

}


/* =========================================================
   LOADING
========================================================= */

function setLoading(
    state
) {

    OlympState.loading =
        Boolean(
            state
        );

    document
        .querySelectorAll(
            "[data-loading]"
        )
        .forEach(
            function (element) {

                element.style.display =
                    state
                        ? ""
                        : "none";

            }
        );

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type = "info"
) {

    if (
        !message
    ) {

        return;

    }

    let container =
        document.querySelector(
            "[data-message]"
        );

    if (
        !container
    ) {

        container =
            document.querySelector(
                "#message"
            );

    }

    if (
        !container
    ) {

        container =
            document.querySelector(
                ".message"
            );

    }

    if (
        !container
    ) {

        container =
            document.createElement(
                "div"
            );

        container.className =
            "olymp-message";

        document.body.appendChild(
            container
        );

    }

    container.textContent =
        message;

    container.classList.remove(
        "success",
        "error",
        "info",
        "warning"
    );

    container.classList.add(
        type
    );

    container.style.display =
        "";

    clearTimeout(
        container._olympTimeout
    );

    container._olympTimeout =
        setTimeout(
            function () {

                container.style.display =
                    "none";

            },
            5000
        );

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    selector,
    value
) {

    document
        .querySelectorAll(
            selector
        )
        .forEach(
            function (element) {

                element.textContent =
                    value === undefined ||
                    value === null
                        ? ""
                        : value;

            }
        );

}


/* =========================================================
   NORMALIZE OLYMP-ID
========================================================= */

function normalizeOlympId(
    value
) {

    let result =
        String(
            value ||
            ""
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
            result.substring(
                5
            );

    }

    return result;

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(
    status
) {

    const value =
        String(
            status ||
            ""
        ).toLowerCase();

    if (
        value.indexOf(
            "прийнято"
        ) !== -1
    ) {

        return "status-approved";

    }

    if (
        value.indexOf(
            "виконано"
        ) !== -1
    ) {

        return "status-completed";

    }

    if (
        value.indexOf(
            "відхилено"
        ) !== -1
    ) {

        return "status-rejected";

    }

    if (
        value.indexOf(
            "закрито"
        ) !== -1
    ) {

        return "status-closed";

    }

    return "status-pending";

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (
        !value
    ) {

        return "—";

    }

    const date =
        new Date(
            value
        );

    if (
        isNaN(
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

        return String(
            value
        );

    }

}


/* =========================================================
   SESSION ERROR
========================================================= */

function isSessionError(
    result
) {

    if (
        !result
    ) {

        return false;

    }

    const message =
        String(
            result.message ||
            ""
        ).toLowerCase();

    return (

        message.indexOf(
            "сесія"
        ) !== -1 ||

        message.indexOf(
            "сесс"
        ) !== -1 ||

        message.indexOf(
            "увійдіть"
        ) !== -1 ||

        message.indexOf(
            "войд"
        ) !== -1 ||

        message.indexOf(
            "olymp-id"
        ) !== -1 ||

        message.indexOf(
            "token"
        ) !== -1

    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
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
   SAVE AVATAR
========================================================= */

async function saveAvatar(
    avatarUrl
) {

    if (
        !isLoggedIn()
    ) {

        showLoginRequired();

        return {
            success:
                false
        };

    }

    avatarUrl =
        String(
            avatarUrl ||
            ""
        ).trim();

    if (
        !avatarUrl
    ) {

        showMessage(
            "Вкажіть посилання на аватар.",
            "error"
        );

        return {
            success:
                false
        };

    }

    try {

        const result =
            await apiRequest(
                "saveavatar",
                {

                    olympId:
                        OlympState.olympId,

                    sessionToken:
                        OlympState.sessionToken,

                    token:
                        OlympState.sessionToken,

                    avatarUrl:
                        avatarUrl,

                    avatar:
                        avatarUrl,

                    image:
                        avatarUrl,

                    url:
                        avatarUrl

                }
            );

        if (
            !result ||
            !result.success
        ) {

            showMessage(
                result &&
                result.message
                    ? result.message
                    : "Не вдалося зберегти аватар.",
                "error"
            );

            return result;

        }

        const citizen =
            result.citizen ||
            result.profile;

        if (
            citizen
        ) {

            OlympState.citizen =
                citizen;

            OlympState.profile =
                citizen;

            localStorage.setItem(
                OLYMP_CONFIG.STORAGE.CITIZEN,
                JSON.stringify(citizen)
            );

            localStorage.setItem(
                OLYMP_CONFIG.STORAGE.PROFILE,
                JSON.stringify(citizen)
            );

        }

        updateAvatarUI(
            citizen
        );

        showMessage(
            "Аватар успішно збережено.",
            "success"
        );

        return result;

    } catch (error) {

        console.error(
            "saveAvatar:",
            error
        );

        showMessage(
            error.message ||
            "Помилка збереження аватара.",
            "error"
        );

        return {
            success:
                false
        };

    }

}


/* =========================================================
   REMOVE AVATAR
========================================================= */

async function removeAvatar() {

    if (
        !isLoggedIn()
    ) {

        showLoginRequired();

        return {
            success:
                false
        };

    }

    try {

        const result =
            await apiRequest(
                "removeavatar",
                {

                    olympId:
                        OlympState.olympId,

                    sessionToken:
                        OlympState.sessionToken,

                    token:
                        OlympState.sessionToken

                }
            );

        if (
            !result ||
            !result.success
        ) {

            showMessage(
                result &&
                result.message
                    ? result.message
                    : "Не вдалося видалити аватар.",
                "error"
            );

            return result;

        }

        if (
            OlympState.citizen
        ) {

            OlympState.citizen.avatarUrl =
                "";

            OlympState.citizen.avatar =
                "";

            OlympState.citizen.photo =
                "";

            localStorage.setItem(
                OLYMP_CONFIG.STORAGE.CITIZEN,
                JSON.stringify(
                    OlympState.citizen
                )
            );

        }

        updateAvatarUI(
            OlympState.citizen
        );

        showMessage(
            "Аватар видалено.",
            "success"
        );

        return result;

    } catch (error) {

        console.error(
            "removeAvatar:",
            error
        );

        return {
            success:
                false
        };

    }

}


/* =========================================================
   UPDATE AUTH UI
========================================================= */

function updateAuthUI() {

    const loggedIn =
        isLoggedIn();

    const citizen =
        getCurrentUser();

    document
        .querySelectorAll(
            "[data-auth-only]"
        )
        .forEach(
            function (element) {

                element.style.display =
                    loggedIn
                        ? ""
                        : "none";

            }
        );

    document
        .querySelectorAll(
            "[data-guest-only]"
        )
        .forEach(
            function (element) {

                element.style.display =
                    loggedIn
                        ? "none"
                        : "";

            }
        );

    setText(
        "[data-user-olymp-id]",
        OlympState.olympId
    );

    setText(
        "#userOlympId",
        OlympState.olympId
    );

    setText(
        "#olympId",
        OlympState.olympId
    );

    setText(
        "#profileOlympId",
        OlympState.olympId
    );

    if (
        citizen
    ) {

        const name =
            citizen.fullName ||
            citizen.name ||
            citizen.fio ||
            "";

        setText(
            "[data-user-name]",
            name
        );

        setText(
            "#userName",
            name
        );

        setText(
            "#profileName",
            name
        );

        setText(
            "#citizenName",
            name
        );

        setText(
            "[data-user-email]",
            citizen.email ||
            ""
        );

        setText(
            "#profileEmail",
            citizen.email ||
            ""
        );

        setText(
            "[data-user-phone]",
            citizen.phone ||
            ""
        );

        setText(
            "#profilePhone",
            citizen.phone ||
            ""
        );

        setText(
            "[data-user-discord]",
            citizen.discord ||
            ""
        );

        setText(
            "#profileDiscord",
            citizen.discord ||
            ""
        );

        setText(
            "[data-user-birth-date]",
            citizen.birthDate ||
            ""
        );

        setText(
            "#profileBirthDate",
            citizen.birthDate ||
            ""
        );

        setText(
            "[data-user-status]",
            citizen.status ||
            "Активний"
        );

    }

    updateAvatarUI(
        citizen
    );

    updateApplicationButtons();

}


/* =========================================================
   UPDATE APPLICATION BUTTONS
========================================================= */

function updateApplicationButtons() {

    const loggedIn =
        isLoggedIn();

    document
        .querySelectorAll(
            "[data-submit-application], " +
            "[data-application-submit], " +
            "#submitApplication, " +
            "#sendApplication, " +
            "#submitRequest, " +
            "#sendRequest"
        )
        .forEach(
            function (button) {

                if (
                    loggedIn
                ) {

                    button.classList.remove(
                        "login-required"
                    );

                    button.removeAttribute(
                        "aria-disabled"
                    );

                } else {

                    button.classList.add(
                        "login-required"
                    );

                    button.setAttribute(
                        "aria-disabled",
                        "true"
                    );

                }

            }
        );

}


/* =========================================================
   UPDATE AVATAR UI
========================================================= */

function updateAvatarUI(
    citizen
) {

    if (
        !citizen
    ) {

        return;

    }

    const avatar =
        citizen.avatarUrl ||
        citizen.avatar ||
        citizen.photo ||
        "";

    document
        .querySelectorAll(
            "[data-user-avatar]"
        )
        .forEach(
            function (img) {

                if (
                    avatar
                ) {

                    img.src =
                        avatar;

                    img.style.display =
                        "";

                }

            }
        );

    document
        .querySelectorAll(
            "#userAvatar, #profileAvatar, #avatarPreview"
        )
        .forEach(
            function (img) {

                if (
                    avatar
                ) {

                    img.src =
                        avatar;

                }

            }
        );

}


/* =========================================================
   IS LOGGED IN
========================================================= */

function isLoggedIn() {

    return Boolean(
        OlympState.authenticated &&
        OlympState.sessionToken &&
        OlympState.olympId
    );

}


/* =========================================================
   CURRENT USER
========================================================= */

function getCurrentUser() {

    return (
        OlympState.citizen ||
        OlympState.profile ||
        null
    );

}


/* =========================================================
   CURRENT OLYMP ID
========================================================= */

function getCurrentOlympId() {

    return (
        OlympState.olympId ||
        ""
    );

}


/* =========================================================
   GLOBAL API
========================================================= */

window.OlympGovernment =
    {

        register:
            registerCitizen,

        login:
            loginCitizen,

        logout:
            logoutCitizen,

        profile:
            loadProfile,

        applications:
            loadApplications,

        createApplication:
            createApplication,

        openApplicationModal:
            openApplicationModal,

        closeApplicationModal:
            closeApplicationModal,

        saveAvatar:
            saveAvatar,

        removeAvatar:
            removeAvatar,

        validateSession:
            validateSession,

        isLoggedIn:
            isLoggedIn,

        getCurrentUser:
            getCurrentUser,

        getOlympId:
            getCurrentOlympId,

        state:
            OlympState

    };


/* =========================================================
   LEGACY GLOBAL FUNCTIONS
========================================================= */

window.registerCitizen =
    registerCitizen;

window.loginCitizen =
    loginCitizen;

window.logoutCitizen =
    logoutCitizen;

window.createApplication =
    createApplication;

window.openApplicationModal =
    openApplicationModal;

window.closeApplicationModal =
    closeApplicationModal;

window.saveAvatar =
    saveAvatar;

window.removeAvatar =
    removeAvatar;

window.loadProfile =
    loadProfile;

window.loadApplications =
    loadApplications;

window.isLoggedIn =
    isLoggedIn;


/* =========================================================
   DEBUG
========================================================= */

window.OLYMP_DEBUG =
    {

        getState:
            function () {

                return {

                    authenticated:
                        OlympState.authenticated,

                    olympId:
                        OlympState.olympId,

                    hasToken:
                        Boolean(
                            OlympState.sessionToken
                        ),

                    citizen:
                        OlympState.citizen,

                    applications:
                        OlympState.applications

                };

            },

        clearSession:
            clearSession,

        validate:
            validateSession,

        restore:
            restoreSession,

        createApplication:
            createApplication,

        openApplicationModal:
            openApplicationModal,

        closeApplicationModal:
            closeApplicationModal

    };


/* =========================================================
   CONSOLE
========================================================= */

console.log(
    "%cOLYMP Government 6.6 loaded",
    "font-weight:bold"
);

console.log(
    "OLYMP API:",
    OLYMP_CONFIG.API_URL
);

console.log(
    "openApplicationModal:",
    typeof window.openApplicationModal
);
