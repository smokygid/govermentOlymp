/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET + ADMIN PANEL
   SCRIPT.JS 6.2

   Google Apps Script API
   Без Discord
========================================================= */


/* =========================================================
   НАСТРОЙКИ
========================================================= */

/*
 * ВСТАВЬ СЮДА URL РАЗВЕРНУТОГО GOOGLE APPS SCRIPT
 *
 * Пример:
 *
 * const API_URL =
 * "https://script.google.com/macros/s/XXXXXXXX/exec";
 */

const API_URL =
    "ВСТАВЬ_СЮДА_URL_GOOGLE_APPS_SCRIPT";


/*
 * Ключи локального хранилища
 */

const STORAGE = {

    citizen: "olymp_citizen",

    admin: "olymp_admin",

    applications: "olymp_applications"

};


/*
 * Статусы заявок
 */

const STATUSES = [

    "🟡 На розгляді",

    "🔵 Прийнято",

    "🟢 Виконано",

    "🔴 Відхилено",

    "⚫ Закрито"

];


/* =========================================================
   ГЛОБАЛЬНОЕ СОСТОЯНИЕ
========================================================= */

const OLYMP = {

    citizen: null,

    admin: null,

    applications: [],

    currentApplication: null,

    initialized: false

};


/* =========================================================
   DOM
========================================================= */

const $ = (selector) => {

    return document.querySelector(selector);

};


const $$ = (selector) => {

    return document.querySelectorAll(selector);

};


/* =========================================================
   ИНИЦИАЛИЗАЦИЯ
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initOlymp();

    }
);


/* =========================================================
   INIT
========================================================= */

async function initOlymp() {

    if (OLYMP.initialized) {

        return;

    }

    OLYMP.initialized = true;


    /*
     * Восстанавливаем гражданина
     */

    loadCitizen();


    /*
     * Восстанавливаем администратора
     */

    loadAdmin();


    /*
     * Запускаем интерфейс
     */

    initNavigation();

    initForms();

    initButtons();

    initAdminPanel();

    updateInterface();


    /*
     * Проверяем API
     */

    if (
        API_URL &&
        !API_URL.includes(
            "ВСТАВЬ_СЮДА"
        )
    ) {

        checkAPI();

    }

}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadCitizen() {

    try {

        const data =
            localStorage.getItem(
                STORAGE.citizen
            );


        if (data) {

            OLYMP.citizen =
                JSON.parse(data);

        }

    } catch (error) {

        console.error(
            "Ошибка загрузки гражданина:",
            error
        );

        OLYMP.citizen = null;

    }

}


function saveCitizen(data) {

    OLYMP.citizen = data;


    localStorage.setItem(

        STORAGE.citizen,

        JSON.stringify(data)

    );


    updateInterface();

}


function logoutCitizen() {

    OLYMP.citizen = null;


    localStorage.removeItem(
        STORAGE.citizen
    );


    OLYMP.applications = [];


    updateInterface();


    showToast(
        "Ви вийшли з особистого кабінету.",
        "success"
    );

}


function loadAdmin() {

    try {

        const data =
            localStorage.getItem(
                STORAGE.admin
            );


        if (data) {

            OLYMP.admin =
                JSON.parse(data);

        }

    } catch (error) {

        console.error(
            "Ошибка загрузки администратора:",
            error
        );

        OLYMP.admin = null;

    }

}


function saveAdmin(data) {

    OLYMP.admin = data;


    localStorage.setItem(

        STORAGE.admin,

        JSON.stringify(data)

    );


    updateInterface();

}


function logoutAdmin() {

    OLYMP.admin = null;


    localStorage.removeItem(
        STORAGE.admin
    );


    updateInterface();


    showToast(
        "Сесію адміністратора завершено.",
        "success"
    );

}


/* =========================================================
   API
========================================================= */

async function apiRequest(
    method = "GET",
    data = null
) {

    if (
        !API_URL ||
        API_URL.includes(
            "ВСТАВЬ_СЮДА"
        )
    ) {

        throw new Error(
            "URL Google Apps Script не налаштовано."
        );

    }


    let response;


    try {

        if (method === "GET") {

            let url =
                API_URL;


            if (data) {

                const params =
                    new URLSearchParams();


                Object.keys(data)
                    .forEach(
                        key => {

                            if (
                                data[key] !==
                                undefined &&
                                data[key] !==
                                null
                            ) {

                                params.append(
                                    key,
                                    data[key]
                                );

                            }

                        }
                    );


                const query =
                    params.toString();


                if (query) {

                    url +=
                        "?" +
                        query;

                }

            }


            response =
                await fetch(
                    url,
                    {

                        method:
                            "GET",

                        cache:
                            "no-store"

                    }
                );

        } else {

            const formData =
                new URLSearchParams();


            if (data) {

                Object.keys(data)
                    .forEach(
                        key => {

                            if (
                                data[key] !==
                                undefined &&
                                data[key] !==
                                null
                            ) {

                                formData.append(
                                    key,
                                    data[key]
                                );

                            }

                        }
                    );

            }


            response =
                await fetch(
                    API_URL,
                    {

                        method:
                            "POST",

                        body:
                            formData,

                        cache:
                            "no-store"

                    }
                );

        }

    } catch (error) {

        console.error(
            "API connection error:",
            error
        );


        throw new Error(
            "Не вдалося підключитися до сервера."
        );

    }


    const text =
        await response.text();


    let result;


    try {

        result =
            JSON.parse(text);

    } catch {

        console.error(
            "Некоректна відповідь API:",
            text
        );


        throw new Error(
            "Сервер повернув некоректну відповідь."
        );

    }


    if (
        result &&
        result.success === false
    ) {

        throw new Error(
            result.message ||
            "Помилка API."
        );

    }


    return result;

}


