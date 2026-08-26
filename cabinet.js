/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET 4.0

   ИСПРАВЛЕННАЯ ВЕРСИЯ

   • Вхід за ID громадянина + паролем
   • Підтримка citizenId
   • Підтримка olympId
   • Автоматичне збереження сесії
   • Відновлення сесії
   • Особиста інформація
   • OLYMP-ID
   • Всі заявки громадянина
   • Статуси заявок
   • Відповіді державних органів
   • Перегляд конкретної заявки
   • Копіювання номера заявки
   • Статистика
   • Вихід
   • Toast
   • Loading
   • Сумісність зі старим HTML

   OLYMP GOVERNMENT 4.0
========================================================= */


/* =========================================================
   НАСТРОЙКИ
========================================================= */

const API_URL =
    "https://script.google.com/macros/s/AKfycbyynbAxu6A_tU5nBEUum357BCY6o8D-3e44wEtR-AlyOtV5un8mNgpmkvU6dtrIy0RvfQ/exec";


const STORAGE_KEY =
    "olympCitizenSession";


const CABINET_VERSION =
    "4.0";


/*
   Максимальний час сесії:
   30 днів
*/

const SESSION_MAX_AGE =
    30 * 24 * 60 * 60 * 1000;


/* =========================================================
   DOM
========================================================= */

const loginSection =
    document.getElementById("loginSection");


const cabinetSection =
    document.getElementById("cabinetSection");


const loginForm =
    document.getElementById("loginForm");


const loginButton =
    document.getElementById("loginButton");


const loginButtonText =
    document.getElementById("loginButtonText");


const loginError =
    document.getElementById("loginError");


const logoutButton =
    document.getElementById("logoutButton");


const loadingOverlay =
    document.getElementById("loadingOverlay");


const toast =
    document.getElementById("toast");


const copyNumberButton =
    document.getElementById("copyNumberButton");


/* =========================================================
   STATE
========================================================= */

let currentCitizen = null;

let currentApplications = [];

let currentApplication = null;

let toastTimer = null;


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initCabinet
);


/* =========================================================
   INIT
========================================================= */

