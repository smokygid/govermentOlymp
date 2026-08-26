/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET
   SCRIPT.JS 6.6
   =========================================================

   • OLYMP-ID
   • Регистрация
   • Авторизация
   • Session Token
   • Автоматическое восстановление сессии
   • Личный кабинет
   • Профиль
   • Заявки / звернення
   • Статусы
   • Просмотр заявки
   • Аватар
   • Logout
   • Google Apps Script Web App
   • GET API
   • Глобальная openApplicationModal()
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

    setupApplicationModalEvents();

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
            normalizeOlympId(olympId);

        if (
            citizenRaw
        ) {

            try {

                OlympState.citizen =
                    JSON.parse(citizenRaw);

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
                    JSON.parse(profileRaw);

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
            "OLYMP loadStoredSession:",
            error
        );

        clearSession();

    }

}


/* =========================================================
   SAVE SESSION
========================================================= */

function saveSession(data) {

    if (!data) {

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
                        citizen.idNumber ||
                        ""
                    )
                    : ""
            )
        );

    if (
        !token ||
        !olympId
    ) {

        console.error(
            "OLYMP: невозможно сохранить сессию",
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
            "OLYMP clearSession:",
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

        try {

            return JSON.parse(
                text
            );

        } catch (error) {

            console.error(
                "OLYMP API returned:",
                text
            );

            throw new Error(
                "Сервер повернув не JSON."
            );

        }

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
            "OLYMP restoreSession:",
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
            "OLYMP validateSession:",
            error
        );

        return false;

    }

}


/* =========================================================
   REGISTER
========================================================= */

async function registerCitizen(data) {

    data =
        data || {};

    setLoading(true);

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
            saveSession(result);

        if (
            !saved
        ) {

            showMessage(
                "Реєстрацію завершено, але сесію не збережено.",
                "error"
            );

            return {
                success:
                    false,

                message:
                    "Сесію не збережено."
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
            redirectToCabinet,
            500
        );

        return result;

    } catch (error) {

        console.error(
            "OLYMP register:",
            error
        );

        showMessage(
            error.message ||
            "Помилка реєстрації.",
            "error"
        );

        return {
            success:
                false,

            message:
                error.message
        };

    } finally {

        setLoading(false);

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

    if (!olympId) {

        showMessage(
            "Вкажіть OLYMP-ID.",
            "error"
        );

        return {
            success:
                false
        };

    }

    if (!password) {

        showMessage(
            "Вкажіть пароль.",
            "error"
        );

        return {
            success:
                false
        };

    }

    setLoading(true);

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
            saveSession(result);

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
            redirectToCabinet,
            300
        );

        return result;

    } catch (error) {

        console.error(
            "OLYMP login:",
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

        setLoading(false);

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
                isSessionError(result)
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
            "OLYMP loadProfile:",
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

        renderApplications([]);

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
                isSessionError(result)
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
            "OLYMP loadApplications:",
            error
        );

        return [];

    }

}


/* =========================================================
   CREATE APPLICATION
========================================================= */