/* =========================================================
   ПРОВЕРКА API
========================================================= */

async function checkAPI() {

    try {

        const result =
            await apiRequest(
                "GET"
            );


        console.log(
            "OLYMP API:",
            result
        );


    } catch (error) {

        console.warn(
            "OLYMP API:",
            error.message
        );

    }

}


/* =========================================================
   НАВИГАЦИЯ
========================================================= */

function initNavigation() {

    $$("[data-page]")
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        const page =
                            element.dataset.page;


                        showPage(page);

                    }
                );

            }
        );

}


/* =========================================================
   ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ
========================================================= */

function showPage(page) {

    $$(
        ".page, .cabinet-page, .admin-page"
    )
        .forEach(
            element => {

                element.classList.remove(
                    "active"
                );

            }
        );


    const target =
        document.querySelector(
            `[data-page-content="${page}"]`
        );


    if (target) {

        target.classList.add(
            "active"
        );

    }


    /*
     * Админская страница
     */

    if (
        page === "admin"
    ) {

        if (
            !OLYMP.admin
        ) {

            showAdminLogin();

            return;

        }


        loadAdminApplications();

    }


    /*
     * Кабинет
     */

    if (
        page === "cabinet"
    ) {

        if (
            !OLYMP.citizen
        ) {

            showLogin();

            return;

        }


        loadCitizenApplications();

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   ФОРМЫ
========================================================= */

function initForms() {

    initCitizenLogin();

    initRegister();

    initApplicationForm();

    initAdminLogin();

}


/* =========================================================
   ГРАЖДАНСКАЯ АВТОРИЗАЦИЯ
========================================================= */

function initCitizenLogin() {

    const form =
        document.querySelector(
            "#loginForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const formData =
                new FormData(form);


            const idNumber =
                clean(
                    formData.get(
                        "idNumber"
                    )
                );


            const password =
                clean(
                    formData.get(
                        "password"
                    )
                );


            if (!idNumber) {

                showToast(
                    "Введіть OLYMP-ID.",
                    "error"
                );

                return;

            }


            if (!password) {

                showToast(
                    "Введіть пароль.",
                    "error"
                );

                return;

            }


            setLoading(
                form,
                true
            );


            try {

                /*
                 * Поддержка API 6.x
                 */

                const result =
                    await apiRequest(
                        "POST",
                        {

                            action:
                                "login",

                            idNumber:
                                idNumber,

                            password:
                                password

                        }
                    );


                if (
                    result &&
                    result.user
                ) {

                    saveCitizen(
                        result.user
                    );

                } else {

                    saveCitizen({

                        idNumber:
                            idNumber,

                        name:
                            result.name ||
                            result.fullName ||
                            "",

                        fullName:
                            result.fullName ||
                            result.name ||
                            "",

                        avatar:
                            result.avatar ||
                            "",

                        applications:
                            result.applications ||
                            []

                    });

                }


                showToast(
                    "Авторизація успішна.",
                    "success"
                );


                hideLogin();


                loadCitizenApplications();


            } catch (error) {

                showToast(
                    error.message,
                    "error"
                );

            } finally {

                setLoading(
                    form,
                    false
                );

            }

        }
    );

}


/* =========================================================
   РЕЄСТРАЦІЯ
========================================================= */

function initRegister() {

    const form =
        document.querySelector(
            "#registerForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const formData =
                new FormData(form);


            const data = {

                action:
                    "register",

                fullName:
                    clean(
                        formData.get(
                            "fullName"
                        )
                    ),

                idNumber:
                    clean(
                        formData.get(
                            "idNumber"
                        )
                    ),

                password:
                    clean(
                        formData.get(
                            "password"
                        )
                    ),

                contact:
                    clean(
                        formData.get(
                            "contact"
                        )
                    )

            };


            if (!data.fullName) {

                showToast(
                    "Вкажіть ПІБ.",
                    "error"
                );

                return;

            }


            if (!data.idNumber) {

                showToast(
                    "Вкажіть OLYMP-ID.",
                    "error"
                );

                return;

            }


            if (!data.password) {

                showToast(
                    "Вкажіть пароль.",
                    "error"
                );

                return;

            }


            setLoading(
                form,
                true
            );


            try {

                const result =
                    await apiRequest(
                        "POST",
                        data
                    );


                if (
                    result.user
                ) {

                    saveCitizen(
                        result.user
                    );

                } else {

                    saveCitizen({

                        idNumber:
                            data.idNumber,

                        fullName:
                            data.fullName,

                        name:
                            data.fullName,

                        contact:
                            data.contact || "",

                        avatar:
                            ""

                    });

                }


                showToast(
                    "Реєстрація успішна.",
                    "success"
                );


                hideRegister();


                showPage(
                    "cabinet"
                );


            } catch (error) {

                showToast(
                    error.message,
                    "error"
                );

            } finally {

                setLoading(
                    form,
                    false
                );

            }

        }
    );

}


/* =========================================================
   СОЗДАНИЕ ЗАЯВКИ
========================================================= */

