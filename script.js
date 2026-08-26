/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET
   SCRIPT.JS 6.5
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
   • Аватар
   • Logout
   • Google Apps Script Web App
   • GET API без CORS preflight

   ИСПРАВЛЕНИЯ 6.5:

   1. Исправлена кнопка «Звернення»
   2. Исправлена отправка формы обращения
   3. Форма обращения определяется универсально
   4. Кнопка submit больше не конфликтует с submit формы
   5. Проверка авторизации перед отправкой
   6. Session Token передаётся в createapplication
   7. После отправки заявка появляется в кабинете
   8. После регистрации автоматически создаётся сессия
   9. После login автоматически создаётся сессия
   10. Сессия сохраняется в localStorage
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

    /*
     * Восстановление сессии
     */

    if (
        OlympState.sessionToken &&
        OlympState.olympId
    ) {

        await restoreSession();

    }

    /*
     * Настройка форм
     */

    setupForms();

    /*
     * Ссылки кабинета
     */

    setupCabinetLinks();

    /*
     * Кнопки обращения
     */

    setupApplicationButtons();

    /*
     * Повторно обновляем UI
     */

    updateAuthUI();

    /*
     * Периодическая проверка сессии
     */

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
        !OLYMP_CONFIG.API_URL ||
        OLYMP_CONFIG.API_URL.indexOf(
            "ВСТАВЬ_URL"
        ) !== -1
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
                        OlympState.sessionToken

                }
            );

        if (
            !result ||
            !result.success
        ) {

            clearSession();

            return false;

        }

        const serverOlympId =
            normalizeOlympId(
                result.olympId ||
                result.citizenId ||
                result.idNumber
            );

        if (
            serverOlympId &&
            serverOlympId !==
                OlympState.olympId
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
                "Реєстрацію завершено, але не вдалося зберегти сесію. Увійдіть повторно.",
                "error"
            );

            return {

                success:
                    false,

                message:
                    "Сесію не збережено.",

                raw:
                    result

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
            "Реєстрацію успішно завершено. Ви увійшли до особистого кабінету.",
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

    /*
     * Проверяем авторизацию
     */

    if (
        !isLoggedIn()
    ) {

        showLoginRequired();

        return {

            success:
                false,

            authRequired:
                true,

            message:
                "Для подання заявки необхідно увійти до особистого кабінету."

        };

    }

    /*
     * Проверяем сессию
     */

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

    /*
     * Получаем услугу
     */

    const service =
        String(
            data.service ||
            data.serviceName ||
            data.type ||
            ""
        ).trim();

    /*
     * Получаем текст обращения
     */

    const message =
        String(
            data.message ||
            data.description ||
            data.text ||
            ""
        ).trim();

    /*
     * Контакт
     */

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
            ) ||
            ""
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

        console.log(
            "OLYMP: отправка заявки",
            {
                olympId:
                    OlympState.olympId,

                service:
                    service,

                message:
                    message,

                contact:
                    contact
            }
        );

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
            "OLYMP: ответ createapplication",
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

        /*
         * Добавляем новую заявку
         */

        if (
            result.application
        ) {

            OlympState.applications.unshift(
                result.application
            );

        }

        /*
         * Загружаем актуальный список
         */

        await loadApplications();

        /*
         * Обновляем интерфейс
         */

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
   LOGOUT
========================================================= */

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

            } else {

                updateAuthUI();

            }

        },
        300
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
   GET CURRENT USER
========================================================= */

function getCurrentUser() {

    return (
        OlympState.citizen ||
        OlympState.profile ||
        null
    );

}


/* =========================================================
   GET CURRENT OLYMP ID
========================================================= */

function getCurrentOlympId() {

    return (
        OlympState.olympId ||
        ""
    );

}


/* =========================================================
   UPDATE AUTH UI
========================================================= */

