/* =========================================================
   OLYMP GOVERNMENT
   PERSONAL CABINET / GOVERNMENT PORTAL
   SCRIPT.JS 6.2

   Совместим с:
   - index.html
   - Code.gs 6.2

   Возможности:
   - Государственные услуги
   - Поиск
   - Фильтрация
   - Модальное окно услуги
   - Модальное окно заявки
   - Отправка заявки в Google Apps Script
   - Получение номера заявки
   - Отображение статуса
   - Мобильное меню
   - Защита от повторной отправки
========================================================= */


/* =========================================================
   НАСТРОЙКИ
========================================================= */

/*
 * ВАЖНО!
 *
 * Сюда вставь URL опубликованного Google Apps Script.
 *
 * Пример:
 *
 * https://script.google.com/macros/s/XXXXXXXXXXXX/exec
 *
 */

const OLYMP_CONFIG = {

    API_URL:
        "https://script.google.com/macros/s/AKfycbyynbAxu6A_tU5nBEUum357BCY6o8D-3e44wEtR-AlyOtV5un8mNgpmkvU6dtrIy0RvfQ/exec",

    DEBUG:
        true

};


/* =========================================================
   ЛОГ
========================================================= */

function log(...args) {

    if (
        OLYMP_CONFIG.DEBUG &&
        typeof console !== "undefined"
    ) {

        console.log(
            "[OLYMP 6.2]",
            ...args
        );

    }

}


log(
    "OLYMP Government Script 6.2"
);

log(
    "Personal Cabinet + Government Portal"
);


/* =========================================================
   СОСТОЯНИЕ
========================================================= */

let currentService = null;

let applicationSending = false;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        log(
            "DOM загружен"
        );

        initializePortal();

    }
);


/* =========================================================
   ИНИЦИАЛИЗАЦИЯ
========================================================= */

function initializePortal() {

    initializeMobileMenu();

    initializeServiceSearch();

    initializeCategoryFilters();

    initializeApplicationForm();

    initializeModalEvents();

    initializeClearSearch();

    restoreApplicationDraft();

    updateServiceCount();

    log(
        "Портал OLYMP Government инициализирован."
    );

}


/* =========================================================
   МОБИЛЬНОЕ МЕНЮ
========================================================= */

function initializeMobileMenu() {

    const menuButton =
        document.getElementById(
            "menuButton"
        );

    const menu =
        document.getElementById(
            "mainMenu"
        );


    if (
        !menuButton ||
        !menu
    ) {

        return;

    }


    menuButton.addEventListener(
        "click",
        function () {

            menu.classList.toggle(
                "active"
            );

        }
    );


    const links =
        menu.querySelectorAll(
            "a"
        );


    links.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    menu.classList.remove(
                        "active"
                    );

                }
            );

        }
    );

}


/* =========================================================
   ПОИСК УСЛУГ
========================================================= */

function initializeServiceSearch() {

    const search =
        document.getElementById(
            "serviceSearch"
        );


    if (!search) {

        return;

    }


    search.addEventListener(
        "input",
        function () {

            filterServices();

        }
    );

}


/* =========================================================
   ОЧИСТКА ПОИСКА
========================================================= */

function initializeClearSearch() {

    const button =
        document.getElementById(
            "clearSearch"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function () {

            const search =
                document.getElementById(
                    "serviceSearch"
                );


            if (search) {

                search.value = "";

                search.focus();

            }


            filterServices();

        }
    );

}


/* =========================================================
   ФИЛЬТР КАТЕГОРИЙ
========================================================= */

function initializeCategoryFilters() {

    const buttons =
        document.querySelectorAll(
            ".category-btn"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    buttons.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    filterServices();

                }
            );

        }
    );

}


/* =========================================================
   ФИЛЬТРАЦИЯ УСЛУГ
========================================================= */

