/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET 2.0
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
   DOM
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
   STATISTICS
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
   MODAL
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

        restoreSession();

        initEvents();

    }
);


/* =========================================================
   EVENTS
========================================================= */

function initEvents() {

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }


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
                "Не вдалося виконати вхід."
            );

            return;

        }


        saveCitizen(
            response.citizen
        );


        showDashboard();


        await loadCabinet(
            response.citizen.idNumber
        );


    } catch (error) {

        console.error(
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

            logout();

            showError(
                response?.message ||
                "Профіль не знайдено."
            );

            return;

        }


        saveCitizen(
            response.citizen
        );


        renderProfile(
            response.citizen
        );


        renderApplications(
            response.applications || []
        );


    } catch (error) {

        console.error(
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


    applicationsList.innerHTML =
        "";


    if (
        applications.length === 0
    ) {

        applicationsEmpty.classList.add(
            "visible"
        );

        return;

    }


    applicationsEmpty.classList.remove(
        "visible"
    );


    applications.forEach(
        function (application) {

            applicationsList.appendChild(

                createApplicationCard(
                    application
                )

            );

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
                application.status ||
                "";


            if (
                status.includes(
                    "На розгляді"
                )
            ) {

                pending++;

            }


            if (
                status.includes(
                    "Прийнято"
                ) ||
                status.includes(
                    "Виконано"
                )
            ) {

                approved++;

            }


            if (
                status.includes(
                    "Відхилено"
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

        return "status-approved";

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

        return "status-review";

    }


    return "status-review";

}


/* =========================================================
   DETAILS MODAL
========================================================= */

function openApplicationDetails(
    application
) {

    if (!applicationModal) {

        return;

    }


    detailsTitle.textContent =
        application.service ||
        "Заявка";


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

    try {

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(
                citizen
            )

        );

    } catch (error) {

        console.error(
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


    if (loginId) {

        loginId.value =
            "";

    }


    if (loginPassword) {

        loginPassword.value =
            "";

    }


    hideError();


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
   ERROR
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
        words.length === 1
    ) {

        return words[0]
            .substring(0, 1)
            .toUpperCase();

    }


    return (

        words[0]
            .substring(0, 1) +

        words[1]
            .substring(0, 1)

    ).toUpperCase();

}


/* =========================================================
   GET REQUEST
========================================================= */

async function getRequest(
    params
) {

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
                    "GET"
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
                        "application/x-www-form-urlencoded"

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
