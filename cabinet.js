/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET 3.0

   FRONTEND

   Возможности:

   • Вхід за номером заявки + кодом
   • Автоматичне збереження сесії
   • Відновлення сесії після перезавантаження
   • Перегляд особистої інформації
   • Перегляд заявки
   • Перегляд статусу
   • Перегляд відповіді державного органу
   • Копіювання номера заявки
   • Вихід
   • Toast повідомлення
   • Loading
========================================================= */


/* =========================================================
   НАСТРОЙКИ
========================================================= */


/*
   СЮДА ВСТАВЬ URL РАЗВЁРНУТОГО GOOGLE APPS SCRIPT.

   Пример:

   const API_URL =
       "https://script.google.com/macros/s/XXXXXXXXXXXX/exec";

*/

const API_URL =
    "ВСТАВЬ_СЮДА_URL_GOOGLE_APPS_SCRIPT";


/*
   Ключ для localStorage
*/

const STORAGE_KEY =
    "olympCabinetSession";


/*
   Версия кабинета
*/

const CABINET_VERSION =
    "3.0";



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
   APPLICATION
========================================================= */

let currentApplication =
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


    /*
       LOGIN
    */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    /*
       LOGOUT
    */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }


    /*
       COPY
    */

    if (copyNumberButton) {

        copyNumberButton.addEventListener(
            "click",
            copyApplicationNumber
        );

    }


    /*
       ENTER IN APPLICATION NUMBER
    */

    const numberInput =
        document.getElementById(
            "applicationNumber"
        );


    if (numberInput) {

        numberInput.addEventListener(
            "input",
            function () {

                this.value =
                    this.value
                        .toUpperCase()
                        .replace(/\s+/g, "");

            }
        );

    }


    /*
       ACCESS CODE
    */

    const accessCodeInput =
        document.getElementById(
            "accessCode"
        );


    if (accessCodeInput) {

        accessCodeInput.addEventListener(
            "input",
            function () {

                this.value =
                    this.value
                        .toUpperCase()
                        .replace(/\s+/g, "");

            }
        );

    }


    /*
       ESC
    */

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


    const numberInput =
        document.getElementById(
            "applicationNumber"
        );


    const accessCodeInput =
        document.getElementById(
            "accessCode"
        );


    const number =
        clean(
            numberInput.value
        ).toUpperCase();


    const accessCode =
        clean(
            accessCodeInput.value
        ).toUpperCase();



    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!number) {

        showLoginError(
            "Вкажіть номер заявки."
        );

        numberInput.focus();

        return;

    }


    if (!accessCode) {

        showLoginError(
            "Вкажіть код доступу."
        );

        accessCodeInput.focus();

        return;

    }



    if (
        !/^OLYMP-\d{6}$/.test(
            number
        )
    ) {

        showLoginError(
            "Невірний формат номера заявки. Приклад: OLYMP-000001"
        );

        numberInput.focus();

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


        const application =
            await apiRequest(
                "login",
                {
                    number:
                        number,

                    accessCode:
                        accessCode
                }
            );


        if (
            !application ||
            !application.success
        ) {

            throw new Error(

                application &&
                application.message

                    ?

                application.message

                    :

                "Не вдалося виконати вхід."

            );

        }



        /* =================================================
           SAVE SESSION
        ================================================= */

        saveSession(
            application.application
        );


        currentApplication =
            application.application;



        /* =================================================
           DISPLAY
        ================================================= */

        renderCabinet(
            currentApplication
        );


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



    if (
        !session.number ||
        !session.accessCode
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
                "status",
                {

                    number:
                        session.number,

                    accessCode:
                        session.accessCode

                }
            );


        if (
            !response ||
            !response.success ||
            !response.application
        ) {

            throw new Error(
                "Сесія недійсна."
            );

        }


        currentApplication =
            response.application;


        saveSession(
            currentApplication
        );


        renderCabinet(
            currentApplication
        );


        hideLoading();


    } catch (error) {

        console.warn(
            "SESSION RESTORE ERROR:",
            error
        );


        clearSession();

        hideLoading();

        showLogin();

    }

}