function initApplicationForm() {

    const form =
        document.querySelector(
            "#applicationForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !OLYMP.citizen
            ) {

                showToast(
                    "Спочатку увійдіть до особистого кабінету.",
                    "error"
                );

                return;

            }


            const formData =
                new FormData(form);


            const data = {

                action:
                    "createApplication",

                fullName:
                    clean(
                        formData.get(
                            "fullName"
                        ) ||
                        OLYMP.citizen.fullName ||
                        OLYMP.citizen.name
                    ),

                idNumber:
                    clean(
                        formData.get(
                            "idNumber"
                        ) ||
                        OLYMP.citizen.idNumber
                    ),

                service:
                    clean(
                        formData.get(
                            "service"
                        )
                    ),

                contact:
                    clean(
                        formData.get(
                            "contact"
                        )
                    ),

                message:
                    clean(
                        formData.get(
                            "message"
                        )
                    )

            };


            /*
             * Совместимость с текущим Code.gs
             *
             * Он принимает POST:
             * fullName
             * idNumber
             * service
             * contact
             * message
             */

            delete data.action;


            if (!data.fullName) {

                showToast(
                    "Вкажіть ПІБ.",
                    "error"
                );

                return;

            }


            if (!data.idNumber) {

                showToast(
                    "Вкажіть номер посвідчення.",
                    "error"
                );

                return;

            }


            if (!data.service) {

                showToast(
                    "Оберіть державну послугу.",
                    "error"
                );

                return;

            }


            if (!data.message) {

                showToast(
                    "Вкажіть опис звернення.",
                    "error"
                );

                return;

            }


            setLoading(
                form,
                true
            );


            try {

                const result =
                    await apiRequest(
                        "POST",
                        data
                    );


                if (
                    result.success
                ) {

                    form.reset();


                    /*
                     * Добавляем заявку
                     * локально
                     */

                    const application = {

                        number:
                            result.number,

                        date:
                            result.date,

                        fullName:
                            data.fullName,

                        idNumber:
                            data.idNumber,

                        service:
                            data.service,

                        contact:
                            data.contact,

                        message:
                            data.message,

                        status:
                            result.status ||
                            "🟡 На розгляді",

                        responsible:
                            "",

                        comment:
                            ""

                    };


                    OLYMP.applications
                        .unshift(
                            application
                        );


                    saveApplications();


                    renderCitizenApplications();


                    showToast(
                        `Заявку ${result.number} успішно зареєстровано.`,
                        "success"
                    );


                    closeApplicationModal();


                } else {

                    throw new Error(
                        result.message ||
                        "Не вдалося зареєструвати заявку."
                    );

                }


            } catch (error) {

                showToast(
                    error.message,
                    "error"
                );

            } finally {

                setLoading(
                    form,
                    false
                );

            }

        }
    );

}


/* =========================================================
   ЗАГРУЗКА ЗАЯВОК ГРАЖДАНИНА
========================================================= */

async function loadCitizenApplications() {

    if (
        !OLYMP.citizen
    ) {

        return;

    }


    /*
     * Сначала показываем локальные
     */

    loadApplications();


    renderCitizenApplications();


    try {

        const result =
            await apiRequest(
                "GET",
                {

                    action:
                        "getMyApplications",

                    idNumber:
                        OLYMP.citizen.idNumber

                }
            );


        if (
            result &&
            Array.isArray(
                result.applications
            )
        ) {

            OLYMP.applications =
                result.applications;


            saveApplications();


            renderCitizenApplications();

        }

    } catch (error) {

        console.warn(
            "Не вдалося оновити заявки:",
            error.message
        );

    }


    updateStatistics();

}


/* =========================================================
   ЛОКАЛЬНЫЕ ЗАЯВКИ
========================================================= */

function loadApplications() {

    try {

        const data =
            localStorage.getItem(
                STORAGE.applications
            );


        if (data) {

            OLYMP.applications =
                JSON.parse(data);

        }

    } catch {

        OLYMP.applications = [];

    }

}


function saveApplications() {

    localStorage.setItem(

        STORAGE.applications,

        JSON.stringify(
            OLYMP.applications
        )

    );

}


/* =========================================================
   РЕНДЕР ЗАЯВОК
========================================================= */

function renderCitizenApplications() {

    const containers = [

        "#applicationsList",

        "#myApplications",

        "#cabinetApplications",

        "[data-applications]"

    ];


    let container = null;


    for (
        const selector of containers
    ) {

        container =
            document.querySelector(
                selector
            );


        if (container) {

            break;

        }

    }


    if (!container) {

        return;

    }


    if (
        !OLYMP.applications.length
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📋
                </div>

                <h3>
                    Заявок поки немає
                </h3>

                <p>
                    Після подання звернення
                    воно з'явиться тут.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        OLYMP.applications
            .map(
                application =>
                    renderApplicationCard(
                        application
                    )
            )
            .join("");


    container
        .querySelectorAll(
            "[data-application-number]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openApplication(
                            button.dataset.applicationNumber
                        );

                    }
                );

            }
        );

}


/* =========================================================
   КАРТОЧКА ЗАЯВКИ
========================================================= */

function renderApplicationCard(
    application
) {

    const number =
        escapeHTML(
            application.number ||
            application.requestNumber ||
            "—"
        );


    const service =
        escapeHTML(
            application.service ||
            "Державна послуга"
        );


    const date =
        escapeHTML(
            application.date ||
            "—"
        );


    const status =
        application.status ||
        "🟡 На розгляді";


    return `

        <article
            class="application-card"
        >

            <div
                class="application-card-header"
            >

                <div>

                    <span
                        class="application-number"
                    >
                        ${number}
                    </span>

                    <h3>
                        ${service}
                    </h3>

                </div>

                <span
                    class="status-badge ${statusClass(status)}"
                >
                    ${escapeHTML(status)}
                </span>

            </div>


            <div
                class="application-card-body"
            >

                <div>
                    <span>Дата</span>
                    <strong>${date}</strong>
                </div>

                <div>
                    <span>Статус</span>
                    <strong>${escapeHTML(status)}</strong>
                </div>

            </div>


            <div
                class="application-card-footer"
            >

                <button
                    type="button"
                    class="btn"
                    data-application-number="${number}"
                >
                    Переглянути заявку
                </button>

            </div>

        </article>

    `;

}


