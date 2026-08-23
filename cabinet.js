/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET
   cabinet.js
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT
========================================================= */

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzET7X9XsoUnCZlhGv8YEiv1NAoCmu13U4AP3WMlmo5sFXiwlBKhfLkXBfQKcFJh-RGog/exec";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentCitizen = null;

let currentApplications = [];

let selectedApplication = null;


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
        "OLYMP Personal Cabinet initialized."
    );


    initializeHeader();

    initializeLogin();

    initializeLogout();

    initializeRefresh();

    initializeApplicationModal();

    restoreSession();

}


/* =========================================================
   HEADER
========================================================= */

function initializeHeader() {

    const header =
        document.getElementById("header");

    const menuButton =
        document.getElementById("menuButton");

    const mainMenu =
        document.getElementById("mainMenu");


    /* =====================================================
       HEADER SCROLL
    ===================================================== */

    if (header) {

        function updateHeader() {

            if (window.scrollY > 50) {

                header.classList.add("scrolled");

            } else {

                header.classList.remove("scrolled");

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


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    if (
        menuButton &&
        mainMenu
    ) {

        menuButton.addEventListener(
            "click",
            () => {

                mainMenu.classList.toggle(
                    "active"
                );


                const opened =
                    mainMenu.classList.contains(
                        "active"
                    );


                menuButton.setAttribute(
                    "aria-expanded",
                    opened
                );

            }
        );


        mainMenu
            .querySelectorAll("a")
            .forEach(
                link => {

                    link.addEventListener(
                        "click",
                        () => {

                            mainMenu.classList.remove(
                                "active"
                            );


                            menuButton.setAttribute(
                                "aria-expanded",
                                "false"
                            );

                        }
                    );

                }
            );

    }

}


/* =========================================================
   LOGIN
========================================================= */

function initializeLogin() {

    const form =
        document.getElementById(
            "cabinetLoginForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await loginCitizen();

        }
    );

}


/* =========================================================
   LOGIN CITIZEN
========================================================= */

async function loginCitizen() {

    const input =
        document.getElementById(
            "cabinetIdNumber"
        );


    const button =
        document.getElementById(
            "cabinetLoginButton"
        );


    if (!input) {

        return;

    }


    const idNumber =
        input.value
            .trim()
            .toUpperCase();


    hideLoginError();


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!idNumber) {

        showLoginError(
            "Введіть номер посвідчення."
        );


        input.focus();

        return;

    }


    /* =====================================================
       LOADING
    ===================================================== */

    setCabinetButtonLoading(
        button,
        true,
        "Відкриття кабінету..."
    );


    try {

        const result =
            await fetchUserProfile(
                idNumber
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Не вдалося отримати профіль."
            );

        }


        /*
         * ВАЖНО:
         *
         * Даже если заявок 0 —
         * профиль всё равно открывается.
         */

        currentApplications =
            normalizeApplications(
                result.applications || []
            );


        /*
         * Берём ПІБ из профиля,
         * если Google Apps Script его вернул.
         */

        const profile =
            result.profile || {};


        currentCitizen = {

            fullName:
                profile.fullName ||
                "Громадянин Olymp",

            idNumber:
                profile.idNumber ||
                idNumber,

            contact:
                profile.contact ||
                ""

        };


        saveSession();


        /* =================================================
           OPEN DASHBOARD
        ================================================= */

        showDashboard();

        renderCitizenProfile();

        renderStatistics();

        renderApplications();


    } catch (error) {

        console.error(
            "OLYMP Cabinet login error:",
            error
        );


        showLoginError(
            getFriendlyErrorMessage(
                error
            )
        );

    } finally {

        setCabinetButtonLoading(
            button,
            false,
            "Переглянути мої заявки"
        );

    }

}


/* =========================================================
   FETCH USER PROFILE
========================================================= */

async function fetchUserProfile(
    idNumber
) {

    if (!GOOGLE_SCRIPT_URL) {

        throw new Error(
            "Google Apps Script URL не налаштовано."
        );

    }


    const url =
        GOOGLE_SCRIPT_URL +
        "?action=profile" +
        "&idNumber=" +
        encodeURIComponent(
            idNumber
        );


    const response =
        await fetch(
            url,
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


    const text =
        await response.text();


    let result;


    try {

        result =
            JSON.parse(
                text
            );

    } catch (error) {

        console.error(
            "Invalid JSON:",
            text
        );


        throw new Error(
            "Сервер повернув некоректну відповідь."
        );

    }


    return result;

}


/* =========================================================
   FETCH APPLICATIONS
========================================================= */

async function fetchApplications(
    idNumber
) {

    return fetchUserProfile(
        idNumber
    );

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
            item =>
                normalizeApplication(
                    item
                )
        )
        .filter(
            item =>
                item !== null
        );

}


