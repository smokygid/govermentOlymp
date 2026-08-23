/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET 4.0

   • Вхід по № заявки + коду
   • Збереження сесії
   • Перегляд особистих даних
   • Перегляд заявки
   • Перегляд статусу
   • Перегляд відповіді державного органу
   • Копіювання номера
   • Вихід
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT
========================================================= */

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzET7X9XsoUnCZlhGv8YEiv1NAoCmu13U4AP3WMlmo5sFXiwlBKhfLkXBfQKcFJh-RGog/exec";


/* =========================================================
   LOCAL STORAGE
========================================================= */

const SESSION_KEY =
    "olymp_cabinet_session";


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeCabinet
);


/* =========================================================
   INITIALIZATION
========================================================= */

function initializeCabinet() {

    console.log(
        "%cOLYMP Government Cabinet",
        "font-weight:bold;font-size:18px;"
    );


    initializeLoginForm();

    initializeLogout();

    initializeCopyButton();

    restoreSession();

}


/* =========================================================
   LOGIN FORM
========================================================= */

function initializeLoginForm() {

    const form =
        document.getElementById(
            "loginForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        handleLogin
    );

}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {

    event.preventDefault();


    const numberInput =
        document.getElementById(
            "loginNumber"
        );


    const codeInput =
        document.getElementById(
            "loginCode"
        );


    const loginButton =
        document.getElementById(
            "loginButton"
        );


    const number =
        numberInput
            ? numberInput.value
                .trim()
                .toUpperCase()
            : "";


    const accessCode =
        codeInput
            ? codeInput.value
                .trim()
                .toUpperCase()
            : "";


    clearLoginError();


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!number) {

        showLoginError(
            "Вкажіть номер заявки."
        );

        if (numberInput) {

            numberInput.focus();

        }

        return;

    }


    if (!accessCode) {

        showLoginError(
            "Вкажіть код доступу."
        );

        if (codeInput) {

            codeInput.focus();

        }

        return;

    }


    if (
        !GOOGLE_SCRIPT_URL
    ) {

        showLoginError(
            "Система кабінету не налаштована."
        );

        return;

    }


    /* =====================================================
       BUTTON
    ===================================================== */

    setLoginLoading(
        loginButton,
        true
    );


    showLoading();


    try {


        /* =================================================
           REQUEST
        ================================================= */

        const url =
            new URL(
                GOOGLE_SCRIPT_URL
            );


        url.searchParams.set(
            "action",
            "login"
        );


        url.searchParams.set(
            "number",
            number
        );


        url.searchParams.set(
            "accessCode",
            accessCode
        );


        const response =
            await fetch(
                url.toString(),
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const result =
            await response.json();


        console.log(
            "OLYMP Cabinet response:",
            result
        );


        if (
            !result ||
            result.success !== true ||
            !result.application
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Не вдалося виконати вхід."
            );

        }


        /* =================================================
           SAVE SESSION
        ================================================= */

        saveSession({

            number:
                result.application.number,

            accessCode:
                result.application.accessCode,

            application:
                result.application

        });


        /* =================================================
           SHOW CABINET
        ================================================= */

        renderCabinet(
            result.application
        );


        showToast(
            "Вхід успішний.",
            "success"
        );


    } catch (error) {

        console.error(
            "OLYMP Cabinet login error:",
            error
        );


        showLoginError(
            error.message ||
            "Не вдалося увійти до кабінету."
        );


    } finally {

        hideLoading();


        setLoginLoading(
            loginButton,
            false
        );

    }

}


/* =========================================================
   RESTORE SESSION
========================================================= */