function updateAuthUI() {

    const loggedIn =
        isLoggedIn();

    const citizen =
        getCurrentUser();

    /*
     * Авторизованные элементы
     */

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

    /*
     * Элементы для гостя
     */

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

    /*
     * auth-required
     */

    document
        .querySelectorAll(
            ".auth-required"
        )
        .forEach(
            function (element) {

                if (
                    loggedIn
                ) {

                    element.classList.remove(
                        "disabled"
                    );

                    element.removeAttribute(
                        "aria-disabled"
                    );

                } else {

                    element.classList.add(
                        "disabled"
                    );

                    element.setAttribute(
                        "aria-disabled",
                        "true"
                    );

                }

            }
        );

    /*
     * OLYMP-ID
     */

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

    /*
     * Имя
     */

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

        /*
         * Email
         */

        setText(
            "[data-user-email]",
            citizen.email || ""
        );

        setText(
            "#profileEmail",
            citizen.email || ""
        );

        /*
         * Телефон
         */

        setText(
            "[data-user-phone]",
            citizen.phone || ""
        );

        setText(
            "#profilePhone",
            citizen.phone || ""
        );

        /*
         * Discord
         */

        setText(
            "[data-user-discord]",
            citizen.discord || ""
        );

        setText(
            "#profileDiscord",
            citizen.discord || ""
        );

        /*
         * Дата рождения
         */

        setText(
            "[data-user-birth-date]",
            citizen.birthDate || ""
        );

        setText(
            "#profileBirthDate",
            citizen.birthDate || ""
        );

        /*
         * Статус
         */

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

                    /*
                     * Не ставим disabled=true,
                     * иначе click не сработает.
                     */

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

    updateAuthUI();

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

        </div>
    `;

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

    const total =
        applications.length;

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
            total,

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

                    const data = {

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

                    };

                    await registerCitizen(
                        data
                    );

                }
            );

        }
    );

}


/* =========================================================
   APPLICATION FORMS
========================================================= */

function setupApplicationForms() {

    /*
     * Ищем максимально много вариантов формы.
     */

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

    /*
     * Дополнительный поиск:
     * если форма не имеет class/id,
     * ищем форму с полями обращения.
     */

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

            /*
             * Если пользователь не вошёл,
             * показываем login.
             */

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

            console.log(
                "OLYMP application form data:",
                data
            );

            const result =
                await createApplication(
                    data
                );

            if (
                result &&
                result.success
            ) {

                /*
                 * Очищаем форму
                 */

                try {

                    form.reset();

                } catch (error) {

                    console.warn(
                        "Не удалось очистить форму:",
                        error
                    );

                }

                /*
                 * Закрываем модальное окно,
                 * если форма находится внутри него.
                 */

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

    /*
     * Все возможные кнопки отправки.
     */

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


    /*
     * Дополнительный поиск кнопок.
     *
     * Если HTML имеет просто:
     *
     * <button>Подати звернення</button>
     *
     * JS тоже сможет её найти.
     */

    document
        .querySelectorAll(
            "button, input[type='submit'], input[type='button'], a"
        )
        .forEach(
            function (button) {

                if (
                    button.dataset.olympApplicationBound ===
                    "true"
                ) {

                    return;

                }

                const text =
                    String(
                        button.innerText ||
                        button.value ||
                        button.textContent ||
                        ""
                    )
                        .trim()
                        .toLowerCase();

                if (
                    text.indexOf(
                        "звернення"
                    ) !== -1 ||
                    text.indexOf(
                        "подати звернення"
                    ) !== -1 ||
                    text.indexOf(
                        "відправити звернення"
                    ) !== -1 ||
                    text.indexOf(
                        "подать обращение"
                    ) !== -1 ||
                    text.indexOf(
                        "отправить обращение"
                    ) !== -1
                ) {

                    bindApplicationButton(
                        button
                    );

                }

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

    /*
     * Если это submit кнопка,
     * НЕ перехватываем click.
     *
     * Её обработает submit формы.
     */

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

            /*
             * Авторизация
             */

            if (
                !isLoggedIn()
            ) {

                showLoginRequired();

                return;

            }

            /*
             * Ищем форму
             */

            const form =
                button.closest(
                    "form"
                );

            if (
                form
            ) {

                /*
                 * Используем requestSubmit,
                 * чтобы сработал основной submit handler.
                 */

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

            /*
             * Если формы нет,
             * пробуем найти ближайший блок
             * с полями.
             */

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

            const data = {

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

            };

            const result =
                await createApplication(
                    data
                );

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

            if (
                element.textContent
            ) {

                const value =
                    String(
                        element.textContent
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

                if (
                    link.dataset.olympBound ===
                    "true"
                ) {

                    return;

                }

                link.dataset.olympBound =
                    "true";

                link.addEventListener(
                    "click",
                    function () {

                        /*
                         * Переход разрешён.
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

    const message =
        "Для подання заявки необхідно увійти до особистого кабінету.";

    showMessage(
        message,
        "error"
    );

    /*
     * Кнопка входа
     */

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

    /*
     * Login modal
     */

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

        return;

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

    for (
        let i = 0;
        i < names.length;
        i++
    ) {

        const name =
            names[i];

        const element =
            form.querySelector(
                `[name="${name}"], #${name}`
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

    document
        .querySelectorAll(
            "button[type='submit']"
        )
        .forEach(
            function (button) {

                if (
                    state
                ) {

                    button.classList.add(
                        "loading"
                    );

                } else {

                    button.classList.remove(
                        "loading"
                    );

                }

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
            createApplication

    };


/* =========================================================
   CONSOLE
========================================================= */

console.log(
    "%cOLYMP Government 6.5 loaded",
    "font-weight:bold"
);

console.log(
    "OLYMP API:",
    OLYMP_CONFIG.API_URL
);
