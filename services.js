/* =========================================================
   OLYMP GOVERNMENT
   SERVICES
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeServicesPage();

    }
);


function initializeServicesPage() {

    initializeSearch();

    initializeFilters();

    initializeServiceModal();

}


/* =========================================================
   SEARCH
========================================================= */

function initializeSearch() {

    const input =
        document.getElementById(
            "serviceSearch"
        );

    const clear =
        document.getElementById(
            "clearSearch"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        filterServices
    );


    if (clear) {

        clear.addEventListener(
            "click",
            () => {

                input.value = "";

                filterServices();

                input.focus();

            }
        );

    }

}


/* =========================================================
   FILTERS
========================================================= */

let currentCategory = "all";


function initializeFilters() {

    const buttons =
        document.querySelectorAll(
            ".service-filter"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    buttons.forEach(
                        item => {

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

}


/* =========================================================
   FILTER SERVICES
========================================================= */

function filterServices() {

    const input =
        document.getElementById(
            "serviceSearch"
        );


    const cards =
        document.querySelectorAll(
            ".service-card"
        );


    const empty =
        document.getElementById(
            "servicesEmpty"
        );


    const clear =
        document.getElementById(
            "clearSearch"
        );


    const search =
        input
            ? input.value
                .toLowerCase()
                .trim()
            : "";


    let visible = 0;


    cards.forEach(
        card => {

            const title =
                (
                    card.dataset.title ||
                    ""
                ).toLowerCase();


            const category =
                card.dataset.category ||
                "";


            const matchSearch =
                !search ||
                title.includes(search);


            const matchCategory =
                currentCategory === "all" ||
                category === currentCategory;


            if (
                matchSearch &&
                matchCategory
            ) {

                card.style.display = "";

                visible++;

            } else {

                card.style.display = "none";

            }

        }
    );


    /*
     * Скрываем пустые категории
     */

    document
        .querySelectorAll(
            ".service-group"
        )
        .forEach(
            group => {

                const visibleCards =
                    group.querySelectorAll(
                        ".service-card:not([style*='display: none'])"
                    );


                group.style.display =
                    visibleCards.length
                        ? ""
                        : "none";

            }
        );


    if (empty) {

        empty.classList.toggle(
            "visible",
            visible === 0
        );

    }


    if (clear) {

        clear.classList.toggle(
            "active",
            Boolean(search)
        );

    }

}


/* =========================================================
   MODAL
========================================================= */

function initializeServiceModal() {

    const modal =
        document.getElementById(
            "serviceModal"
        );


    const close =
        document.getElementById(
            "closeServiceModal"
        );


    const closeButton =
        document.getElementById(
            "modalCloseButton"
        );


    const buttons =
        document.querySelectorAll(
            ".service-open"
        );


    if (!modal) {
        return;
    }


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    openServiceModal(
                        button
                            .dataset
                            .service
                    );

                }
            );

        }
    );


    if (close) {

        close.addEventListener(
            "click",
            closeServiceModal
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeServiceModal
        );

    }


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeServiceModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeServiceModal();

            }

        }
    );

}


/* =========================================================
   SERVICE DATA
========================================================= */

const serviceData = {

    government: {

        icon: "🏛️",

        label: "УРЯД ШТАТУ",

        title: "Уряд штату OLYMP",

        category: "Державні органи",

        description:
            "Центральний орган державного управління штату, який забезпечує координацію роботи державних органів, реалізацію державної політики та взаємодію між службами."

    },


    mayor: {

        icon: "🏢",

        label: "МІСЦЕВЕ САМОВРЯДУВАННЯ",

        title: "Мерія",

        category: "Державні органи",

        description:
            "Орган місцевого самоврядування, який забезпечує управління містом, розвиток міської інфраструктури та взаємодію з громадянами."

    },


    lspd: {

        icon: "🚔",

        label: "LSPD",

        title:
            "Los Santos Police Department",

        category:
            "Правоохоронні органи",

        description:
            "Поліцейський департамент міста Los Santos. Забезпечує охорону громадського порядку, безпеку громадян та реагування на правопорушення."

    },


    sfpd: {

        icon: "🚔",

        label: "SFPD",

        title:
            "San Fierro Police Department",

        category:
            "Правоохоронні органи",

        description:
            "Правоохоронний орган міста San Fierro, відповідальний за забезпечення громадської безпеки та дотримання законодавства."

    },


    lvpd: {

        icon: "🚔",

        label: "LVPD",

        title:
            "Las Venturas Police Department",

        category:
            "Правоохоронні органи",

        description:
            "Поліцейський департамент міста Las Venturas, який здійснює охорону громадського порядку та забезпечує безпеку населення."

    },


    bcsd: {

        icon: "⭐",

        label: "BCSD",

        title:
            "Blaine County Sheriff's Department",

        category:
            "Правоохоронні органи",

        description:
            "Шерифський департамент округу Blaine County, який відповідає за охорону правопорядку, безпеку громадян та реагування на надзвичайні ситуації."

    },


    fib: {

        icon: "🕵️",

        label: "FIB",

        title:
            "Federal Investigation Bureau",

        category:
            "Федеральні служби",

        description:
            "Федеральний правоохоронний орган, який займається розслідуванням особливо важливих справ, боротьбою з організованою злочинністю та загрозами державній безпеці."

    },


    sang: {

        icon: "🪖",

        label: "SANG",

        title:
            "San Andreas National Guard",

        category:
            "Національна гвардія",

        description:
            "Національна гвардія штату, яка забезпечує оборону, охорону стратегічних об'єктів, військову безпеку та виконання спеціальних завдань."

    },


    sams: {

        icon: "🏥",

        label: "SAMS",

        title:
            "San Andreas Medical Services",

        category:
            "Медичні служби",

        description:
            "Державна медична служба штату, яка забезпечує медичну допомогу громадянам, роботу лікарень та екстрене реагування."

    }

};


/* =========================================================
   OPEN
========================================================= */

function openServiceModal(
    serviceId
) {

    const data =
        serviceData[serviceId];


    if (!data) {
        return;
    }


    const modal =
        document.getElementById(
            "serviceModal"
        );


    document.getElementById(
        "modalIcon"
    ).textContent =
        data.icon;


    document.getElementById(
        "modalLabel"
    ).textContent =
        data.label;


    document.getElementById(
        "modalTitle"
    ).textContent =
        data.title;


    document.getElementById(
        "modalCategory"
    ).textContent =
        data.category;


    document.getElementById(
        "modalDescription"
    ).textContent =
        data.description;


    modal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE
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


    document.body.style.overflow =
        "";

}
