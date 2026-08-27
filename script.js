/* =========================================================
   OLYMP GOVERNMENT
   MAIN SCRIPT 6.1
   GOOGLE APPS SCRIPT INTEGRATION
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const OLYMP_API_URL =
    "https://script.google.com/macros/s/AKfycbyynbAxu6A_tU5nBEUum357BCY6o8D-3e44wEtR-AlyOtV5un8mNgpmkvU6dtrIy0RvfQ/exec";


/* =========================================================
   GLOBAL USER STATE
========================================================= */

let currentUser = null;
let currentSessionToken = null;
let currentCitizenSession = null;


/* =========================================================
   LOAD SESSION
========================================================= */

function loadSession() {

    try {

        /* =====================================================
           СТАРА СИСТЕМА SESSION TOKEN
        ===================================================== */

        currentSessionToken =
            localStorage.getItem(
                "olymp_session_token"
            );


        /* =====================================================
           ПОЛЬЗОВАТЕЛЬ
        ===================================================== */

        const savedUser =
            localStorage.getItem(
                "olymp_user"
            );


        if (savedUser) {

            try {

                currentUser =
                    JSON.parse(
                        savedUser
                    );

            } catch (e) {

                currentUser = null;

            }

        }


        /* =====================================================
           СЕССИЯ ЛИЧНОГО КАБИНЕТА
           
           cabinet.js сохраняет:
           olympCitizenSession
        ===================================================== */

        const citizenSessionRaw =
            localStorage.getItem(
                "olympCitizenSession"
            );


        if (citizenSessionRaw) {

            try {

                currentCitizenSession =
                    JSON.parse(
                        citizenSessionRaw
                    );

            } catch (e) {

                currentCitizenSession =
                    null;

            }

        }


        /* =====================================================
           ЕСЛИ ЕСТЬ СЕССИЯ КАБИНЕТА,
           СОЗДАЁМ CURRENT USER
        ===================================================== */

        if (
            currentCitizenSession &&
            currentCitizenSession.olympId
        ) {

            if (!currentUser) {

                currentUser = {

                    olympId:
                        currentCitizenSession.olympId

                };

            }

        }


        console.log(
            "OLYMP SESSION:",
            {

                token:
                    currentSessionToken
                        ? "FOUND"
                        : "NOT FOUND",

                citizenSession:
                    currentCitizenSession
                        ? "FOUND"
                        : "NOT FOUND",

                olympId:
                    currentCitizenSession
                        ? currentCitizenSession.olympId
                        : null

            }
        );


    } catch (error) {

        console.error(
            "Помилка завантаження сесії:",
            error
        );


        currentSessionToken = null;

        currentUser = null;

        currentCitizenSession = null;

    }

}


/* =========================================================
   SAVE SESSION
========================================================= */

function saveSession(
    token,
    user
) {

    currentSessionToken =
        token || null;

    currentUser =
        user || null;


    if (token) {

        localStorage.setItem(
            "olymp_session_token",
            token
        );

    }


    if (user) {

        localStorage.setItem(
            "olymp_user",
            JSON.stringify(user)
        );

    }

}


/* =========================================================
   CLEAR SESSION
========================================================= */

function clearSession() {

    currentSessionToken = null;
    currentUser = null;

    localStorage.removeItem(
        "olymp_session_token"
    );

    localStorage.removeItem(
        "olymp_user"
    );

}


/* =========================================================
   API REQUEST
========================================================= */

async function olympApi(
    action,
    data = {}
) {

    if (
        !OLYMP_API_URL ||
        OLYMP_API_URL.indexOf("ВСТАВЬ_СЮДА") !== -1
    ) {

        throw new Error(
            "Не налаштовано URL Google Apps Script."
        );

    }


    const params =
        new URLSearchParams();


    params.append(
        "action",
        action
    );


    Object.keys(data).forEach(
        key => {

            const value =
                data[key];

            if (
                value !== undefined &&
                value !== null
            ) {

                params.append(
                    key,
                    String(value)
                );

            }

        }
    );


    const response =
        await fetch(
            OLYMP_API_URL,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/x-www-form-urlencoded;charset=UTF-8"

                },

                body:
                    params.toString()

            }
        );


    if (!response.ok) {

        throw new Error(
            "Помилка HTTP: " +
            response.status
        );

    }


    const result =
        await response.json();


    return result;

}