function initCabinet() {

    setupEvents();

    restoreSession();

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    /* -----------------------------------------------------
       LOGIN
    ----------------------------------------------------- */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    /* -----------------------------------------------------
       LOGOUT
    ----------------------------------------------------- */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }


    /* -----------------------------------------------------
       COPY NUMBER
    ----------------------------------------------------- */

    if (copyNumberButton) {

        copyNumberButton.addEventListener(
            "click",
            copyApplicationNumber
        );

    }


    /* -----------------------------------------------------
       ID ГРОМАДЯНИНА
    ----------------------------------------------------- */

    const citizenIdInput =
        document.getElementById(
            "citizenId"
        );


    if (citizenIdInput) {

        citizenIdInput.addEventListener(
            "input",
            function () {

                this.value =
                    normalizeOlympId(
                        this.value
                    );

            }
        );

    }


    /* -----------------------------------------------------
       НОВИЙ olympId
       ДЛЯ СУМІСНОСТІ
    ----------------------------------------------------- */

    const olympIdInput =
        document.getElementById(
            "olympId"
        );


    if (olympIdInput) {

        olympIdInput.addEventListener(
            "input",
            function () {

                this.value =
                    normalizeOlympId(
                        this.value
                    );

            }
        );

    }


    /* -----------------------------------------------------
       СТАРЕ applicationNumber
    ----------------------------------------------------- */

    const applicationNumberInput =
        document.getElementById(
            "applicationNumber"
        );


    if (applicationNumberInput) {

        applicationNumberInput.addEventListener(
            "input",
            function () {

                this.value =
                    normalizeOlympId(
                        this.value
                    );

            }
        );

    }


    /* -----------------------------------------------------
       PASSWORD
    ----------------------------------------------------- */

    const citizenPasswordInput =
        document.getElementById(
            "citizenPassword"
        );


    if (citizenPasswordInput) {

        citizenPasswordInput.addEventListener(
            "input",
            function () {

                this.value =
                    cleanPassword(
                        this.value
                    );

            }
        );

    }


    /* -----------------------------------------------------
       password
    ----------------------------------------------------- */

    const passwordInput =
        document.getElementById(
            "password"
        );


    if (passwordInput) {

        passwordInput.addEventListener(
            "input",
            function () {

                this.value =
                    cleanPassword(
                        this.value
                    );

            }
        );

    }


    /* -----------------------------------------------------
       СТАРИЙ ACCESS CODE
    ----------------------------------------------------- */

    const accessCodeInput =
        document.getElementById(
            "accessCode"
        );


    if (accessCodeInput) {

        accessCodeInput.addEventListener(
            "input",
            function () {

                this.value =
                    cleanPassword(
                        this.value
                    );

            }
        );

    }


    /* -----------------------------------------------------
       ESC
    ----------------------------------------------------- */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                hideToast();

            }

        }
    );

}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {

    event.preventDefault();

    clearLoginError();


    /*
       =====================================================
       ВАЖЛИВО

       Твій поточний cabinet.html має:

       id="citizenId"

       id="citizenPassword"

       Саме їх використовуємо першими.
       =====================================================
    */


    const citizenIdInput =
        document.getElementById(
            "citizenId"
        );


    const olympIdInput =
        document.getElementById(
            "olympId"
        );


    const applicationNumberInput =
        document.getElementById(
            "applicationNumber"
        );


    const citizenPasswordInput =
        document.getElementById(
            "citizenPassword"
        );


    const passwordInput =
        document.getElementById(
            "password"
        );


    const accessCodeInput =
        document.getElementById(
            "accessCode"
        );


    let olympId = "";

    let password = "";


    /* =====================================================
       ПОЛУЧАЕМ OLYMP-ID
    ===================================================== */


    /*
       1. Основное поле текущего HTML
    */

    if (citizenIdInput) {

        olympId =
            normalizeOlympId(
                citizenIdInput.value
            );

    }


    /*
       2. Дополнительная совместимость
    */

    if (
        !olympId &&
        olympIdInput
    ) {

        olympId =
            normalizeOlympId(
                olympIdInput.value
            );

    }


    /*
       3. Старый HTML
    */

    if (
        !olympId &&
        applicationNumberInput
    ) {

        olympId =
            normalizeOlympId(
                applicationNumberInput.value
            );

    }


    /* =====================================================
       ПОЛУЧАЕМ ПАРОЛЬ
    ===================================================== */


    /*
       1. Основное поле текущего HTML
    */

    if (citizenPasswordInput) {

        password =
            cleanPassword(
                citizenPasswordInput.value
            );

    }


    /*
       2. Совместимость
    */

    if (
        !password &&
        passwordInput
    ) {

        password =
            cleanPassword(
                passwordInput.value
            );

    }


    /*
       3. Старый accessCode
    */

    if (
        !password &&
        accessCodeInput
    ) {

        password =
            cleanPassword(
                accessCodeInput.value
            );

    }


    /* =====================================================
       DEBUG
    ===================================================== */

    console.log(
        "OLYMP LOGIN:",
        {
            olympId: olympId,
            passwordEntered: !!password
        }
    );


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!olympId) {

        showLoginError(
            "Вкажіть OLYMP-ID."
        );


        if (citizenIdInput) {

            citizenIdInput.focus();

        } else if (olympIdInput) {

            olympIdInput.focus();

        } else if (applicationNumberInput) {

            applicationNumberInput.focus();

        }


        return;

    }


    /*
       Проверяем формат.

       Разрешаем:

       OLYMP-000001
       olymp-000001
       OLYMP000001

       Последний вариант автоматически
       превращается в OLYMP-000001.
    */

    olympId =
        formatOlympId(
            olympId
        );


    if (
        !/^OLYMP-\d{6}$/.test(
            olympId
        )
    ) {

        showLoginError(
            "Невірний формат OLYMP-ID. Приклад: OLYMP-000001"
        );


        if (citizenIdInput) {

            citizenIdInput.focus();

        }


        return;

    }


    if (!password) {

        showLoginError(
            "Вкажіть пароль."
        );


        if (citizenPasswordInput) {

            citizenPasswordInput.focus();

        } else if (passwordInput) {

            passwordInput.focus();

        }


        return;

    }


    /* =====================================================
       LOADING
    ===================================================== */

    setLoginLoading(true);

    showLoading(
        "Перевірка даних..."
    );


    try {

        const response =
            await apiRequest(
                "login",
                {

                    olympId:
                        olympId,

                    idNumber:
                        olympId,

                    citizenId:
                        olympId,

                    password:
                        password

                }
            );


        console.log(
            "LOGIN RESPONSE:",
            response
        );


        if (
            !response ||
            response.success !== true
        ) {

            throw new Error(

                response &&
                response.message

                    ?

                response.message

                    :

                "Невірний OLYMP-ID або пароль."

            );

        }


        /* =================================================
           CITIZEN
        ================================================= */

        currentCitizen =
            normalizeCitizen(
                response.citizen ||
                response.profile ||
                response.user ||
                response.data ||
                null
            );


        /* =================================================
           APPLICATIONS
        ================================================= */

        currentApplications =
            normalizeApplications(
                response.applications ||
                response.requests ||
                response.myApplications ||
                response.data?.applications ||
                []
            );


        /*
           Якщо API повернув тільки одну заявку
        */

        if (
            currentApplications.length === 0 &&
            response.application
        ) {

            currentApplications =
                normalizeApplications(
                    [
                        response.application
                    ]
                );

        }


        /*
           Якщо профіль не повернувся,
           створюємо мінімальний профіль
           з OLYMP-ID.
        */

        if (!currentCitizen) {

            currentCitizen = {

                olympId:
                    olympId,

                fullName:
                    response.fullName ||
                    "",

                birthDate:
                    response.birthDate ||
                    "",

                phone:
                    response.phone ||
                    "",

                email:
                    response.email ||
                    "",

                discord:
                    response.discord ||
                    "",

                contact:
                    response.contact ||
                    "",

                registrationDate:
                    response.registrationDate ||
                    ""

            };

        }


        /* =================================================
           SAVE SESSION
        ================================================= */

        saveSession(
            olympId,
            password
        );


        /* =================================================
           RENDER
        ================================================= */

        renderCabinet();

        hideLoading();

        showToast(
            "Вхід успішно виконано.",
            "success"
        );


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        hideLoading();


        showLoginError(
            error.message ||
            "Помилка входу."
        );


    } finally {

        setLoginLoading(
            false
        );

    }

}


