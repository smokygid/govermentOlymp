/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET 5.0

   Система:
   • OLYMP-ID
   • Пароль
   • Авторизация гражданина
   • Автоматическое восстановление сессии
   • Профиль гражданина
   • Аватар
   • Предпросмотр аватара
   • Сохранение аватара
   • Удаление аватара
   • Google Drive
   • Все заявки гражданина
   • Статусы
   • Ответы государственных органов
   • Статистика
   • Просмотр заявки
   • Копирование
   • Выход
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const API_URL =
    "https://script.google.com/macros/s/AKfycbyynbAxu6A_tU5nBEUum357BCY6o8D-3e44wEtR-AlyOtV5un8mNgpmkvU6dtrIy0RvfQ/exec";


const STORAGE_KEY =
    "olympCitizenSession";


const CABINET_VERSION =
    "5.0";


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
   AVATAR DOM
========================================================= */

const avatarInput =
    document.getElementById("avatarInput");

const saveAvatarButton =
    document.getElementById("saveAvatarButton");

const removeAvatarButton =
    document.getElementById("removeAvatarButton");

const avatarPreviewBox =
    document.getElementById("avatarPreviewBox");

const avatarPreview =
    document.getElementById("avatarPreview");

const profileAvatar =
    document.getElementById("profileAvatar");


/* =========================================================
   STATE
========================================================= */

let currentCitizen = null;

let currentApplications = [];

let currentApplication = null;