/* =========================================================
   ОТКРЫТИЕ ЗАЯВКИ
========================================================= */

async function openApplication(
    number
) {

    const local =
        OLYMP.applications.find(
            application =>
                String(
                    application.number ||
                    application.requestNumber
                ) ===
                String(number)
        );


    OLYMP.currentApplication =
        local || null;


    /*
     * Пробуем получить свежие данные
     */

    try {

        const result =
            await apiRequest(
                "GET",
                {

                    action:
                        "getApplication",

                    number:
                        number

                }
            );


        if (
            result &&
            result.application
        ) {

            OLYMP.currentApplication =
                result.application;

        }

    } catch (error) {

        console.warn(
            "Не вдалося отримати актуальні дані заявки:",
            error.message
        );

    }


    renderApplicationModal();

}


/* =========================================================
   МОДАЛКА ЗАЯВКИ
========================================================= */

function renderApplicationModal() {

    const application =
        OLYMP.currentApplication;


    if (!application) {

        showToast(
            "Заявку не знайдено.",
            "error"
        );

        return;

    }


    const modal =
        document.querySelector(
            "#applicationModal"
        );


    if (!modal) {

        return;

    }


    const number =
        application.number ||
        application.requestNumber ||
        "—";


    const html = `

        <div class="modal-content">

            <button
                type="button"
                class="modal-close"
                data-close-modal
            >
                ×
            </button>


            <div class="modal-header">

                <span class="application-number">
                    ${escapeHTML(number)}
                </span>

                <h2>
                    ${escapeHTML(
                        application.service ||
                        "Заявка"
                    )}
                </h2>

            </div>


            <div class="application-details">

                <div class="detail-row">

                    <span>Дата</span>

                    <strong>
                        ${escapeHTML(
                            application.date ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-row">

                    <span>ПІБ</span>

                    <strong>
                        ${escapeHTML(
                            application.fullName ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-row">

                    <span>Посвідчення</span>

                    <strong>
                        ${escapeHTML(
                            application.idNumber ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-row">

                    <span>Контакт</span>

                    <strong>
                        ${escapeHTML(
                            application.contact ||
                            "Не вказано"
                        )}
                    </strong>

                </div>


                <div class="detail-row">

                    <span>Статус</span>

                    <strong
                        class="status-badge ${statusClass(
                            application.status
                        )}"
                    >
                        ${escapeHTML(
                            application.status ||
                            "🟡 На розгляді"
                        )}
                    </strong>

                </div>


                <div class="detail-block">

                    <span>
                        Опис звернення
                    </span>

                    <p>
                        ${escapeHTML(
                            application.message ||
                            application.description ||
                            "—"
                        )}
                    </p>

                </div>


                ${
                    application.comment
                    ?
                    `
                    <div class="detail-block">

                        <span>
                            Відповідь адміністрації
                        </span>

                        <p>
                            ${escapeHTML(
                                application.comment
                            )}
                        </p>

                    </div>
                    `
                    :
                    ""
                }


                ${
                    application.responsible
                    ?
                    `
                    <div class="detail-row">

                        <span>
                            Відповідальний
                        </span>

                        <strong>
                            ${escapeHTML(
                                application.responsible
                            )}
                        </strong>

                    </div>
                    `
                    :
                    ""
                }

            </div>


            <div class="modal-actions">

                <button
                    type="button"
                    class="btn"
                    data-copy-number="${escapeHTML(number)}"
                >
                    📋 Копіювати номер
                </button>

            </div>

        </div>

    `;


    modal.innerHTML =
        html;


    modal.classList.add(
        "active"
    );


    modal
        .querySelector(
            "[data-close-modal]"
        )
        ?.addEventListener(
            "click",
            closeApplicationModal
        );


    modal
        .querySelector(
            "[data-copy-number]"
        )
        ?.addEventListener(
            "click",
            () => {

                copyText(
                    number
                );

            }
        );

}


/* =========================================================
   ЗАКРЫТИЕ МОДАЛКИ
========================================================= */

function closeApplicationModal() {

    const modal =
        document.querySelector(
            "#applicationModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   СТАТИСТИКА
========================================================= */

function updateStatistics() {

    const applications =
        OLYMP.applications;


    const total =
        applications.length;


    const pending =
        applications.filter(
            item =>
                item.status ===
                "🟡 На розгляді"
        ).length;


    const approved =
        applications.filter(
            item =>
                item.status ===
                "🔵 Прийнято" ||
                item.status ===
                "🟢 Виконано"
        ).length;


    const rejected =
        applications.filter(
            item =>
                item.status ===
                "🔴 Відхилено"
        ).length;


    setText(
        "#totalApplications",
        total
    );

    setText(
        "#pendingApplications",
        pending
    );

    setText(
        "#approvedApplications",
        approved
    );

    setText(
        "#rejectedApplications",
        rejected
    );


    /*
     * Дополнительные data-атрибуты
     */

    setText(
        "[data-stat='total']",
        total
    );

    setText(
        "[data-stat='pending']",
        pending
    );

    setText(
        "[data-stat='approved']",
        approved
    );

    setText(
        "[data-stat='rejected']",
        rejected
    );

}


/* =========================================================
   АДМИН
========================================================= */

function initAdminPanel() {

    /*
     * Если есть кнопка входа
     */

    $$(
        "[data-admin-login]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    showAdminLogin
                );

            }
        );


    /*
     * Выход
     */

    $$(
        "[data-admin-logout]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    logoutAdmin
                );

            }
        );


    /*
     * Фильтры
     */

    const statusFilter =
        document.querySelector(
            "#adminStatusFilter"
        );


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            renderAdminApplications
        );

    }


    const search =
        document.querySelector(
            "#adminSearch"
        );


    if (search) {

        search.addEventListener(
            "input",
            debounce(
                renderAdminApplications,
                250
            )
        );

    }

}


