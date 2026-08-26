/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET 4.0

   FRONTEND

   НОВАЯ СИСТЕМА:

   • Вхід за OLYMP-ID + паролем
   • Автоматичне збереження сесії
   • Відновлення сесії після перезавантаження
   • Перегляд особистої інформації
   • Перегляд OLYMP-ID
   • Перегляд усіх заявок громадянина
   • Перегляд статусу кожної заявки
   • Перегляд відповіді державного органу
   • Відкриття конкретної заявки
   • Копіювання номера заявки
   • Вихід
   • Toast повідомлення
   • Loading
   • Захист від некоректних відповідей API

   OLYMP GOVERNMENT 4.0
========================================================= */


/* =========================================================
   НАСТРОЙКИ
========================================================= */


/*
   URL РАЗВЁРНУТОГО GOOGLE APPS SCRIPT

   ТЕКУЩИЙ URL:
*/

const API_URL =
    "https://script.google.com/macros/s/AKfycbyynbAxu6A_tU5nBEUum357BCY6o8D-3e44wEtR-AlyOtV5un8mNgpmkvU6dtrIy0RvfQ/exec";


/*
   Ключ сессии
*/

const STORAGE_KEY =
    "olympCitizenSession";


/*
   Версия кабинета
*/

const CABINET_VERSION =
    "4.0";


/*
   Максимальный возраст сессии.

   30 дней.
*/

const SESSION_MAX_AGE =
    30 * 24 * 60 * 60 * 1000;


/* =========================================================
   DOM
========================================================= */

const loginSection =
    document.getElementById(
        "loginSection"
    );


const cabinetSection =
    document.getElementById(
        "cabinetSection"
    );


const loginForm =
    document.getElementById(
        "loginForm"
    );


const loginButton =
    document.getElementById(
        "loginButton"
    );


const loginButtonText =
    document.getElementById(
        "loginButtonText"
    );