/* =========================================================
   RESTORE SESSION
========================================================= */

async function restoreSession() {

    const session =
        loadSession();


    if (!session) {

        showLogin();

        return;

    }


    /* =====================================================
       SESSION AGE
    ===================================================== */

    if (
        session.savedAt &&
        Date.now() -
        Number(session.savedAt) >
        SESSION_MAX_AGE
    ) {

        clearSession();

        showLogin();


        showToast(
            "Сесія завершилася. Увійдіть повторно.",
            "error"
        );


        return;

    }


    if (
        !session.olympId ||
        !session.password
    ) {

        clearSession();

        showLogin();

        return;

    }


    showLoading(
        "Відновлення кабінету..."
    );


    try {

        const response =
            await apiRequest(
                "profile",
                {

                    olympId:
                        session.olympId,

                    idNumber:
                        session.olympId,

                    citizenId:
                        session.olympId,

                    password:
                        session.password

                }
            );


        console.log(
            "PROFILE RESPONSE:",
            response
        );


        if (
            !response ||
            response.success !== true
        ) {

            throw new Error(
                response &&
                response.message

                    ?

                response.message

                    :

                "Сесія недійсна."
            );

        }


        currentCitizen =
            normalizeCitizen(
                response.citizen ||
                response.profile ||
                response.user ||
                response.data ||
                null
            );


        currentApplications =
            normalizeApplications(
                response.applications ||
                response.requests ||
                response.myApplications ||
                response.data?.applications ||
                []
            );


        if (
            currentApplications.length === 0 &&
            response.application
        ) {

            currentApplications =
                normalizeApplications(
                    [
                        response.application
                    ]
                );

        }


        /*
           Fallback
        */

        if (!currentCitizen) {

            currentCitizen = {

                olympId:
                    session.olympId,

                fullName:
                    "",

                birthDate:
                    "",

                phone:
                    "",

                email:
                    "",

                discord:
                    "",

                contact:
                    "",

                registrationDate:
                    ""

            };

        }


        /*
           Оновлюємо час сесії
        */

        saveSession(
            session.olympId,
            session.password
        );


        renderCabinet();


        hideLoading();


    } catch (error) {

        console.warn(
            "SESSION RESTORE ERROR:",
            error
        );


        clearSession();


        currentCitizen =
            null;


        currentApplications =
            [];


        currentApplication =
            null;


        hideLoading();


        showLogin();

    }

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    action,
    params = {}
) {

    if (
        !API_URL ||
        API_URL.includes(
            "ВСТАВЬ"
        )
    ) {

        throw new Error(
            "Не вказано URL Google Apps Script."
        );

    }


    const query =
        new URLSearchParams();


    query.append(
        "action",
        action
    );


    Object.keys(
        params
    ).forEach(
        function (key) {

            const value =
                params[key];


            if (
                value !== undefined &&
                value !== null
            ) {

                query.append(
                    key,
                    String(value)
                );

            }

        }
    );


    const url =
        API_URL +
        "?" +
        query.toString();


    console.log(
        "API REQUEST:",
        action
    );


    let response;


    try {

        response =
            await fetch(
                url,
                {

                    method:
                        "GET",

                    cache:
                        "no-store",

                    redirect:
                        "follow"

                }
            );

    } catch (error) {

        console.error(
            "FETCH ERROR:",
            error
        );


        throw new Error(
            "Не вдалося підключитися до сервера."
        );

    }


    if (!response.ok) {

        throw new Error(
            "Сервер повернув помилку HTTP " +
            response.status
        );

    }


    const text =
        await response.text();


    if (!text) {

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
            "INVALID JSON:",
            text
        );


        throw new Error(
            "Сервер повернув некоректну відповідь."
        );

    }


    return data;

}


/* =========================================================
   RENDER CABINET
========================================================= */