function filterServices() {

    const search =
        document.getElementById(
            "serviceSearch"
        );


    const query =
        search
            ? search.value
                .trim()
                .toLowerCase()
            : "";


    const activeCategory =
        document.querySelector(
            ".category-btn.active"
        );


    const category =
        activeCategory
            ? activeCategory.dataset.category
            : "all";


    const services =
        document.querySelectorAll(
            ".service-item"
        );


    const noResults =
        document.getElementById(
            "noResults"
        );


    let visibleCount = 0;


    services.forEach(
        function (service) {

            const title =
                (
                    service.dataset.title ||
                    ""
                ).toLowerCase();


            const description =
                (
                    service.dataset.description ||
                    ""
                ).toLowerCase();


            const requirements =
                (
                    service.dataset.requirements ||
                    ""
                ).toLowerCase();


            const serviceCategory =
                (
                    service.dataset.category ||
                    ""
                ).toLowerCase();


            const content =
                title +
                " " +
                description +
                " " +
                requirements;


            const matchesSearch =
                !query ||
                content.includes(
                    query
                );


            const matchesCategory =
                category === "all" ||
                serviceCategory === category;


            if (
                matchesSearch &&
                matchesCategory
            ) {

                service.style.display =
                    "";

                visibleCount++;

            } else {

                service.style.display =
                    "none";

            }

        }
    );


    if (noResults) {

        if (
            visibleCount === 0
        ) {

            noResults.classList.add(
                "active"
            );

        } else {

            noResults.classList.remove(
                "active"
            );

        }

    }


    log(
        "Фильтрация:",
        {
            query,
            category,
            visibleCount
        }
    );

}


/* =========================================================
   КОЛИЧЕСТВО УСЛУГ
========================================================= */