async function restoreSession() {

    const session =
        getSession();


    if (!session) {

        showLoginSection();

        return;

    }


    if (
        !session.number ||
        !session.accessCode
    ) {

        clearSession();

        showLoginSection();

        return;

    }


    showLoading();


    try {

        const application =
            await getApplicationFromServer(

                session.number,

                session.accessCode

            );


        if (
            !application
        ) {

            clearSession();

            showLoginSection();

            return;

        }


        saveSession({

            number:
                application.number,

            accessCode:
                application.accessCode,

            application:
                application

        });


        renderCabinet(
            application
        );


    } catch (error) {

        console.error(
            "Session restore error:",
            error
        );


        /*
         * Если сервер временно недоступен,
         * используем сохранённые данные.
         */

        if (
            session.application
        ) {

            renderCabinet(
                session.application
            );

        } else {

            clearSession();

            showLoginSection();

        }

    } finally {

        hideLoading();

    }

}


/* =========================================================
   GET APPLICATION
========================================================= */

async function getApplicationFromServer(

    number,

    accessCode

) {


    const url =
        new URL(
            GOOGLE_SCRIPT_URL
        );


    url.searchParams.set(
        "action",
        "application"
    );


    url.searchParams.set(
        "number",
        number
    );


    url.searchParams.set(
        "accessCode",
        accessCode
    );


    const response =
        await fetch(
            url.toString(),
            {
                method: "GET",
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );

    }


    const result =
        await response.json();


    if (
        !result ||
        result.success !== true ||
        !result.application
    ) {

        throw new Error(
            result &&
            result.message
                ? result.message
                : "Заявку не знайдено."
        );

    }


    return result.application;

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
       APPLICATION
    ===================================================== */

    setText(
        "applicationNumber",
        application.number
            ? "№ " + application.number
            : "—"
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
        application.message
    );


    /* =====================================================
       STATUS
    ===================================================== */

    setStatus(
        application.status
    );


    /* =====================================================
       COMMENT / ANSWER
    ===================================================== */

    const comment =
        application.comment
            ? application.comment
            : "Відповідь ще не надана.";


    setText(
        "applicationComment",
        comment
    );


    /* =====================================================
       SHOW CABINET
    ===================================================== */

    showCabinetSection();


    /*
     * Прокручуємо сторінку вгору
     */

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   STATUS
========================================================= */

function setStatus(
    status
) {

    const element =
        document.getElementById(
            "applicationStatus"
        );


    if (!element) {

        return;

    }


    const currentStatus =
        status ||
        "🟡 На розгляді";


    element.textContent =
        currentStatus;


    element.className =
        "status-badge";


    if (
        currentStatus.includes(
            "На розгляді"
        )
    ) {

        element.classList.add(
            "status-pending"
        );

    }


    else if (
        currentStatus.includes(
            "Прийнято"
        )
    ) {

        element.classList.add(
            "status-accepted"
        );

    }


    else if (
        currentStatus.includes(
            "Виконано"
        )
    ) {

        element.classList.add(
            "status-completed"
        );

    }


    else if (
        currentStatus.includes(
            "Відхилено"
        )
    ) {

        element.classList.add(
            "status-rejected"
        );

    }


    else if (
        currentStatus.includes(
            "Закрито"
        )
    ) {

        element.classList.add(
            "status-closed"
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function initializeLogout() {

    const button =
        document.getElementById(
            "logoutButton"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        logout
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    clearSession();


    showLoginSection();


    const numberInput =
        document.getElementById(
            "loginNumber"
        );


    const codeInput =
        document.getElementById(
            "loginCode"
        );


    if (numberInput) {

        numberInput.value = "";

    }


    if (codeInput) {

        codeInput.value = "";

    }


    clearLoginError();


    showToast(
        "Ви вийшли з особистого кабінету.",
        "success"
    );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   SAVE SESSION
========================================================= */

function saveSession(
    session
) {

    try {

        localStorage.setItem(

            SESSION_KEY,

            JSON.stringify(
                session
            )

        );

    } catch (error) {

        console.warn(
            "Не вдалося зберегти сесію:",
            error
        );

    }

}


/* =========================================================
   GET SESSION
========================================================= */

function getSession() {

    try {

        const value =
            localStorage.getItem(
                SESSION_KEY
            );


        if (!value) {

            return null;

        }


        return JSON.parse(
            value
        );


    } catch (error) {

        console.warn(
            "Помилка читання сесії:",
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
            SESSION_KEY
        );

    } catch (error) {

        console.warn(
            "Помилка очищення сесії:",
            error
        );

    }

}


/* =========================================================
   COPY APPLICATION NUMBER
========================================================= */

function initializeCopyButton() {

    const button =
        document.getElementById(
            "copyNumberButton"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        copyApplicationNumber
    );

}


/* =========================================================
   COPY
========================================================= */

async function copyApplicationNumber() {

    const element =
        document.getElementById(
            "applicationNumber"
        );


    if (!element) {

        return;

    }


    let text =
        element.textContent
            .replace(
                "№",
                ""
            )
            .trim();


    if (!text) {

        return;

    }


    try {


        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {

            await navigator.clipboard.writeText(
                text
            );

        } else {

            const textarea =
                document.createElement(
                    "textarea"
                );


            textarea.value =
                text;


            textarea.style.position =
                "fixed";


            textarea.style.opacity =
                "0";


            document.body.appendChild(
                textarea
            );


            textarea.focus();


            textarea.select();


            document.execCommand(
                "copy"
            );


            textarea.remove();

        }


        showToast(
            "Номер заявки скопійовано.",
            "success"
        );


    } catch (error) {

        console.error(
            error
        );


        showToast(
            "Не вдалося скопіювати номер.",
            "error"
        );

    }

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLoginSection() {

    const login =
        document.getElementById(
            "loginSection"
        );


    const cabinet =
        document.getElementById(
            "cabinetSection"
        );


    if (login) {

        login.classList.remove(
            "hidden"
        );

    }


    if (cabinet) {

        cabinet.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   SHOW CABINET
========================================================= */

function showCabinetSection() {

    const login =
        document.getElementById(
            "loginSection"
        );


    const cabinet =
        document.getElementById(
            "cabinetSection"
        );


    if (login) {

        login.classList.add(
            "hidden"
        );

    }


    if (cabinet) {

        cabinet.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   TEXT
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

            ? String(value)

            : "—";


    element.textContent =
        text;

}


/* =========================================================
   LOGIN ERROR
========================================================= */

function showLoginError(
    message
) {

    const element =
        document.getElementById(
            "loginError"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.classList.add(
        "visible"
    );

}


/* =========================================================
   CLEAR LOGIN ERROR
========================================================= */

function clearLoginError() {

    const element =
        document.getElementById(
            "loginError"
        );


    if (!element) {

        return;

    }


    element.textContent =
        "";


    element.classList.remove(
        "visible"
    );

}


/* =========================================================
   LOGIN BUTTON
========================================================= */

function setLoginLoading(
    button,
    loading
) {

    if (!button) {

        return;

    }


    if (loading) {

        button.disabled =
            true;


        button.dataset.originalText =
            button.innerHTML;


        button.innerHTML =
            `
                <span class="button-loader"></span>
                Виконується вхід...
            `;

    } else {

        button.disabled =
            false;


        button.innerHTML =
            button.dataset.originalText ||
            "Увійти до кабінету";

    }

}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    const overlay =
        document.getElementById(
            "loadingOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.remove(
        "hidden"
    );

}


/* =========================================================
   HIDE LOADING
========================================================= */

function hideLoading() {

    const overlay =
        document.getElementById(
            "loadingOverlay"
        );


    if (!overlay) {

        return;

    }


    overlay.classList.add(
        "hidden"
    );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        return;

    }


    toast.textContent =
        message;


    toast.className =
        "toast";


    toast.classList.add(
        type
    );


    toast.classList.add(
        "visible"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "visible"
                );

            },
            3000
        );

}


/* =========================================================
   GLOBAL API
========================================================= */

window.logout =
    logout;


window.copyApplicationNumber =
    copyApplicationNumber;


window.getSession =
    getSession;


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "OLYMP Government Cabinet 4.0 запущено."
);
