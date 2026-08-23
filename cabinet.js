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

    initializeNewApplicationButton();

    restoreSession();

}


/* =========================================================
   HEADER
========================================================= */

function initializeHeader() {

    const header =
        document.getElementById(
            "header"
        );


    const menuButton =
        document.getElementById(
            "menuButton"
        );


    const mainMenu =
        document.getElementById(
            "mainMenu"
        );


    /*
     * HEADER SCROLL
     */

    if (header) {

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


    /*
     * MOBILE MENU
     */

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
                    String(
                        opened
                    )
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


    /*
     * VALIDATION
     */

    if (!idNumber) {

        showLoginError(
            "Введіть номер посвідчення."
        );


        input.focus();

        return;

    }


    /*
     * LOADING
     */

    setCabinetButtonLoading(
        button,
        true,
        "Пошук..."
    );


    try {

        /*
         * Загружаем профиль.
         *
         * ВАЖНО:
         * Code.gs должен поддерживать:
         *
         * action=profile
         * idNumber=OLYMP-0001
         */

        const result =
            await fetchProfile(
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
                    : "Не вдалося отримати дані."
            );

        }


        /*
         * Профиль может существовать
         * даже без заявок.
         */

        currentApplications =
            normalizeApplications(
                result.applications
            );


        currentCitizen =
            createCitizenProfile(
                idNumber,
                result
            );


        /*
         * СОХРАНЯЕМ СЕССИЮ
         */

        saveSession();


        /*
         * ПОКАЗЫВАЕМ КАБИНЕТ
         */

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
            "Переглянути мій кабінет"
        );

    }

}


/* =========================================================
   FETCH PROFILE
========================================================= */