async function createApplication(data) {

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

    const valid =
        await validateSession();

    if (
        !valid
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

    if (!service) {

        showMessage(
            "Оберіть державну послугу.",
            "error"
        );

        return {
            success:
                false
        };

    }

    if (!message) {

        showMessage(
            "Вкажіть опис звернення.",
            "error"
        );

        return {
            success:
                false
        };

    }

    setLoading(true);

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
                isSessionError(result)
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
            "OLYMP createApplication:",
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

        setLoading(false);

    }

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

    if (!avatarUrl) {

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

        renderProfile(
            citizen
        );

        showMessage(
            "Аватар успішно збережено.",
            "success"
        );

        return result;

    } catch (error) {

        console.error(
            "OLYMP saveAvatar:",
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

        renderProfile(
            OlympState.citizen
        );

        showMessage(
            "Аватар видалено.",
            "success"
        );

        return result;

    } catch (error) {

        console.error(
            "OLYMP removeAvatar:",
            error
        );

        return {
            success:
                false
        };

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutCitizen() {

    const token =
        OlympState.sessionToken;

    try {

        if (token) {

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
            "OLYMP logout API:",
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
   AUTH
========================================================= */

function isLoggedIn() {

    return Boolean(
        OlympState.authenticated &&
        OlympState.sessionToken &&
        OlympState.olympId
    );

}


function getCurrentUser() {

    return (
        OlympState.citizen ||
        OlympState.profile ||
        null
    );

}


function getCurrentOlympId() {

    return OlympState.olympId || "";

}


/* =========================================================
   AUTH UI
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
            citizen.email || ""
        );

        setText(
            "#profileEmail",
            citizen.email || ""
        );

        setText(
            "[data-user-phone]",
            citizen.phone || ""
        );

        setText(
            "#profilePhone",
            citizen.phone || ""
        );

        setText(
            "[data-user-discord]",
            citizen.discord || ""
        );

        setText(
            "#profileDiscord",
            citizen.discord || ""
        );

        setText(
            "[data-user-birth-date]",
            citizen.birthDate || ""
        );

        setText(
            "#profileBirthDate",
            citizen.birthDate || ""
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
   APPLICATION BUTTONS
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
            "#sendRequest, " +
            "#submitAppeal, " +
            "#sendAppeal"
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
   AVATAR UI
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

                if (avatar) {

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

                if (avatar) {

                    img.src =
                        avatar;

                }

            }
        );

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

                container.innerHTML = `

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
                        function (application) {

                            return createApplicationHTML(
                                application
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
    application
) {

    application =
        application || {};

    const rawNumber =
        application.number ||
        application.applicationNumber ||
        application.requestNumber ||
        "";

    const number =
        escapeHTML(
            rawNumber ||
            "—"
        );

    const safeNumber =
        String(
            rawNumber || ""
        )
            .replace(
                /\\/g,
                "\\\\"
            )
            .replace(
                /'/g,
                "\\'"
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

    return `

        <div
            class="application-card"
            data-application-number="${number}"
            role="button"
            tabindex="0"
            onclick="openApplicationModal('${safeNumber}')"
            onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openApplicationModal('${safeNumber}');}"
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

                <div class="application-open-hint">
                    Переглянути звернення →
                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   OPEN APPLICATION MODAL
========================================================= */

function openApplicationModal(
    applicationNumber
) {

    console.log(
        "OLYMP: opening application",
        applicationNumber
    );

    const number =
        String(
            applicationNumber ||
            ""
        ).trim();

    const applications =
        Array.isArray(
            OlympState.applications
        )
            ? OlympState.applications
            : [];

    const application =
        applications.find(
            function (item) {

                if (!item) {

                    return false;

                }

                const itemNumber =
                    String(
                        item.number ||
                        item.applicationNumber ||
                        item.requestNumber ||
                        ""
                    ).trim();

                return (
                    itemNumber ===
                    number
                );

            }
        );

    if (
        !application
    ) {

        console.warn(
            "OLYMP: application not found",
            number
        );

        showMessage(
            "Звернення не знайдено.",
            "error"
        );

        return;

    }

    let modal =
        document.querySelector(
            "#applicationModal"
        );

    if (
        !modal
    ) {

        modal =
            createApplicationModal();

        document.body.appendChild(
            modal
        );

    }

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
        "Не призначено";

    const comment =
        application.comment ||
        application.response ||
        "";

    const numberElement =
        modal.querySelector(
            "#applicationModalNumber"
        );

    const statusElement =
        modal.querySelector(
            "#applicationModalStatus"
        );

    const serviceElement =
        modal.querySelector(
            "#applicationModalService"
        );

    const dateElement =
        modal.querySelector(
            "#applicationModalDate"
        );

    const responsibleElement =
        modal.querySelector(
            "#applicationModalResponsible"
        );

    const messageElement =
        modal.querySelector(
            "#applicationModalMessage"
        );

    const commentElement =
        modal.querySelector(
            "#applicationModalComment"
        );

    const commentBlock =
        modal.querySelector(
            "#applicationModalCommentBlock"
        );

    if (numberElement) {

        numberElement.textContent =
            number ||
            "—";

    }

    if (statusElement) {

        statusElement.textContent =
            status;

        statusElement.className =
            "application-status " +
            getStatusClass(
                status
            );

    }

    if (serviceElement) {

        serviceElement.textContent =
            service;

    }

    if (dateElement) {

        dateElement.textContent =
            date;

    }

    if (responsibleElement) {

        responsibleElement.textContent =
            responsible;

    }

    if (messageElement) {

        messageElement.textContent =
            message;

    }

    if (
        commentBlock &&
        commentElement
    ) {

        if (
            comment
        ) {

            commentElement.textContent =
                comment;

            commentBlock.style.display =
                "";

        } else {

            commentElement.textContent =
                "";

            commentBlock.style.display =
                "none";

        }

    }

    modal.classList.add(
        "active"
    );

    modal.style.display =
        "flex";

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   CREATE APPLICATION MODAL
========================================================= */

function createApplicationModal() {

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "applicationModal";

    modal.className =
        "modal application-modal";

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    modal.innerHTML = `

        <div
            class="modal-overlay"
            data-close-application-modal
        ></div>

        <div class="modal-content">

            <button
                type="button"
                class="modal-close"
                data-close-application-modal
                aria-label="Закрити"
            >
                ×
            </button>

            <div class="application-modal-header">

                <div>

                    <div class="application-modal-label">
                        ЗВЕРНЕННЯ
                    </div>

                    <h2 id="applicationModalNumber">
                        —
                    </h2>

                </div>

                <div
                    id="applicationModalStatus"
                    class="application-status status-pending"
                >
                    —
                </div>

            </div>

            <div class="application-modal-body">

                <div class="application-detail">

                    <span>
                        Державна послуга
                    </span>

                    <strong id="applicationModalService">
                        —
                    </strong>

                </div>

                <div class="application-detail">

                    <span>
                        Дата подання
                    </span>

                    <strong id="applicationModalDate">
                        —
                    </strong>

                </div>

                <div class="application-detail">

                    <span>
                        Відповідальний
                    </span>

                    <strong id="applicationModalResponsible">
                        —
                    </strong>

                </div>

                <div class="application-detail application-detail-message">

                    <span>
                        Ваше звернення
                    </span>

                    <div id="applicationModalMessage">
                        —
                    </div>

                </div>

                <div
                    class="application-detail"
                    id="applicationModalCommentBlock"
                    style="display:none;"
                >

                    <span>
                        Відповідь уряду
                    </span>

                    <div id="applicationModalComment">
                        —
                    </div>

                </div>

            </div>

        </div>

    `;

    return modal;

}


/* =========================================================
   CLOSE APPLICATION MODAL
========================================================= */

function closeApplicationModal() {

    const modal =
        document.querySelector(
            "#applicationModal"
        );

    if (!modal) {

        return;

    }

    modal.classList.remove(
        "active"
    );

    modal.style.display =
        "none";

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   MODAL EVENTS
========================================================= */

function setupApplicationModalEvents() {

    document.addEventListener(
        "click",
        function (event) {

            const close =
                event.target.closest(
                    "[data-close-application-modal]"
                );

            if (
                close
            ) {

                event.preventDefault();

                closeApplicationModal();

            }

        }
    );

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeApplicationModal();

            }

        }
    );

}


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

    const values = {

        total:
            applications.length,

        pending:
            0,

        approved:
            0,

        completed:
            0,

        rejected:
            0,

        closed:
            0

    };

    applications.forEach(
        function (application) {

            const status =
                String(
                    application.status ||
                    ""
                ).toLowerCase();

            if (
                status.includes(
                    "розгляді"
                )
            ) {

                values.pending++;

            }

            if (
                status.includes(
                    "прийнято"
                )
            ) {

                values.approved++;

            }

            if (
                status.includes(
                    "виконано"
                )
            ) {

                values.completed++;

            }

            if (
                status.includes(
                    "відхилено"
                )
            ) {

                values.rejected++;

            }

            if (
                status.includes(
                    "закрито"
                )
            ) {

                values.closed++;

            }

        }
    );

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
   FORMS
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
        bindApplicationForm
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
        !form ||
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

            const result =
                await createApplication({

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

                });

            if (
                result &&
                result.success
            ) {

                try {

                    form.reset();

                } catch (error) {

                    console.warn(
                        "OLYMP form reset:",
                        error
                    );

                }

            }

        }
    );

}


/* =========================================================
   LOGOUT BUTTONS
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


/* =========================================================
   APPLICATION BUTTONS
========================================================= */

function setupApplicationButtons() {

    document
        .querySelectorAll(
            "[data-submit-application], " +
            "[data-application-submit], " +
            "#submitApplication, " +
            "#sendApplication, " +
            "#submitRequest, " +
            "#sendRequest, " +
            "#submitAppeal, " +
            "#sendAppeal"
        )
        .forEach(
            bindApplicationButton
        );

}


/* =========================================================
   BIND APPLICATION BUTTON
========================================================= */

function bindApplicationButton(
    button
) {

    if (
        !button ||
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
   ELEMENT VALUE
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
            !element
        ) {

            continue;

        }

        if (
            element.value !== undefined
        ) {

            const value =
                String(
                    element.value
                ).trim();

            if (value) {

                return value;

            }

        }

        if (
            element.textContent
        ) {

            const value =
                String(
                    element.textContent
                ).trim();

            if (value) {

                return value;

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
                    [
                        "service",
                        "servicename",
                        "type",
                        "message",
                        "description",
                        "text"
                    ].includes(name)
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

                        /*
                         * Обычная навигация.
                         */

                    }
                );

            }
        );

}