/* =========================================================
   VALIDATE SESSION
========================================================= */

async function validateCurrentSession() {

    if (!currentSessionToken) {

        return false;

    }


    try {

        const result =
            await olympApi(
                "validate",
                {

                    sessionToken:
                        currentSessionToken

                }
            );


        if (
            result &&
            result.success
        ) {

            return true;

        }


        clearSession();

        return false;

    } catch (error) {

        console.error(
            "Помилка перевірки сесії:",
            error
        );

        return false;

    }

}


/* =========================================================
   GET PROFILE
========================================================= */

async function loadCurrentProfile() {

    if (!currentSessionToken) {

        return null;

    }


    try {

        const result =
            await olympApi(
                "profile",
                {

                    olympId:
                        currentUser
                            ? currentUser.olympId
                            : "",

                    sessionToken:
                        currentSessionToken

                }
            );


        if (
            result &&
            result.success
        ) {

            currentUser =
                result.citizen ||
                result.profile ||
                result.user ||
                null;


            if (currentUser) {

                localStorage.setItem(
                    "olymp_user",
                    JSON.stringify(
                        currentUser
                    )
                );

            }


            return result;

        }


        return null;

    } catch (error) {

        console.error(
            "Помилка завантаження профілю:",
            error
        );

        return null;

    }

}


/* =========================================================
   REQUIRE LOGIN
========================================================= */

async function requireLogin() {

    loadSession();


    /* =====================================================
       ВАРИАНТ 1
       НОВАЯ СИСТЕМА SESSION TOKEN
    ===================================================== */

    if (currentSessionToken) {

        const valid =
            await validateCurrentSession();


        if (!valid) {

            alert(
                "Ваша сесія завершена. Увійдіть до особистого кабінету повторно."
            );


            window.location.href =
                "cabinet.html";


            return false;

        }


        if (!currentUser) {

            await loadCurrentProfile();

        }


        return true;

    }


    /* =====================================================
       ВАРИАНТ 2
       ТВОЯ ТЕКУЩАЯ СИСТЕМА CABINET
       
       olympCitizenSession
    ===================================================== */

    if (
        currentCitizenSession &&
        currentCitizenSession.olympId &&
        currentCitizenSession.password
    ) {

        const olympId =
            currentCitizenSession.olympId;


        const password =
            currentCitizenSession.password;


        try {

            const result =
                await fetch(
                    OLYMP_API_URL +
                    "?" +
                    new URLSearchParams({

                        action:
                            "profile",

                        olympId:
                            olympId,

                        citizenId:
                            olympId,

                        idNumber:
                            olympId,

                        password:
                            password

                    }).toString(),

                    {

                        method:
                            "GET",

                        cache:
                            "no-store",

                        redirect:
                            "follow"

                    }
                );


            if (!result.ok) {

                throw new Error(
                    "HTTP " +
                    result.status
                );

            }


            const profile =
                await result.json();


            console.log(
                "CABINET PROFILE CHECK:",
                profile
            );


            if (
                !profile ||
                profile.success !== true
            ) {

                alert(
                    profile &&
                    profile.message
                        ? profile.message
                        : "Сесію завершено. Увійдіть повторно."
                );


                localStorage.removeItem(
                    "olympCitizenSession"
                );


                window.location.href =
                    "cabinet.html";


                return false;

            }


            currentUser =
                profile.citizen ||
                profile.profile ||
                profile.user ||
                {

                    olympId:
                        olympId

                };


            localStorage.setItem(
                "olymp_user",
                JSON.stringify(
                    currentUser
                )
            );


            console.log(
                "Авторизація через olympCitizenSession успішна."
            );


            return true;


        } catch (error) {

            console.error(
                "CABINET SESSION ERROR:",
                error
            );


            alert(
                "Не вдалося перевірити авторизацію."
            );


            return false;

        }

    }


    /* =====================================================
       НЕТ НИКАКОЙ СЕССИИ
    ===================================================== */

    alert(
        "Для подання заявки необхідно увійти до особистого кабінету."
    );


    window.location.href =
        "cabinet.html";


    return false;

}


/* =========================================================
   MOBILE MENU
========================================================= */