function updateServiceCount() {

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
   ОТКРЫТИЕ УСЛУГИ
========================================================= */

/*
 * ЭТА ФУНКЦИЯ НУЖНА HTML:
 *
 * onclick="openService(this)"
 *
 */

function openService(button) {

    if (!button) {

        return;

    }


    const card =
        button.closest(
            ".service-card"
        );


    if (!card) {

        log(
            "Карточка услуги не найдена."
        );

        return;

    }


    const title =
        card.dataset.title ||
        card.querySelector("h3")?.textContent.trim() ||
        "Державна послуга";


    const description =
        card.dataset.description ||
        card.querySelector("p")?.textContent.trim() ||
        "Інформація про державну послугу.";


    const requirements =
        card.dataset.requirements ||
        "Не вказано.";


    const category =
        card.dataset.category ||
        "government";


    const iconElement =
        card.querySelector(
            ".service-icon"
        );


    const icon =
        iconElement
            ? iconElement.textContent.trim()
            : "🏛️";


    currentService = {

        title,
        description,
        requirements,
        category,
        icon

    };


    setElementText(
        "modalIcon",
        icon
    );


    setElementText(
        "modalTitle",
        title
    );


    setElementText(
        "modalDescription",
        description
    );


    setElementText(
        "modalRequirements",
        requirements
    );


    setElementText(
        "modalCategory",
        getCategoryName(category)
    );


    const modal =
        document.getElementById(
            "serviceModal"
        );


    if (!modal) {

        return;

    }


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


    log(
        "Открыта услуга:",
        title
    );

}


/* =========================================================
   НАЗВАНИЕ КАТЕГОРИИ
========================================================= */

function getCategoryName(category) {

    const categories = {

        documents:
            "ДЕРЖАВНІ ДОКУМЕНТИ",

        transport:
            "ТРАНСПОРТ",

        business:
            "БІЗНЕС",

        legal:
            "ЮРИДИЧНІ ПОСЛУГИ",

        government:
            "УРЯДОВІ ПОСЛУГИ"

    };


    return (
        categories[category] ||
        "ДЕРЖАВНА ПОСЛУГА"
    );

}


/* =========================================================
   ЗАКРЫТИЕ SERVICE MODAL
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


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   КНОПКА "ПОДАТИ ЗАЯВКУ" ИЗ SERVICE MODAL
========================================================= */

function initializeServiceApplicationButton() {

    const button =
        document.getElementById(
            "applyFromService"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function () {

            const selectedService =
                currentService
                    ? currentService.title
                    : "Звернення громадянина";


            closeServiceModal();


            openApplicationModal(
                selectedService
            );

        }
    );

}


/* =========================================================
   ОТКРЫТИЕ APPLICATION MODAL
========================================================= */

/*
 * ЭТА ФУНКЦИЯ ВЫЗЫВАЕТСЯ ИЗ HTML:
 *
 * onclick="openApplicationModal('Звернення громадянина')"
 *
 */

function openApplicationModal(
    serviceName
) {

    const modal =
        document.getElementById(
            "applicationModal"
        );


    if (!modal) {

        log(
            "applicationModal не найден."
        );

        return;

    }


    const form =
        document.getElementById(
            "applicationForm"
        );


    const success =
        document.getElementById(
            "successMessage"
        );


    /*
     * Скрываем результат
     */

    if (success) {

        success.classList.remove(
            "active"
        );

        success.style.display =
            "none";

    }


    /*
     * Показываем форму
     */

    if (form) {

        form.style.display =
            "";

    }


    /*
     * Устанавливаем выбранную услугу
     */

    if (
        serviceName
    ) {

        const select =
            document.getElementById(
                "applicationService"
            );


        if (select) {

            setServiceSelectValue(
                select,
                serviceName
            );

        }

    }


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


    /*
     * Автофокус
     */

    setTimeout(
        function () {

            const firstInput =
                document.getElementById(
                    "fullName"
                );


            if (firstInput) {

                firstInput.focus();

            }

        },
        150
    );


    log(
        "Открыта форма заявки:",
        serviceName
    );

}


/* =========================================================
   УСТАНОВКА ЗНАЧЕНИЯ SELECT
========================================================= */

function setServiceSelectValue(
    select,
    serviceName
) {

    const options =
        Array.from(
            select.options
        );


    /*
     * Сначала точное совпадение
     */

    const exact =
        options.find(
            function (option) {

                return (
                    option.value.trim() ===
                    serviceName.trim()
                );

            }
        );


    if (exact) {

        select.value =
            exact.value;

        return;

    }


    /*
     * Затем совпадение по тексту
     */

    const textMatch =
        options.find(
            function (option) {

                return (
                    option.textContent
                        .trim()
                        .toLowerCase() ===
                    serviceName
                        .trim()
                        .toLowerCase()
                );

            }
        );


    if (textMatch) {

        select.value =
            textMatch.value;

        return;

    }


    /*
     * Если такой услуги нет —
     * оставляем "Оберіть послугу"
     */

    select.value = "";

}


/* =========================================================
   ЗАКРЫТИЕ APPLICATION MODAL
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


    document.body.classList.remove(
        "modal-open"
    );


    /*
     * Разрешаем новую отправку
     */

    applicationSending =
        false;


    const submitButton =
        document.querySelector(
            "#applicationForm button[type='submit']"
        );


    if (submitButton) {

        submitButton.disabled =
            false;

        submitButton.dataset.originalText =
            "Надіслати заявку";

        submitButton.textContent =
            "Надіслати заявку";

    }

}


/* =========================================================
   MODAL EVENTS
========================================================= */