/* =========================================================
   АДМИН ЛОГИН
========================================================= */

function initAdminLogin() {

    const form =
        document.querySelector(
            "#adminLoginForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const formData =
                new FormData(form);


            const login =
                clean(
                    formData.get(
                        "login"
                    )
                );


            const password =
                clean(
                    formData.get(
                        "password"
                    )
                );


            if (!login || !password) {

                showToast(
                    "Вкажіть логін та пароль адміністратора.",
                    "error"
                );

                return;

            }


            setLoading(
                form,
                true
            );


            try {

                const result =
                    await apiRequest(
                        "POST",
                        {

                            action:
                                "adminLogin",

                            login:
                                login,

                            password:
                                password

                        }
                    );


                if (
                    result.admin
                ) {

                    saveAdmin(
                        result.admin
                    );

                } else {

                    saveAdmin({

                        login:
                            login,

                        name:
                            result.name ||
                            login,

                        role:
                            result.role ||
                            "Адміністратор"

                    });

                }


                showToast(
                    "Вхід адміністратора успішний.",
                    "success"
                );


                hideAdminLogin();


                showPage(
                    "admin"
                );


            } catch (error) {

                showToast(
                    error.message,
                    "error"
                );

            } finally {

                setLoading(
                    form,
                    false
                );

            }

        }
    );

}


/* =========================================================
   АДМИН — ПОЛУЧИТЬ ВСЕ ЗАЯВКИ
========================================================= */

async function loadAdminApplications() {

    if (
        !OLYMP.admin
    ) {

        showAdminLogin();

        return;

    }


    showAdminLoading();


    try {

        const result =
            await apiRequest(
                "GET",
                {

                    action:
                        "getApplications"

                }
            );


        if (
            result &&
            Array.isArray(
                result.applications
            )
        ) {

            OLYMP.applications =
                result.applications;


            renderAdminApplications();


            updateAdminStatistics();

        } else {

            throw new Error(
                "Сервер не повернув список заявок."
            );

        }

    } catch (error) {

        showToast(
            error.message,
            "error"
        );


        /*
         * Не очищаем локальные данные
         */

        renderAdminApplications();

    } finally {

        hideAdminLoading();

    }

}


/* =========================================================
   АДМИН — РЕНДЕР
========================================================= */

function renderAdminApplications() {

    const container =
        document.querySelector(
            "#adminApplications"
        );


    if (!container) {

        return;

    }


    const search =
        clean(
            document.querySelector(
                "#adminSearch"
            )?.value
        )
        .toLowerCase();


    const status =
        document.querySelector(
            "#adminStatusFilter"
        )?.value || "";


    const responsible =
        clean(
            document.querySelector(
                "#adminResponsibleFilter"
            )?.value
        )
        .toLowerCase();


    let applications =
        [...OLYMP.applications];


    if (search) {

        applications =
            applications.filter(
                application => {

                    const text =
                        [

                            application.number,

                            application.requestNumber,

                            application.fullName,

                            application.idNumber,

                            application.service,

                            application.contact,

                            application.message

                        ]
                            .join(" ")
                            .toLowerCase();


                    return text.includes(
                        search
                    );

                }
            );

    }


    if (status) {

        applications =
            applications.filter(
                application =>
                    application.status ===
                    status
            );

    }


    if (responsible) {

        applications =
            applications.filter(
                application =>
                    String(
                        application.responsible ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            responsible
                        )
            );

    }


    if (
        !applications.length
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📭
                </div>

                <h3>
                    Заявок не знайдено
                </h3>

                <p>
                    Спробуйте змінити параметри пошуку.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        applications
            .map(
                application =>
                    renderAdminApplication(
                        application
                    )
            )
            .join("");


    container
        .querySelectorAll(
            "[data-admin-application]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openAdminApplication(
                            button.dataset.adminApplication
                        );

                    }
                );

            }
        );

}


/* =========================================================
   АДМИН — КАРТОЧКА
========================================================= */

function renderAdminApplication(
    application
) {

    const number =
        application.number ||
        application.requestNumber ||
        "—";


    const status =
        application.status ||
        "🟡 На розгляді";


    return `

        <article
            class="admin-application-card"
        >

            <div>

                <span
                    class="application-number"
                >
                    ${escapeHTML(number)}
                </span>

                <h3>
                    ${escapeHTML(
                        application.service ||
                        "Заявка"
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        application.fullName ||
                        "Невідомий заявник"
                    )}
                </p>

            </div>


            <div>

                <span
                    class="status-badge ${statusClass(status)}"
                >
                    ${escapeHTML(status)}
                </span>

                <small>
                    ${escapeHTML(
                        application.date ||
                        ""
                    )}
                </small>

            </div>


            <button
                type="button"
                class="btn"
                data-admin-application="${escapeHTML(number)}"
            >
                Відкрити
            </button>

        </article>

    `;

}


/* =========================================================
   АДМИН — ОТКРЫТЬ ЗАЯВКУ
========================================================= */