const menuButton =
    document.getElementById(
        "menuButton"
    );

const menu =
    document.querySelector(
        ".menu"
    );


if (
    menuButton &&
    menu
) {

    menuButton.addEventListener(
        "click",
        () => {

            menu.classList.toggle(
                "active"
            );

        }
    );

}


if (menu) {

    document
        .querySelectorAll(
            ".menu a"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        menu.classList.remove(
                            "active"
                        );

                    }
                );

            }
        );

}


/* =========================================================
   SERVICE MODAL
========================================================= */

const serviceModal =
    document.getElementById(
        "serviceModal"
    );

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

const modalIcon =
    document.getElementById(
        "modalIcon"
    );

const modalCategory =
    document.getElementById(
        "modalCategory"
    );

const applyFromService =
    document.getElementById(
        "applyFromService"
    );


let selectedService = "";


/* =========================================================
   OPEN SERVICE
========================================================= */

window.openService =
function(button) {

    if (!serviceModal) {

        console.error(
            "serviceModal не найден"
        );

        return;

    }


    const card =
        button.closest(
            ".service-item"
        );


    if (!card) {

        console.error(
            "Карточка послуги не знайдена"
        );

        return;

    }


    const title =
        card.dataset.title ||
        "Державна послуга";


    const description =
        card.dataset.description ||
        "";


    const requirements =
        card.dataset.requirements ||
        "—";


    selectedService =
        title;


    if (modalTitle) {

        modalTitle.textContent =
            title;

    }


    if (modalDescription) {

        modalDescription.textContent =
            description;

    }


    if (modalRequirements) {

        modalRequirements.textContent =
            requirements;

    }


    if (modalIcon) {

        const icon =
            card.querySelector(
                ".service-icon"
            );

        if (icon) {

            modalIcon.textContent =
                icon.textContent.trim();

        }

    }


    if (modalCategory) {

        const category =
            card.dataset.category ||
            "government";


        const categories = {

            documents:
                "ДОКУМЕНТИ",

            transport:
                "ТРАНСПОРТ",

            business:
                "БІЗНЕС",

            legal:
                "ЮРИДИЧНІ",

            government:
                "УРЯДОВІ"

        };


        modalCategory.textContent =
            categories[category] ||
            "ДЕРЖАВНА ПОСЛУГА";

    }


    serviceModal.classList.add(
        "active"
    );


    serviceModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";

};


/* =========================================================
   CLOSE SERVICE
========================================================= */

window.closeServiceModal =
function() {

    if (!serviceModal) {

        return;

    }


    serviceModal.classList.remove(
        "active"
    );


    serviceModal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.style.overflow =
        "";

};


window.closeService =
function() {

    window.closeServiceModal();

};


if (serviceModal) {

    serviceModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                serviceModal
            ) {

                window.closeServiceModal();

            }

        }
    );

}


/* =========================================================
   APPLICATION MODAL
========================================================= */

const applicationModal =
    document.getElementById(
        "applicationModal"
    );

const applicationForm =
    document.getElementById(
        "applicationForm"
    );

const applicationService =
    document.getElementById(
        "applicationService"
    );

const successMessage =
    document.getElementById(
        "successMessage"
    );

const applicationNumber =
    document.getElementById(
        "applicationNumber"
    );

const applicationStatus =
    document.getElementById(
        "applicationStatus"
    );


/* =========================================================
   OPEN APPLICATION MODAL
========================================================= */

window.openApplicationModal =
async function(serviceName) {

    if (!applicationModal) {

        console.error(
            "applicationModal не найден"
        );

        return;

    }


    /*
     * Спочатку перевіряємо авторизацію.
     */

    const loggedIn =
        await requireLogin();


    if (!loggedIn) {

        return;

    }


    /*
     * Вибір послуги.
     */

    if (
        serviceName &&
        applicationService
    ) {

        let found = false;


        for (
            const option
            of applicationService.options
        ) {

            if (
                option.textContent
                    .trim()
                    .toLowerCase() ===
                serviceName
                    .trim()
                    .toLowerCase()
            ) {

                applicationService.value =
                    option.value;

                found = true;

                break;

            }

        }


        /*
         * Якщо точної опції немає —
         * пробуємо додати значення.
         */

        if (
            !found &&
            serviceName
        ) {

            let option =
                Array.from(
                    applicationService.options
                ).find(
                    item =>
                        item.textContent
                            .trim()
                            .toLowerCase()
                            .includes(
                                serviceName
                                    .trim()
                                    .toLowerCase()
                            )
                );


            if (option) {

                applicationService.value =
                    option.value;

            }

        }

    }


    /*
     * Скидаємо повідомлення про успіх.
     */

    if (successMessage) {

        successMessage.style.display =
            "none";

    }


    if (applicationForm) {

        applicationForm.style.display =
            "";

    }


    applicationModal.classList.add(
        "active"
    );


    applicationModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";

};


