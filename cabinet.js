/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET 4.0

   СИСТЕМА:

   • Вхід без реєстрації
   • Вхід за номером заявки
   • Вхід за кодом доступу
   • Перегляд персональної інформації
   • Перегляд заявки
   • Перегляд статусу
   • Перегляд відповідального
   • Перегляд відповіді державного органу
   • Збереження сесії
   • Вихід
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT
========================================================= */

const CABINET_API_URL =
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
    () => {

        initializeCabinet();

    }
);


/* =========================================================
   INITIALIZATION
========================================================= */

function initializeCabinet() {

    console.log(
        "OLYMP Government Cabinet 4.0 запущено."
    );


    initializeLoginForm();

    initializeLogout();

    initializeCopyButton();

    initializeHeader();

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


    /*
     * Автоматически переводим
     * код в верхний регистр.
     */

    const codeInput =
        document.getElementById(
            "loginCode"
        );


    if (codeInput) {

        codeInput.addEventListener(
            "input",
            () => {

                codeInput.value =
                    codeInput.value
                        .toUpperCase()
                        .replace(
                            /[^A-Z0-9]/g,
                            ""
                        );

            }
        );

    }


    /*
     * Номер заявки тоже
     * приводим к верхнему регистру.
     */

    const numberInput =
        document.getElementById(
            "loginNumber"
        );


    if (numberInput) {

        numberInput.addEventListener(
            "input",
            () => {

                numberInput.value =
                    numberInput.value
                        .toUpperCase();

            }
        );

    }

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


    /*
     * Проверка номера
     */

    if (!number) {

        showLoginError(
            "Вкажіть номер заявки."
        );


        focusElement(
            numberInput
        );


        return;

    }


    /*
     * Проверка формата номера
     */

    if (
        !/^OLYMP-\d{6}$/i.test(
            number
        )
    ) {

        showLoginError(
            "Номер заявки має формат OLYMP-000001."
        );


        focusElement(
            numberInput
        );


        return;

    }


    /*
     * Проверка кода
     */

    if (!accessCode) {

        showLoginError(
            "Вкажіть код доступу."
        );


        focusElement(
            codeInput
        );


        return;

    }


    if (
        accessCode.length !== 8
    ) {

        showLoginError(
            "Код доступу повинен містити 8 символів."
        );


        focusElement(
            codeInput
        );


        return;

    }


    /*
     * Состояние кнопки
     */

    setLoginLoading(
        loginButton,
        true
    );


    /*
     * Показываем загрузку
     */

    showLoading();


    try {

        /*
         * Формируем URL
         */

        const url =
            new URL(
                CABINET_API_URL
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


        /*
         * GET запрос
         */

        const response =
            await fetch(
                url.toString(),
                {
                    method: "GET"
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


        const result =
            await response.json();


        /*
         * Проверяем ответ
         */

        if (
            !result ||
            result.success !== true ||
            !result.application
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Невірний номер заявки або код доступу."
            );

        }


        /*
         * Сохраняем сессию
         */

        saveSession(
            result.application
        );


        /*
         * Показываем кабинет
         */

        renderCabinet(
            result.application
        );


    } catch (error) {

        console.error(
            "OLYMP Cabinet login error:",
            error
        );


        showLoginError(
            error.message ||
            "Не вдалося виконати вхід. Спробуйте ще раз."
        );


        hideLoading();


    } finally {

        setLoginLoading(
            loginButton,
            false
        );

    }

}


/* =========================================================
   SAVE SESSION
========================================================= */

function saveSession(
    application
) {

    if (!application) {

        return;

    }


    const session = {

        number:
            application.number || "",

        accessCode:
            application.accessCode || "",

        savedAt:
            Date.now()

    };


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
   RESTORE SESSION
========================================================= */

async function restoreSession() {

    let session = null;


    try {

        const raw =
            localStorage.getItem(
                SESSION_KEY
            );


        if (!raw) {

            return;

        }


        session =
            JSON.parse(
                raw
            );


    } catch (error) {

        clearSession();

        return;

    }


    if (
        !session ||
        !session.number ||
        !session.accessCode
    ) {

        clearSession();

        return;

    }


    /*
     * Проверяем срок сессии.
     *
     * 30 дней.
     */

    const SESSION_DURATION =
        30 *
        24 *
        60 *
        60 *
        1000;


    if (
        session.savedAt &&
        Date.now() -
        session.savedAt >
        SESSION_DURATION
    ) {

        clearSession();

        return;

    }


    /*
     * Автоматический вход
     */

    showLoading();


    try {

        const application =
            await fetchApplication(
                session.number,
                session.accessCode
            );


        if (!application) {

            clearSession();

            hideLoading();

            return;

        }


        renderCabinet(
            application
        );


    } catch (error) {

        console.warn(
            "Не вдалося відновити сесію:",
            error
        );


        /*
         * Если сервер временно
         * недоступен, возвращаем
         * пользователя на форму.
         */

        hideLoading();

    }

}


/* =========================================================
   FETCH APPLICATION
========================================================= */

async function fetchApplication(
    number,
    accessCode
) {

    const url =
        new URL(
            CABINET_API_URL
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
                method: "GET"
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


    const result =
        await response.json();


    if (
        !result ||
        result.success !== true ||
        !result.application
    ) {

        return null;

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


    /*
     * Заполняем профиль
     */

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


    /*
     * Заявка
     */

    setText(
        "applicationNumber",
        application.number
            ? "№ " +
              application.number
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
        application.responsible
            ? application.responsible
            : "Не призначено"
    );


    setText(
        "applicationMessage",
        application.message
    );


    /*
     * Статус
     */

    renderStatus(
        application.status
    );


    /*
     * Ответ государственного органа
     */

    const comment =
        application.comment
            ? application.comment
            : "Відповідь ще не надана.";


    setText(
        "governmentComment",
        comment
    );


    /*
     * Код доступа
     */

    setText(
        "accessCodeDisplay",
        application.accessCode
            ? application.accessCode
            : "—"
    );


    /*
     * Переключаем интерфейс
     */

    const loginSection =
        document.getElementById(
            "loginSection"
        );


    const cabinetSection =
        document.getElementById(
            "cabinetSection"
        );


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


    hideLoading();


    /*
     * Возвращаемся в начало
     */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   STATUS
========================================================= */

function renderStatus(
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


    /*
     * Удаляем старые классы
     */

    element.classList.remove(

        "status-review",

        "status-accepted",

        "status-completed",

        "status-rejected",

        "status-closed"

    );


    /*
     * Добавляем класс
     */

    switch (
        currentStatus
    ) {

        case "🟡 На розгляді":

            element.classList.add(
                "status-review"
            );

            break;


        case "🔵 Прийнято":

            element.classList.add(
                "status-accepted"
            );

            break;


        case "🟢 Виконано":

            element.classList.add(
                "status-completed"
            );

            break;


        case "🔴 Відхилено":

            element.classList.add(
                "status-rejected"
            );

            break;


        case "⚫ Закрито":

            element.classList.add(
                "status-closed"
            );

            break;

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


    /*
     * Очищаем данные кабинета
     */

    clearCabinetData();


    const cabinetSection =
        document.getElementById(
            "cabinetSection"
        );


    const loginSection =
        document.getElementById(
            "loginSection"
        );


    if (cabinetSection) {

        cabinetSection.classList.add(
            "hidden"
        );

    }


    if (loginSection) {

        loginSection.classList.remove(
            "hidden"
        );

    }


    /*
     * Очищаем форму
     */

    const form =
        document.getElementById(
            "loginForm"
        );


    if (form) {

        form.reset();

    }


    clearLoginError();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

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
            "Не вдалося очистити сесію:",
            error
        );

    }

}


/* =========================================================
   CLEAR CABINET DATA
========================================================= */

function clearCabinetData() {

    const ids = [

        "profileFullName",

        "profileBirthDate",

        "profilePhone",

        "profileEmail",

        "profileDiscord",

        "profileContact",

        "applicationNumber",

        "applicationDate",

        "applicationService",

        "applicationResponsible",

        "applicationMessage",

        "governmentComment",

        "accessCodeDisplay"

    ];


    ids.forEach(
        id => {

            setText(
                id,
                "—"
            );

        }
    );


    setText(
        "applicationStatus",
        "🟡 На розгляді"
    );

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
   COPY NUMBER
========================================================= */

async function copyApplicationNumber() {

    const element =
        document.getElementById(
            "applicationNumber"
        );


    if (!element) {

        return;

    }


    const number =
        element.textContent
            .replace(
                "№",
                ""
            )
            .trim();


    if (!number) {

        return;

    }


    try {

        await navigator.clipboard.writeText(
            number
        );


        const button =
            document.getElementById(
                "copyNumberButton"
            );


        if (button) {

            const oldText =
                button.textContent;


            button.textContent =
                "Скопійовано ✓";


            setTimeout(
                () => {

                    button.textContent =
                        oldText;

                },
                2000
            );

        }

    } catch (error) {

        console.warn(
            "Не вдалося скопіювати номер:",
            error
        );

    }

}


/* =========================================================
   LOGIN ERROR
========================================================= */

function showLoginError(
    message
) {

    const errorElement =
        document.getElementById(
            "loginError"
        );


    if (!errorElement) {

        return;

    }


    errorElement.textContent =
        message;


    errorElement.classList.add(
        "visible"
    );

}


/* =========================================================
   CLEAR LOGIN ERROR
========================================================= */

function clearLoginError() {

    const errorElement =
        document.getElementById(
            "loginError"
        );


    if (!errorElement) {

        return;

    }


    errorElement.textContent =
        "";


    errorElement.classList.remove(
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
                <span class="button-spinner"></span>
                Перевірка...
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

    const loading =
        document.getElementById(
            "cabinetLoading"
        );


    if (!loading) {

        return;

    }


    loading.classList.remove(
        "hidden"
    );

}


/* =========================================================
   HIDE LOADING
========================================================= */

function hideLoading() {

    const loading =
        document.getElementById(
            "cabinetLoading"
        );


    if (!loading) {

        return;

    }


    loading.classList.add(
        "hidden"
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


    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {

        element.textContent =
            "—";

        return;

    }


    element.textContent =
        String(value);

}


/* =========================================================
   FOCUS
========================================================= */

function focusElement(
    element
) {

    if (
        element &&
        typeof element.focus ===
        "function"
    ) {

        element.focus();

    }

}


/* =========================================================
   HEADER
========================================================= */

function initializeHeader() {

    const header =
        document.getElementById(
            "header"
        );


    if (!header) {

        return;

    }


    function updateHeader() {

        if (
            window.scrollY > 50
        ) {

            header.classList.add(
                "scrolled"
            );

        } else {

            header.classList.remove(
                "scrolled"
            );

        }

    }


    window.addEventListener(
        "scroll",
        updateHeader,
        {
            passive: true
        }
    );


    updateHeader();

}


/* =========================================================
   PUBLIC API
========================================================= */

window.logoutCabinet =
    logout;


window.fetchCabinetApplication =
    fetchApplication;


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "%cOLYMP Government",
    "font-weight:bold;font-size:18px;"
);


console.log(
    "Personal Cabinet 4.0 запущено."
);
