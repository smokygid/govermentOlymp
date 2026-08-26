/* =========================================================
   OLYMP GOVERNMENT
   Frontend JavaScript 4.0
   Державний портал

   VERSION 4.0

   СИСТЕМА:
   • Державні послуги
   • Пошук послуг
   • Категорії
   • Модальні вікна
   • Створення заявки
   • Google Apps Script
   • OLYMP-ID
   • Авторизація
   • Особистий кабінет
   • Автоматичне визначення сесії
   • Автоматична передача OLYMP-ID
   • Автоматичне заповнення даних громадянина
   • Аватар за прямим посиланням
   • Збереження аватара
   • Відображення аватара на всьому порталі
   • Toast
   • Loading
   • Захист від некоректних відповідей API

   OLYMP GOVERNMENT 4.0
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT
========================================================= */

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyynbAxu6A_tU5nBEUum357BCY6o8D-3e44wEtR-AlyOtV5un8mNgpmkvU6dtrIy0RvfQ/exec";


/* =========================================================
   STORAGE
========================================================= */

const OLYMP_SESSION_KEY =
    "olympCitizenSession";

const OLYMP_CITIZEN_KEY =
    "olympCitizenProfile";

const OLYMP_AVATAR_KEY =
    "olympCitizenAvatar";

const OLYMP_LAST_APPLICATION_KEY =
    "olymp_last_application";

const OLYMP_LAST_ACCESS_CODE_KEY =
    "olymp_last_access_code";


/* =========================================================
   VERSION
========================================================= */

const OLYMP_FRONTEND_VERSION =
    "4.0";


/* =========================================================
   SESSION AGE
========================================================= */

const OLYMP_SESSION_MAX_AGE =
    30 * 24 * 60 * 60 * 1000;


/* =========================================================
   GLOBAL STATE
========================================================= */

let olympCurrentCitizen =
    null;

let olympCurrentApplications =
    [];

let olympCurrentAvatar =
    "";

let currentCategory =
    "all";

let selectedService =
    "";

let olympToastTimer =
    null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeGovernmentPortal();

    }
);


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeGovernmentPortal() {

    try {

        initializeMobileMenu();

        initializeHeader();

        initializeServices();

        initializeApplicationForm();

        initializeModals();

        initializeApplyButton();

        initializeAvatarSystem();

        initializeScrollAnimations();

        initializeSmoothScroll();

        updateServiceCounter();

        await initializeCitizenSession();

        console.log(
            "OLYMP Government Frontend " +
            OLYMP_FRONTEND_VERSION +
            " запущено."
        );

    } catch (error) {

        console.error(
            "OLYMP Government initialization error:",
            error
        );

    }

}


/* =========================================================
   CITIZEN SESSION
========================================================= */

async function initializeCitizenSession() {

    const session =
        loadOlympSession();


    if (!session) {

        updatePublicUserInterface(
            null
        );

        return;

    }


    if (
        session.savedAt &&
        Date.now() -
        Number(session.savedAt) >
        OLYMP_SESSION_MAX_AGE
    ) {

        clearOlympSession();

        updatePublicUserInterface(
            null
        );

        return;

    }


    if (
        !session.olympId ||
        !session.password
    ) {

        clearOlympSession();

        updatePublicUserInterface(
            null
        );

        return;

    }


    /*
       Сначала пробуем взять
       сохранённый профиль.
    */

    const cachedCitizen =
        loadCachedCitizen();


    if (cachedCitizen) {

        olympCurrentCitizen =
            cachedCitizen;


        olympCurrentAvatar =
            getCitizenAvatar(
                cachedCitizen
            );


        updatePublicUserInterface(
            cachedCitizen
        );

    }


    /*
       Затем обязательно проверяем
       пользователя через API.
    */

    try {

        const response =
            await olympApiRequest(
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


        const citizen =
            normalizeCitizen(
                response.citizen ||
                response.profile ||
                response.user ||
                null
            );


        if (!citizen) {

            throw new Error(
                "Дані громадянина не отримано."
            );

        }


        olympCurrentCitizen =
            citizen;


        olympCurrentAvatar =
            getCitizenAvatar(
                citizen
            );


        saveCachedCitizen(
            citizen
        );


        if (
            olympCurrentAvatar
        ) {

            saveAvatarLocally(
                olympCurrentAvatar
            );

        }


        olympCurrentApplications =
            normalizeApplications(
                response.applications ||
                response.requests ||
                response.myApplications ||
                []
            );


        updatePublicUserInterface(
            citizen
        );


        saveOlympSession(
            session.olympId,
            session.password
        );


    } catch (error) {

        console.warn(
            "PUBLIC SESSION ERROR:",
            error
        );


        /*
           Якщо API не відповів,
           але локальний профіль є —
           не приховуємо його миттєво.
        */

        if (
            !olympCurrentCitizen
        ) {

            updatePublicUserInterface(
                null
            );

        }

    }

}


/* =========================================================
   LOAD SESSION
========================================================= */

function loadOlympSession() {

    try {

        const raw =
            localStorage.getItem(
                OLYMP_SESSION_KEY
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

        console.warn(
            "SESSION LOAD ERROR:",
            error
        );


        return null;

    }

}


/* =========================================================
   SAVE SESSION
========================================================= */

function saveOlympSession(
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
            OLYMP_FRONTEND_VERSION,

        olympId:
            String(
                olympId
            )
                .trim()
                .toUpperCase(),

        password:
            String(
                password
            )
                .trim(),

        savedAt:
            Date.now()

    };


    try {

        localStorage.setItem(
            OLYMP_SESSION_KEY,
            JSON.stringify(
                session
            )
        );

    } catch (error) {

        console.warn(
            "SESSION SAVE ERROR:",
            error
        );

    }

}


/* =========================================================
   CLEAR SESSION
========================================================= */

function clearOlympSession() {

    try {

        localStorage.removeItem(
            OLYMP_SESSION_KEY
        );

    } catch (error) {

        console.warn(
            "SESSION CLEAR ERROR:",
            error
        );

    }


    olympCurrentCitizen =
        null;

    olympCurrentApplications =
        [];

    olympCurrentAvatar =
        "";

}


/* =========================================================
   CACHE CITIZEN
========================================================= */

function saveCachedCitizen(
    citizen
) {

    if (!citizen) {

        return;

    }


    try {

        localStorage.setItem(
            OLYMP_CITIZEN_KEY,
            JSON.stringify(
                citizen
            )
        );

    } catch (error) {

        console.warn(
            "CITIZEN CACHE ERROR:",
            error
        );

    }

}


/* =========================================================
   LOAD CACHED CITIZEN
========================================================= */

function loadCachedCitizen() {

    try {

        const raw =
            localStorage.getItem(
                OLYMP_CITIZEN_KEY
            );


        if (!raw) {

            return null;

        }


        const citizen =
            JSON.parse(
                raw
            );


        return normalizeCitizen(
            citizen
        );

    } catch (error) {

        return null;

    }

}


/* =========================================================
   AVATAR SYSTEM
========================================================= */

function initializeAvatarSystem() {

    /*
       Поле прямого URL:

       id="avatarUrl"
    */

    const avatarInput =
        document.getElementById(
            "avatarUrl"
        );


    if (avatarInput) {

        avatarInput.addEventListener(
            "input",
            function () {

                const value =
                    cleanAvatarUrl(
                        this.value
                    );


                previewAvatar(
                    value
                );

            }
        );


        avatarInput.addEventListener(
            "change",
            function () {

                const value =
                    cleanAvatarUrl(
                        this.value
                    );


                previewAvatar(
                    value
                );

            }
        );


        const citizen =
            olympCurrentCitizen ||
            loadCachedCitizen();


        if (citizen) {

            const avatar =
                getCitizenAvatar(
                    citizen
                );


            if (avatar) {

                avatarInput.value =
                    avatar;

                previewAvatar(
                    avatar
                );

            }

        }

    }


    /*
       Кнопка сохранения аватара.

       Поддерживаем:

       #saveAvatarButton
       #saveProfileButton
       .save-avatar-button
    */

    const saveButtons =
        document.querySelectorAll(
            "#saveAvatarButton, " +
            "#saveProfileButton, " +
            ".save-avatar-button"
        );


    saveButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    /*
                       Если кнопка находится
                       внутри формы — submit
                       отдельно не блокируем.
                    */

                    if (
                        button.type !==
                        "submit"
                    ) {

                        event.preventDefault();

                    }


                    saveCitizenAvatar();

                }
            );

        }
    );


    /*
       Первичне відображення.
    */

    const citizen =
        olympCurrentCitizen ||
        loadCachedCitizen();


    if (citizen) {

        updateAllAvatarElements(
            getCitizenAvatar(
                citizen
            )
        );

    }

}