/* =========================================================
   CLOSE APPLICATION
========================================================= */

window.closeApplicationModal =
function() {

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


    document.body.style.overflow =
        "";

};


if (applicationModal) {

    applicationModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                applicationModal
            ) {

                window.closeApplicationModal();

            }

        }
    );

}


/* =========================================================
   APPLY FROM SERVICE
========================================================= */

if (applyFromService) {

    applyFromService.addEventListener(
        "click",
        async () => {

            window.closeServiceModal();

            await window.openApplicationModal(
                selectedService
            );

        }
    );

}


/* =========================================================
   APPLICATION SUBMIT
========================================================= */

if (applicationForm) {

    applicationForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            /*
             * Повторно перевіряємо сесію.
             */

            const loggedIn =
                await requireLogin();


            if (!loggedIn) {

                return;

            }


            /*
             * Перевіряємо профіль.
             */

            if (!currentUser) {

                const profile =
                    await loadCurrentProfile();


                if (!profile) {

                    alert(
                        "Не вдалося завантажити ваш профіль."
                    );

                    return;

                }

            }


            /*
             * Отримуємо поля форми.
             */

            const service =
                applicationService
                    ? applicationService.value.trim()
                    : "";


            const contactInput =
                document.getElementById(
                    "contact"
                );


            const messageInput =
                document.getElementById(
                    "message"
                );


            const contact =
                contactInput
                    ? contactInput.value.trim()
                    : "";


            const message =
                messageInput
                    ? messageInput.value.trim()
                    : "";


            if (!service) {

                alert(
                    "Оберіть державну послугу."
                );

                return;

            }


            if (!message) {

                alert(
                    "Вкажіть опис звернення."
                );

                return;

            }


            /*
             * Кнопка.
             */

            const submitButton =
                applicationForm.querySelector(
                    ".form-submit"
                );


            const oldButtonText =
                submitButton
                    ? submitButton.textContent
                    : "";


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Відправлення...";

            }


            try {

                /*
                 * Відправляємо заявку.
                 *
                 * ПІБ, OLYMP-ID, телефон,
                 * Email, Discord беруться
                 * з профілю автоматично.
                 */

                const result =
                    await olympApi(
                        "saveapplication",
                        {

                            olympId:
                                currentUser.olympId,

sessionToken:
    currentSessionToken ||
    "",

password:
    currentCitizenSession
        ? currentCitizenSession.password
        : "",

                            service:
                                service,

                            contact:
                                contact ||
                                currentUser.contact ||
                                currentUser.preferredContact ||
                                "",

                            message:
                                message

                        }
                    );


                if (
                    !result ||
                    !result.success
                ) {

                    throw new Error(
                        result &&
                        result.message
                            ? result.message
                            : "Не вдалося подати заявку."
                    );

                }


                /*
                 * Заявка успішно створена.
                 */

                const application =
                    result.application ||
                    {};


                const number =
                    result.applicationNumber ||
                    result.number ||
                    application.number ||
                    "—";


                /*
                 * Показуємо номер заявки.
                 */

                if (applicationNumber) {

                    applicationNumber.textContent =
                        "№ " + number;

                }


                if (applicationStatus) {

                    applicationStatus.innerHTML =
                        `
                        <span class="status-label">
                            Статус:
                        </span>

                        <span class="status-badge pending">
                            🟡 На розгляді
                        </span>
                        `;

                }


                /*
                 * Приховуємо форму.
                 */

                applicationForm.style.display =
                    "none";


                /*
                 * Показуємо success.
                 */

                if (successMessage) {

                    successMessage.style.display =
                        "block";

                }


                /*
                 * Очищаємо поля.
                 */

                applicationForm.reset();


                /*
                 * Оновлюємо локальні дані.
                 */

                await loadCurrentProfile();


                console.log(
                    "Заявка успішно створена:",
                    result
                );


            } catch (error) {

                console.error(
                    "Помилка подання заявки:",
                    error
                );


                alert(
                    error.message ||
                    "Сталася помилка під час подання заявки."
                );


            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        oldButtonText ||
                        "Надіслати заявку";

                }

            }

        }
    );

}


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        if (serviceModal) {

            serviceModal.classList.remove(
                "active"
            );

            serviceModal.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        if (applicationModal) {

            applicationModal.classList.remove(
                "active"
            );

            applicationModal.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        document.body.style.overflow =
            "";

    }
);


