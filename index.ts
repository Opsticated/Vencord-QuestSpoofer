import definePlugin from "@utils/types";

import Settings from "./settings";
import runScript from "./script";

const BUTTON_ID = "vencord-quest-script-button";

const pluginName = "QuestSpoofer";

let observer: MutationObserver | null = null;
let syncScheduled = false;

function isOnQuestsPage() {
    // Current Discord Quest route is /quest-home.
    // /quests is included as a fallback in case Discord changes/reroutes it.
    return (
        location.pathname.includes("/quest-home") ||
        location.pathname.includes("/quests")
    );
}

function styleButton(button: HTMLButtonElement, floating: boolean) {
    button.style.cssText = `
        height: 32px;
        padding: 0 16px;
        border: none;
        border-radius: 8px;
        background: var(--brand-500, #5865f2);
        color: white;
        font-family: inherit;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition:
            background 0.15s ease,
            opacity 0.15s ease;
        ${floating ? `
            position: fixed;
            top: 70px;
            right: 24px;
            z-index: 9999;
        ` : `
            position: relative;
            margin-left: 8px;
        `}
    `;
}

function createButton() {
    const button = document.createElement("button");

    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "Spoof Active Quests";
    button.setAttribute("aria-label", "Run Quest spoofing");

    button.addEventListener("mouseenter", () => {
        if (!button.disabled)
            button.style.opacity = "0.85";
    });

    button.addEventListener("mouseleave", () => {
        button.style.opacity = "1";
    });

    button.addEventListener("click", async () => {
        const previousText = button.textContent;

        button.disabled = true;
        button.textContent = "Running...";
        button.style.opacity = "0.6";
        button.style.cursor = "not-allowed";

        try {
            await runScript();
        } catch (error) {
            console.error(
                `[${pluginName}] Error while running script:`,
                error
            );

            button.textContent = "Script Failed";

            setTimeout(() => {
                button.textContent = previousText;
            }, 2000);
        } finally {
            button.disabled = false;
            button.style.opacity = "1";
            button.style.cursor = "pointer";

            if (button.textContent === "Running...")
                button.textContent = previousText;
        }
    });

    return button;
}

function removeButton() {
    document.getElementById(BUTTON_ID)?.remove();
}


function syncButton() {
    if (!isOnQuestsPage()) {
        removeButton();
        return;
    }

    let button = document.getElementById(
        BUTTON_ID
    ) as HTMLButtonElement | null;

    if (!button)
        button = createButton();

    // Discord currently exposes a headingControls container on the Quest page. Put the button there when possible.
    const headingControls =
        document.querySelector<HTMLElement>(
            'div[class*="headingControls"]'
        );

    if (headingControls) {
        if (button.parentElement !== headingControls)
            headingControls.prepend(button);

        styleButton(button, false);
        return;
    }

    // Fallback: If Discord changes the Quest header classes, the plugin still works by displaying a floating button.
    if (button.parentElement !== document.body)
        document.body.appendChild(button);

    styleButton(button, true);
}

function scheduleSync() {
    if (syncScheduled)
        return;

    syncScheduled = true;

    requestAnimationFrame(() => {
        syncScheduled = false;
        syncButton();
    });
}

export default definePlugin({
    name: pluginName,
    description: "Adds a button to the Quests page that allows you to automatically complete active quests." +
        "You must activate the quests in order for them to be completed." +
        "The button should be located next to the sorting and filtering buttons.",
    authors: [{ name: "David2379", id: 681245724691660828n },  { name: "Afonso", id: 1552890680475652157n }],
    settings: Settings,

    start() {
        console.log(`[${pluginName}] Started`);

        syncButton();

        observer = new MutationObserver(scheduleSync);

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    stop() {
        console.log(`[${pluginName}] Stopped`);

        observer?.disconnect();
        observer = null;

        removeButton();
    }
});