function renderCabinet() {

    if (!currentCitizen) {

        return;

    }


    showCabinet();


    renderCitizenProfile(
        currentCitizen
    );


    renderApplications(
        currentApplications
    );


    /*
       Перша заявка
       автоматично показується
       тільки для сумісності
    */

    if (
        currentApplications.length > 0
    ) {

        currentApplication =
            currentApplications[0];


        renderSingleApplication(
            currentApplication
        );

    } else {

        currentApplication =
            null;


        clearSingleApplication();

    }

}


/* =========================================================
   RENDER CITIZEN
========================================================= */

function renderCitizenProfile(
    citizen
) {

    if (!citizen) {

        return;

    }


    const olympId =
        citizen.olympId ||
        citizen.idNumber ||
        citizen.citizenId ||
        citizen.number ||
        "";


    const fullName =
        citizen.fullName ||
        citizen.name ||
        citizen.fio ||
        "";


    const birthDate =
        citizen.birthDate ||
        citizen.dateOfBirth ||
        "";


    const phone =
        citizen.phone ||
        "";


    const email =
        citizen.email ||
        "";


    const discord =
        citizen.discord ||
        "";


    const contact =
        citizen.contact ||
        citizen.preferredContact ||
        "";


    const registrationDate =
        citizen.registrationDate ||
        citizen.createdAt ||
        "";


    /* =====================================================
       ID

       ТВОЙ HTML:

       profileCitizenId
    ===================================================== */

    setText(
        "profileCitizenId",
        olympId || "—"
    );


    /*
       Дополнительная совместимость
    */

    setTextIfExists(
        "profileOlympId",
        olympId
    );


    setTextIfExists(
        "profileOlympID",
        olympId
    );


    setTextIfExists(
        "citizenId",
        olympId
    );


    /* =====================================================
       FULL NAME
    ===================================================== */

    setText(
        "profileFullName",
        fullName
    );


    /* =====================================================
       BIRTH DATE
    ===================================================== */

    setText(
        "profileBirthDate",
        formatDate(
            birthDate
        )
    );


    /* =====================================================
       PHONE
    ===================================================== */

    setText(
        "profilePhone",
        phone
    );


    /* =====================================================
       EMAIL
    ===================================================== */

    setText(
        "profileEmail",
        email
    );


    /* =====================================================
       DISCORD
    ===================================================== */

    setText(
        "profileDiscord",
        discord
    );


    /* =====================================================
       CONTACT
    ===================================================== */

    setText(
        "profileContact",
        contact
    );


    /* =====================================================
       REGISTRATION DATE
    ===================================================== */

    setText(
        "profileCreatedAt",
        formatDateTime(
            registrationDate
        )
    );


    /* =====================================================
       AVATAR
    ===================================================== */

    updateAvatar(
        fullName
    );

}


/* =========================================================
   APPLICATIONS
========================================================= */

function renderApplications(
    applications
) {

    const normalized =
        normalizeApplications(
            applications
        );


    currentApplications =
        normalized;


    const container =
        document.getElementById(
            "applicationsList"
        );


    const loading =
        document.getElementById(
            "applicationsLoading"
        );


    const empty =
        document.getElementById(
            "applicationsEmpty"
        );


    /*
       Скрываем loading
    */

    if (loading) {

        loading.classList.add(
            "hidden"
        );

    }


    /*
       Если контейнер отсутствует
    */

    if (!container) {

        updateApplicationsCounter(
            normalized
        );

        return;

    }


    /*
       Удаляем старые динамические карточки,
       но сохраняем loading / empty
    */

    const oldCards =
        container.querySelectorAll(
            ".application-history-card"
        );


    oldCards.forEach(
        function (card) {

            card.remove();

        }
    );


    /*
       EMPTY
    */

    if (
        normalized.length === 0
    ) {

        if (empty) {

            empty.classList.remove(
                "hidden"
            );

        }


        updateApplicationsCounter(
            normalized
        );


        return;

    }


    /*
       Есть заявки
    */

    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    normalized.forEach(
        function (
            application,
            index
        ) {

            const card =
                createApplicationCard(
                    application,
                    index
                );


            container.appendChild(
                card
            );

        }
    );


    updateApplicationsCounter(
        normalized
    );

}


/* =========================================================
   CREATE APPLICATION CARD
========================================================= */