const loginError =
    document.getElementById(
        "loginError"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const loadingOverlay =
    document.getElementById(
        "loadingOverlay"
    );


const toast =
    document.getElementById(
        "toast"
    );


const copyNumberButton =
    document.getElementById(
        "copyNumberButton"
    );


/* =========================================================
   STATE
========================================================= */

let currentCitizen =
    null;


let currentApplications =
    [];


let currentApplication =
    null;


let toastTimer =
    null;


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
       COPY APPLICATION NUMBER
    ----------------------------------------------------- */

    if (copyNumberButton) {

        copyNumberButton.addEventListener(
            "click",
            copyApplicationNumber
        );

    }


    /* -----------------------------------------------------
       OLYMP ID
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


    /*
       Сумісність зі старим полем.

       Якщо login.html ще має
       applicationNumber,
       використовуємо його як OLYMP-ID.
    */

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

    const passwordInput =
        document.getElementById(
            "password"
        );


    if (passwordInput) {

        passwordInput.addEventListener(
            "input",
            function () {

                this.value =
                    String(
                        this.value
                    ).replace(
                        /\s+/g,
                        ""
                    );

            }
        );

    }


    /* -----------------------------------------------------
       СТАРЕ ПОЛЕ ACCESS CODE
       НЕ ЛАМАЄМО СТАРИЙ HTML
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
                    String(
                        this.value
                    ).replace(
                        /\s+/g,
                        ""
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
                event.key ===
                "Escape"
            ) {

                hideToast();

            }

        }
    );

}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(
    event
) {

    event.preventDefault();

    clearLoginError();


    /*
       Поддерживаем новый login.html:

       olympId
       password

       И старый:

       applicationNumber
       accessCode
    */

    const olympIdInput =
        document.getElementById(
            "olympId"
        );


    const applicationNumberInput =
        document.getElementById(
            "applicationNumber"
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


    /*
       Новый вариант
    */

    if (olympIdInput) {

        olympId =
            clean(
                olympIdInput.value
            ).toUpperCase();

    }


    /*
       Совместимость со старым HTML
    */

    if (
        !olympId &&
        applicationNumberInput
    ) {

        olympId =
            clean(
                applicationNumberInput.value
            ).toUpperCase();

    }


    /*
       Новый пароль
    */

    if (passwordInput) {

        password =
            cleanPassword(
                passwordInput.value
            );

    }


    /*
       Совместимость со старым HTML
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
       VALIDATION
    ===================================================== */

    if (!olympId) {

        showLoginError(
            "Вкажіть OLYMP-ID."
        );


        if (olympIdInput) {

            olympIdInput.focus();

        } else if (
            applicationNumberInput
        ) {

            applicationNumberInput.focus();

        }


        return;

    }


    if (
        !/^OLYMP-\d{6}$/.test(
            olympId
        )
    ) {

        showLoginError(
            "Невірний формат OLYMP-ID. Приклад: OLYMP-000001"
        );


        if (olympIdInput) {

            olympIdInput.focus();

        } else if (
            applicationNumberInput
        ) {

            applicationNumberInput.focus();

        }


        return;

    }


    if (!password) {

        showLoginError(
            "Вкажіть пароль."
        );


        if (passwordInput) {

            passwordInput.focus();

        } else if (
            accessCodeInput
        ) {

            accessCodeInput.focus();

        }


        return;

    }


    /* =====================================================
       LOADING
    ===================================================== */

    setLoginLoading(
        true
    );


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

                    password:
                        password

                }
            );


        if (
            !response ||
            !response.success
        ) {

            throw new Error(

                response &&
                response.message

                    ?

                response.message

                    :

                "Не вдалося виконати вхід."

            );

        }


        /*
           Громадянин
        */

        currentCitizen =
            normalizeCitizen(
                response.citizen ||
                response.profile ||
                response.user ||
                null
            );


        /*
           Заявки
        */

        currentApplications =
            normalizeApplications(
                response.applications ||
                response.requests ||
                response.myApplications ||
                []
            );


        /*
           Если API возвращает только одну заявку
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
           Без профиля вход считаем неуспешным
        */

        if (!currentCitizen) {

            throw new Error(
                "Сервер не повернув дані громадянина."
            );

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


    /*
       Проверка возраста сессии
    */

    if (
        session.savedAt &&
        Date.now() -
        session.savedAt >
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

                    password:
                        session.password

                }
            );


        if (
            !response ||
            !response.success
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
                null
            );


        currentApplications =
            normalizeApplications(
                response.applications ||
                response.requests ||
                response.myApplications ||
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


        if (!currentCitizen) {

            throw new Error(
                "Дані громадянина не отримано."
            );

        }


        /*
           Обновляем время сессии
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
                    value
                );

            }

        }
    );


    const url =
        API_URL +
        "?" +
        query.toString();


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


    if (
        !response.ok
    ) {

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


    /*
       Профіль
    */

    renderCitizenProfile(
        currentCitizen
    );


    /*
       Заявки
    */

    renderApplications(
        currentApplications
    );


    /*
       Перша заявка для сумісності
       зі старим HTML
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
   RENDER CITIZEN PROFILE
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


    /*
       OLYMP-ID
    */

    setText(
        "profileOlympId",
        olympId || "—"
    );


    /*
       ПІБ
    */

    setText(
        "profileFullName",
        fullName
    );


    /*
       Дата народження
    */

    setText(
        "profileBirthDate",
        birthDate
    );


    /*
       Телефон
    */

    setText(
        "profilePhone",
        phone
    );


    /*
       Email
    */

    setText(
        "profileEmail",
        email
    );


    /*
       Discord
    */

    setText(
        "profileDiscord",
        discord
    );


    /*
       Контакт
    */

    setText(
        "profileContact",
        contact
    );


    /*
       Avatar
    */

    updateAvatar(
        fullName
    );


    /*
       Додаткові поля,
       якщо вони є в HTML
    */

    setTextIfExists(
        "citizenId",
        olympId
    );


    setTextIfExists(
        "profileOlympID",
        olympId
    );

}