async function openAdminApplication(
    number
) {

    let application =
        OLYMP.applications.find(
            item =>
                String(
                    item.number ||
                    item.requestNumber
                ) ===
                String(number)
        );


    OLYMP.currentApplication =
        application || null;


    /*
     * Получаем актуальную версию
     */

    try {

        const result =
            await apiRequest(
                "GET",
                {

                    action:
                        "getApplication",

                    number:
                        number

                }
            );


        if (
            result &&
            result.application
        ) {

            OLYMP.currentApplication =
                result.application;

        }

    } catch (error) {

        console.warn(
            "Деталі заявки:",
            error.message
        );

    }


    renderAdminApplicationModal();

}


/* =========================================================
   АДМИН — МОДАЛКА
========================================================= */

function renderAdminApplicationModal() {

    const application =
        OLYMP.currentApplication;


    if (!application) {

        showToast(
            "Заявку не знайдено.",
            "error"
        );

        return;

    }


    const modal =
        document.querySelector(
            "#adminApplicationModal"
        );


    if (!modal) {

        /*
         * Если отдельной админской
         * модалки нет — используем
         * гражданскую
         */

        renderApplicationModal();

        return;

    }


    const number =
        application.number ||
        application.requestNumber ||
        "—";


    modal.innerHTML = `

        <div class="modal-content admin-modal">

            <button
                type="button"
                class="modal-close"
                data-admin-close
            >
                ×
            </button>


            <div class="modal-header">

                <span
                    class="application-number"
                >
                    ${escapeHTML(number)}
                </span>

                <h2>
                    ${escapeHTML(
                        application.service ||
                        "Заявка"
                    )}
                </h2>

            </div>


            <div class="application-details">

                <div class="detail-row">
                    <span>Дата</span>
                    <strong>
                        ${escapeHTML(
                            application.date || "—"
                        )}
                    </strong>
                </div>


                <div class="detail-row">
                    <span>ПІБ</span>
                    <strong>
                        ${escapeHTML(
                            application.fullName || "—"
                        )}
                    </strong>
                </div>


                <div class="detail-row">
                    <span>Посвідчення</span>
                    <strong>
                        ${escapeHTML(
                            application.idNumber || "—"
                        )}
                    </strong>
                </div>


                <div class="detail-row">
                    <span>Контакт</span>
                    <strong>
                        ${escapeHTML(
                            application.contact ||
                            "Не вказано"
                        )}
                    </strong>
                </div>


                <div class="detail-block">

                    <span>
                        Опис звернення
                    </span>

                    <p>
                        ${escapeHTML(
                            application.message ||
                            application.description ||
                            "—"
                        )}
                    </p>

                </div>

            </div>


            <hr>


            <div class="admin-actions">

                <label>
                    Статус заявки
                </label>

                <select
                    id="adminApplicationStatus"
                >

                    ${STATUSES
                        .map(
                            status => `

                                <option
                                    value="${escapeHTML(status)}"
                                    ${
                                        application.status ===
                                        status
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escapeHTML(status)}
                                </option>

                            `
                        )
                        .join("")}

                </select>


                <label>
                    Відповідальний співробітник
                </label>

                <input
                    id="adminApplicationResponsible"
                    type="text"
                    value="${escapeHTML(
                        application.responsible || ""
                    )}"
                    placeholder="ПІБ співробітника"
                >


                <label>
                    Відповідь / коментар
                </label>

                <textarea
                    id="adminApplicationComment"
                    rows="5"
                    placeholder="Введіть відповідь громадянину..."
                >${escapeHTML(
                    application.comment || ""
                )}</textarea>


                <div
                    class="admin-action-buttons"
                >

                    <button
                        type="button"
                        class="btn btn-primary"
                        id="saveAdminApplication"
                    >
                        💾 Зберегти зміни
                    </button>


                    <button
                        type="button"
                        class="btn"
                        id="closeAdminApplication"
                    >
                        🔒 Закрити заявку
                    </button>

                </div>

            </div>

        </div>

    `;


    modal.classList.add(
        "active"
    );


    modal
        .querySelector(
            "[data-admin-close]"
        )
        ?.addEventListener(
            "click",
            closeAdminApplicationModal
        );


    modal
        .querySelector(
            "#saveAdminApplication"
        )
        ?.addEventListener(
            "click",
            saveAdminApplication
        );


    modal
        .querySelector(
            "#closeAdminApplication"
        )
        ?.addEventListener(
            "click",
            closeAdminApplication
        );

}


/* =========================================================
   АДМИН — СОХРАНИТЬ
========================================================= */

