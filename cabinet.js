/* =========================================================
   OLYMP STATE GOVERNMENT
   PERSONAL CABINET 3.0
   ---------------------------------------------------------
   Функции:

   • Регистрация гражданина
   • Вход по номеру удостоверения + паролю
   • Автоматическое восстановление сессии
   • Профиль гражданина
   • Заявки гражданина
   • Статистика заявок
   • Просмотр подробностей заявки
   • Выход
   • Обновление заявок
   • Кабинет работает даже при 0 заявок
========================================================= */


/* =========================================================
   API
========================================================= */

const CABINET_API_URL =
    "ВСТАВЬ_СЮДА_URL_ТВОЕГО_GOOGLE_APPS_SCRIPT";


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY =
    "olymp_citizen";


/* =========================================================
   DOM — LOGIN
========================================================= */

const loginForm =
    document.getElementById(
        "cabinetLoginForm"
    );

const loginId =
    document.getElementById(
        "cabinetIdNumber"
    );

const loginPassword =
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

const cabinetLogin =
    document.getElementById(
        "cabinetLogin"
    );


/* =========================================================
   DOM — REGISTRATION
========================================================= */

const cabinetRegister =
    document.getElementById(
        "cabinetRegister"
    );

const registerForm =
    document.getElementById(
        "cabinetRegisterForm"
    );

const registerFullName =
    document.getElementById(
        "registerFullName"
    );

const registerBirthDate =
    document.getElementById(
        "registerBirthDate"
    );

const registerPhone =
    document.getElementById(
        "registerPhone"
    );

const registerDiscord =
    document.getElementById(
        "registerDiscord"
    );

const registerPassword =
    document.getElementById(
        "registerPassword"
    );

const registerPasswordRepeat =
    document.getElementById(
        "registerPasswordRepeat"
    );

const registerButton =
    document.getElementById(
        "registerButton"
    );

const registerError =
    document.getElementById(
        "cabinetRegisterError"
    );

const openRegistrationButton =
    document.getElementById(
        "openRegistrationButton"
    );

const backToLoginButton =
    document.getElementById(
        "backToLoginButton"
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

const applicationsList =
    document.getElementById(
        "applicationsList"
    );

const applicationsEmpty =
    document.getElementById(
        "applicationsEmpty"
    );

const cabinetLoading =
    document.getElementById(
        "cabinetLoading"
    );

const refreshApplications =
    document.getElementById(
        "refreshApplications"
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

        restoreSession();

    }
);


/* =========================================================
   EVENTS
========================================================= */

function initEvents() {


    /* =========================
       LOGIN
    ========================= */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    /* =========================
       REGISTRATION
    ========================= */

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            handleRegistration
        );

    }


    /* =========================
       OPEN REGISTRATION
    ========================= */

    if (openRegistrationButton) {

        openRegistrationButton.addEventListener(
            "click",
            function () {

                showRegistration();

            }
        );

    }


    /* =========================
       BACK TO LOGIN
    ========================= */

    if (backToLoginButton) {

        backToLoginButton.addEventListener(
            "click",
            function () {

                showLogin();

            }
        );

    }


    /* =========================
       LOGOUT
    ========================= */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }


    /* =========================
       REFRESH
    ========================= */

    if (refreshApplications) {

        refreshApplications.addEventListener(
            "click",
            function () {

                const citizen =
                    getSavedCitizen();


                if (
                    citizen &&
                    citizen.idNumber
                ) {

                    loadCabinet(
                        citizen.idNumber
                    );

                }

            }
        );

    }


    /* =========================
       MODAL CLOSE
    ========================= */

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


    /* =========================
       ESC
    ========================= */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeApplicationModal();

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


    hideError();


    const idNumber =
        String(
            loginId?.value || ""
        )
        .trim()
        .toUpperCase();


    const password =
        String(
            loginPassword?.value || ""
        );


    /* =========================
       VALIDATION
    ========================= */

    if (!idNumber) {

        showError(
            "Вкажіть номер посвідчення."
        );

        return;

    }


    if (!password) {

        showError(
            "Вкажіть пароль."
        );

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

                idNumber:
                    idNumber,

                password:
                    password

            });


        if (
            !response ||
            !response.success
        ) {

            showError(
                response?.message ||
                "Невірний номер посвідчення або пароль."
            );

            return;

        }


        /* =========================
           SAVE CITIZEN
        ========================= */

        if (
            response.citizen
        ) {

            saveCitizen(
                response.citizen
            );

        }


        /* =========================
           SHOW CABINET
        ========================= */

        showDashboard();


        await loadCabinet(
            response.citizen.idNumber
        );


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        showError(
            "Не вдалося підключитися до державного порталу."
        );


    } finally {

        setLoginLoading(
            false
        );

    }

}


/* =========================================================
   REGISTRATION
========================================================= */