/* =========================================================
   HEADER SCROLL
========================================================= */

const header =
    document.querySelector(
        ".header"
    );


if (header) {

    window.addEventListener(
        "scroll",
        () => {

            if (
                window.scrollY > 50
            ) {

                header.style.boxShadow =
                    "0 5px 30px rgba(0,0,0,0.25)";

            } else {

                header.style.boxShadow =
                    "none";

            }

        }
    );

}


/* =========================================================
   SERVICE SEARCH
========================================================= */

const serviceSearch =
    document.getElementById(
        "serviceSearch"
    );

const clearSearch =
    document.getElementById(
        "clearSearch"
    );

const servicesGrid =
    document.getElementById(
        "servicesGrid"
    );

const noResults =
    document.getElementById(
        "noResults"
    );

const categoryButtons =
    document.querySelectorAll(
        ".category-btn"
    );

const serviceItems =
    document.querySelectorAll(
        ".service-item"
    );


let currentCategory =
    "all";


function filterServices() {

    const searchText =
        serviceSearch
            ? serviceSearch.value
                .toLowerCase()
                .trim()
            : "";


    let visibleCount =
        0;


    serviceItems.forEach(
        item => {

            const title =
                (
                    item.dataset.title ||
                    ""
                ).toLowerCase();


            const description =
                (
                    item.dataset.description ||
                    ""
                ).toLowerCase();


            const category =
                item.dataset.category ||
                "";


            const matchesSearch =
                !searchText ||
                title.includes(
                    searchText
                ) ||
                description.includes(
                    searchText
                );


            const matchesCategory =
                currentCategory === "all" ||
                category ===
                    currentCategory;


            if (
                matchesSearch &&
                matchesCategory
            ) {

                item.style.display =
                    "";

                visibleCount++;

            } else {

                item.style.display =
                    "none";

            }

        }
    );


    if (noResults) {

        noResults.style.display =
            visibleCount === 0
                ? "block"
                : "none";

    }

}


if (serviceSearch) {

    serviceSearch.addEventListener(
        "input",
        filterServices
    );

}


if (clearSearch) {

    clearSearch.addEventListener(
        "click",
        () => {

            if (serviceSearch) {

                serviceSearch.value =
                    "";

            }

            filterServices();

        }
    );

}


categoryButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                categoryButtons.forEach(
                    btn => {

                        btn.classList.remove(
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


/* =========================================================
   SIMPLE SCROLL ANIMATION
========================================================= */

const animatedElements =
    document.querySelectorAll(
        ".service-card, " +
        ".government-card, " +
        ".news-card, " +
        ".law-card"
    );


if (
    "IntersectionObserver"
    in window
) {

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.style.opacity =
                                "1";

                            entry.target.style.transform =
                                "translateY(0)";


                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {

                threshold: 0.1

            }
        );


    animatedElements.forEach(
        element => {

            element.style.opacity =
                "0";

            element.style.transform =
                "translateY(20px)";

            element.style.transition =
                "opacity .5s ease, " +
                "transform .5s ease";

            observer.observe(
                element
            );

        }
    );

} else {

    animatedElements.forEach(
        element => {

            element.style.opacity =
                "1";

            element.style.transform =
                "translateY(0)";

        }
    );

}


/* =========================================================
   INITIALIZATION
========================================================= */

loadSession();

filterServices();


console.log(
    "OLYMP Government script 6.1 loaded successfully."
);

console.log(
    "Session:",
    currentSessionToken
        ? "FOUND"
        : "NOT FOUND"
);