async function fetchProfile(
    idNumber
) {

    if (
        !GOOGLE_SCRIPT_URL
    ) {

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
   Оставлено для совместимости
========================================================= */

async function fetchApplications(
    idNumber
) {

    return await fetchProfile(
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

    /*
     * Точное совпадение
     */

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


    /*
     * Без учета регистра
     */

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


        if (
            foundKey
        ) {

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
   CREATE CITIZEN PROFILE
========================================================= */

function createCitizenProfile(
    idNumber,
    result
) {

    const profile =
        result &&
        result.profile
            ? result.profile
            : {};


    const applications =
        result &&
        Array.isArray(
            result.applications
        )
            ? result.applications
            : [];


    const firstApplication =
        applications.length
            ? applications[0]
            : null;


    /*
     * ПРИОРИТЕТ:
     *
     * 1. profile.fullName
     * 2. первая заявка
     * 3. Громадянин Olymp
     */

    const fullName =
        cleanText(
            profile.fullName
        ) ||
        (
            firstApplication &&
            cleanText(
                firstApplication.fullName
            )
        ) ||
        "Громадянин Olymp";


    const contact =
        cleanText(
            profile.contact
        ) ||
        (
            firstApplication &&
            cleanText(
                firstApplication.contact
            )
        ) ||
        "Не вказано";


    return {

        fullName:
            fullName,

        idNumber:
            idNumber,

        contact:
            contact

    };

}


/* =========================================================
   CLEAN TEXT
========================================================= */

function cleanText(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(
        value
    ).trim();

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
   RENDER PROFILE
========================================================= */

function renderCitizenProfile() {

    if (
        !currentCitizen
    ) {

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
            currentCitizen.fullName;

    }


    if (id) {

        id.textContent =
            currentCitizen.idNumber;

    }


    if (avatar) {

        avatar.textContent =
            getInitials(
                currentCitizen.fullName
            );

    }


    /*
     * Дополнительные поля,
     * если они есть в HTML
     */

    setTextIfExists(
        "profileContact",
        currentCitizen.contact
    );

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


    if (
        element &&
        value
    ) {

        element.textContent =
            value;

    }

}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(
    name
) {

    if (
        !name
    ) {

        return "O";

    }


    const words =
        name
            .trim()
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );


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

    let completed = 0;

    let rejected = 0;

    let closed = 0;


    currentApplications.forEach(
        application => {

            const status =
                normalizeStatus(
                    application.status
                );


            switch (
                status
            ) {

                case "pending":
                    pending++;
                    break;

                case "approved":
                    approved++;
                    break;

                case "completed":
                    completed++;
                    break;

                case "rejected":
                    rejected++;
                    break;

                case "closed":
                    closed++;
                    break;

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
        "completedApplications",
        completed
    );


    setText(
        "rejectedApplications",
        rejected
    );


    setText(
        "closedApplications",
        closed
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
     * НЕТ ЗАЯВОК
     */

    if (
        !currentApplications.length
    ) {

        if (empty) {

            empty.classList.add(
                "visible"
            );


            /*
             * Если внутри empty есть
             * счетчик / текст — обновляем
             */

            const emptyTitle =
                empty.querySelector(
                    "[data-empty-title]"
                );


            if (emptyTitle) {

                emptyTitle.textContent =
                    "Заявок поки немає";

            }

        }


        return;

    }


    /*
     * ЗАЯВКИ ЕСТЬ
     */

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
   SORT APPLICATIONS
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
                            application.createdAt ||
                            application.date
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
                    Відповідальний
                </span>

                <strong>
                    ${escapeHtml(
                        application.responsible ||
                        "Не призначено"
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
   STATUS INFORMATION
========================================================= */

function getStatusInfo(
    status
) {

    const normalized =
        normalizeStatus(
            status
        );


    switch (
        normalized
    ) {

        case "approved":

            return {

                label:
                    "Прийнято",

                className:
                    "status-approved",

                icon:
                    "🔵"

            };


        case "completed":

            return {

                label:
                    "Виконано",

                className:
                    "status-completed",

                icon:
                    "🟢"

            };


        case "rejected":

            return {

                label:
                    "Відхилено",

                className:
                    "status-rejected",

                icon:
                    "🔴"

            };


        case "closed":

            return {

                label:
                    "Закрито",

                className:
                    "status-closed",

                icon:
                    "⚫"

            };


        case "pending":

        default:

            return {

                label:
                    "На розгляді",

                className:
                    "status-pending",

                icon:
                    "🟡"

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
        value.includes("approved") ||
        value.includes("approve") ||
        value.includes("прийня")
    ) {

        return "approved";

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
        value.includes("відх") ||
        value.includes("отказ") ||
        value.includes("rejected") ||
        value.includes("reject")
    ) {

        return "rejected";

    }


    if (
        value.includes("закрит") ||
        value.includes("closed") ||
        value.includes("close")
    ) {

        return "closed";

    }


    return "pending";

}


/* =========================================================
   OPEN APPLICATION DETAILS
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
                            application.createdAt ||
                            application.date
                        )
                    )}
                </strong>

            </div>


            <div class="application-info-item">

                <span>
                    Відповідальний
                </span>

                <strong>
                    ${escapeHtml(
                        application.responsible ||
                        "Не призначено"
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


        <div class="application-comment">

            <strong>
                Коментар державного службовця
            </strong>

            <p>

                ${
                    application.comment
                        ? escapeHtml(
                            application.comment
                        )
                        : "Коментар поки що відсутній."
                }

            </p>

        </div>

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
   APPLICATION MODAL
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
   CLOSE APPLICATION DETAILS
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


    selectedApplication =
        null;


    updateBodyModalState();

}


/* =========================================================
   BODY MODAL STATE
========================================================= */

function updateBodyModalState() {

    const modal =
        document.getElementById(
            "cabinetApplicationModal"
        );


    if (
        modal &&
        modal.classList.contains(
            "active"
        )
    ) {

        document.body.classList.add(
            "modal-open"
        );

    } else {

        document.body.classList.remove(
            "modal-open"
        );

    }

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
            await fetchProfile(
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
                    : "Не вдалося оновити дані."
            );

        }


        currentApplications =
            normalizeApplications(
                result.applications
            );


        /*
         * Обновляем профиль даже если
         * заявок после обновления нет.
         */

        currentCitizen =
            createCitizenProfile(
                currentCitizen.idNumber,
                result
            );


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
   NEW APPLICATION BUTTON
========================================================= */

function initializeNewApplicationButton() {

    const buttons =
        document.querySelectorAll(
            "[data-new-application]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    openNewApplicationPage();

                }
            );

        }
    );

}


/* =========================================================
   OPEN NEW APPLICATION PAGE
========================================================= */

function openNewApplicationPage() {

    /*
     * Если у тебя страница называется иначе,
     * поменяй только эту строку.
     */

    window.location.href =
        "services.html";

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
   SESSION
========================================================= */

function saveSession() {

    if (
        !currentCitizen
    ) {

        return;

    }


    try {

        localStorage.setItem(
            "olymp_citizen_session",
            JSON.stringify({

                idNumber:
                    currentCitizen.idNumber,

                fullName:
                    currentCitizen.fullName

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

    let session =
        null;


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
            await fetchProfile(
                session.idNumber
            );


        if (
            !result ||
            result.success !== true
        ) {

            return;

        }


        /*
         * Даже если заявок НЕТ —
         * всё равно открываем кабинет.
         */

        currentApplications =
            normalizeApplications(
                result.applications
            );


        currentCitizen =
            createCitizenProfile(
                session.idNumber,
                result
            );


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

        return (
            "Сталася невідома помилка."
        );

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
            "Перевірте URL Google Apps Script та його розгортання."
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

    if (
        !value
    ) {

        return 0;

    }


    /*
     * ISO / обычная дата
     */

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


    /*
     * DD.MM.YYYY HH:mm:ss
     */

    const match =
        String(
            value
        ).match(
            /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
        );


    if (
        match
    ) {

        const day =
            Number(
                match[1]
            );


        const month =
            Number(
                match[2]
            ) - 1;


        const year =
            Number(
                match[3]
            );


        const hour =
            Number(
                match[4] || 0
            );


        const minute =
            Number(
                match[5] || 0
            );


        const second =
            Number(
                match[6] || 0
            );


        return new Date(
            year,
            month,
            day,
            hour,
            minute,
            second
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

    if (
        !value
    ) {

        return "—";

    }


    const timestamp =
        parseDate(
            value
        );


    if (!timestamp) {

        return String(
            value
        );

    }


    const date =
        new Date(
            timestamp
        );


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


    return String(
        value
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