function createApplicationCard(
    application,
    index
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "application-history-card";


    card.dataset.number =
        application.number ||
        "";


    /* =====================================================
       TOP
    ===================================================== */

    const top =
        document.createElement(
            "div"
        );


    top.className =
        "application-history-top";


    /* =====================================================
       NUMBER
    ===================================================== */

    const numberBlock =
        document.createElement(
            "div"
        );


    numberBlock.className =
        "application-history-number";


    const numberLabel =
        document.createElement(
            "span"
        );


    numberLabel.textContent =
        "НОМЕР ЗАЯВКИ";


    const number =
        document.createElement(
            "strong"
        );


    number.textContent =
        application.number ||
        "—";


    numberBlock.appendChild(
        numberLabel
    );


    numberBlock.appendChild(
        number
    );


    /* =====================================================
       STATUS
    ===================================================== */

    const status =
        document.createElement(
            "span"
        );


    status.className =
        "status-badge " +
        getStatusClass(
            application.status
        );


    status.textContent =
        application.status ||
        "🟡 На розгляді";


    top.appendChild(
        numberBlock
    );


    top.appendChild(
        status
    );


    card.appendChild(
        top
    );


    /* =====================================================
       GRID
    ===================================================== */

    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "application-history-grid";


    addApplicationInfo(
        grid,
        "Дата",
        formatDateTime(
            application.date
        )
    );


    addApplicationInfo(
        grid,
        "Державна послуга",
        application.service
    );


    addApplicationInfo(
        grid,
        "Відповідальний",
        application.responsible ||
        "Не призначено"
    );


    card.appendChild(
        grid
    );


    /* =====================================================
       MESSAGE
    ===================================================== */

    const messageBlock =
        document.createElement(
            "div"
        );


    messageBlock.className =
        "application-history-message";


    const messageLabel =
        document.createElement(
            "span"
        );


    messageLabel.textContent =
        "ОПИС ЗВЕРНЕННЯ";


    const messageText =
        document.createElement(
            "p"
        );


    messageText.textContent =
        truncateText(
            application.message ||
            "Опис звернення відсутній.",
            180
        );


    messageBlock.appendChild(
        messageLabel
    );


    messageBlock.appendChild(
        messageText
    );


    card.appendChild(
        messageBlock
    );


    /* =====================================================
       ACTIONS
    ===================================================== */

    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "application-history-actions";


    /* =====================================================
       VIEW
    ===================================================== */

    const viewButton =
        document.createElement(
            "button"
        );


    viewButton.type =
        "button";


    viewButton.className =
        "primary-button";


    viewButton.textContent =
        "Переглянути заявку";


    viewButton.addEventListener(
        "click",
        function () {

            openApplication(
                application
            );

        }
    );


    actions.appendChild(
        viewButton
    );


    /* =====================================================
       COPY
    ===================================================== */

    const copyButton =
        document.createElement(
            "button"
        );


    copyButton.type =
        "button";


    copyButton.className =
        "copy-button";


    copyButton.textContent =
        "Копіювати номер";


    copyButton.addEventListener(
        "click",
        function () {

            copyText(
                application.number,
                "Номер заявки скопійовано."
            );

        }
    );


    actions.appendChild(
        copyButton
    );


    card.appendChild(
        actions
    );


    return card;

}


/* =========================================================
   ADD APPLICATION INFO
========================================================= */

function addApplicationInfo(
    container,
    label,
    value
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "info-item";


    const labelElement =
        document.createElement(
            "span"
        );


    labelElement.textContent =
        label;


    const valueElement =
        document.createElement(
            "strong"
        );


    valueElement.textContent =
        value ||
        "—";


    item.appendChild(
        labelElement
    );


    item.appendChild(
        valueElement
    );


    container.appendChild(
        item
    );

}


/* =========================================================
   OPEN APPLICATION
========================================================= */

function openApplication(
    application
) {

    if (!application) {

        return;

    }


    currentApplication =
        application;


    renderSingleApplication(
        application
    );


    const details =
        document.getElementById(
            "applicationDetails"
        );


    if (details) {

        details.classList.remove(
            "hidden"
        );


        setTimeout(
            function () {

                details.scrollIntoView(
                    {
                        behavior:
                            "smooth",

                        block:
                            "start"
                    }
                );

            },
            50
        );

    }


    showToast(
        "Заявку відкрито.",
        "success"
    );

}


/* =========================================================
   RENDER SINGLE APPLICATION
========================================================= */

function renderSingleApplication(
    application
) {

    if (!application) {

        return;

    }


    setText(
        "applicationNumberView",
        application.number
    );


    setText(
        "applicationDate",
        formatDateTime(
            application.date
        )
    );


    setText(
        "applicationService",
        application.service
    );


    setText(
        "applicationResponsible",
        application.responsible ||
        "Не призначено"
    );


    setText(
        "applicationAccessCode",
        application.accessCode ||
        "—"
    );


    setText(
        "applicationMessage",
        application.message ||
        "Опис звернення відсутній."
    );


    setText(
        "applicationComment",
        application.comment ||
        "Відповідь ще не надана."
    );


    updateStatus(
        application.status
    );

}


/* =========================================================
   CLEAR SINGLE APPLICATION
========================================================= */