/* =========================================================
   API
========================================================= */

async function apiRequest(
    action,
    params = {}
) {


    if (
        !API_URL ||
        API_URL.includes(
            "ВСТАВЬ_СЮДА"
        )
    ) {

        throw new Error(
            "Не вказано URL Google Apps Script у cabinet.js."
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



    const response =
        await fetch(
            url,
            {
                method:
                    "GET",

                cache:
                    "no-store"
            }
        );



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

function renderCabinet(
    application
) {


    if (!application) {

        return;

    }


    currentApplication =
        application;



    /* =====================================================
       HIDE LOGIN
    ===================================================== */

    showCabinet();



    /* =====================================================
       PROFILE
    ===================================================== */

    setText(
        "profileFullName",
        application.fullName
    );


    setText(
        "profileBirthDate",
        application.birthDate
    );


    setText(
        "profilePhone",
        application.phone
    );


    setText(
        "profileEmail",
        application.email
    );


    setText(
        "profileDiscord",
        application.discord
    );


    setText(
        "profileContact",
        application.contact
    );



    /* =====================================================
       AVATAR
    ===================================================== */

    updateAvatar(
        application.fullName
    );



    /* =====================================================
       APPLICATION
    ===================================================== */

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
        application.accessCode
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



    /* =====================================================
       STATUS
    ===================================================== */

    updateStatus(
        application.status
    );

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
            top: 0,
            behavior: "smooth"
        }
    );

}



/* =========================================================
   SESSION
========================================================= */

function saveSession(
    application
) {


    if (!application) {

        return;

    }


    const session = {

        version:
            CABINET_VERSION,

        number:
            application.number,

        accessCode:
            application.accessCode,

        savedAt:
            new Date().toISOString()

    };


    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(
            session
        )

    );

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
            !session.number ||
            !session.accessCode
        ) {

            return null;

        }


        return session;


    } catch (error) {

        console.error(
            "SESSION ERROR:",
            error
        );


        return null;

    }

}



/* =========================================================
   CLEAR SESSION
========================================================= */

function clearSession() {

    localStorage.removeItem(
        STORAGE_KEY
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



    if (
        cleanStatus.includes(
            "На розгляді"
        )
    ) {

        element.classList.add(
            "status-pending"
        );

        return;

    }



    if (
        cleanStatus.includes(
            "Прийнято"
        )
    ) {

        element.classList.add(
            "status-accepted"
        );

        return;

    }



    if (
        cleanStatus.includes(
            "Виконано"
        )
    ) {

        element.classList.add(
            "status-completed"
        );

        return;

    }



    if (
        cleanStatus.includes(
            "Відхилено"
        )
    ) {

        element.classList.add(
            "status-rejected"
        );

        return;

    }



    if (
        cleanStatus.includes(
            "Закрито"
        )
    ) {

        element.classList.add(
            "status-closed"
        );

        return;

    }


    element.classList.add(
        "status-pending"
    );

}



/* =========================================================
   COPY NUMBER
========================================================= */

async function copyApplicationNumber() {


    if (
        !currentApplication ||
        !currentApplication.number
    ) {

        return;

    }


    const number =
        currentApplication.number;


    try {


        await navigator.clipboard.writeText(
            number
        );


        showToast(
            "Номер заявки скопійовано.",
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
            number;


        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";


        document.body.appendChild(
            textarea
        );


        textarea.select();


        try {

            document.execCommand(
                "copy"
            );

            showToast(
                "Номер заявки скопійовано.",
                "success"
            );

        } catch (copyError) {

            showToast(
                "Не вдалося скопіювати номер.",
                "error"
            );

        }


        document.body.removeChild(
            textarea
        );

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


    return String(value)
        .trim()
        .replace(
            /\s+/g,
            " "
        );

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
   RESET LOGIN FORM
========================================================= */

function resetLoginForm() {


    if (loginForm) {

        loginForm.reset();

    }


    clearLoginError();

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
   TOAST
========================================================= */

let toastTimer =
    null;



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