let selectedAvatarData = "";

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


    /* LOGIN */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    /* LOGOUT */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }


    /* COPY */

    if (copyNumberButton) {

        copyNumberButton.addEventListener(
            "click",
            copyApplicationNumber
        );

    }


    /* AVATAR */

    if (avatarInput) {

        avatarInput.addEventListener(
            "change",
            handleAvatarSelect
        );

    }


    if (saveAvatarButton) {

        saveAvatarButton.addEventListener(
            "click",
            saveAvatar
        );

    }


    if (removeAvatarButton) {

        removeAvatarButton.addEventListener(
            "click",
            removeAvatar
        );

    }


    /* ID */

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


    /* PASSWORD */

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


    /* ESC */

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


    const citizenIdInput =
        document.getElementById(
            "citizenId"
        );


    const passwordInput =
        document.getElementById(
            "citizenPassword"
        );


    let olympId =
        normalizeOlympId(
            citizenIdInput
                ? citizenIdInput.value
                : ""
        );


    const password =
        cleanPassword(
            passwordInput
                ? passwordInput.value
                : ""
        );


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

        if (passwordInput) {

            passwordInput.focus();

        }

        return;

    }


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

                    citizenId:
                        olympId,

                    idNumber:
                        olympId,

                    password:
                        password

                }
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
                []
            );


        if (!currentCitizen) {

            throw new Error(
                "Профіль громадянина не отримано."
            );

        }


        saveSession(
            olympId,
            password
        );


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

                    citizenId:
                        session.olympId,

                    idNumber:
                        session.olympId,

                    password:
                        session.password

                }
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
                null
            );


        currentApplications =
            normalizeApplications(
                response.applications ||
                []
            );


        if (!currentCitizen) {

            throw new Error(
                "Профіль не отримано."
            );

        }


        saveSession(
            session.olympId,
            session.password
        );


        renderCabinet();


        hideLoading();


    } catch (error) {

        console.warn(
            "SESSION ERROR:",
            error
        );


        clearSession();

        currentCitizen = null;

        currentApplications = [];

        currentApplication = null;

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
        API_URL.includes("ВСТАВЬ")
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


    Object.keys(params).forEach(
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
   CABINET
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
   PROFILE
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
        "";


    const fullName =
        citizen.fullName ||
        citizen.name ||
        citizen.fio ||
        "";


    setText(
        "profileCitizenId",
        olympId
    );


    setText(
        "profileFullName",
        fullName
    );


    setText(
        "profileBirthDate",
        formatDate(
            citizen.birthDate
        )
    );


    setText(
        "profilePhone",
        citizen.phone
    );


    setText(
        "profileEmail",
        citizen.email
    );


    setText(
        "profileDiscord",
        citizen.discord
    );


    setText(
        "profileContact",
        citizen.contact
    );


    setText(
        "profileCreatedAt",
        formatDateTime(
            citizen.registrationDate
        )
    );


    renderAvatar(
        citizen
    );

}


/* =========================================================
   AVATAR RENDER
========================================================= */

function renderAvatar(
    citizen
) {

    if (!profileAvatar) {

        return;

    }


    const avatarUrl =
        clean(
            citizen.avatarUrl ||
            citizen.avatar ||
            citizen.photo ||
            ""
        );


    const fullName =
        clean(
            citizen.fullName
        );


    if (avatarUrl) {

        profileAvatar.innerHTML = "";


        const img =
            document.createElement(
                "img"
            );


        img.src =
            avatarUrl;


        img.alt =
            "Аватар громадянина";


        img.className =
            "profile-avatar-image";


        img.onerror =
            function () {

                showInitialsAvatar(
                    fullName
                );

            };


        profileAvatar.appendChild(
            img
        );


        if (removeAvatarButton) {

            removeAvatarButton.classList.remove(
                "hidden"
            );

        }

        return;

    }


    showInitialsAvatar(
        fullName
    );


    if (removeAvatarButton) {

        removeAvatarButton.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   INITIALS
========================================================= */

function showInitialsAvatar(
    fullName
) {

    if (!profileAvatar) {

        return;

    }


    const name =
        clean(
            fullName
        );


    if (!name) {

        profileAvatar.textContent =
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


    profileAvatar.textContent =
        initials ||
        "👤";

}


/* =========================================================
   AVATAR SELECT
========================================================= */

async function handleAvatarSelect(
    event
) {

    const file =
        event.target.files &&
        event.target.files[0];


    if (!file) {

        return;

    }


    const allowed =
        [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


    if (
        !allowed.includes(
            file.type
        )
    ) {

        showToast(
            "Дозволені JPG, PNG або WEBP.",
            "error"
        );

        avatarInput.value = "";

        return;

    }


    if (
        file.size >
        8 * 1024 * 1024
    ) {

        showToast(
            "Максимальний розмір фото — 8 МБ.",
            "error"
        );

        avatarInput.value = "";

        return;

    }


    showLoading(
        "Підготовка аватара..."
    );


    try {

        selectedAvatarData =
            await compressImage(
                file
            );


        if (
            !selectedAvatarData
        ) {

            throw new Error(
                "Не вдалося обробити зображення."
            );

        }


        if (avatarPreview) {

            avatarPreview.src =
                selectedAvatarData;

        }


        if (avatarPreviewBox) {

            avatarPreviewBox.classList.remove(
                "hidden"
            );

        }


        if (saveAvatarButton) {

            saveAvatarButton.classList.remove(
                "hidden"
            );

        }


        hideLoading();


        showToast(
            "Фото підготовлено. Натисніть «Зберегти аватар».",
            "success"
        );


    } catch (error) {

        console.error(
            error
        );

        hideLoading();

        showToast(
            "Не вдалося підготувати фото.",
            "error"
        );

    }

}


/* =========================================================
   COMPRESS IMAGE
========================================================= */

function compressImage(
    file
) {

    return new Promise(
        function (
            resolve,
            reject
        ) {

            const reader =
                new FileReader();


            reader.onload =
                function () {

                    const image =
                        new Image();


                    image.onload =
                        function () {

                            const maxSize =
                                500;


                            let width =
                                image.width;


                            let height =
                                image.height;


                            if (
                                width >
                                height
                            ) {

                                if (
                                    width >
                                    maxSize
                                ) {

                                    height =
                                        Math.round(
                                            height *
                                            maxSize /
                                            width
                                        );

                                    width =
                                        maxSize;

                                }

                            } else {

                                if (
                                    height >
                                    maxSize
                                ) {

                                    width =
                                        Math.round(
                                            width *
                                            maxSize /
                                            height
                                        );

                                    height =
                                        maxSize;

                                }

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;


                            canvas.height =
                                height;


                            const context =
                                canvas.getContext(
                                    "2d"
                                );


                            context.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );


                            resolve(
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.72
                                )
                            );

                        };


                    image.onerror =
                        reject;


                    image.src =
                        reader.result;

                };


            reader.onerror =
                reject;


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================================
   SAVE AVATAR
========================================================= */

async function saveAvatar() {

    if (
        !currentCitizen
    ) {

        return;

    }


    if (
        !selectedAvatarData
    ) {

        showToast(
            "Спочатку виберіть фото.",
            "error"
        );

        return;

    }


    const session =
        loadSession();


    if (!session) {

        showToast(
            "Сесія завершилася. Увійдіть повторно.",
            "error"
        );

        return;

    }


    showLoading(
        "Збереження аватара..."
    );


    if (saveAvatarButton) {

        saveAvatarButton.disabled =
            true;

    }


    try {

        /*
           ВАЖЛИВО:

           Фото вже стиснуте до приблизно
           500px і JPEG 0.72.
        */

        const response =
            await apiRequest(
                "saveAvatar",
                {

                    olympId:
                        session.olympId,

                    citizenId:
                        session.olympId,

                    password:
                        session.password,

                    image:
                        selectedAvatarData

                }
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

                "Не вдалося зберегти аватар."

            );

        }


        if (
            response.avatarUrl
        ) {

            currentCitizen.avatarUrl =
                response.avatarUrl;

        }


        selectedAvatarData =
            "";


        if (avatarInput) {

            avatarInput.value =
                "";

        }


        if (avatarPreviewBox) {

            avatarPreviewBox.classList.add(
                "hidden"
            );

        }


        if (saveAvatarButton) {

            saveAvatarButton.classList.add(
                "hidden"
            );

        }


        renderAvatar(
            currentCitizen
        );


        hideLoading();


        showToast(
            "Аватар успішно збережено.",
            "success"
        );


    } catch (error) {

        console.error(
            "SAVE AVATAR ERROR:",
            error
        );


        hideLoading();


        showToast(
            error.message ||
            "Не вдалося зберегти аватар.",
            "error"
        );


    } finally {

        if (saveAvatarButton) {

            saveAvatarButton.disabled =
                false;

        }

    }

}


/* =========================================================
   REMOVE AVATAR
========================================================= */

async function removeAvatar() {

    if (!currentCitizen) {

        return;

    }


    const confirmed =
        window.confirm(
            "Видалити поточний аватар?"
        );


    if (!confirmed) {

        return;

    }


    const session =
        loadSession();


    if (!session) {

        return;

    }


    showLoading(
        "Видалення аватара..."
    );


    try {

        const response =
            await apiRequest(
                "removeAvatar",
                {

                    olympId:
                        session.olympId,

                    citizenId:
                        session.olympId,

                    password:
                        session.password

                }
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

                "Не вдалося видалити аватар."

            );

        }


        currentCitizen.avatarUrl =
            "";


        selectedAvatarData =
            "";


        renderAvatar(
            currentCitizen
        );


        hideLoading();


        showToast(
            "Аватар видалено.",
            "success"
        );


    } catch (error) {

        hideLoading();

        showToast(
            error.message ||
            "Помилка видалення аватара.",
            "error"
        );

    }

}


/* =========================================================
   APPLICATIONS
========================================================= */

function renderApplications(
    applications
) {

    currentApplications =
        normalizeApplications(
            applications
        );


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


    if (loading) {

        loading.classList.add(
            "hidden"
        );

    }


    if (!container) {

        updateApplicationsCounter(
            currentApplications
        );

        return;

    }


    container
        .querySelectorAll(
            ".application-history-card"
        )
        .forEach(
            function (card) {

                card.remove();

            }
        );


    if (
        currentApplications.length === 0
    ) {

        if (empty) {

            empty.classList.remove(
                "hidden"
            );

        }


        updateApplicationsCounter(
            currentApplications
        );

        return;

    }


    if (empty) {

        empty.classList.add(
            "hidden"
        );

    }


    currentApplications.forEach(
        function (
            application,
            index
        ) {

            container.appendChild(
                createApplicationCard(
                    application,
                    index
                )
            );

        }
    );


    updateApplicationsCounter(
        currentApplications
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
        "application-history-card";


    const top =
        document.createElement(
            "div"
        );


    top.className =
        "application-history-top";


    const numberBlock =
        document.createElement(
            "div"
        );


    numberBlock.className =
        "application-history-number";


    const label =
        document.createElement(
            "span"
        );


    label.textContent =
        "НОМЕР ЗАЯВКИ";


    const number =
        document.createElement(
            "strong"
        );


    number.textContent =
        application.number ||
        "—";


    numberBlock.appendChild(
        label
    );


    numberBlock.appendChild(
        number
    );


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
   ADD INFO
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
   SINGLE APPLICATION
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


    updateStatus(
        application.status
    );

}


/* =========================================================
   CLEAR APPLICATION
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
            item =>
                statusContains(
                    item.status,
                    "На розгляді"
                )
        ).length;


    const accepted =
        list.filter(
            item =>
                statusContains(
                    item.status,
                    "Прийнято"
                )
        ).length;


    const completed =
        list.filter(
            item =>
                statusContains(
                    item.status,
                    "Виконано"
                )
        ).length;


    const rejected =
        list.filter(
            item =>
                statusContains(
                    item.status,
                    "Відхилено"
                )
        ).length;


    const closed =
        list.filter(
            item =>
                statusContains(
                    item.status,
                    "Закрито"
                )
        ).length;


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
        "status-badge " +
        getStatusClass(
            value
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
        )
        .toLowerCase();


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

    if (
        !window.confirm(
            "Ви дійсно хочете вийти з особистого кабінету?"
        )
    ) {

        return;

    }


    clearSession();


    currentCitizen =
        null;


    currentApplications =
        [];


    currentApplication =
        null;


    selectedAvatarData =
        "";


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
   SESSION
========================================================= */

function saveSession(
    olympId,
    password
) {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                {

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

                }
            )
        );

    } catch (error) {

        console.error(
            "SAVE SESSION ERROR:",
            error
        );

    }

}


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

        return null;

    }

}


function clearSession() {

    try {

        localStorage.removeItem(
            STORAGE_KEY
        );

    } catch (error) {

        console.error(
            error
        );

    }

}


/* =========================================================
   LOGIN / CABINET
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
   RESET
========================================================= */

function resetLoginForm() {

    if (loginForm) {

        loginForm.reset();

    }


    clearLoginError();

}


/* =========================================================
   ERROR
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
            '<span class="button-loader"></span> Перевірка...';

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


function hideLoading() {

    if (!loadingOverlay) {

        return;

    }


    loadingOverlay.classList.add(
        "hidden"
    );

}


/* =========================================================
   COPY
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

            throw new Error();

        }


        showToast(
            successMessage ||
            "Скопійовано.",
            "success"
        );

    } catch (error) {

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


        document.body.appendChild(
            textarea
        );


        textarea.select();


        let success =
            false;


        try {

            success =
                document.execCommand(
                    "copy"
                );

        } catch (e) {

            success =
                false;

        }


        textarea.remove();


        showToast(
            success
                ?
            successMessage ||
            "Скопійовано."
                :
            "Не вдалося скопіювати.",
            success
                ?
            "success"
                :
            "error"
        );

    }

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
            formatOlympId(
                citizen.olympId ||
                citizen.idNumber ||
                citizen.citizenId ||
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
            ),


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


        registrationDate:
            clean(
                citizen.registrationDate ||
                citizen.createdAt ||
                ""
            ),


        avatarUrl:
            clean(
                citizen.avatarUrl ||
                citizen.avatar ||
                citizen.photo ||
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
            normalizeApplication
        )
        .filter(
            Boolean
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
                ""
            )
            .toUpperCase(),


        accessCode:
            clean(
                application.accessCode ||
                application.code ||
                ""
            )
            .toUpperCase(),


        olympId:
            formatOlympId(
                application.olympId ||
                application.idNumber ||
                application.citizenId ||
                ""
            ),


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
                application.fio ||
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
                application.type ||
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
            )

    };

}


/* =========================================================
   ID
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


function formatOlympId(
    value
) {

    let result =
        normalizeOlympId(
            value
        );


    result =
        result.replace(
            /-+/g,
            "-"
        );


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
   DATES
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
   GLOBAL
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