/* =========================================================
   GET AVATAR
========================================================= */

function getCitizenAvatar(
    citizen
) {

    if (
        !citizen ||
        typeof citizen !== "object"
    ) {

        return "";

    }


    return cleanAvatarUrl(
        citizen.avatarUrl ||
        citizen.avatar ||
        citizen.photo ||
        citizen.photoUrl ||
        ""
    );

}


/* =========================================================
   CLEAN AVATAR URL
========================================================= */

function cleanAvatarUrl(
    value
) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    const url =
        String(
            value
        )
            .trim();


    if (!url) {

        return "";

    }


    /*
       Дозволяємо лише HTTP/HTTPS.
    */

    if (
        !/^https?:\/\//i.test(
            url
        )
    ) {

        return "";

    }


    return url;

}


/* =========================================================
   SAVE AVATAR
========================================================= */

async function saveCitizenAvatar() {

    const session =
        loadOlympSession();


    if (!session) {

        showOlympToast(
            "Для зміни аватара необхідно увійти до особистого кабінету.",
            "error"
        );

        return;

    }


    const avatarInput =
        document.getElementById(
            "avatarUrl"
        );


    if (!avatarInput) {

        showOlympToast(
            "Поле аватара не знайдено.",
            "error"
        );

        return;

    }


    const avatarUrl =
        cleanAvatarUrl(
            avatarInput.value
        );


    if (
        avatarInput.value.trim() &&
        !avatarUrl
    ) {

        showOlympToast(
            "Вкажіть коректне пряме HTTPS-посилання на зображення.",
            "error"
        );

        return;

    }


    try {

        showOlympLoading(
            "Збереження аватара..."
        );


        const response =
            await olympApiRequest(
                "updateProfile",
                {

                    olympId:
                        session.olympId,

                    idNumber:
                        session.olympId,

                    password:
                        session.password,

                    avatarUrl:
                        avatarUrl

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


        olympCurrentAvatar =
            avatarUrl;


        if (
            !olympCurrentCitizen
        ) {

            olympCurrentCitizen = {};

        }


        olympCurrentCitizen.avatarUrl =
            avatarUrl;


        saveCachedCitizen(
            olympCurrentCitizen
        );


        saveAvatarLocally(
            avatarUrl
        );


        updateAllAvatarElements(
            avatarUrl
        );


        showOlympToast(
            "Аватар успішно збережено.",
            "success"
        );


    } catch (error) {

        console.error(
            "SAVE AVATAR ERROR:",
            error
        );


        showOlympToast(
            error.message ||
            "Не вдалося зберегти аватар.",
            "error"
        );


    } finally {

        hideOlympLoading();

    }

}


/* =========================================================
   LOCAL AVATAR
========================================================= */

function saveAvatarLocally(
    avatarUrl
) {

    try {

        if (avatarUrl) {

            localStorage.setItem(
                OLYMP_AVATAR_KEY,
                avatarUrl
            );

        } else {

            localStorage.removeItem(
                OLYMP_AVATAR_KEY
            );

        }

    } catch (error) {

        console.warn(
            "AVATAR STORAGE ERROR:",
            error
        );

    }

}


/* =========================================================
   UPDATE ALL AVATARS
========================================================= */

function updateAllAvatarElements(
    avatarUrl
) {

    const url =
        cleanAvatarUrl(
            avatarUrl
        );


    /*
       Підтримувані ID.
    */

    const ids = [

        "profileAvatar",

        "headerAvatar",

        "userAvatar",

        "citizenAvatar",

        "cabinetAvatar",

        "mainAvatar",

        "accountAvatar",

        "avatarPreview"

    ];


    ids.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                applyAvatarToElement(
                    element,
                    url
                );

            }

        }
    );


    /*
       Підтримка класів.

       <img class="profile-avatar">
       <div class="profile-avatar">
    */

    const classes = [

        ".profile-avatar",

        ".header-avatar",

        ".user-avatar",

        ".citizen-avatar",

        ".cabinet-avatar",

        ".main-avatar",

        ".account-avatar",

        ".avatar"

    ];


    classes.forEach(
        function (selector) {

            document
                .querySelectorAll(
                    selector
                )
                .forEach(
                    function (element) {

                        applyAvatarToElement(
                            element,
                            url
                        );

                    }
                );

        }
    );


    /*
       Якщо аватара немає —
       показуємо ініціали.
    */

    if (!url) {

        const name =
            olympCurrentCitizen
                ? olympCurrentCitizen.fullName
                : "";


        updateAvatarInitials(
            name
        );

    }

}