async function handleRegistration(
    event
) {

    event.preventDefault();


    hideRegisterError();


    const fullName =
        String(
            registerFullName?.value || ""
        )
        .trim();


    const birthDate =
        String(
            registerBirthDate?.value || ""
        )
        .trim();


    const phone =
        String(
            registerPhone?.value || ""
        )
        .trim();


    const discord =
        String(
            registerDiscord?.value || ""
        )
        .trim();


    const password =
        String(
            registerPassword?.value || ""
        );


    const passwordRepeat =
        String(
            registerPasswordRepeat?.value || ""
        );


    /* =========================
       VALIDATION
    ========================= */

    if (!fullName) {

        showRegisterError(
            "Вкажіть ПІБ."
        );

        return;

    }


    if (
        fullName.length < 5
    ) {

        showRegisterError(
            "ПІБ вказано некоректно."
        );

        return;

    }


    if (!birthDate) {

        showRegisterError(
            "Вкажіть дату народження."
        );

        return;

    }


    if (!phone) {

        showRegisterError(
            "Вкажіть номер телефону."
        );

        return;

    }


    if (!discord) {

        showRegisterError(
            "Вкажіть Discord."
        );

        return;

    }


    if (!password) {

        showRegisterError(
            "Вкажіть пароль."
        );

        return;

    }


    if (
        password.length < 6
    ) {

        showRegisterError(
            "Пароль повинен містити мінімум 6 символів."
        );

        return;

    }


    if (
        password !==
        passwordRepeat
    ) {

        showRegisterError(
            "Паролі не співпадають."
        );

        return;

    }


    setRegisterLoading(
        true
    );


    try {

        const response =
            await postRequest({

                action:
                    "register",

                fullName:
                    fullName,

                birthDate:
                    birthDate,

                phone:
                    phone,

                discord:
                    discord,

                password:
                    password

            });


        if (
            !response ||
            !response.success
        ) {

            showRegisterError(
                response?.message ||
                "Не вдалося створити профіль."
            );

            return;

        }


        /* =========================
           REGISTRATION SUCCESS
        ========================= */

        if (
            response.citizen
        ) {

            saveCitizen(
                response.citizen
            );

        }


        /* =========================
           CLEAR FORM
        ========================= */

        if (registerForm) {

            registerForm.reset();

        }


        /* =========================
           SHOW CABINET
        ========================= */

        showDashboard();


        if (
            response.citizen &&
            response.citizen.idNumber
        ) {

            await loadCabinet(
                response.citizen.idNumber
            );

        }


        /* =========================
           SUCCESS MESSAGE
        ========================= */

        if (
            response.citizen &&
            response.citizen.idNumber
        ) {

            alert(
                "Профіль успішно створено!\n\n" +
                "Ваш номер посвідчення:\n" +
                response.citizen.idNumber
            );

        }


    } catch (error) {

        console.error(
            "REGISTRATION ERROR:",
            error
        );


        showRegisterError(
            "Не вдалося підключитися до державного порталу."
        );


    } finally {

        setRegisterLoading(
            false
        );

    }

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

    if (cabinetRegister) {

        cabinetRegister.style.display =
            "none";

    }


    if (cabinetLogin) {

        cabinetLogin.style.display =
            "block";

    }


    hideRegisterError();

    hideError();


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   SHOW REGISTRATION
========================================================= */

function showRegistration() {

    if (cabinetLogin) {

        cabinetLogin.style.display =
            "none";

    }


    if (cabinetRegister) {

        cabinetRegister.style.display =
            "block";

    }


    hideError();

    hideRegisterError();


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   RESTORE SESSION
========================================================= */

function restoreSession() {

    const citizen =
        getSavedCitizen();


    if (
        !citizen ||
        !citizen.idNumber
    ) {

        return;

    }


    showDashboard();


    loadCabinet(
        citizen.idNumber
    );

}


/* =========================================================
   LOAD CABINET
========================================================= */

async function loadCabinet(
    idNumber
) {

    if (!idNumber) {

        return;

    }


    showLoading(
        true
    );


    try {

        const response =
            await getRequest({

                action:
                    "profile",

                idNumber:
                    idNumber

            });


        if (
            !response ||
            !response.success
        ) {

            localStorage.removeItem(
                STORAGE_KEY
            );


            showLogin();


            showError(
                response?.message ||
                "Профіль не знайдено."
            );


            return;

        }


        /* =========================
           SAVE UPDATED CITIZEN
        ========================= */

        if (
            response.citizen
        ) {

            saveCitizen(
                response.citizen
            );

        }


        /* =========================
           PROFILE
        ========================= */

        renderProfile(
            response.citizen
        );


        /* =========================
           APPLICATIONS
        ========================= */

        renderApplications(
            response.applications || []
        );


    } catch (error) {

        console.error(
            "CABINET LOAD ERROR:",
            error
        );


        showError(
            "Не вдалося завантажити особистий кабінет."
        );


    } finally {

        showLoading(
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

    if (!citizen) {

        return;

    }


    if (profileName) {

        profileName.textContent =
            citizen.fullName ||
            "Громадянин";

    }


    if (profileId) {

        profileId.textContent =
            citizen.idNumber ||
            "—";

    }


    if (profileAvatar) {

        profileAvatar.textContent =
            getInitials(
                citizen.fullName
            );

    }

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


    updateStatistics(
        applications
    );


    if (applicationsList) {

        applicationsList.innerHTML =
            "";

    }


    /* =====================================================
       ZERO APPLICATIONS
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
                    "У вас поки що немає заявок";

            }


            if (text) {

                text.textContent =
                    "Ваш особистий кабінет активний. Ви можете подати заявку через розділ «Державні послуги».";

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
   CREATE APPLICATION CARD
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
            "Дата",
            application.date
        )

    );


    info.appendChild(

        createInfoItem(
            "Посвідчення",
            application.idNumber
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
       DETAILS BUTTON
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

    let pending = 0;

    let approved = 0;

    let rejected = 0;


    applications.forEach(
        function (application) {

            const status =
                String(
                    application.status ||
                    ""
                )
                .toLowerCase();


            /* =========================
               PENDING
            ========================= */

            if (

                status.includes(
                    "розгляді"
                ) ||

                status.includes(
                    "очіку"
                ) ||

                status.includes(
                    "нов"
                )

            ) {

                pending++;

            }


            /* =========================
               APPROVED
            ========================= */

            if (

                status.includes(
                    "прийнято"
                ) ||

                status.includes(
                    "схвалено"
                ) ||

                status.includes(
                    "виконано"
                )

            ) {

                approved++;

            }


            /* =========================
               REJECTED
            ========================= */

            if (

                status.includes(
                    "відхилено"
                ) ||

                status.includes(
                    "відмовлено"
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
            status || ""
        )
        .toLowerCase();


    if (

        value.includes(
            "розгляді"
        ) ||

        value.includes(
            "очіку"
        ) ||

        value.includes(
            "нов"
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
        ) ||

        value.includes(
            "відмовлено"
        )

    ) {

        return "status-rejected";

    }


    if (
        value.includes(
            "закрито"
        )
    ) {

        return "status-review";

    }


    if (
        value.includes(
            "документ"
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
                "Посвідчення",
                application.idNumber
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
                "Коментар",
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

function saveCitizen(
    citizen
) {

    if (!citizen) {

        return;

    }


    try {

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(
                citizen
            )

        );

    } catch (error) {

        console.error(
            "STORAGE ERROR:",
            error
        );

    }

}


function getSavedCitizen() {

    try {

        const data =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!data) {

            return null;

        }


        return JSON.parse(
            data
        );


    } catch (error) {

        console.error(
            "STORAGE READ ERROR:",
            error
        );


        return null;

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    localStorage.removeItem(
        STORAGE_KEY
    );


    if (cabinetDashboard) {

        cabinetDashboard.classList.remove(
            "active"
        );

    }


    if (cabinetLogin) {

        cabinetLogin.style.display =
            "block";

    }


    if (cabinetRegister) {

        cabinetRegister.style.display =
            "none";

    }


    if (loginId) {

        loginId.value =
            "";

    }


    if (loginPassword) {

        loginPassword.value =
            "";

    }


    hideError();

    hideRegisterError();


    if (applicationsList) {

        applicationsList.innerHTML =
            "";

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   SHOW DASHBOARD
========================================================= */

function showDashboard() {

    if (cabinetLogin) {

        cabinetLogin.style.display =
            "none";

    }


    if (cabinetRegister) {

        cabinetRegister.style.display =
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
   REGISTRATION LOADING
========================================================= */

function setRegisterLoading(
    loading
) {

    if (!registerButton) {

        return;

    }


    registerButton.disabled =
        loading;


    registerButton.textContent =
        loading

            ? "Створення профілю..."

            : "Зареєструвати профіль";

}


/* =========================================================
   LOGIN ERROR
========================================================= */

function showError(
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


function hideError() {

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
   REGISTRATION ERROR
========================================================= */

function showRegisterError(
    message
) {

    if (!registerError) {

        return;

    }


    registerError.textContent =
        message;


    registerError.classList.add(
        "visible"
    );

}


function hideRegisterError() {

    if (!registerError) {

        return;

    }


    registerError.textContent =
        "";


    registerError.classList.remove(
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
            fullName || "O"
        )
        .trim()
        .split(/\s+/);


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
        new URLSearchParams(
            params
        );


    const url =
        CABINET_API_URL +
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


    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );

    }


    return response.json();

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
        params
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
                    body.toString()

            }

        );


    if (!response.ok) {

        throw new Error(
            "HTTP " +
            response.status
        );

    }


    return response.json();

}