async function saveAdminApplication() {

    if (
        !OLYMP.admin ||
        !OLYMP.currentApplication
    ) {

        return;

    }


    const application =
        OLYMP.currentApplication;


    const number =
        application.number ||
        application.requestNumber;


    const status =
        document.querySelector(
            "#adminApplicationStatus"
        )?.value;


    const responsible =
        clean(
            document.querySelector(
                "#adminApplicationResponsible"
            )?.value
        );


    const comment =
        clean(
            document.querySelector(
                "#adminApplicationComment"
            )?.value
        );


    try {

        const result =
            await apiRequest(
                "POST",
                {

                    action:
                        "updateApplication",

                    number:
                        number,

                    status:
                        status,

                    responsible:
                        responsible,

                    comment:
                        comment,

                    admin:
                        OLYMP.admin.login ||
                        OLYMP.admin.id ||
                        ""

                }
            );


        /*
         * Обновляем локальную копию
         */

        const index =
            OLYMP.applications.findIndex(
                item =>
                    String(
                        item.number ||
                        item.requestNumber
                    ) ===
                    String(number)
            );


        if (index !== -1) {

            OLYMP.applications[index] = {

                ...OLYMP.applications[index],

                status:
                    status,

                responsible:
                    responsible,

                comment:
                    comment

            };

        }


        saveApplications();


        showToast(
            result.message ||
            "Зміни збережено.",
            "success"
        );


        closeAdminApplicationModal();


        renderAdminApplications();


    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   АДМИН — ЗАКРЫТИЕ
========================================================= */

async function closeAdminApplication() {

    if (
        !OLYMP.currentApplication
    ) {

        return;

    }


    const number =
        OLYMP.currentApplication.number ||
        OLYMP.currentApplication.requestNumber;


    try {

        const result =
            await apiRequest(
                "POST",
                {

                    action:
                        "closeApplication",

                    number:
                        number,

                    admin:
                        OLYMP.admin?.login ||
                        ""

                }
            );


        const index =
            OLYMP.applications.findIndex(
                item =>
                    String(
                        item.number ||
                        item.requestNumber
                    ) ===
                    String(number)
            );


        if (index !== -1) {

            OLYMP.applications[index].status =
                "⚫ Закрито";

        }


        saveApplications();


        showToast(
            result.message ||
            "Заявку закрито.",
            "success"
        );


        closeAdminApplicationModal();


        renderAdminApplications();


    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   ЗАКРЫТИЕ АДМИН МОДАЛКИ
========================================================= */

function closeAdminApplicationModal() {

    const modal =
        document.querySelector(
            "#adminApplicationModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   АДМИН СТАТИСТИКА
========================================================= */

function updateAdminStatistics() {

    const applications =
        OLYMP.applications;


    const total =
        applications.length;


    const pending =
        applications.filter(
            item =>
                item.status ===
                "🟡 На розгляді"
        ).length;


    const accepted =
        applications.filter(
            item =>
                item.status ===
                "🔵 Прийнято"
        ).length;


    const completed =
        applications.filter(
            item =>
                item.status ===
                "🟢 Виконано"
        ).length;


    const rejected =
        applications.filter(
            item =>
                item.status ===
                "🔴 Відхилено"
        ).length;


    const closed =
        applications.filter(
            item =>
                item.status ===
                "⚫ Закрито"
        ).length;


    setText(
        "#adminTotal",
        total
    );

    setText(
        "#adminPending",
        pending
    );

    setText(
        "#adminAccepted",
        accepted
    );

    setText(
        "#adminCompleted",
        completed
    );

    setText(
        "#adminRejected",
        rejected
    );

    setText(
        "#adminClosed",
        closed
    );

}


/* =========================================================
   UI — АВТОРИЗАЦИЯ
========================================================= */

function showLogin() {

    const element =
        document.querySelector(
            "#loginSection"
        );


    if (element) {

        element.classList.add(
            "active"
        );

    }

}


function hideLogin() {

    const element =
        document.querySelector(
            "#loginSection"
        );


    if (element) {

        element.classList.remove(
            "active"
        );

    }

}


function showRegister() {

    const element =
        document.querySelector(
            "#registerSection"
        );


    if (element) {

        element.classList.add(
            "active"
        );

    }

}


function hideRegister() {

    const element =
        document.querySelector(
            "#registerSection"
        );


    if (element) {

        element.classList.remove(
            "active"
        );

    }

}


function showAdminLogin() {

    const element =
        document.querySelector(
            "#adminLoginSection"
        );


    if (element) {

        element.classList.add(
            "active"
        );

    }

}


function hideAdminLogin() {

    const element =
        document.querySelector(
            "#adminLoginSection"
        );


    if (element) {

        element.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   UI — СОСТОЯНИЕ
========================================================= */

function updateInterface() {

    /*
     * Имя гражданина
     */

    const citizenName =
        OLYMP.citizen?.fullName ||
        OLYMP.citizen?.name ||
        "";


    setText(
        "#userName",
        citizenName
    );


    setText(
        "#profileName",
        citizenName
    );


    setText(
        "#userId",
        OLYMP.citizen?.idNumber || ""
    );


    setText(
        "#profileId",
        OLYMP.citizen?.idNumber || ""
    );


    /*
     * Администратор
     */

    setText(
        "#adminName",
        OLYMP.admin?.name ||
        OLYMP.admin?.login ||
        ""
    );


    setText(
        "#adminRole",
        OLYMP.admin?.role ||
        ""
    );


    /*
     * Кнопки
     */

    $$(
        "[data-auth-only]"
    )
        .forEach(
            element => {

                element.style.display =
                    OLYMP.citizen
                        ? ""
                        : "none";

            }
        );


    $$(
        "[data-guest-only]"
    )
        .forEach(
            element => {

                element.style.display =
                    OLYMP.citizen
                        ? "none"
                        : "";

            }
        );


    $$(
        "[data-admin-only]"
    )
        .forEach(
            element => {

                element.style.display =
                    OLYMP.admin
                        ? ""
                        : "none";

            }
        );


    updateStatistics();

}


/* =========================================================
   КНОПКИ
========================================================= */

function initButtons() {

    /*
     * Logout гражданина
     */

    $$(
        "[data-logout]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    logoutCitizen
                );

            }
        );


    /*
     * Переход в регистрацию
     */

    $$(
        "[data-register]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        hideLogin();

                        showRegister();

                    }
                );

            }
        );


    /*
     * Переход во вход
     */

    $$(
        "[data-login]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        hideRegister();

                        showLogin();

                    }
                );

            }
        );


    /*
     * Создание заявки
     */

    $$(
        "[data-create-application]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    openApplicationCreate
                );

            }
        );


    /*
     * Закрытие модалок
     */

    $$(
        "[data-close-modal]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        closeApplicationModal();

                        closeAdminApplicationModal();

                    }
                );

            }
        );


    /*
     * Копирование номера
     */

    $$(
        "[data-copy-number]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        copyText(
                            button.dataset.copyNumber
                        );

                    }
                );

            }
        );

}