/* =========================================================
   APPLY AVATAR
========================================================= */

function applyAvatarToElement(
    element,
    url
) {

    if (!element) {

        return;

    }


    if (
        element.tagName ===
        "IMG"
    ) {

        if (url) {

            element.src =
                url;


            element.removeAttribute(
                "data-avatar-empty"
            );


            element.onerror =
                function () {

                    this.setAttribute(
                        "data-avatar-empty",
                        "true"
                    );


                    this.removeAttribute(
                        "src"
                    );


                    this.alt =
                        "Аватар";

                    updateAvatarInitialsForElement(
                        this
                    );

                };

        } else {

            element.removeAttribute(
                "src"
            );


            element.alt =
                "Аватар";


            element.setAttribute(
                "data-avatar-empty",
                "true"
            );

        }


        return;

    }


    /*
       DIV / SPAN / BUTTON
    */

    if (url) {

        element.style.backgroundImage =
            "url(\"" +
            escapeCssUrl(
                url
            ) +
            "\")";


        element.style.backgroundSize =
            "cover";


        element.style.backgroundPosition =
            "center";


        element.style.backgroundRepeat =
            "no-repeat";


        element.classList.add(
            "has-avatar"
        );


        element.classList.remove(
            "avatar-empty"
        );


        /*
           Якщо всередині є текст —
           ховаємо його.
        */

        element.dataset.avatarText =
            element.textContent;


        element.style.color =
            "transparent";

    } else {

        element.style.backgroundImage =
            "none";


        element.classList.remove(
            "has-avatar"
        );


        element.classList.add(
            "avatar-empty"
        );


        element.style.color =
            "";


        if (
            element.dataset.avatarText
        ) {

            element.textContent =
                element.dataset.avatarText;

        }

    }

}


/* =========================================================
   ESCAPE CSS URL
========================================================= */

function escapeCssUrl(
    value
) {

    return String(
        value
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /"/g,
            '\\"'
        )
        .replace(
            /\n/g,
            ""
        )
        .replace(
            /\r/g,
            ""
        );

}


/* =========================================================
   AVATAR INITIALS
========================================================= */

function updateAvatarInitials(
    fullName
) {

    const name =
        clean(
            fullName
        );


    let initials =
        "👤";


    if (name) {

        const words =
            name.split(
                " "
            );


        initials =
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


        if (!initials) {

            initials =
                "👤";

        }

    }


    document
        .querySelectorAll(
            ".profile-avatar, " +
            ".header-avatar, " +
            ".user-avatar, " +
            ".citizen-avatar, " +
            ".cabinet-avatar, " +
            ".main-avatar, " +
            ".account-avatar, " +
            ".avatar"
        )
        .forEach(
            function (element) {

                if (
                    element.tagName !==
                    "IMG"
                ) {

                    if (
                        !element.classList.contains(
                            "has-avatar"
                        )
                    ) {

                        element.textContent =
                            initials;

                    }

                }

            }
        );

}


/* =========================================================
   AVATAR PREVIEW
========================================================= */

function previewAvatar(
    avatarUrl
) {

    const url =
        cleanAvatarUrl(
            avatarUrl
        );


    const previewIds = [

        "avatarPreview",

        "profileAvatarPreview",

        "avatarImagePreview"

    ];


    previewIds.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                applyAvatarToElement(
                    element,
                    url
                );

            }

        }
    );

}


/* =========================================================
   AVATAR INITIALS FOR BROKEN IMG
========================================================= */

function updateAvatarInitialsForElement(
    element
) {

    if (!element) {

        return;

    }


    const parent =
        element.parentElement;


    if (!parent) {

        return;

    }


    if (
        element.tagName ===
        "IMG"
    ) {

        parent.classList.add(
            "avatar-image-error"
        );


        const name =
            olympCurrentCitizen
                ? olympCurrentCitizen.fullName
                : "";


        const words =
            clean(
                name
            ).split(
                " "
            );


        let initials =
            "👤";


        if (
            words.length >= 2
        ) {

            initials =
                words[0]
                    .charAt(0)
                    .toUpperCase() +
                words[1]
                    .charAt(0)
                    .toUpperCase();

        }


        parent.setAttribute(
            "data-initials",
            initials
        );

    }

}


/* =========================================================
   PUBLIC USER INTERFACE
========================================================= */