/* =========================================================
   LOGIN REQUIRED
========================================================= */

function showLoginRequired() {

    showMessage(
        "Для подання заявки необхідно увійти до особистого кабінету.",
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

    const link =
        document.querySelector(
            "a[href*='cabinet.html'], " +
            "a[href*='cabinet']"
        );

    if (
        link &&
        link.href
    ) {

        window.location.href =
            link.href;

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
   CLOSE AUTH FORMS
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

    if (
        !form
    ) {

        return "";

    }

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

            if (value) {

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
        Boolean(state);

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

    document
        .querySelectorAll(
            "button[type='submit']"
        )
        .forEach(
            function (button) {

                button.classList.toggle(
                    "loading",
                    Boolean(state)
                );

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
            result.substring(5);

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
        value.includes(
            "прийнято"
        )
    ) {

        return "status-approved";

    }

    if (
        value.includes(
            "виконано"
        )
    ) {

        return "status-completed";

    }

    if (
        value.includes(
            "відхилено"
        )
    ) {

        return "status-rejected";

    }

    if (
        value.includes(
            "закрито"
        )
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
        new Date(value);

    if (
        isNaN(
            date.getTime()
        )
    ) {

        return String(value);

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
        ).format(date);

    } catch (error) {

        return String(value);

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
        message.includes("сесія") ||
        message.includes("сесс") ||
        message.includes("увійдіть") ||
        message.includes("войд") ||
        message.includes("olymp-id") ||
        message.includes("token")
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
   GLOBAL API
========================================================= */

window.OlympGovernment = {

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
        OlympState,

    openApplicationModal:
        openApplicationModal,

    closeApplicationModal:
        closeApplicationModal

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
   IMPORTANT:
   ЭТИ ДВЕ ФУНКЦИИ НУЖНЫ ТВОЕМУ HTML
========================================================= */

window.openApplicationModal =
    openApplicationModal;

window.closeApplicationModal =
    closeApplicationModal;


/* =========================================================
   DEBUG
========================================================= */

window.OLYMP_DEBUG = {

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
        openApplicationModal

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
