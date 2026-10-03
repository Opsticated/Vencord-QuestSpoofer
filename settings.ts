import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export default definePluginSettings({
    blockMultipleInstances: {
        type: OptionType.BOOLEAN,
        description: "Prevent multiple instances of the plugin from running at the same time for the same user. Turn on to avoid clicking the button multiple times.",
        default: false,
    },
    showMainNotifications: {
        type: OptionType.BOOLEAN,
        description: "Show main notifications about the plugin's actions.",
        default: true,
    },
    showStartNotifications: {
        type: OptionType.BOOLEAN,
        description: "Show notifications everytime a quest starts being spoofed.",
        default: true,
    },
    showFinishNotifications: {
        type: OptionType.BOOLEAN,
        description: "Show notifications everytime a quest is finished.",
        default: true,
    },
    showErrorNotifications: {
        type: OptionType.BOOLEAN,
        description: "Show notifications when an error occurs.",
        default: true,
    }
});