function updatePublicUserInterface(
    citizen
) {

    if (!citizen) {

        /*
           Не авторизований.
        */

        document
            .querySelectorAll(
                "[data-auth-user]"
            )
            .forEach(
                function (element) {

                    element.classList.add(
                        "hidden"
                    );

                }
            );


        document
            .querySelectorAll(
                "[data-auth-guest]"
            )
            .forEach(
                function (element) {

                    element.classList.remove(
                        "hidden"
                    );

                }
            );


        return;

    }


    const olympId =
        citizen.olympId ||
        "";


    const fullName =
        citizen.fullName ||
        "";


    const avatarUrl =
        getCitizenAvatar(
            citizen
        );


    olympCurrentAvatar =
        avatarUrl;


    /*
       Елементи імені.
    */

    document
        .querySelectorAll(
            "[data-citizen-name], " +
            "[data-user-name], " +
            ".citizen-name, " +
            ".user-name"
        )
        .forEach(
            function (element) {

                element.textContent =
                    fullName ||
                    "Громадянин";

            }
        );


    /*
       OLYMP-ID.
    */

    document
        .querySelectorAll(
            "[data-citizen-id], " +
            "[data-olymp-id], " +
            ".citizen-id"
        )
        .forEach(
            function (element) {

                element.textContent =
                    olympId ||
                    "—";

            }
        );


    /*
       Аватар.
    */

    updateAllAvatarElements(
        avatarUrl
    );


    /*
       Авторизований.
    */

    document
        .querySelectorAll(
            "[data-auth-user]"
        )
        .forEach(
            function (element) {

                element.classList.remove(
                    "hidden"
                );

            }
        );


    /*
       Гість.
    */

    document
        .querySelectorAll(
            "[data-auth-guest]"
        )
        .forEach(
            function (element) {

                element.classList.add(
                    "hidden"
                );

            }
        );


    /*
       Оновлення кнопки кабінету.
    */

    document
        .querySelectorAll(
            "[data-cabinet-button]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    "Особистий кабінет";

            }
        );

}


/* =========================================================
   MOBILE MENU
========================================================= */

function initializeMobileMenu() {

    const menuButton =
        document.getElementById(
            "menuButton"
        );


    const mainMenu =
        document.getElementById(
            "mainMenu"
        );


    if (
        !menuButton ||
        !mainMenu
    ) {

        return;

    }


    menuButton.addEventListener(
        "click",
        function () {

            mainMenu.classList.toggle(
                "active"
            );


            const isOpen =
                mainMenu.classList.contains(
                    "active"
                );


            menuButton.setAttribute(
                "aria-expanded",
                String(
                    isOpen
                )
            );

        }
    );


    mainMenu
        .querySelectorAll(
            "a"
        )
        .forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function () {

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
            window.scrollY >
            50
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
            passive:
                true
        }
    );


    updateHeader();

}


/* =========================================================
   SERVICES
========================================================= */

function initializeServices() {

    const searchInput =
        document.getElementById(
            "serviceSearch"
        );


    const clearSearch =
        document.getElementById(
            "clearSearch"
        );


    const categoryButtons =
        document.querySelectorAll(
            ".category-btn"
        );


    syncApplicationServices();


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterServices
        );

    }


    if (clearSearch) {

        clearSearch.addEventListener(
            "click",
            function () {

                if (searchInput) {

                    searchInput.value =
                        "";

                    searchInput.focus();

                }


                filterServices();

            }
        );

    }


    categoryButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    categoryButtons.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    currentCategory =
                        button.dataset.category ||
                        "all";


                    filterServices();

                }
            );

        }
    );


    filterServices();

}


/* =========================================================
   FILTER SERVICES
========================================================= */

function filterServices() {

    const searchInput =
        document.getElementById(
            "serviceSearch"
        );


    const noResults =
        document.getElementById(
            "noResults"
        );


    const clearSearch =
        document.getElementById(
            "clearSearch"
        );


    const serviceItems =
        document.querySelectorAll(
            ".service-item"
        );


    const searchText =
        searchInput
            ?
        searchInput.value
            .toLowerCase()
            .trim()
            :
        "";


    let visibleCount =
        0;


    serviceItems.forEach(
        function (service) {

            const title =
                (
                    service.dataset.title ||
                    ""
                )
                    .toLowerCase();


            const description =
                (
                    service.dataset.description ||
                    ""
                )
                    .toLowerCase();


            const requirements =
                (
                    service.dataset.requirements ||
                    ""
                )
                    .toLowerCase();


            const category =
                service.dataset.category ||
                "all";


            const matchesSearch =
                !searchText ||
                title.includes(
                    searchText
                ) ||
                description.includes(
                    searchText
                ) ||
                requirements.includes(
                    searchText
                );


            const matchesCategory =
                currentCategory ===
                    "all" ||
                category ===
                    currentCategory;


            if (
                matchesSearch &&
                matchesCategory
            ) {

                service.classList.remove(
                    "hidden"
                );


                visibleCount++;

            } else {

                service.classList.add(
                    "hidden"
                );

            }

        }
    );


    if (noResults) {

        noResults.classList.toggle(
            "visible",
            visibleCount === 0
        );

    }


    if (clearSearch) {

        clearSearch.classList.toggle(
            "visible",
            searchText.length > 0
        );

    }

}


/* =========================================================
   SERVICE COUNTER
========================================================= */

function updateServiceCounter() {

    const counter =
        document.getElementById(
            "serviceCount"
        );


    if (!counter) {

        return;

    }


    const services =
        document.querySelectorAll(
            ".service-item"
        );


    counter.textContent =
        services.length;

}


/* =========================================================
   SYNCHRONIZE SERVICES
========================================================= */