function clearSingleApplication() {

    setText(
        "applicationNumberView",
        "—"
    );


    setText(
        "applicationDate",
        "—"
    );


    setText(
        "applicationService",
        "—"
    );


    setText(
        "applicationResponsible",
        "—"
    );


    setText(
        "applicationAccessCode",
        "—"
    );


    setText(
        "applicationMessage",
        "Заявок поки немає."
    );


    setText(
        "applicationComment",
        "Відповідь ще не надана."
    );


    updateStatus(
        "🟡 На розгляді"
    );

}


/* =========================================================
   STATISTICS
========================================================= */

function updateApplicationsCounter(
    applications
) {

    const list =
        Array.isArray(
            applications
        )
            ?
        applications
            :
        [];


    const total =
        list.length;


    const pending =
        list.filter(
            function (item) {

                return statusContains(
                    item.status,
                    "На розгляді"
                );

            }
        ).length;


    const accepted =
        list.filter(
            function (item) {

                return statusContains(
                    item.status,
                    "Прийнято"
                );

            }
        ).length;


    const completed =
        list.filter(
            function (item) {

                return statusContains(
                    item.status,
                    "Виконано"
                );

            }
        ).length;


    const rejected =
        list.filter(
            function (item) {

                return statusContains(
                    item.status,
                    "Відхилено"
                );

            }
        ).length;


    const closed =
        list.filter(
            function (item) {

                return statusContains(
                    item.status,
                    "Закрито"
                );

            }
        ).length;


    /* =====================================================
       HTML IDS ИЗ ТВОЕГО CABINET.HTML
    ===================================================== */

    setText(
        "statTotal",
        total
    );


    setText(
        "statPending",
        pending
    );


    setText(
        "statAccepted",
        accepted
    );


    setText(
        "statCompleted",
        completed
    );


    setText(
        "statRejected",
        rejected
    );


    setText(
        "statClosed",
        closed
    );


    /* =====================================================
       СТАРЫЕ IDS
    ===================================================== */

    setTextIfExists(
        "applicationsCount",
        total
    );


    setTextIfExists(
        "totalApplications",
        total
    );


    setTextIfExists(
        "pendingApplications",
        pending
    );


    setTextIfExists(
        "acceptedApplications",
        accepted
    );


    setTextIfExists(
        "completedApplications",
        completed
    );


    setTextIfExists(
        "rejectedApplications",
        rejected
    );


    setTextIfExists(
        "closedApplications",
        closed
    );

}


/* =========================================================
   STATUS
========================================================= */

