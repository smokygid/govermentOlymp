/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET 3.0
   ---------------------------------------------------------
   Система:

   • Вход по номеру заявки
   • Вход по коду доступа
   • Автоматическое восстановление сессии
   • Информация гражданина
   • Информация заявки
   • Статус заявки
   • Ответственный сотрудник
   • Комментарий государственного органа
   • Подробности заявки
   • Обновление заявки
   • Выход
   • Работа без регистрации
   • Совместимость с новым Google Apps Script 3.0
========================================================= */


/* =========================================================
   API
========================================================= */

const CABINET_API_URL =
    "https://script.google.com/macros/s/AKfycbyynbAxu6A_tU5nBEUum357BCY6o8D-3e44wEtR-AlyOtV5un8mNgpmkvU6dtrIy0RvfQ/exec";



/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY =
    "olymp_application_session";


/* =========================================================
   DOM — LOGIN
========================================================= */

const cabinetLogin =
    document.getElementById(
        "cabinetLogin"
    );

const loginForm =
    document.getElementById(
        "cabinetLoginForm"
    );

const loginNumber =
    document.getElementById(
        "cabinetIdNumber"
    );

const loginCode =
    document.getElementById(
        "cabinetPassword"
    );

const loginError =
    document.getElementById(
        "cabinetLoginError"
    );

const loginButton =
    document.getElementById(
        "cabinetLoginButton"
    );


/* =========================================================
   DOM — DASHBOARD
========================================================= */

const cabinetDashboard =
    document.getElementById(
        "cabinetDashboard"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const refreshApplications =
    document.getElementById(
        "refreshApplications"
    );

const cabinetLoading =
    document.getElementById(
        "cabinetLoading"
    );


/* =========================================================
   DOM — PROFILE
========================================================= */

const profileName =
    document.getElementById(
        "profileName"
    );

const profileId =
    document.getElementById(
        "profileId"
    );

const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );


/* =========================================================
   DOM — APPLICATIONS
========================================================= */

const applicationsList =
    document.getElementById(
        "applicationsList"
    );

const applicationsEmpty =
    document.getElementById(
        "applicationsEmpty"
    );


/* =========================================================
   DOM — STATISTICS
========================================================= */

const totalApplications =
    document.getElementById(
        "totalApplications"
    );

const pendingApplications =
    document.getElementById(
        "pendingApplications"
    );

const approvedApplications =
    document.getElementById(
        "approvedApplications"
    );

const rejectedApplications =
    document.getElementById(
        "rejectedApplications"
    );


/* =========================================================
   DOM — MODAL
========================================================= */

const applicationModal =
    document.getElementById(
        "cabinetApplicationModal"
    );

const closeModal =
    document.getElementById(
        "closeCabinetApplicationModal"
    );

const closeModalButton =
    document.getElementById(
        "closeCabinetApplicationModalButton"
    );

const detailsTitle =
    document.getElementById(
        "detailsTitle"
    );

const detailsContent =
    document.getElementById(
        "detailsContent"
    );


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initEvents();

        prepareLoginForm();

        restoreSession();

    }
);


/* =========================================================
   EVENTS
========================================================= */

function initEvents() {


    /* =====================================================
       LOGIN
    ===================================================== */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }


    /* =====================================================
       REFRESH
    ===================================================== */

    if (refreshApplications) {

        refreshApplications.addEventListener(
            "click",
            function () {

                const session =
                    getSavedSession();


                if (
                    session &&
                    session.number &&
                    session.accessCode
                ) {

                    loadApplication(
                        session.number,
                        session.accessCode
                    );

                }

            }
        );

    }


    /* =====================================================
       MODAL
    ===================================================== */

    if (closeModal) {

        closeModal.addEventListener(
            "click",
            closeApplicationModal
        );

    }


    if (closeModalButton) {

        closeModalButton.addEventListener(
            "click",
            closeApplicationModal
        );

    }


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


    /* =====================================================
       ESC
    ===================================================== */

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
   PREPARE LOGIN