function syncApplicationServices() {

    const select =
        document.getElementById(
            "applicationService"
        );


    if (!select) {

        return;

    }


    const services =
        document.querySelectorAll(
            ".service-item"
        );


    const previousValue =
        select.value;


    select.innerHTML =
        "";


    const firstOption =
        document.createElement(
            "option"
        );


    firstOption.value =
        "";


    firstOption.textContent =
        "Оберіть послугу";


    select.appendChild(
        firstOption
    );


    services.forEach(
        function (service) {

            const title =
                (
                    service.dataset.title ||
                    ""
                )
                    .trim();


            if (!title) {

                return;

            }


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                title;


            option.textContent =
                title;


            select.appendChild(
                option
            );

        }
    );


    if (previousValue) {

        const exists =
            Array.from(
                select.options
            )
                .some(
                    function (option) {

                        return (
                            option.value ===
                            previousValue
                        );

                    }
                );


        if (exists) {

            select.value =
                previousValue;

        }

    }

}


/* =========================================================
   OPEN SERVICE
========================================================= */

function openService(
    button
) {

    if (!button) {

        return;

    }


    const card =
        button.closest(
            ".service-item"
        );


    if (!card) {

        return;

    }


    const serviceModal =
        document.getElementById(
            "serviceModal"
        );


    if (!serviceModal) {

        return;

    }


    selectedService =
        card.dataset.title ||
        "";


    const modalTitle =
        document.getElementById(
            "modalTitle"
        );


    const modalDescription =
        document.getElementById(
            "modalDescription"
        );


    const modalRequirements =
        document.getElementById(
            "modalRequirements"
        );


    const modalCategory =
        document.getElementById(
            "modalCategory"
        );


    const modalIcon =
        document.getElementById(
            "modalIcon"
        );


    if (modalTitle) {

        modalTitle.textContent =
            card.dataset.title ||
            "Державна послуга";

    }


    if (modalDescription) {

        modalDescription.textContent =
            card.dataset.description ||
            "Інформація про послугу.";

    }


    if (modalRequirements) {

        modalRequirements.textContent =
            card.dataset.requirements ||
            "Не вказано.";

    }


    if (modalCategory) {

        const category =
            card.querySelector(
                ".service-category"
            );


        modalCategory.textContent =
            category
                ?
            category.textContent.trim()
                :
            "ДЕРЖАВНА ПОСЛУГА";

    }


    if (modalIcon) {

        const icon =
            card.querySelector(
                ".service-icon"
            );


        modalIcon.textContent =
            icon
                ?
            icon.textContent.trim()
                :
            "🏛️";

    }


    serviceModal.classList.add(
        "active"
    );


    serviceModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   CLOSE SERVICE MODAL
========================================================= */

function closeServiceModal() {

    const modal =
        document.getElementById(
            "serviceModal"
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


    updateBodyModalState();

}


/* =========================================================
   OPEN APPLICATION MODAL
========================================================= */

function openApplicationModal(
    serviceName = ""
) {

    /*
       ГОЛОВНЕ ВИПРАВЛЕННЯ:

       Перед відкриттям форми
       перевіряємо авторизацію.
    */

    const session =
        loadOlympSession();


    if (!session) {

        showOlympToast(
            "Для подання заявки необхідно увійти до особистого кабінету.",
            "error"
        );


        /*
           Пробуємо перейти
           до кабінету.
        */

        setTimeout(
            function () {

                const cabinetLink =
                    document.querySelector(
                        'a[href*="cabinet"]'
                    );


                if (cabinetLink) {

                    cabinetLink.click();

                }

            },
            700
        );


        return;

    }


    const applicationModal =
        document.getElementById(
            "applicationModal"
        );


    if (!applicationModal) {

        console.error(
            "applicationModal не найден."
        );

        return;

    }


    syncApplicationServices();


    const applicationService =
        document.getElementById(
            "applicationService"
        );


    if (
        serviceName &&
        applicationService
    ) {

        const normalizedService =
            serviceName.trim();


        const option =
            Array.from(
                applicationService.options
            )
                .find(
                    function (item) {

                        return (
                            item.value ===
                            normalizedService
                        );

                    }
                );


        if (option) {

            applicationService.value =
                normalizedService;

        }

    }


    /*
       Автоматично заповнюємо
       дані громадянина.
    */

    fillApplicationFromCitizen();


    applicationModal.classList.add(
        "active"
    );


    applicationModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   FILL APPLICATION FROM CITIZEN
========================================================= */

function fillApplicationFromCitizen() {

    const citizen =
        olympCurrentCitizen ||
        loadCachedCitizen();


    if (!citizen) {

        return;

    }


    setInputValueIfEmpty(
        "fullName",
        citizen.fullName
    );


    setInputValueIfEmpty(
        "birthDate",
        citizen.birthDate
    );


    setInputValueIfEmpty(
        "phone",
        citizen.phone
    );


    setInputValueIfEmpty(
        "email",
        citizen.email
    );


    setInputValueIfEmpty(
        "discord",
        citizen.discord
    );


    setInputValueIfEmpty(
        "contact",
        citizen.contact
    );

}


/* =========================================================
   SET INPUT IF EMPTY
========================================================= */

function setInputValueIfEmpty(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        !element ||
        !value
    ) {

        return;

    }


    if (
        !element.value.trim()
    ) {

        element.value =
            value;

    }

}


/* =========================================================
   CLOSE APPLICATION MODAL
========================================================= */

function closeApplicationModal() {

    const modal =
        document.getElementById(
            "applicationModal"
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


    resetApplicationModal();

    updateBodyModalState();

}


/* =========================================================
   BODY MODAL STATE
========================================================= */

function updateBodyModalState() {

    const serviceModal =
        document.getElementById(
            "serviceModal"
        );


    const applicationModal =
        document.getElementById(
            "applicationModal"
        );


    const serviceActive =
        serviceModal &&
        serviceModal.classList.contains(
            "active"
        );


    const applicationActive =
        applicationModal &&
        applicationModal.classList.contains(
            "active"
        );


    if (
        serviceActive ||
        applicationActive
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
   APPLICATION FORM
========================================================= */

function initializeApplicationForm() {

    const form =
        document.getElementById(
            "applicationForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        handleApplicationSubmit
    );

}


/* =========================================================
   HANDLE APPLICATION SUBMIT
========================================================= */

async function handleApplicationSubmit(
    event
) {

    event.preventDefault();


    const form =
        event.currentTarget;


    /*
       =====================================================
       ПЕРЕВІРКА АВТОРИЗАЦІЇ
       =====================================================
    */

    const session =
        loadOlympSession();


    if (!session) {

        showFormError(
            "Для подання заявки необхідно увійти до особистого кабінету."
        );


        return;

    }


    if (
        !session.olympId ||
        !session.password
    ) {

        clearOlympSession();


        showFormError(
            "Сесію користувача втрачено. Увійдіть до особистого кабінету повторно."
        );


        return;

    }


    const submitButton =
        form.querySelector(
            ".form-submit"
        );


    if (
        submitButton &&
        submitButton.disabled
    ) {

        return;

    }


    /*
       =====================================================
       ПОЛЯ
       =====================================================
    */

    const fullNameInput =
        document.getElementById(
            "fullName"
        );


    const birthDateInput =
        document.getElementById(
            "birthDate"
        );


    const phoneInput =
        document.getElementById(
            "phone"
        );


    const emailInput =
        document.getElementById(
            "email"
        );


    const discordInput =
        document.getElementById(
            "discord"
        );


    const serviceInput =
        document.getElementById(
            "applicationService"
        );


    const contactInput =
        document.getElementById(
            "contact"
        );


    const messageInput =
        document.getElementById(
            "message"
        );


    const fullName =
        fullNameInput
            ?
        fullNameInput.value.trim()
            :
        "";


    const birthDate =
        birthDateInput
            ?
        birthDateInput.value.trim()
            :
        "";


    const phone =
        phoneInput
            ?
        phoneInput.value.trim()
            :
        "";


    const email =
        emailInput
            ?
        emailInput.value.trim()
            :
        "";


    const discord =
        discordInput
            ?
        discordInput.value.trim()
            :
        "";


    const service =
        serviceInput
            ?
        serviceInput.value.trim()
            :
        "";


    const contact =
        contactInput
            ?
        contactInput.value.trim()
            :
        "";


    const message =
        messageInput
            ?
        messageInput.value.trim()
            :
        "";


    /*
       =====================================================
       ВАЛІДАЦІЯ
       =====================================================
    */

    if (!fullName) {

        showFormError(
            "Будь ласка, вкажіть ПІБ."
        );


        focusElement(
            fullNameInput
        );


        return;

    }


    if (!service) {

        showFormError(
            "Будь ласка, оберіть державну послугу."
        );


        focusElement(
            serviceInput
        );


        return;

    }


    if (!message) {

        showFormError(
            "Будь ласка, опишіть ваше звернення."
        );


        focusElement(
            messageInput
        );


        return;

    }


    if (
        !phone &&
        !email &&
        !discord &&
        !contact
    ) {

        showFormError(
            "Вкажіть хоча б один спосіб зв'язку."
        );


        focusElement(
            phoneInput
        );


        return;

    }


    /*
       =====================================================
       URL
       =====================================================
    */

    if (
        !GOOGLE_SCRIPT_URL ||
        GOOGLE_SCRIPT_URL.includes(
            "ВСТАВЬ"
        )
    ) {

        showFormError(
            "Google Apps Script ще не підключено."
        );


        return;

    }


    /*
       =====================================================
       BUTTON
       =====================================================
    */

    setSubmitState(
        submitButton,
        true
    );


    showOlympLoading(
        "Реєстрація заявки..."
    );


    /*
       =====================================================
       FORM DATA
       =====================================================
    */

    const formData =
        new URLSearchParams();


    formData.append(
        "action",
        "application"
    );


    /*
       ГОЛОВНЕ:

       Передаємо OLYMP-ID
       авторизованого користувача.
    */

    formData.append(
        "olympId",
        session.olympId
    );


    formData.append(
        "idNumber",
        session.olympId
    );


    /*
       ПІБ
    */

    formData.append(
        "fullName",
        fullName
    );


    formData.append(
        "birthDate",
        birthDate
    );


    formData.append(
        "phone",
        phone
    );


    formData.append(
        "email",
        email
    );


    formData.append(
        "discord",
        discord
    );


    formData.append(
        "service",
        service
    );


    formData.append(
        "contact",
        contact
    );


    formData.append(
        "message",
        message
    );


    formData.append(
        "source",
        "OLYMP Government Website"
    );


    /*
       =====================================================
       AVATAR
       =====================================================
    */

    if (
        olympCurrentAvatar
    ) {

        formData.append(
            "avatarUrl",
            olympCurrentAvatar
        );

    }


    /*
       =====================================================
       SEND
       =====================================================
    */

    try {

        const response =
            await fetch(
                GOOGLE_SCRIPT_URL,
                {

                    method:
                        "POST",

                    body:
                        formData

                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const responseText =
            await response.text();


        console.log(
            "Google Apps Script response:",
            responseText
        );


        let result;


        try {

            result =
                JSON.parse(
                    responseText
                );

        } catch (parseError) {

            console.error(
                "JSON PARSE ERROR:",
                parseError
            );


            throw new Error(
                "Google Apps Script повернув некоректну відповідь."
            );

        }


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result &&
                result.message
                    ?
                result.message
                    :
                "Заявку не було зареєстровано."
            );

        }


        /*
           =================================================
           SUCCESS
           =================================================
        */

        showApplicationSuccess(
            result
        );


    } catch (error) {

        console.error(
            "APPLICATION SUBMIT ERROR:",
            error
        );


        showFormError(
            error.message ||
            "Не вдалося відправити заявку. Спробуйте ще раз."
        );


        setSubmitState(
            submitButton,
            false
        );

    } finally {

        hideOlympLoading();

    }

}


/* =========================================================
   APPLICATION SUCCESS
========================================================= */

function showApplicationSuccess(
    result
) {

    const form =
        document.getElementById(
            "applicationForm"
        );


    const successMessage =
        document.getElementById(
            "successMessage"
        );


    const applicationNumber =
        document.getElementById(
            "applicationNumber"
        );


    const number =
        result &&
        result.application &&
        result.application.number
            ?
        result.application.number
            :
        result &&
        result.number
            ?
        result.number
            :
        "OLYMP-000000";


    const accessCode =
        result &&
        result.application &&
        result.application.accessCode
            ?
        result.application.accessCode
            :
        result &&
        result.accessCode
            ?
        result.accessCode
            :
        "";


    if (form) {

        form.style.display =
            "none";

    }


    if (applicationNumber) {

        applicationNumber.textContent =
            "№ " +
            number;

    }


    /*
       ACCESS CODE
    */

    let accessCodeElement =
        document.getElementById(
            "applicationAccessCode"
        );


    if (
        accessCode &&
        successMessage
    ) {

        if (!accessCodeElement) {

            accessCodeElement =
                document.createElement(
                    "div"
                );


            accessCodeElement.id =
                "applicationAccessCode";


            accessCodeElement.className =
                "success-access-code";


            successMessage.insertBefore(
                accessCodeElement,
                successMessage.querySelector(
                    "button"
                )
            );

        }


        accessCodeElement.innerHTML =
            `
                <strong>
                    Код доступу:
                </strong>

                <span>
                    ${escapeHtml(accessCode)}
                </span>

                <br>

                <small>
                    Збережіть цей код. Він потрібен
                    для входу до особистого кабінету.
                </small>
            `;

    }


    /*
       STATUS
    */

    if (successMessage) {

        let statusElement =
            document.getElementById(
                "applicationStatus"
            );


        if (!statusElement) {

            statusElement =
                document.createElement(
                    "div"
                );


            statusElement.id =
                "applicationStatus";


            statusElement.style.margin =
                "10px 0";


            statusElement.style.fontWeight =
                "600";


            successMessage.insertBefore(
                statusElement,
                successMessage.querySelector(
                    "button"
                )
            );

        }


        const status =
            result &&
            result.application &&
            result.application.status
                ?
            result.application.status
                :
            result &&
            result.status
                ?
            result.status
                :
            "🟡 На розгляді";


        statusElement.textContent =
            "Статус: " +
            status;


        successMessage.classList.add(
            "active"
        );

    }


    /*
       LOCAL STORAGE
    */

    try {

        localStorage.setItem(
            OLYMP_LAST_APPLICATION_KEY,
            number
        );


        if (accessCode) {

            localStorage.setItem(
                OLYMP_LAST_ACCESS_CODE_KEY,
                accessCode
            );

        }

    } catch (error) {

        console.warn(
            "LocalStorage unavailable:",
            error
        );

    }


    /*
       Оновлюємо локальний список заявок.
    */

    const application =
        result &&
        result.application
            ?
        normalizeApplication(
            result.application
        )
            :
        null;


    if (application) {

        olympCurrentApplications.unshift(
            application
        );

    }


    showOlympToast(
        "Заявку успішно зареєстровано.",
        "success"
    );

}


/* =========================================================
   RESET APPLICATION MODAL
========================================================= */

function resetApplicationModal() {

    const form =
        document.getElementById(
            "applicationForm"
        );


    const successMessage =
        document.getElementById(
            "successMessage"
        );


    if (form) {

        form.reset();

        form.style.display =
            "";

    }


    if (successMessage) {

        successMessage.classList.remove(
            "active"
        );

    }


    const accessCodeElement =
        document.getElementById(
            "applicationAccessCode"
        );


    if (accessCodeElement) {

        accessCodeElement.remove();

    }


    const statusElement =
        document.getElementById(
            "applicationStatus"
        );


    if (statusElement) {

        statusElement.remove();

    }


    if (form) {

        const button =
            form.querySelector(
                ".form-submit"
            );


        if (button) {

            setSubmitState(
                button,
                false
            );

        }

    }


    syncApplicationServices();

}


/* =========================================================
   FORM ERROR
========================================================= */

function showFormError(
    message
) {

    showOlympToast(
        message,
        "error"
    );

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
   SUBMIT BUTTON STATE
========================================================= */

function setSubmitState(
    button,
    loading
) {

    if (!button) {

        return;

    }


    if (loading) {

        button.disabled =
            true;


        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent.trim();

        }


        button.textContent =
            "Відправлення...";

    } else {

        button.disabled =
            false;


        button.textContent =
            button.dataset.originalText ||
            "Надіслати заявку";

    }

}


/* =========================================================
   MODALS
========================================================= */

function initializeModals() {

    const serviceModal =
        document.getElementById(
            "serviceModal"
        );


    const applicationModal =
        document.getElementById(
            "applicationModal"
        );


    if (serviceModal) {

        serviceModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    serviceModal
                ) {

                    closeServiceModal();

                }

            }
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


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            closeServiceModal();

            closeApplicationModal();

        }
    );

}


/* =========================================================
   APPLY BUTTON
========================================================= */

function initializeApplyButton() {

    const applyFromService =
        document.getElementById(
            "applyFromService"
        );


    if (!applyFromService) {

        return;

    }


    applyFromService.addEventListener(
        "click",
        function () {

            const service =
                selectedService;


            closeServiceModal();


            setTimeout(
                function () {

                    openApplicationModal(
                        service
                    );

                },
                100
            );

        }
    );

}


/* =========================================================
   SCROLL ANIMATIONS
========================================================= */

function initializeScrollAnimations() {

    const animatedElements =
        document.querySelectorAll(
            ".service-card, " +
            ".government-card, " +
            ".news-card, " +
            ".law-card, " +
            ".contact-card"
        );


    if (
        !animatedElements.length
    ) {

        return;

    }


    if (
        !(
            "IntersectionObserver"
            in
            window
        )
    ) {

        animatedElements.forEach(
            function (element) {

                element.classList.add(
                    "show"
                );

            }
        );


        return;

    }


    const observer =
        new IntersectionObserver(
            function (entries) {

                entries.forEach(
                    function (entry) {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "show"
                            );


                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold:
                    0.1
            }
        );


    animatedElements.forEach(
        function (element) {

            element.classList.add(
                "animate-element"
            );


            observer.observe(
                element
            );

        }
    );

}


/* =========================================================
   SMOOTH SCROLL
========================================================= */

function initializeSmoothScroll() {

    document.addEventListener(
        "click",
        function (event) {

            const link =
                event.target.closest(
                    'a[href^="#"]'
                );


            if (!link) {

                return;

            }


            const targetId =
                link.getAttribute(
                    "href"
                );


            if (
                !targetId ||
                targetId === "#"
            ) {

                return;

            }


            let target;


            try {

                target =
                    document.querySelector(
                        targetId
                    );

            } catch (error) {

                return;

            }


            if (!target) {

                return;

            }


            event.preventDefault();


            target.scrollIntoView(
                {

                    behavior:
                        "smooth",

                    block:
                        "start"

                }
            );

        }
    );

}


/* =========================================================
   API REQUEST
========================================================= */

async function olympApiRequest(
    action,
    params = {}
) {

    if (
        !GOOGLE_SCRIPT_URL ||
        GOOGLE_SCRIPT_URL.includes(
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
    )
        .forEach(
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
        GOOGLE_SCRIPT_URL +
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
            "API FETCH ERROR:",
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
            )
                .toUpperCase(),


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
            )
                .toLowerCase(),


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


        avatarUrl:
            cleanAvatarUrl(
                citizen.avatarUrl ||
                citizen.avatar ||
                citizen.photo ||
                citizen.photoUrl ||
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


    return applications
        .map(
            function (application) {

                return normalizeApplication(
                    application
                );

            }
        )
        .filter(
            function (application) {

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
            )
                .toUpperCase(),


        olympId:
            clean(
                application.olympId ||
                application.idNumber ||
                ""
            )
                .toUpperCase(),


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
            )
                .toUpperCase()

    };

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
   LOADING
========================================================= */

function showOlympLoading(
    text
) {

    const overlay =
        document.getElementById(
            "loadingOverlay"
        );


    if (!overlay) {

        return;

    }


    const textElement =
        overlay.querySelector(
            ".loading-box span"
        );


    if (textElement) {

        textElement.textContent =
            text ||
            "Будь ласка, зачекайте...";

    }


    overlay.classList.remove(
        "hidden"
    );

}


/* =========================================================
   HIDE LOADING
========================================================= */

function hideOlympLoading() {

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

function showOlympToast(
    message,
    type = ""
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        /*
           Якщо Toast у HTML немає,
           використовуємо console.
        */

        console.log(
            message
        );


        return;

    }


    clearTimeout(
        olympToastTimer
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


    olympToastTimer =
        setTimeout(
            hideOlympToast,
            3500
        );

}


/* =========================================================
   HIDE TOAST
========================================================= */

function hideOlympToast() {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {

        return;

    }


    toast.classList.remove(
        "visible"
    );

}


/* =========================================================
   LAST APPLICATION
========================================================= */

function getLastApplicationNumber() {

    try {

        return localStorage.getItem(
            OLYMP_LAST_APPLICATION_KEY
        );

    } catch (error) {

        return null;

    }

}


/* =========================================================
   COPY APPLICATION NUMBER
========================================================= */

function copyApplicationNumber() {

    const applicationNumber =
        document.getElementById(
            "applicationNumber"
        );


    if (!applicationNumber) {

        return;

    }


    const text =
        applicationNumber.textContent
            .replace(
                "№",
                ""
            )
            .trim();


    if (!text) {

        return;

    }


    copyText(
        text,
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
                "Clipboard unavailable"
            );

        }


        showOlympToast(
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

            showOlympToast(
                successMessage ||
                "Скопійовано.",
                "success"
            );

        } else {

            showOlympToast(
                "Не вдалося скопіювати.",
                "error"
            );

        }

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

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
   PUBLIC API
========================================================= */

window.openService =
    openService;


window.closeServiceModal =
    closeServiceModal;


window.openApplicationModal =
    openApplicationModal;


window.closeApplicationModal =
    closeApplicationModal;


window.copyApplicationNumber =
    copyApplicationNumber;


window.saveCitizenAvatar =
    saveCitizenAvatar;


window.getOlympCitizen =
    function () {

        return olympCurrentCitizen;

    };


window.getOlympSession =
    function () {

        return loadOlympSession();

    };


window.refreshOlympSession =
    function () {

        return initializeCitizenSession();

    };


window.logoutOlymp =
    function () {

        clearOlympSession();

        try {

            localStorage.removeItem(
                OLYMP_CITIZEN_KEY
            );

            localStorage.removeItem(
                OLYMP_AVATAR_KEY
            );

        } catch (error) {

            console.warn(
                error
            );

        }


        updatePublicUserInterface(
            null
        );


        showOlympToast(
            "Ви вийшли з кабінету.",
            "success"
        );

    };


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "%cOLYMP Government",
    "font-weight:bold;font-size:18px;"
);

console.log(
    "%cFrontend JavaScript 4.0 запущено.",
    "font-weight:bold;"
);

console.log(
    "Session:",
    loadOlympSession()
);

console.log(
    "Citizen:",
    olympCurrentCitizen
);

console.log(
    "Avatar:",
    olympCurrentAvatar
);