function updateStatus(
    status
) {

    const element =
        document.getElementById(
            "applicationStatus"
        );


    if (!element) {

        return;

    }


    const value =
        clean(
            status
        ) ||
        "🟡 На розгляді";


    element.textContent =
        value;


    element.className =
        "status-badge";


    element.classList.add(
        getStatusClass(
            value
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
        clean(
            status
        ).toLowerCase();


    if (
        value.includes(
            "на розгляді"
        )
    ) {

        return "status-pending";

    }


    if (
        value.includes(
            "прийнято"
        )
    ) {

        return "status-accepted";

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
   STATUS CONTAINS
========================================================= */

function statusContains(
    status,
    text
) {

    return clean(
        status
    )
        .toLowerCase()
        .includes(
            String(text)
                .toLowerCase()
        );

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    const confirmed =
        window.confirm(
            "Ви дійсно хочете вийти з особистого кабінету?"
        );


    if (!confirmed) {

        return;

    }


    clearSession();


    currentCitizen =
        null;


    currentApplications =
        [];


    currentApplication =
        null;


    showLogin();


    resetLoginForm();


    showToast(
        "Ви вийшли з кабінету.",
        "success"
    );


    window.scrollTo(
        {
            top:
                0,

            behavior:
                "smooth"
        }
    );

}


/* =========================================================
   SAVE SESSION
========================================================= */

function saveSession(
    olympId,
    password
) {

    if (
        !olympId ||
        !password
    ) {

        return;

    }


    const session = {

        version:
            CABINET_VERSION,

        olympId:
            formatOlympId(
                olympId
            ),

        password:
            password,

        savedAt:
            Date.now()

    };


    try {

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(
                session
            )

        );

    } catch (error) {

        console.error(
            "SAVE SESSION ERROR:",
            error
        );

    }

}


/* =========================================================
   LOAD SESSION
========================================================= */

function loadSession() {

    try {

        const raw =
            localStorage.getItem(
                STORAGE_KEY
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
            !session.olympId ||
            !session.password
        ) {

            return null;

        }


        session.olympId =
            formatOlympId(
                session.olympId
            );


        return session;

    } catch (error) {

        console.error(
            "LOAD SESSION ERROR:",
            error
        );


        return null;

    }

}


/* =========================================================
   CLEAR SESSION
========================================================= */

function clearSession() {

    try {

        localStorage.removeItem(
            STORAGE_KEY
        );

    } catch (error) {

        console.error(
            "CLEAR SESSION ERROR:",
            error
        );

    }

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

    if (loginSection) {

        loginSection.classList.remove(
            "hidden"
        );

    }


    if (cabinetSection) {

        cabinetSection.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   SHOW CABINET
========================================================= */

function showCabinet() {

    if (loginSection) {

        loginSection.classList.add(
            "hidden"
        );

    }


    if (cabinetSection) {

        cabinetSection.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   RESET LOGIN
========================================================= */

function resetLoginForm() {

    if (loginForm) {

        loginForm.reset();

    }


    clearLoginError();

}


/* =========================================================
   LOGIN ERROR
========================================================= */

function showLoginError(
    message
) {

    if (!loginError) {

        return;

    }


    loginError.textContent =
        message;


    loginError.classList.add(
        "visible"
    );

}


/* =========================================================
   CLEAR LOGIN ERROR
========================================================= */

function clearLoginError() {

    if (!loginError) {

        return;

    }


    loginError.textContent =
        "";


    loginError.classList.remove(
        "visible"
    );

}


/* =========================================================
   LOGIN LOADING
========================================================= */

function setLoginLoading(
    loading
) {

    if (!loginButton) {

        return;

    }


    loginButton.disabled =
        loading;


    if (!loginButtonText) {

        return;

    }


    if (loading) {

        loginButtonText.innerHTML =

            '<span class="button-loader"></span>' +
            'Перевірка...';

    } else {

        loginButtonText.textContent =
            "Увійти до кабінету";

    }

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(
    text
) {

    if (!loadingOverlay) {

        return;

    }


    const textElement =
        loadingOverlay.querySelector(
            ".loading-box span"
        );


    if (textElement) {

        textElement.textContent =
            text ||
            "Будь ласка, зачекайте...";

    }


    loadingOverlay.classList.remove(
        "hidden"
    );

}


/* =========================================================
   HIDE LOADING
========================================================= */

function hideLoading() {

    if (!loadingOverlay) {

        return;

    }


    loadingOverlay.classList.add(
        "hidden"
    );

}


/* =========================================================
   COPY APPLICATION NUMBER
========================================================= */

async function copyApplicationNumber() {

    if (
        !currentApplication ||
        !currentApplication.number
    ) {

        showToast(
            "Номер заявки недоступний.",
            "error"
        );


        return;

    }


    await copyText(

        currentApplication.number,

        "Номер заявки скопійовано."

    );

}


/* =========================================================
   COPY TEXT
========================================================= */

async function copyText(
    value,
    successMessage
) {

    if (!value) {

        return;

    }


    try {

        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {

            await navigator.clipboard.writeText(
                String(value)
            );

        } else {

            throw new Error(
                "Clipboard unavailable"
            );

        }


        showToast(
            successMessage ||
            "Скопійовано.",
            "success"
        );


    } catch (error) {

        /*
           Fallback
        */

        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            String(value);


        textarea.style.position =
            "fixed";


        textarea.style.left =
            "-9999px";


        textarea.style.top =
            "0";


        textarea.style.opacity =
            "0";


        document.body.appendChild(
            textarea
        );


        textarea.focus();

        textarea.select();


        let success =
            false;


        try {

            success =
                document.execCommand(
                    "copy"
                );

        } catch (
            copyError
        ) {

            success =
                false;

        }


        document.body.removeChild(
            textarea
        );


        if (success) {

            showToast(
                successMessage ||
                "Скопійовано.",
                "success"
            );

        } else {

            showToast(
                "Не вдалося скопіювати.",
                "error"
            );

        }

    }

}


/* =========================================================
   AVATAR
========================================================= */

function updateAvatar(
    fullName
) {

    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    if (!avatar) {

        return;

    }


    const name =
        clean(
            fullName
        );


    if (!name) {

        avatar.textContent =
            "👤";


        return;

    }


    const words =
        name.split(
            " "
        );


    let initials =
        "";


    if (words[0]) {

        initials +=
            words[0]
                .charAt(0)
                .toUpperCase();

    }


    if (words[1]) {

        initials +=
            words[1]
                .charAt(0)
                .toUpperCase();

    }


    avatar.textContent =
        initials ||
        "👤";

}


/* =========================================================
   NORMALIZE CITIZEN
========================================================= */

function normalizeCitizen(
    citizen
) {

    if (
        !citizen ||
        typeof citizen !== "object"
    ) {

        return null;

    }


    return {

        olympId:
            normalizeOlympId(
                citizen.olympId ||
                citizen.idNumber ||
                citizen.citizenId ||
                citizen.number ||
                ""
            ),


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
                citizen.registration ||
                ""
            )

    };

}


/* =========================================================
   NORMALIZE APPLICATIONS
========================================================= */

function normalizeApplications(
    applications
) {

    if (
        !Array.isArray(
            applications
        )
    ) {

        return [];

    }


    return applications
        .map(
            function (application) {

                return normalizeApplication(
                    application
                );

            }
        )
        .filter(
            function (application) {

                return !!application;

            }
        );

}


/* =========================================================
   NORMALIZE APPLICATION
========================================================= */

function normalizeApplication(
    application
) {

    if (
        !application ||
        typeof application !== "object"
    ) {

        return null;

    }


    return {

        number:
            clean(
                application.number ||
                application.applicationNumber ||
                application.requestNumber ||
                application.id ||
                ""
            ).toUpperCase(),


        olympId:
            normalizeOlympId(
                application.olympId ||
                application.idNumber ||
                application.citizenId ||
                ""
            ),


        date:
            clean(
                application.date ||
                application.createdAt ||
                application.timestamp ||
                ""
            ),


        fullName:
            clean(
                application.fullName ||
                application.name ||
                application.fio ||
                ""
            ),


        birthDate:
            clean(
                application.birthDate ||
                application.dateOfBirth ||
                ""
            ),


        phone:
            clean(
                application.phone ||
                ""
            ),


        email:
            clean(
                application.email ||
                ""
            ),


        discord:
            clean(
                application.discord ||
                ""
            ),


        service:
            clean(
                application.service ||
                application.serviceName ||
                application.type ||
                ""
            ),


        contact:
            clean(
                application.contact ||
                application.preferredContact ||
                ""
            ),


        message:
            clean(
                application.message ||
                application.description ||
                application.text ||
                ""
            ),


        status:
            clean(
                application.status ||
                "🟡 На розгляді"
            ),


        responsible:
            clean(
                application.responsible ||
                application.responsibleName ||
                application.employee ||
                ""
            ),


        comment:
            clean(
                application.comment ||
                application.answer ||
                application.response ||
                application.adminComment ||
                ""
            ),


        accessCode:
            clean(
                application.accessCode ||
                application.code ||
                ""
            ).toUpperCase()

    };

}


/* =========================================================
   NORMALIZE OLYMP ID
========================================================= */

function normalizeOlympId(
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
       Если пользователь ввёл:

       OLYMP000001

       превращаем в:

       OLYMP-000001
    */

    if (
        /^OLYMP\d{6}$/.test(
            result
        )
    ) {

        result =
            result.replace(
                /^OLYMP/,
                "OLYMP-"
            );

    }


    /*
       Если пользователь ввёл:

       OLYMP-000001
    */

    return result;

}


/* =========================================================
   FORMAT OLYMP ID
========================================================= */

function formatOlympId(
    value
) {

    let result =
        normalizeOlympId(
            value
        );


    /*
       Удаляем возможные
       двойные дефисы
    */

    result =
        result.replace(
            /-+/g,
            "-"
        );


    /*
       OLYMP000001
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
   CLEAN PASSWORD
========================================================= */

function cleanPassword(
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
            ""
        );

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
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


    const text =
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""

            ?

        String(value)

            :

        "—";


    element.textContent =
        text;

}


/* =========================================================
   SET TEXT IF EXISTS
========================================================= */

function setTextIfExists(
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


    const text =
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""

            ?

        String(value)

            :

        "—";


    element.textContent =
        text;

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "—";

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


    return date.toLocaleDateString(
        "uk-UA",
        {

            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric"

        }
    );

}


/* =========================================================
   FORMAT DATE TIME
========================================================= */

function formatDateTime(
    value
) {

    if (!value) {

        return "—";

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


    return date.toLocaleString(
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
    );

}


/* =========================================================
   TRUNCATE
========================================================= */

function truncateText(
    value,
    maxLength
) {

    const text =
        clean(
            value
        );


    if (
        text.length <= maxLength
    ) {

        return text;

    }


    return (
        text.substring(
            0,
            maxLength
        ) +
        "…"
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = ""
) {

    if (!toast) {

        return;

    }


    clearTimeout(
        toastTimer
    );


    toast.textContent =
        message;


    toast.className =
        "toast visible";


    if (type) {

        toast.classList.add(
            type
        );

    }


    toastTimer =
        setTimeout(
            hideToast,
            3500
        );

}


/* =========================================================
   HIDE TOAST
========================================================= */

function hideToast() {

    if (!toast) {

        return;

    }


    toast.classList.remove(
        "visible"
    );

}


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "OLYMP Government Personal Cabinet " +
    CABINET_VERSION +
    " loaded successfully."
);


/* =========================================================
   GLOBAL DEBUG
========================================================= */

window.OlympCabinet = {

    version:
        CABINET_VERSION,


    getCitizen:
        function () {

            return currentCitizen;

        },


    getApplications:
        function () {

            return currentApplications;

        },


    getCurrentApplication:
        function () {

            return currentApplication;

        },


    refresh:
        function () {

            restoreSession();

        },


    logout:
        function () {

            logout();

        }

};