========================================================= */

function prepareLoginForm() {

    if (loginNumber) {

        loginNumber.placeholder =
            "OLYMP-000001";

        loginNumber.autocomplete =
            "username";

    }


    if (loginCode) {

        loginCode.placeholder =
            "Введіть код доступу";

        loginCode.type =
            "text";

        loginCode.autocomplete =
            "current-password";

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(
    event
) {

    event.preventDefault();


    hideLoginError();


    const number =
        String(
            loginNumber?.value || ""
        )
        .trim()
        .toUpperCase();


    const accessCode =
        String(
            loginCode?.value || ""
        )
        .trim()
        .toUpperCase();


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!number) {

        showLoginError(
            "Вкажіть номер заявки."
        );

        if (loginNumber) {

            loginNumber.focus();

        }

        return;

    }


    if (!accessCode) {

        showLoginError(
            "Вкажіть код доступу."
        );

        if (loginCode) {

            loginCode.focus();

        }

        return;

    }


    setLoginLoading(
        true
    );


    try {


        const response =
            await postRequest({

                action:
                    "login",

                number:
                    number,

                accessCode:
                    accessCode

            });


        /* =================================================
           ERROR
        ================================================= */

        if (
            !response ||
            !response.success
        ) {

            showLoginError(

                response?.message ||

                "Невірний номер заявки або код доступу."

            );

            return;

        }


        /* =================================================
           APPLICATION
        ================================================= */

        if (
            !response.application
        ) {

            showLoginError(
                "Сервер не повернув дані заявки."
            );

            return;

        }


        /* =================================================
           SAVE SESSION
        ================================================= */

        saveSession({

            number:
                number,

            accessCode:
                accessCode,

            application:
                response.application

        });


        /* =================================================
           SHOW DASHBOARD
        ================================================= */

        showDashboard();


        /* =================================================
           RENDER
        ================================================= */

        renderApplication(
            response.application
        );


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        showLoginError(

            "Не вдалося підключитися до державного порталу."

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

function restoreSession() {

    const session =
        getSavedSession();


    if (
        !session ||
        !session.number ||
        !session.accessCode
    ) {

        showLogin();

        return;

    }


    showDashboard();


    loadApplication(

        session.number,

        session.accessCode

    );

}


/* =========================================================
   LOAD APPLICATION
========================================================= */

async function loadApplication(

    number,

    accessCode

) {

    if (
        !number ||
        !accessCode
    ) {

        return;

    }


    showLoading(
        true
    );


    try {


        const response =
            await getRequest({

                action:
                    "application",

                number:
                    number,

                accessCode:
                    accessCode

            });


        if (
            !response ||
            !response.success ||
            !response.application
        ) {


            /* =============================================
               СЕССИЯ НЕДЕЙСТВИТЕЛЬНА
            ============================================= */

            removeSession();

            showLogin();


            showLoginError(

                response?.message ||

                "Заявку не знайдено."

            );


            return;

        }


        /* =================================================
           SAVE UPDATED SESSION
        ================================================= */

        saveSession({

            number:
                number,

            accessCode:
                accessCode,

            application:
                response.application

        });


        /* =================================================
           RENDER
        ================================================= */

        renderApplication(
            response.application
        );


    } catch (error) {

        console.error(
            "CABINET LOAD ERROR:",
            error
        );


        showCabinetError(

            "Не вдалося завантажити актуальні дані. Спробуйте оновити сторінку."

        );


    } finally {

        showLoading(
            false
        );

    }

}


/* =========================================================
   RENDER APPLICATION
========================================================= */

function renderApplication(
    application
) {

    if (!application) {

        return;

    }


    /* =====================================================
       PROFILE
    ===================================================== */

    renderProfile(
        application
    );


    /* =====================================================
       APPLICATION
    ===================================================== */

    renderApplications([

        application

    ]);

}


/* =========================================================
   PROFILE
========================================================= */

function renderProfile(
    application
) {

    if (!application) {

        return;

    }


    if (profileName) {

        profileName.textContent =
            application.fullName ||
            "Громадянин";

    }


    if (profileId) {

        profileId.textContent =
            application.number ||
            "—";

    }


    if (profileAvatar) {

        profileAvatar.textContent =
            getInitials(
                application.fullName
            );

    }

}


/* =========================================================
   APPLICATIONS
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


    updateStatistics(
        applications
    );


    if (applicationsList) {

        applicationsList.innerHTML =
            "";

    }


    /* =====================================================
       EMPTY
    ===================================================== */

    if (
        applications.length === 0
    ) {

        if (applicationsEmpty) {

            applicationsEmpty.classList.add(
                "visible"
            );


            const title =
                applicationsEmpty.querySelector(
                    "h3"
                );


            const text =
                applicationsEmpty.querySelector(
                    "p"
                );


            if (title) {

                title.textContent =
                    "Заявку не знайдено";

            }


            if (text) {

                text.textContent =
                    "Перевірте номер заявки та код доступу.";

            }

        }


        return;

    }


    if (applicationsEmpty) {

        applicationsEmpty.classList.remove(
            "visible"
        );

    }


    applications.forEach(

        function (application) {

            if (applicationsList) {

                applicationsList.appendChild(

                    createApplicationCard(
                        application
                    )

                );

            }

        }

    );

}


/* =========================================================
   APPLICATION CARD
========================================================= */

function createApplicationCard(
    application
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "application-card";


    /* =====================================================
       TOP
    ===================================================== */

    const top =
        document.createElement(
            "div"
        );


    top.className =
        "application-card-top";


    const left =
        document.createElement(
            "div"
        );


    const number =
        document.createElement(
            "span"
        );


    number.className =
        "application-number";


    number.textContent =
        application.number ||
        "Без номера";


    const title =
        document.createElement(
            "h3"
        );


    title.className =
        "application-title";


    title.textContent =
        application.service ||
        "Державна послуга";


    left.appendChild(
        number
    );


    left.appendChild(
        title
    );


    /* =====================================================
       STATUS
    ===================================================== */

    const status =
        document.createElement(
            "span"
        );


    status.className =

        "application-status-badge " +

        getStatusClass(

            application.status

        );


    status.textContent =

        application.status ||

        "🟡 На розгляді";


    top.appendChild(
        left
    );


    top.appendChild(
        status
    );


    card.appendChild(
        top
    );


    /* =====================================================
       INFO
    ===================================================== */

    const info =
        document.createElement(
            "div"
        );


    info.className =
        "application-info";


    info.appendChild(

        createInfoItem(

            "Дата подання",

            application.date

        )

    );


    info.appendChild(

        createInfoItem(

            "Номер заявки",

            application.number

        )

    );


    info.appendChild(

        createInfoItem(

            "Відповідальний",

            application.responsible ||

            "Ще не призначено"

        )

    );


    card.appendChild(
        info
    );


    /* =====================================================
       DESCRIPTION
    ===================================================== */

    const description =
        document.createElement(
            "div"
        );


    description.className =
        "application-description";


    const descriptionTitle =
        document.createElement(
            "strong"
        );


    descriptionTitle.textContent =
        "Опис звернення";


    const descriptionText =
        document.createElement(
            "p"
        );


    descriptionText.textContent =

        application.message ||

        "Опис відсутній.";


    description.appendChild(
        descriptionTitle
    );


    description.appendChild(
        descriptionText
    );


    card.appendChild(
        description
    );


    /* =====================================================
       COMMENT
    ===================================================== */

    if (
        application.comment
    ) {


        const comment =
            document.createElement(
                "div"
            );


        comment.className =
            "application-comment";


        const commentTitle =
            document.createElement(
                "strong"
            );


        commentTitle.textContent =
            "Коментар державного органу";


        const commentText =
            document.createElement(
                "p"
            );


        commentText.textContent =

            application.comment;


        comment.appendChild(
            commentTitle
        );


        comment.appendChild(
            commentText
        );


        card.appendChild(
            comment
        );

    }


    /* =====================================================
       DETAILS
    ===================================================== */

    const actions =
        document.createElement(
            "div"
        );


    actions.style.marginTop =
        "18px";


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "btn btn-light";


    button.textContent =
        "Детальніше";


    button.addEventListener(

        "click",

        function () {

            openApplicationDetails(
                application
            );

        }

    );


    actions.appendChild(
        button
    );


    card.appendChild(
        actions
    );


    return card;

}


/* =========================================================
   INFO ITEM
========================================================= */

function createInfoItem(

    label,

    value

) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "application-info-item";


    const span =
        document.createElement(
            "span"
        );


    span.textContent =
        label;


    const strong =
        document.createElement(
            "strong"
        );


    strong.textContent =
        value ||
        "—";


    item.appendChild(
        span
    );


    item.appendChild(
        strong
    );


    return item;

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics(
    applications
) {

    let pending =
        0;

    let approved =
        0;

    let rejected =
        0;


    applications.forEach(

        function (application) {

            const status =

                String(

                    application.status ||

                    ""

                )

                .toLowerCase()

                .trim();


            /* =============================================
               PENDING
            ============================================= */

            if (

                status.includes(
                    "розгляді"
                ) ||

                status.includes(
                    "очіку"
                ) ||

                status.includes(
                    "нов"
                ) ||

                status.includes(
                    "pending"
                )

            ) {

                pending++;

            }


            /* =============================================
               APPROVED
            ============================================= */

            if (

                status.includes(
                    "прийнято"
                ) ||

                status.includes(
                    "схвалено"
                ) ||

                status.includes(
                    "затверджено"
                ) ||

                status.includes(
                    "approved"
                )

            ) {

                approved++;

            }


            /* =============================================
               REJECTED
            ============================================= */

            if (

                status.includes(
                    "відхилено"
                ) ||

                status.includes(
                    "відмовлено"
                ) ||

                status.includes(
                    "rejected"
                )

            ) {

                rejected++;

            }

        }

    );


    if (totalApplications) {

        totalApplications.textContent =
            applications.length;

    }


    if (pendingApplications) {

        pendingApplications.textContent =
            pending;

    }


    if (approvedApplications) {

        approvedApplications.textContent =
            approved;

    }


    if (rejectedApplications) {

        rejectedApplications.textContent =
            rejected;

    }

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

        )

        .toLowerCase()

        .trim();


    if (

        value.includes(
            "розгляді"
        ) ||

        value.includes(
            "очіку"
        ) ||

        value.includes(
            "нов"
        ) ||

        value.includes(
            "pending"
        )

    ) {

        return "status-pending";

    }


    if (

        value.includes(
            "прийнято"
        ) ||

        value.includes(
            "схвалено"
        ) ||

        value.includes(
            "затверджено"
        ) ||

        value.includes(
            "approved"
        )

    ) {

        return "status-approved";

    }


    if (

        value.includes(
            "виконано"
        ) ||

        value.includes(
            "завершено"
        ) ||

        value.includes(
            "completed"
        )

    ) {

        return "status-completed";

    }


    if (

        value.includes(
            "відхилено"
        ) ||

        value.includes(
            "відмовлено"
        ) ||

        value.includes(
            "rejected"
        )

    ) {

        return "status-rejected";

    }


    if (

        value.includes(
            "документ"
        ) ||

        value.includes(
            "documents"
        )

    ) {

        return "status-documents";

    }


    return "status-review";

}


/* =========================================================
   APPLICATION DETAILS
========================================================= */

function openApplicationDetails(
    application
) {

    if (!applicationModal) {

        return;

    }


    if (detailsTitle) {

        detailsTitle.textContent =

            application.service ||

            "Заявка";

    }


    if (detailsContent) {

        detailsContent.innerHTML =
            "";


        detailsContent.appendChild(

            createDetail(

                "Номер заявки",

                application.number

            )

        );


        detailsContent.appendChild(

            createDetail(

                "Код доступу",

                application.accessCode

            )

        );


        detailsContent.appendChild(

            createDetail(

                "Дата подання",

                application.date

            )

        );


        detailsContent.appendChild(

            createDetail(

                "ПІБ",

                application.fullName

            )

        );


        detailsContent.appendChild(

            createDetail(

                "Дата народження",

                application.birthDate

            )

        );


        detailsContent.appendChild(

            createDetail(

                "Телефон",

                application.phone

            )

        );


        detailsContent.appendChild(

            createDetail(

                "Email",

                application.email

            )

        );


        detailsContent.appendChild(

            createDetail(

                "Discord",

                application.discord

            )

        );


        detailsContent.appendChild(

            createDetail(

                "Послуга",

                application.service

            )

        );


        detailsContent.appendChild(

            createDetail(

                "Контакт",

                application.contact

            )

        );


        detailsContent.appendChild(

            createDetail(

                "Статус",

                application.status

            )

        );


        detailsContent.appendChild(

            createDetail(

                "Відповідальний",

                application.responsible ||

                "Не призначено"

            )

        );


        detailsContent.appendChild(

            createDetail(

                "Опис звернення",

                application.message

            )

        );


        detailsContent.appendChild(

            createDetail(

                "Коментар державного органу",

                application.comment ||

                "Коментар відсутній."

            )

        );

    }


    applicationModal.setAttribute(

        "aria-hidden",

        "false"

    );


    applicationModal.classList.add(
        "active"
    );

}


/* =========================================================
   DETAIL
========================================================= */

function createDetail(

    label,

    value

) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.style.marginBottom =
        "15px";


    const title =
        document.createElement(
            "strong"
        );


    title.textContent =
        label;


    title.style.display =
        "block";


    title.style.marginBottom =
        "5px";


    const text =
        document.createElement(
            "div"
        );


    text.textContent =
        value ||
        "—";


    text.style.color =
        "#59656e";


    text.style.lineHeight =
        "1.6";


    wrapper.appendChild(
        title
    );


    wrapper.appendChild(
        text
    );


    return wrapper;

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeApplicationModal() {

    if (!applicationModal) {

        return;

    }


    applicationModal.classList.remove(
        "active"
    );


    applicationModal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   STORAGE
========================================================= */

function saveSession(
    session
) {

    if (!session) {

        return;

    }


    try {

        const safeSession = {

            number:
                session.number ||
                "",

            accessCode:
                session.accessCode ||
                "",

            application:
                session.application ||
                null

        };


        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(
                safeSession
            )

        );


    } catch (error) {

        console.error(

            "SESSION SAVE ERROR:",

            error

        );

    }

}


/* =========================================================
   GET SESSION
========================================================= */

function getSavedSession() {

    try {

        const data =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!data) {

            return null;

        }


        const session =
            JSON.parse(
                data
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

            "SESSION READ ERROR:",

            error

        );


        removeSession();


        return null;

    }

}


/* =========================================================
   REMOVE SESSION
========================================================= */

function removeSession() {

    try {

        localStorage.removeItem(
            STORAGE_KEY
        );

    } catch (error) {

        console.error(
            "SESSION REMOVE ERROR:",
            error
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {


    removeSession();


    /* =====================================================
       DASHBOARD
    ===================================================== */

    if (cabinetDashboard) {

        cabinetDashboard.classList.remove(
            "active"
        );

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    if (cabinetLogin) {

        cabinetLogin.style.display =
            "block";

    }


    /* =====================================================
       CLEAR FORM
    ===================================================== */

    if (loginNumber) {

        loginNumber.value =
            "";

    }


    if (loginCode) {

        loginCode.value =
            "";

    }


    /* =====================================================
       CLEAR APPLICATION
    ===================================================== */

    if (applicationsList) {

        applicationsList.innerHTML =
            "";

    }


    if (applicationsEmpty) {

        applicationsEmpty.classList.remove(
            "visible"
        );

    }


    updateStatistics([]);


    hideLoginError();


    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"

    });

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {


    if (cabinetDashboard) {

        cabinetDashboard.classList.remove(
            "active"
        );

    }


    if (cabinetLogin) {

        cabinetLogin.style.display =
            "block";

    }


    hideLoginError();

}


/* =========================================================
   SHOW DASHBOARD
========================================================= */

function showDashboard() {


    if (cabinetLogin) {

        cabinetLogin.style.display =
            "none";

    }


    if (cabinetDashboard) {

        cabinetDashboard.classList.add(
            "active"
        );

    }

}


/* =========================================================
   LOADING
========================================================= */

function showLoading(
    visible
) {

    if (!cabinetLoading) {

        return;

    }


    if (visible) {

        cabinetLoading.classList.add(
            "visible"
        );

    } else {

        cabinetLoading.classList.remove(
            "visible"
        );

    }

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


    loginButton.textContent =

        loading

            ? "Вхід..."

            : "Увійти до кабінету";

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


function hideLoginError() {

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
   CABINET ERROR
========================================================= */

function showCabinetError(
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
   INITIALS
========================================================= */

function getInitials(
    fullName
) {

    const words =

        String(

            fullName ||

            "O"

        )

        .trim()

        .split(/\s+/)

        .filter(Boolean);


    if (
        words.length === 0
    ) {

        return "O";

    }


    if (
        words.length === 1
    ) {

        return words[0]

            .substring(

                0,

                1

            )

            .toUpperCase();

    }


    return (

        words[0]

            .substring(

                0,

                1

            ) +

        words[1]

            .substring(

                0,

                1

            )

    ).toUpperCase();

}


/* =========================================================
   GET REQUEST
========================================================= */

async function getRequest(
    params
) {


    if (

        !CABINET_API_URL ||

        CABINET_API_URL.includes(
            "ВСТАВЬ"
        )

    ) {

        throw new Error(
            "CABINET_API_URL не налаштований."
        );

    }


    const query =
        new URLSearchParams();


    Object.keys(
        params || {}
    ).forEach(

        function (key) {

            query.append(

                key,

                params[key] ?? ""

            );

        }

    );


    const separator =

        CABINET_API_URL.includes("?")

            ? "&"

            : "?";


    const url =

        CABINET_API_URL +

        separator +

        query.toString();


    const response =
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


    if (!response.ok) {

        throw new Error(

            "HTTP " +

            response.status

        );

    }


    const text =
        await response.text();


    try {

        return JSON.parse(
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

}


/* =========================================================
   POST REQUEST
========================================================= */

async function postRequest(
    params
) {


    if (

        !CABINET_API_URL ||

        CABINET_API_URL.includes(
            "ВСТАВЬ"
        )

    ) {

        throw new Error(

            "CABINET_API_URL не налаштований."

        );

    }


    const body =
        new URLSearchParams();


    Object.keys(
        params || {}
    ).forEach(

        function (key) {

            body.append(

                key,

                params[key] ?? ""

            );

        }

    );


    const response =
        await fetch(

            CABINET_API_URL,

            {

                method:
                    "POST",

                headers: {

                    "Content-Type":

                        "application/x-www-form-urlencoded;charset=UTF-8"

                },

                body:
                    body.toString(),

                redirect:
                    "follow"

            }

        );


    if (!response.ok) {

        throw new Error(

            "HTTP " +

            response.status

        );

    }


    const text =
        await response.text();


    try {

        return JSON.parse(
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

}