/* =========================================================
   RENDER ALL APPLICATIONS
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


    /*
       Ищем специальный контейнер
       новой версии HTML.
    */

    const containers = [

        "applicationsList",

        "myApplications",

        "applicationsContainer",

        "requestsList",

        "applicationList"

    ];


    let container =
        null;


    for (
        let i = 0;
        i < containers.length;
        i++
    ) {

        const element =
            document.getElementById(
                containers[i]
            );


        if (element) {

            container =
                element;

            break;

        }

    }


    /*
       Если нового контейнера
       ещё нет — не ломаем старый HTML.
    */

    if (!container) {

        updateApplicationsCounter(
            normalized
        );

        return;

    }


    container.innerHTML =
        "";


    if (
        normalized.length === 0
    ) {

        container.innerHTML =

            '<div class="history-empty">' +

                '<div class="history-icon">📁</div>' +

                '<h3>Заявок поки немає</h3>' +

                '<p>' +

                    'У вашому особистому кабінеті ' +

                    'ще не зареєстровано жодної заявки.' +

                '</p>' +

            '</div>';

        updateApplicationsCounter(
            normalized
        );

        return;

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


    /*
       TOP
    */

    const top =
        document.createElement(
            "div"
        );


    top.className =
        "application-history-top";


    /*
       Number
    */

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


    /*
       Status
    */

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


    /*
       GRID
    */

    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "application-history-grid";


    addApplicationInfo(
        grid,
        "Дата",
        application.date
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


    /*
       Message preview
    */

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
        grid
    );


    card.appendChild(
        messageBlock
    );


    /*
       BUTTON
    */

    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "application-history-actions";


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


    /*
       COPY BUTTON
    */

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


    /*
       Если в HTML есть
       подробный блок заявки,
       прокручиваем к нему.
    */

    const section =
        document.querySelector(
            ".applications-section"
        );


    if (section) {

        section.scrollIntoView(
            {
                behavior:
                    "smooth",

                block:
                    "start"
            }
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
        application.date
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
   APPLICATION COUNTER
========================================================= */

function updateApplicationsCounter(
    applications
) {

    const count =
        applications
            ? applications.length
            : 0;


    setTextIfExists(
        "applicationsCount",
        String(count)
    );


    setTextIfExists(
        "totalApplications",
        String(count)
    );


    /*
       Статистика
    */

    const pending =
        applications.filter(
            function (item) {

                return (
                    clean(item.status)
                        .includes(
                            "На розгляді"
                        )
                );

            }
        ).length;


    const accepted =
        applications.filter(
            function (item) {

                return (
                    clean(item.status)
                        .includes(
                            "Прийнято"
                        )
                );

            }
        ).length;


    const completed =
        applications.filter(
            function (item) {

                return (
                    clean(item.status)
                        .includes(
                            "Виконано"
                        )
                );

            }
        ).length;


    const rejected =
        applications.filter(
            function (item) {

                return (
                    clean(item.status)
                        .includes(
                            "Відхилено"
                        )
                );

            }
        ).length;


    setTextIfExists(
        "pendingApplications",
        String(pending)
    );


    setTextIfExists(
        "acceptedApplications",
        String(accepted)
    );


    setTextIfExists(
        "completedApplications",
        String(completed)
    );


    setTextIfExists(
        "rejectedApplications",
        String(rejected)
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


    const cleanStatus =
        clean(
            status
        ) ||
        "🟡 На розгляді";


    element.textContent =
        cleanStatus;


    element.className =
        "status-badge";


    element.classList.add(
        getStatusClass(
            cleanStatus
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
        );


    if (
        value.includes(
            "На розгляді"
        )
    ) {

        return "status-pending";

    }


    if (
        value.includes(
            "Прийнято"
        )
    ) {

        return "status-accepted";

    }


    if (
        value.includes(
            "Виконано"
        )
    ) {

        return "status-completed";

    }


    if (
        value.includes(
            "Відхилено"
        )
    ) {

        return "status-rejected";

    }


    if (
        value.includes(
            "Закрито"
        )
    ) {

        return "status-closed";

    }


    return "status-pending";

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
            olympId,

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
   RESET LOGIN FORM
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


    if (
        loginButtonText
    ) {

        if (loading) {

            loginButtonText.innerHTML =

                '<span class="button-loader"></span>' +

                'Перевірка...';

        } else {

            loginButtonText.textContent =
                "Увійти до кабінету";

        }

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
                "Clipboard API unavailable"
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


    if (
        words[0]
    ) {

        initials +=
            words[0]
                .charAt(0)
                .toUpperCase();

    }


    if (
        words[1]
    ) {

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


    return applications.map(
        function (
            application
        ) {

            return normalizeApplication(
                application
            );

        }
    ).filter(
        function (
            application
        ) {

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
        typeof application !==
        "object"
    ) {

        return null;

    }


    return {

        number:
            clean(
                application.number ||
                application.applicationNumber ||
                application.requestNumber ||
                ""
            ).toUpperCase(),


        olympId:
            clean(
                application.olympId ||
                application.idNumber ||
                ""
            ).toUpperCase(),


        date:
            clean(
                application.date ||
                application.createdAt ||
                ""
            ),


        fullName:
            clean(
                application.fullName ||
                application.name ||
                ""
            ),


        birthDate:
            clean(
                application.birthDate ||
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
                ""
            ),


        contact:
            clean(
                application.contact ||
                ""
            ),


        message:
            clean(
                application.message ||
                application.description ||
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
                ""
            ),


        comment:
            clean(
                application.comment ||
                application.answer ||
                application.response ||
                ""
            ),


        accessCode:
            clean(
                application.accessCode ||
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

    return String(
        value || ""
    )
        .toUpperCase()
        .replace(
            /\s+/g,
            ""
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


    element.textContent =
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""

            ?

        String(value)

            :

        "—";

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
        text.length <=
        maxLength
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
    " loaded."
);


/* =========================================================
   GLOBAL DEBUG OBJECT
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