/* =========================================================
   СОЗДАНИЕ ЗАЯВКИ
========================================================= */

function openApplicationCreate() {

    if (
        !OLYMP.citizen
    ) {

        showLogin();

        showToast(
            "Для подання заявки необхідно увійти.",
            "error"
        );

        return;

    }


    const modal =
        document.querySelector(
            "#applicationCreateModal"
        );


    if (modal) {

        /*
         * Автоматически подставляем данные
         */

        const fullName =
            modal.querySelector(
                '[name="fullName"]'
            );


        const idNumber =
            modal.querySelector(
                '[name="idNumber"]'
            );


        const contact =
            modal.querySelector(
                '[name="contact"]'
            );


        if (fullName) {

            fullName.value =
                OLYMP.citizen.fullName ||
                OLYMP.citizen.name ||
                "";

        }


        if (idNumber) {

            idNumber.value =
                OLYMP.citizen.idNumber ||
                "";

        }


        if (contact) {

            contact.value =
                OLYMP.citizen.contact ||
                "";

        }


        modal.classList.add(
            "active"
        );

    }

}


/* =========================================================
   ADMIN LOADING
========================================================= */

function showAdminLoading() {

    const element =
        document.querySelector(
            "#adminLoading"
        );


    if (element) {

        element.classList.add(
            "active"
        );

    }

}


function hideAdminLoading() {

    const element =
        document.querySelector(
            "#adminLoading"
        );


    if (element) {

        element.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   ЗАГРУЗКА
========================================================= */

function setLoading(
    form,
    loading
) {

    if (!form) {

        return;

    }


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    if (!button) {

        return;

    }


    if (loading) {

        button.dataset.originalText =
            button.innerHTML;


        button.disabled =
            true;


        button.innerHTML =
            `

                <span class="loading-spinner">
                    ⏳
                </span>

                Зачекайте...

            `;

    } else {

        button.disabled =
            false;


        button.innerHTML =
            button.dataset.originalText ||
            "Увійти";

    }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "info"
) {

    let container =
        document.querySelector(
            "#toastContainer"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );


        container.id =
            "toastContainer";


        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast toast-${type}`;


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );

        }
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );


            setTimeout(
                () => {

                    toast.remove();

                },
                300
            );

        },
        4000
    );

}


/* =========================================================
   УТИЛИТЫ
========================================================= */

function clean(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(value)

        .trim()

        .replace(
            /<[^>]*>/g,
            ""
        )

        .replace(
            /\s+/g,
            " "
        );

}


function escapeHTML(value) {

    return String(
        value ?? ""
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


function setText(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (element) {

        element.textContent =
            value ?? "";

    }

}


function statusClass(
    status
) {

    if (
        status ===
        "🟡 На розгляді"
    ) {

        return "status-pending";

    }


    if (
        status ===
        "🔵 Прийнято"
    ) {

        return "status-accepted";

    }


    if (
        status ===
        "🟢 Виконано"
    ) {

        return "status-completed";

    }


    if (
        status ===
        "🔴 Відхилено"
    ) {

        return "status-rejected";

    }


    if (
        status ===
        "⚫ Закрито"
    ) {

        return "status-closed";

    }


    return "";

}


async function copyText(
    text
) {

    try {

        await navigator.clipboard.writeText(
            text
        );


        showToast(
            "Номер заявки скопійовано.",
            "success"
        );

    } catch {

        showToast(
            "Не вдалося скопіювати номер.",
            "error"
        );

    }

}


function debounce(
    callback,
    delay
) {

    let timer;


    return function (...args) {

        clearTimeout(
            timer
        );


        timer =
            setTimeout(
                () => {

                    callback(
                        ...args
                    );

                },
                delay
            );

    };

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


        closeApplicationModal();

        closeAdminApplicationModal();

    }
);


/* =========================================================
   КЛИК ПО ФОНУ МОДАЛКИ
========================================================= */

document.addEventListener(
    "click",
    event => {

        const target =
            event.target;


        if (
            target.classList.contains(
                "modal"
            )
        ) {

            target.classList.remove(
                "active"
            );

        }

    }
);


/* =========================================================
   ЗАЩИТА ОТ СЛУЧАЙНОГО ОТПРАВЛЕНИЯ
========================================================= */

document.addEventListener(
    "submit",
    event => {

        const form =
            event.target;


        if (
            !form ||
            !form.matches(
                "form"
            )
        ) {

            return;

        }


        /*
         * Не блокируем формы,
         * обработанные выше.
         */

    }
);


/* =========================================================
   ГЛОБАЛЬНЫЕ ФУНКЦИИ
========================================================= */

window.OLYMP =
    OLYMP;


window.showPage =
    showPage;


window.showLogin =
    showLogin;


window.showRegister =
    showRegister;


window.showAdminLogin =
    showAdminLogin;


window.logoutCitizen =
    logoutCitizen;


window.logoutAdmin =
    logoutAdmin;


window.openApplication =
    openApplication;


window.closeApplicationModal =
    closeApplicationModal;


window.closeAdminApplicationModal =
    closeAdminApplicationModal;


window.loadCitizenApplications =
    loadCitizenApplications;


window.loadAdminApplications =
    loadAdminApplications;


window.openApplicationCreate =
    openApplicationCreate;


window.copyText =
    copyText;


console.log(
    "%cOLYMP Government Script 6.2",
    "font-weight:bold;font-size:16px"
);

console.log(
    "Personal Cabinet + Admin Panel"
);
