# QuestSpoofer

QuestSpoofer is a custom Vencord plugin, listed as **SpoofQuests** in the plugin settings,
that adds a **Spoof Active Quests** button to the Quests page.
It attempts to complete active quests by simulating video viewing, game activity, streaming, or activity participation.

The plugin only processes **quests you have already accepted that are incomplete, unexpired, and use a supported task type**.
It does not accept quests or claim rewards automatically.

## Disclaimer

**This plugin is for testing purposes only. Its behavior goes against Discord's Terms of Service, so it should not be used in the official Discord app.**

If you choose to use this plugin, you do so at your own risk.
Discord may suspend your access to quests if they detect abnormal activity.

## Settings

| Setting | Description | Default  |
| --- |------------------------------------------------------------|----------|
| `blockMultipleInstances` | Prevent multiple instances of the plugin from running at the same time for the same user. | Disabled |
| `showMainNotifications` | Show main notifications about the plugin's actions. | Enabled  |
| `showStartNotifications` | Show notifications everytime a quest starts being spoofed. | Enabled  |
| `showFinishNotifications` | Show notifications everytime a quest is finished. | Enabled  |
| `showErrorNotifications` | Show a notification when an error occurs. | Enabled  |

- Turn off notifications if you want to avoid popups, nothing else is affected.
- It is recommended to keep the `showMainNotifications` and `showErrorNotifications` options enabled.

## Installation

This is a custom plugin for a Vencord build from source. The following steps are intended only for a controlled testing environment, subject to the disclaimer above.

1. Copy the `QuestSpooferButton` folder into `src/userplugins/` in your Vencord source tree.
2. Rebuild your Vencord test build.
3. Enable **SpoofQuests** in Vencord's plugin settings and configure `showNotifications`.
4. With eligible quests already accepted in the test environment, open the Quests page and click **Spoof Active Quests**.

## Notes

- Supported task types are `WATCH_VIDEO`, `WATCH_VIDEO_ON_MOBILE`, `PLAY_ON_DESKTOP`, `STREAM_ON_DESKTOP`, and `PLAY_ACTIVITY`.
- The button appears beside the Quests page's sorting and filtering controls when their container is available.
Otherwise, it appears as a floating button near the top-right corner.
- The button is removed when you leave the Quests page or disable the plugin.
- Streaming tasks require an active stream with at least one viewer.
- Quests are processed sequentially, and completion takes time. Notifications report activity and completion.
- Avoid clicking the button again while processing is underway to prevent multiple instances from running simultaneously.
- To stop the running instances, you must close the client.
- Disabling the plugin removes its button but does not explicitly cancel background tasks or clean up an unfinished run's temporary changes.
- The plugin depends on Discord's internal modules and page structure, so client changes can break its behavior.

## Credits

Credit to [Amia](https://github.com/aamiaa) for creating the base script used in this plugin.