/* =========================================================
   NORMALIZE APPLICATION
========================================================= */

function normalizeApplication(
    item
) {

    if (
        !item ||
        typeof item !== "object"
    ) {

        return null;

    }


    return {

        number:
            getField(
                item,
                [
                    "number",
                    "applicationNumber",
                    "Номер заявки",
                    "Номер",
                    "ID"
                ]
            ) ||
            "OLYMP-000000",


        fullName:
            getField(
                item,
                [
                    "fullName",
                    "name",
                    "ПІБ",
                    "ФИО"
                ]
            ) ||
            "Не вказано",


        idNumber:
            getField(
                item,
                [
                    "idNumber",
                    "IDNumber",
                    "Номер посвідчення",
                    "Посвідчення"
                ]
            ) ||
            currentCitizen?.idNumber ||
            "",


        service:
            getField(
                item,
                [
                    "service",
                    "serviceName",
                    "Тип послуги",
                    "Послуга"
                ]
            ) ||
            "Державна послуга",


        contact:
            getField(
                item,
                [
                    "contact",
                    "Контакт",
                    "Контакт для зв'язку"
                ]
            ) ||
            "Не вказано",


        message:
            getField(
                item,
                [
                    "message",
                    "description",
                    "Опис звернення",
                    "Опис"
                ]
            ) ||
            "Опис відсутній.",


        status:
            getField(
                item,
                [
                    "status",
                    "Status",
                    "Статус"
                ]
            ) ||
            "🟡 На розгляді",


        responsible:
            getField(
                item,
                [
                    "responsible",
                    "employee",
                    "Відповідальний"
                ]
            ) ||
            "",


        comment:
            getField(
                item,
                [
                    "comment",
                    "employeeComment",
                    "adminComment",
                    "Комментарий",
                    "Коментар",
                    "Коментар співробітника"
                ]
            ) ||
            "",


        createdAt:
            getField(
                item,
                [
                    "createdAt",
                    "date",
                    "Дата",
                    "Дата подання",
                    "created"
                ]
            ) ||
            "",


        updatedAt:
            getField(
                item,
                [
                    "updatedAt",
                    "updateDate",
                    "Дата оновлення",
                    "Оновлено"
                ]
            ) ||
            ""

    };

}


/* =========================================================
   GET FIELD
========================================================= */

function getField(
    object,
    possibleNames
) {

    for (
        const name of possibleNames
    ) {

        if (
            Object.prototype.hasOwnProperty.call(
                object,
                name
            )
        ) {

            const value =
                object[name];


            if (
                value !== null &&
                value !== undefined
            ) {

                return String(
                    value
                ).trim();

            }

        }

    }


    const objectKeys =
        Object.keys(
            object
        );


    for (
        const possibleName of possibleNames
    ) {

        const foundKey =
            objectKeys.find(
                key =>
                    key.toLowerCase() ===
                    possibleName.toLowerCase()
            );


        if (foundKey) {

            const value =
                object[foundKey];


            if (
                value !== null &&
                value !== undefined
            ) {

                return String(
                    value
                ).trim();

            }

        }

    }


    return "";

}


/* =========================================================
   SHOW DASHBOARD
========================================================= */

function showDashboard() {

    const login =
        document.getElementById(
            "cabinetLogin"
        );


    const dashboard =
        document.getElementById(
            "cabinetDashboard"
        );


    if (login) {

        login.style.display =
            "none";

    }


    if (dashboard) {

        dashboard.classList.add(
            "active"
        );

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

    const login =
        document.getElementById(
            "cabinetLogin"
        );


    const dashboard =
        document.getElementById(
            "cabinetDashboard"
        );


    if (dashboard) {

        dashboard.classList.remove(
            "active"
        );

    }


    if (login) {

        login.style.display =
            "";

    }

}


/* =========================================================
   RENDER CITIZEN PROFILE
========================================================= */

function renderCitizenProfile() {

    if (!currentCitizen) {

        return;

    }


    const name =
        document.getElementById(
            "profileName"
        );


    const id =
        document.getElementById(
            "profileId"
        );


    const avatar =
        document.getElementById(
            "profileAvatar"
        );


    if (name) {

        name.textContent =
            currentCitizen.fullName ||
            "Громадянин Olymp";

    }


    if (id) {

        id.textContent =
            currentCitizen.idNumber ||
            "—";

    }


    if (avatar) {

        avatar.textContent =
            getInitials(
                currentCitizen.fullName
            );

    }

}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(
    name
) {

    if (!name) {

        return "O";

    }


    const words =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        words.length === 1
    ) {

        return words[0]
            .substring(0, 1)
            .toUpperCase();

    }


    return (
        words[0].charAt(0) +
        words[1].charAt(0)
    ).toUpperCase();

}