function initializeModalEvents() {

    initializeServiceApplicationButton();


    /*
     * Закрытие по ESC
     */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !== "Escape"
            ) {

                return;

            }


            closeServiceModal();

            closeApplicationModal();

        }
    );


    /*
     * Закрытие при клике по затемнению
     */

    const serviceModal =
        document.getElementById(
            "serviceModal"
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


    const applicationModal =
        document.getElementById(
            "applicationModal"
        );


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
   APPLICATION FORM
========================================================= */

function initializeApplicationForm() {

    const form =
        document.getElementById(
            "applicationForm"
        );


    if (!form) {

        log(
            "applicationForm не найден."
        );

        return;

    }


    form.addEventListener(
        "submit",
        submitApplication
    );


    /*
     * Сохраняем черновик при вводе
     */

    const fields =
        form.querySelectorAll(
            "input, select, textarea"
        );


    fields.forEach(
        function (field) {

            field.addEventListener(
                "input",
                saveApplicationDraft
            );


            field.addEventListener(
                "change",
                saveApplicationDraft
            );

        }
    );

}


/* =========================================================
   ОТПРАВКА ЗАЯВКИ
========================================================= */

async function submitApplication(
    event
) {

    event.preventDefault();


    if (
        applicationSending
    ) {

        return;

    }


    const form =
        document.getElementById(
            "applicationForm"
        );


    if (!form) {

        return;

    }


    /*
     * Получаем поля
     */

    const fullName =
        getInputValue(
            "fullName"
        );


    const idNumber =
        getInputValue(
            "idNumber"
        );


    const service =
        getInputValue(
            "applicationService"
        );


    const contact =
        getInputValue(
            "contact"
        );


    const message =
        getInputValue(
            "message"
        );


    /*
     * Проверка
     */

    if (!fullName) {

        showFormError(
            "Вкажіть ПІБ."
        );

        focusElement(
            "fullName"
        );

        return;

    }


    if (!idNumber) {

        showFormError(
            "Вкажіть номер посвідчення."
        );

        focusElement(
            "idNumber"
        );

        return;

    }


    if (!service) {

        showFormError(
            "Оберіть державну послугу."
        );

        focusElement(
            "applicationService"
        );

        return;

    }


    if (!message) {

        showFormError(
            "Вкажіть опис звернення."
        );

        focusElement(
            "message"
        );

        return;

    }


/*
 * =========================================================
 * ПРОВЕРКА API
 * =========================================================
 */

const apiUrl =
    String(
        OLYMP_CONFIG.API_URL || ""
    ).trim();


if (
    !apiUrl ||
    !apiUrl.startsWith(
        "https://script.google.com/macros/s/"
    ) ||
    !apiUrl.endsWith(
        "/exec"
    )
) {

    showFormError(
        "Система заявок ще не налаштована. Адміністратору необхідно додати правильний URL Google Apps Script."
    );

    console.error(
        "[OLYMP 6.2] Неправильний API URL:",
        apiUrl
    );

    applicationSending = false;

    return;

}


log(
    "[OLYMP 6.2] API:",
    apiUrl
);


    /*
     * Включаем состояние отправки
     */

    applicationSending =
        true;


    const submitButton =
        form.querySelector(
            "button[type='submit']"
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.dataset.originalText =
            submitButton.textContent;

        submitButton.textContent =
            "Відправлення...";

    }


    /*
     * Данные для Code.gs
     *
     * Code.gs ожидает:
     *
     * fullName
     * idNumber
     * service
     * contact
     * message
     */

    const formData =
        new URLSearchParams();


    formData.append(
        "fullName",
        fullName
    );


    formData.append(
        "idNumber",
        idNumber
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


    log(
        "Отправка заявки..."
    );


    try {

        /*
         * ВАЖНО:
         *
         * Google Apps Script может делать
         * redirect при POST.
         *
         * Поэтому используем no-cors.
         *
         * Заявка при этом отправляется
         * в Code.gs.
         */

        await fetch(
            OLYMP_CONFIG.API_URL,
            {

                method:
                    "POST",

                mode:
                    "no-cors",

                body:
                    formData

            }
        );


        /*
         * При no-cors браузер не позволяет
         * прочитать JSON-ответ Apps Script.
         *
         * Поэтому показываем пользователю
         * подтверждение после успешной
         * отправки HTTP-запроса.
         */

        showApplicationSuccess(
            null,
            service
        );


        /*
         * Очищаем черновик
         */

        clearApplicationDraft();


    } catch (error) {

        console.error(
            "Ошибка отправки:",
            error
        );


        showFormError(
            "Не вдалося відправити заявку. Перевірте підключення до системи."
        );


        applicationSending =
            false;


        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                submitButton.dataset.originalText ||
                "Надіслати заявку";

        }

    }

}


/* =========================================================
   УСПЕШНАЯ ОТПРАВКА
========================================================= */

function showApplicationSuccess(
    response,
    service
) {

    const form =
        document.getElementById(
            "applicationForm"
        );


    const success =
        document.getElementById(
            "successMessage"
        );


    if (!success) {

        return;

    }


    /*
     * Скрываем форму
     */

    if (form) {

        form.style.display =
            "none";

    }


    /*
     * Показываем success
     */

    success.style.display =
        "block";


    success.classList.add(
        "active"
    );


    /*
     * Номер заявки
     */

    const number =
        response &&
        response.number
            ? response.number
            : generateTemporaryApplicationNumber();


    setElementText(
        "applicationNumber",
        "№ " + number
    );


    /*
     * Статус
     */

    setApplicationStatus(
        response &&
        response.status
            ? response.status
            : "🟡 На розгляді"
    );


    /*
     * Сообщение
     */

    const successText =
        success.querySelector(
            "p"
        );


    if (successText) {

        successText.textContent =
            "Ваше звернення успішно сформовано та передано до Уряду штату Olymp.";

    }


    log(
        "Заявка отправлена:",
        {
            number,
            service
        }
    );

}


/* =========================================================
   СТАТУС ЗАЯВКИ
========================================================= */

function setApplicationStatus(
    status
) {

    const container =
        document.getElementById(
            "applicationStatus"
        );


    if (!container) {

        return;

    }


    const badge =
        container.querySelector(
            ".status-badge"
        );


    if (!badge) {

        return;

    }


    badge.textContent =
        status;


    badge.classList.remove(
        "pending",
        "accepted",
        "completed",
        "rejected",
        "closed"
    );


    if (
        status.includes(
            "На розгляді"
        )
    ) {

        badge.classList.add(
            "pending"
        );

    } else if (
        status.includes(
            "Прийнято"
        )
    ) {

        badge.classList.add(
            "accepted"
        );

    } else if (
        status.includes(
            "Виконано"
        )
    ) {

        badge.classList.add(
            "completed"
        );

    } else if (
        status.includes(
            "Відхилено"
        )
    ) {

        badge.classList.add(
            "rejected"
        );

    } else if (
        status.includes(
            "Закрито"
        )
    ) {

        badge.classList.add(
            "closed"
        );

    }

}


/* =========================================================
   ВРЕМЕННЫЙ НОМЕР
========================================================= */

/*
 * В текущем Code.gs настоящий номер
 * генерируется на сервере.
 *
 * Из-за no-cors браузер не может
 * прочитать ответ.
 *
 * Поэтому здесь показываем
 * временный номер только на экране.
 *
 * В Google Sheets настоящий номер
 * будет вида:
 *
 * OLYMP-000001
 *
 */

function generateTemporaryApplicationNumber() {

    const timestamp =
        Date.now()
            .toString()
            .slice(-6);


    return (
        "OLYMP-" +
        timestamp
    );

}


/* =========================================================
   ОШИБКА ФОРМЫ
========================================================= */

function showFormError(
    message
) {

    /*
     * Сначала удаляем старое сообщение
     */

    const old =
        document.querySelector(
            ".olymp-form-error"
        );


    if (old) {

        old.remove();

    }


    const form =
        document.getElementById(
            "applicationForm"
        );


    if (!form) {

        alert(
            message
        );

        return;

    }


    const error =
        document.createElement(
            "div"
        );


    error.className =
        "olymp-form-error";


    error.textContent =
        message;


    error.style.marginBottom =
        "15px";


    error.style.padding =
        "12px 15px";


    error.style.borderRadius =
        "8px";


    error.style.background =
        "#ffe6e6";


    error.style.color =
        "#9b1c1c";


    error.style.fontSize =
        "14px";


    error.style.fontWeight =
        "600";


    form.prepend(
        error
    );


    setTimeout(
        function () {

            if (
                error.parentNode
            ) {

                error.remove();

            }

        },
        5000
    );

}


/* =========================================================
   ПОЛУЧЕНИЕ VALUE
========================================================= */

function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


/* =========================================================
   УСТАНОВКА TEXT
========================================================= */

function setElementText(
    id,
    text
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.textContent =
        text;

}


/* =========================================================
   FOCUS
========================================================= */

function focusElement(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    setTimeout(
        function () {

            element.focus();

        },
        50
    );

}


/* =========================================================
   ЧЕРНОВИК ЗАЯВКИ
========================================================= */

const APPLICATION_DRAFT_KEY =
    "olymp_application_draft_6_2";


function saveApplicationDraft() {

    try {

        const data = {

            fullName:
                getInputValue(
                    "fullName"
                ),

            idNumber:
                getInputValue(
                    "idNumber"
                ),

            service:
                getInputValue(
                    "applicationService"
                ),

            contact:
                getInputValue(
                    "contact"
                ),

            message:
                getInputValue(
                    "message"
                )

        };


        localStorage.setItem(
            APPLICATION_DRAFT_KEY,
            JSON.stringify(data)
        );

    } catch (error) {

        console.warn(
            "Не удалось сохранить черновик.",
            error
        );

    }

}


/* =========================================================
   ВОССТАНОВЛЕНИЕ ЧЕРНОВИКА
========================================================= */

function restoreApplicationDraft() {

    try {

        const saved =
            localStorage.getItem(
                APPLICATION_DRAFT_KEY
            );


        if (!saved) {

            return;

        }


        const data =
            JSON.parse(
                saved
            );


        if (
            data.fullName
        ) {

            setInputValue(
                "fullName",
                data.fullName
            );

        }


        if (
            data.idNumber
        ) {

            setInputValue(
                "idNumber",
                data.idNumber
            );

        }


        if (
            data.service
        ) {

            setInputValue(
                "applicationService",
                data.service
            );

        }


        if (
            data.contact
        ) {

            setInputValue(
                "contact",
                data.contact
            );

        }


        if (
            data.message
        ) {

            setInputValue(
                "message",
                data.message
            );

        }


        log(
            "Черновик заявки восстановлен."
        );

    } catch (error) {

        console.warn(
            "Не удалось восстановить черновик.",
            error
        );

    }

}


/* =========================================================
   SET INPUT VALUE
========================================================= */

function setInputValue(
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


    element.value =
        value;

}


/* =========================================================
   ОЧИСТКА ЧЕРНОВИКА
========================================================= */

function clearApplicationDraft() {

    try {

        localStorage.removeItem(
            APPLICATION_DRAFT_KEY
        );

    } catch (error) {

        console.warn(
            "Не удалось удалить черновик.",
            error
        );

    }

}


/* =========================================================
   ЗАКРЫТИЕ ПО ССЫЛКАМ
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const link =
            event.target.closest(
                "a[href='#']"
            );


        if (!link) {

            return;

        }


        event.preventDefault();

    }
);


/* =========================================================
   ПЛАВНАЯ НАВИГАЦИЯ
========================================================= */

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


        const target =
            document.querySelector(
                targetId
            );


        if (!target) {

            return;

        }


        event.preventDefault();


        target.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });

    }
);


/* =========================================================
   HEADER SCROLL
========================================================= */

window.addEventListener(
    "scroll",
    function () {

        const header =
            document.getElementById(
                "header"
            );


        if (!header) {

            return;

        }


        if (
            window.scrollY > 30
        ) {

            header.classList.add(
                "scrolled"
            );

        } else {

            header.classList.remove(
                "scrolled"
            );

        }

    },
    {
        passive: true
    }
);


/* =========================================================
   АВТОМАТИЧЕСКАЯ ГЛОБАЛЬНАЯ ИНИЦИАЛИЗАЦИЯ
========================================================= */

window.openService =
    openService;


window.openApplicationModal =
    openApplicationModal;


window.closeServiceModal =
    closeServiceModal;


window.closeApplicationModal =
    closeApplicationModal;


/* =========================================================
   FINISH
========================================================= */

log(
    "OLYMP Government Script 6.2 готов."
);