/* =========================================================
   STATISTICS
========================================================= */

function renderStatistics() {

    const total =
        currentApplications.length;


    let pending = 0;

    let approved = 0;

    let rejected = 0;


    currentApplications.forEach(
        application => {

            const status =
                normalizeStatus(
                    application.status
                );


            if (
                status === "pending" ||
                status === "review" ||
                status === "documents"
            ) {

                pending++;

            }


            if (
                status === "approved" ||
                status === "completed"
            ) {

                approved++;

            }


            if (
                status === "rejected"
            ) {

                rejected++;

            }

        }
    );


    setText(
        "totalApplications",
        total
    );


    setText(
        "pendingApplications",
        pending
    );


    setText(
        "approvedApplications",
        approved
    );


    setText(
        "rejectedApplications",
        rejected
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


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   RENDER APPLICATIONS
========================================================= */

function renderApplications() {

    const list =
        document.getElementById(
            "applicationsList"
        );


    const empty =
        document.getElementById(
            "applicationsEmpty"
        );


    const loading =
        document.getElementById(
            "cabinetLoading"
        );


    if (!list) {

        return;

    }


    list.innerHTML = "";


    if (loading) {

        loading.classList.remove(
            "visible"
        );

    }


    /*
     * ЧЕЛОВЕК ЕСТЬ,
     * НО ЗАЯВОК НЕТ
     */

    if (
        currentApplications.length === 0
    ) {

        if (empty) {

            empty.classList.add(
                "visible"
            );


            const title =
                empty.querySelector(
                    "h3"
                );


            const text =
                empty.querySelector(
                    "p"
                );


            if (title) {

                title.textContent =
                    "Заявок поки немає";

            }


            if (text) {

                text.textContent =
                    "Ви ще не подавали заявок до державних органів. Тут вони з’являться після подання.";

            }

        }


        return;

    }


    if (empty) {

        empty.classList.remove(
            "visible"
        );

    }


    const sorted =
        [...currentApplications]
            .sort(
                compareApplications
            );


    sorted.forEach(
        application => {

            const card =
                createApplicationCard(
                    application
                );


            list.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   SORT
========================================================= */

function compareApplications(
    a,
    b
) {

    const dateA =
        parseDate(
            a.createdAt
        );


    const dateB =
        parseDate(
            b.createdAt
        );


    return dateB - dateA;

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


    const status =
        getStatusInfo(
            application.status
        );


    card.innerHTML = `

        <div class="application-card-top">

            <div>

                <span class="application-number">
                    № ${escapeHtml(
                        application.number
                    )}
                </span>

                <h3 class="application-title">
                    ${escapeHtml(
                        application.service
                    )}
                </h3>

            </div>


            <span class="
                application-status-badge
                ${status.className}
            ">

                ${status.icon}

                ${escapeHtml(
                    status.label
                )}

            </span>

        </div>


        <div class="application-info">

            <div class="application-info-item">

                <span>
                    Дата подання
                </span>

                <strong>
                    ${escapeHtml(
                        formatDate(
                            application.createdAt
                        )
                    )}
                </strong>

            </div>


            <div class="application-info-item">

                <span>
                    Номер посвідчення
                </span>

                <strong>
                    ${escapeHtml(
                        application.idNumber ||
                        currentCitizen?.idNumber ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="application-info-item">

                <span>
                    Останнє оновлення
                </span>

                <strong>
                    ${escapeHtml(
                        formatDate(
                            application.updatedAt ||
                            application.createdAt
                        )
                    )}
                </strong>

            </div>

        </div>


        <div class="application-description">

            <strong>
                Ваше звернення
            </strong>

            <p>
                ${escapeHtml(
                    application.message
                )}
            </p>

        </div>


        ${
            application.comment
                ? `

                    <div class="application-comment">

                        <strong>
                            Коментар державного службовця
                        </strong>

                        <p>
                            ${escapeHtml(
                                application.comment
                            )}
                        </p>

                    </div>

                `
                : ""
        }


        <div style="
            margin-top:18px;
            display:flex;
            justify-content:flex-end;
        ">

            <button
                type="button"
                class="btn btn-light application-details-button">

                Детальніше →

            </button>

        </div>

    `;


    const detailsButton =
        card.querySelector(
            ".application-details-button"
        );


    if (detailsButton) {

        detailsButton.addEventListener(
            "click",
            () => {

                openApplicationDetails(
                    application
                );

            }
        );

    }


    return card;

}


/* =========================================================
   STATUS
========================================================= */

function getStatusInfo(
    status
) {

    const normalized =
        normalizeStatus(
            status
        );


    switch (normalized) {

        case "approved":

            return {
                label: "Прийнято",
                className: "status-approved",
                icon: "🔵"
            };


        case "rejected":

            return {
                label: "Відхилено",
                className: "status-rejected",
                icon: "🔴"
            };


        case "documents":

            return {
                label: "Потрібні документи",
                className: "status-documents",
                icon: "🟠"
            };


        case "review":

            return {
                label: "Перевірка",
                className: "status-review",
                icon: "🔵"
            };


        case "completed":

            return {
                label: "Виконано",
                className: "status-completed",
                icon: "🟢"
            };


        case "closed":

            return {
                label: "Закрито",
                className: "status-completed",
                icon: "⚫"
            };


        default:

            return {
                label: "На розгляді",
                className: "status-pending",
                icon: "🟡"
            };

    }

}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(
    status
) {

    const value =
        String(
            status || ""
        )
            .toLowerCase()
            .trim();


    if (
        value.includes("схвал") ||
        value.includes("одобр") ||
        value.includes("прийня") ||
        value.includes("approved") ||
        value.includes("approve")
    ) {

        return "approved";

    }


    if (
        value.includes("відх") ||
        value.includes("отказ") ||
        value.includes("rejected") ||
        value.includes("reject")
    ) {

        return "rejected";

    }


    if (
        value.includes("документ") ||
        value.includes("documents") ||
        value.includes("document")
    ) {

        return "documents";

    }


    if (
        value.includes("перевір") ||
        value.includes("провер") ||
        value.includes("review")
    ) {

        return "review";

    }


    if (
        value.includes("викон") ||
        value.includes("заверш") ||
        value.includes("completed") ||
        value.includes("complete")
    ) {

        return "completed";

    }


    if (
        value.includes("закрит") ||
        value.includes("closed")
    ) {

        return "closed";

    }


    return "pending";

}


/* =========================================================
   APPLICATION DETAILS
========================================================= */

function openApplicationDetails(
    application
) {

    if (!application) {

        return;

    }


    selectedApplication =
        application;


    const modal =
        document.getElementById(
            "cabinetApplicationModal"
        );


    const title =
        document.getElementById(
            "detailsTitle"
        );


    const content =
        document.getElementById(
            "detailsContent"
        );


    if (
        !modal ||
        !content
    ) {

        return;

    }


    const status =
        getStatusInfo(
            application.status
        );


    if (title) {

        title.textContent =
            application.service;

    }


    content.innerHTML = `

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            margin-bottom:20px;
            flex-wrap:wrap;
        ">

            <strong>
                № ${escapeHtml(
                    application.number
                )}
            </strong>


            <span class="
                application-status-badge
                ${status.className}
            ">

                ${status.icon}

                ${escapeHtml(
                    status.label
                )}

            </span>

        </div>


        <div class="application-info">

            <div class="application-info-item">

                <span>
                    ПІБ
                </span>

                <strong>
                    ${escapeHtml(
                        application.fullName ||
                        currentCitizen?.fullName ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="application-info-item">

                <span>
                    Посвідчення
                </span>

                <strong>
                    ${escapeHtml(
                        application.idNumber ||
                        currentCitizen?.idNumber ||
                        "—"
                    )}
                </strong>

            </div>


            <div class="application-info-item">

                <span>
                    Контакт
                </span>

                <strong>
                    ${escapeHtml(
                        application.contact ||
                        currentCitizen?.contact ||
                        "Не вказано"
                    )}
                </strong>

            </div>


            <div class="application-info-item">

                <span>
                    Дата подання
                </span>

                <strong>
                    ${escapeHtml(
                        formatDate(
                            application.createdAt
                        )
                    )}
                </strong>

            </div>


            <div class="application-info-item">

                <span>
                    Останнє оновлення
                </span>

                <strong>
                    ${escapeHtml(
                        formatDate(
                            application.updatedAt ||
                            application.createdAt
                        )
                    )}
                </strong>

            </div>

        </div>


        <div class="application-description">

            <strong>
                Опис звернення
            </strong>

            <p>
                ${escapeHtml(
                    application.message
                )}
            </p>

        </div>


        ${
            application.comment
                ? `

                    <div class="application-comment">

                        <strong>
                            Коментар державного службовця
                        </strong>

                        <p>
                            ${escapeHtml(
                                application.comment
                            )}
                        </p>

                    </div>

                `
                : `

                    <div class="application-comment">

                        <strong>
                            Коментар державного службовця
                        </strong>

                        <p>
                            Коментар поки що відсутній.
                        </p>

                    </div>

                `
        }

    `;


    modal.classList.add(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   MODAL
========================================================= */

function initializeApplicationModal() {

    const modal =
        document.getElementById(
            "cabinetApplicationModal"
        );


    const closeButton =
        document.getElementById(
            "closeCabinetApplicationModal"
        );


    const closeButtonBottom =
        document.getElementById(
            "closeCabinetApplicationModalButton"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeApplicationDetails
        );

    }


    if (closeButtonBottom) {

        closeButtonBottom.addEventListener(
            "click",
            closeApplicationDetails
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeApplicationDetails();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeApplicationDetails();

            }

        }
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeApplicationDetails() {

    const modal =
        document.getElementById(
            "cabinetApplicationModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "active"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   REFRESH
========================================================= */

function initializeRefresh() {

    const button =
        document.getElementById(
            "refreshApplications"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async () => {

            await refreshApplications();

        }
    );

}


/* =========================================================
   REFRESH APPLICATIONS
========================================================= */

async function refreshApplications() {

    if (
        !currentCitizen ||
        !currentCitizen.idNumber
    ) {

        return;

    }


    const button =
        document.getElementById(
            "refreshApplications"
        );


    const list =
        document.getElementById(
            "applicationsList"
        );


    const loading =
        document.getElementById(
            "cabinetLoading"
        );


    setCabinetButtonLoading(
        button,
        true,
        "Оновлення..."
    );


    if (list) {

        list.style.display =
            "none";

    }


    if (loading) {

        loading.classList.add(
            "visible"
        );

    }


    try {

        const result =
            await fetchUserProfile(
                currentCitizen.idNumber
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Не вдалося оновити профіль."
            );

        }


        currentApplications =
            normalizeApplications(
                result.applications || []
            );


        /*
         * Обновляем профиль,
         * даже если заявок стало 0.
         */

        if (result.profile) {

            currentCitizen.fullName =
                result.profile.fullName ||
                currentCitizen.fullName ||
                "Громадянин Olymp";


            currentCitizen.contact =
                result.profile.contact ||
                currentCitizen.contact ||
                "";


            currentCitizen.idNumber =
                result.profile.idNumber ||
                currentCitizen.idNumber;

        }


        saveSession();


        renderCitizenProfile();

        renderStatistics();

        renderApplications();


    } catch (error) {

        console.error(
            "OLYMP refresh error:",
            error
        );


        alert(
            getFriendlyErrorMessage(
                error
            )
        );

    } finally {

        if (list) {

            list.style.display =
                "";

        }


        if (loading) {

            loading.classList.remove(
                "visible"
            );

        }


        setCabinetButtonLoading(
            button,
            false,
            "↻ Оновити"
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
        logoutCitizen
    );

}


/* =========================================================
   LOGOUT CITIZEN
========================================================= */

function logoutCitizen() {

    currentCitizen =
        null;


    currentApplications =
        [];


    selectedApplication =
        null;


    try {

        localStorage.removeItem(
            "olymp_citizen_session"
        );

    } catch (error) {

        console.warn(
            "Unable to clear session:",
            error
        );

    }


    const input =
        document.getElementById(
            "cabinetIdNumber"
        );


    if (input) {

        input.value =
            "";

    }


    hideLoginError();


    showLogin();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   SAVE SESSION
========================================================= */

function saveSession() {

    if (!currentCitizen) {

        return;

    }


    try {

        localStorage.setItem(
            "olymp_citizen_session",
            JSON.stringify({

                idNumber:
                    currentCitizen.idNumber,

                fullName:
                    currentCitizen.fullName,

                contact:
                    currentCitizen.contact || ""

            })
        );

    } catch (error) {

        console.warn(
            "Session storage unavailable:",
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

        const saved =
            localStorage.getItem(
                "olymp_citizen_session"
            );


        if (!saved) {

            return;

        }


        session =
            JSON.parse(
                saved
            );

    } catch (error) {

        console.warn(
            "Unable to restore session:",
            error
        );


        return;

    }


    if (
        !session ||
        !session.idNumber
    ) {

        return;

    }


    const input =
        document.getElementById(
            "cabinetIdNumber"
        );


    if (input) {

        input.value =
            session.idNumber;

    }


    try {

        const result =
            await fetchUserProfile(
                session.idNumber
            );


        if (
            !result ||
            result.success !== true
        ) {

            return;

        }


        currentApplications =
            normalizeApplications(
                result.applications || []
            );


        const profile =
            result.profile || {};


        currentCitizen = {

            fullName:
                profile.fullName ||
                session.fullName ||
                "Громадянин Olymp",

            idNumber:
                profile.idNumber ||
                session.idNumber,

            contact:
                profile.contact ||
                session.contact ||
                ""

        };


        showDashboard();

        renderCitizenProfile();

        renderStatistics();

        renderApplications();

    } catch (error) {

        console.warn(
            "Session restore failed:",
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

    const error =
        document.getElementById(
            "cabinetLoginError"
        );


    if (!error) {

        return;

    }


    error.textContent =
        message;


    error.classList.add(
        "visible"
    );

}


/* =========================================================
   HIDE LOGIN ERROR
========================================================= */

function hideLoginError() {

    const error =
        document.getElementById(
            "cabinetLoginError"
        );


    if (!error) {

        return;

    }


    error.classList.remove(
        "visible"
    );


    error.textContent =
        "";

}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setCabinetButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {

        return;

    }


    if (loading) {

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent;

        }


        button.disabled =
            true;


        button.textContent =
            text ||
            "Завантаження...";

    } else {

        button.disabled =
            false;


        button.textContent =
            text ||
            button.dataset.originalText ||
            "Готово";

    }

}


/* =========================================================
   FRIENDLY ERROR
========================================================= */

function getFriendlyErrorMessage(
    error
) {

    if (!error) {

        return "Сталася невідома помилка.";

    }


    const message =
        String(
            error.message ||
            error
        );


    if (
        message.includes(
            "Failed to fetch"
        )
    ) {

        return (
            "Не вдалося підключитися до сервера. " +
            "Перевірте Google Apps Script."
        );

    }


    if (
        message.includes(
            "HTTP 404"
        )
    ) {

        return (
            "Сервер заявок не знайдено."
        );

    }


    if (
        message.includes(
            "HTTP 500"
        )
    ) {

        return (
            "Помилка сервера Google Apps Script."
        );

    }


    return message;

}


/* =========================================================
   DATE PARSER
========================================================= */

function parseDate(
    value
) {

    if (!value) {

        return 0;

    }


    const date =
        new Date(
            value
        );


    if (
        !Number.isNaN(
            date.getTime()
        )
    ) {

        return date.getTime();

    }


    const match =
        String(value).match(
            /^(\d{1,2})\.(\d{1,2})\.(\d{4})/
        );


    if (match) {

        const day =
            Number(match[1]);


        const month =
            Number(match[2]) - 1;


        const year =
            Number(match[3]);


        return new Date(
            year,
            month,
            day
        ).getTime();

    }


    return 0;

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


    const timestamp =
        parseDate(
            value
        );


    if (!timestamp) {

        return String(value);

    }


    const date =
        new Date(timestamp);


    return new Intl.DateTimeFormat(
        "uk-UA",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

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

window.logoutCitizen =
    logoutCitizen;


window.refreshApplications =
    refreshApplications;


window.openApplicationDetails =
    openApplicationDetails;


window.closeApplicationDetails =
    closeApplicationDetails;


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "%cOLYMP Government",
    "font-weight:bold;font-size:18px;"
);


console.log(
    "Personal Cabinet loaded."
);
