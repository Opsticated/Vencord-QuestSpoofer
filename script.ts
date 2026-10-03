import { NotificationData, showNotification } from "@api/Notifications";
import { UserStore } from "@webpack/common";

import Settings from "./settings";

const pluginName = "QuestSpoofer";
const notificationTitle = "Quest Spoofer";

function notifyUser(data: NotificationData, type: "main" | "start" | "finish" | "error") {
    console.log(`[${pluginName}] ${type}: ${data.body}`);
    if (type === "main" && !Settings.store.showMainNotifications) return;
    if (type === "start" && !Settings.store.showStartNotifications) return;
    if (type === "finish" && !Settings.store.showFinishNotifications) return;
    if (type === "error" && !Settings.store.showErrorNotifications) return;
    void showNotification(data);
}

function getCurrentUser() {
    const user = UserStore.getCurrentUser();
    return {
        id: user?.id || "undefined id",
        username: user?.username || "undefined username",
    }
}

let jobsRunningById = [];
function getJobsRunningForId(id: string) { return jobsRunningById[id] || 0 }
function incrementJobsRunningForId(id: string) { if (Settings.store.blockMultipleInstances) jobsRunningById[id] = getJobsRunningForId(id) + 1 }
function decrementJobsRunningForId(id: string) { if (Settings.store.blockMultipleInstances) jobsRunningById[id] = Math.max(getJobsRunningForId(id) - 1, 0) }

export default async function runScript() {
    const user = getCurrentUser();
    incrementJobsRunningForId(user.id);
    if (Settings.store.blockMultipleInstances && getJobsRunningForId(user.id) > 1) {
        void notifyUser({
            title: notificationTitle,
            body: `Spoofer is already running for ${user.username}.\nAdditional instances are blocked by your current settings.`
        }, "main");
        decrementJobsRunningForId(user.id);
        return;
    }

    delete window.$;
    // @ts-ignore
    let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
    // @ts-ignore
    webpackChunkdiscord_app.pop();

    // @ts-ignore
    let ApplicationStreamingStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getStreamerActiveStreamMetadata).exports.A;
    // @ts-ignore
    let RunningGameStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getRunningGames).exports.Ay;
    // @ts-ignore
    let QuestsStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getQuest).exports.A;
    // @ts-ignore
    let ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.A?.__proto__?.getAllThreadsForParent).exports.A;
    // @ts-ignore
    let GuildChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Ay?.getSFWDefaultChannel).exports.Ay;
    // @ts-ignore
    let FluxDispatcher = Object.values(wpRequire.c).find(x => x?.exports?.h?.__proto__?.flushWaitQueue).exports.h;
    // @ts-ignore
    let api = Object.values(wpRequire.c).find(x => x?.exports?.Bo?.get).exports.Bo;

    const supportedTasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"]
    let quests = [...QuestsStore.quests.values()].filter(x => x.userStatus?.enrolledAt && !x.userStatus?.completedAt && new Date(x.config.expiresAt).getTime() > Date.now() && supportedTasks.find(y => Object.keys((x.config.taskConfig ?? x.config.taskConfigV2).tasks).includes(y)))
    let isApp = typeof DiscordNative !== "undefined"
    if (quests.length === 0) {
        void notifyUser({ title: notificationTitle, body: `${user.username} has no active quests!` }, "main");
        decrementJobsRunningForId(user.id);
    } else {
        void notifyUser({
            title: notificationTitle,
            body: `Spoofer started! Queuing ${quests.length} active quest${quests.length === 1 ? "" : "s"}.`,
        }, "main");

        const totalQuests = quests.length;
        let completedQuests = 0;

        let doJob = function() {

            const quest = quests.pop()
            if (!quest) {
                void notifyUser({ title: notificationTitle, body: `Finished spoofing quests for ${user.username}!\n${completedQuests}/${totalQuests} quests completed.` }, "main");
                decrementJobsRunningForId(user.id);
                return
            }

            const pid = Math.floor(Math.random() * 30000) + 1000

            const questName = quest.config.messages.questName
            const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2
            const taskName = supportedTasks.find(x => taskConfig.tasks[x] != null)
            const taskData = taskConfig.tasks[taskName]
            const applicationId = quest.config.application?.id ?? taskData.applications?.[0]?.id
            const secondsNeeded = taskData.target
            let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0

            if (taskName === "WATCH_VIDEO" || taskName === "WATCH_VIDEO_ON_MOBILE") {
                const speed = 7
                const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime()
                let completed = false
                let fn = async () => {
                    while (true) {
                        const remaining = Math.min(speed, secondsNeeded - secondsDone)
                        await new Promise(resolve => setTimeout(resolve, remaining * 1000))

                        const timestamp = secondsDone + speed
                        const res = await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: Math.min(secondsNeeded, timestamp + Math.random())}})
                        completed = res.body.completed_at != null
                        secondsDone = Math.min(secondsNeeded, timestamp)

                        if (timestamp >= secondsNeeded) {
                            break
                        }
                    }
                    if (!completed) {
                        await api.post({url: `/quests/${quest.id}/video-progress`, body: {timestamp: secondsNeeded}})
                    }

                    completedQuests++;
                    void notifyUser({
                        title: notificationTitle,
                        body: ((taskName === "WATCH_VIDEO_ON_MOBILE") ? "Mobile v" : "V") + `ideo quest completed for ${user.username}: ${questName}!` +
                            `.\n${completedQuests}/${totalQuests} quests completed.`
                    }, "finish");
                    doJob()
                }
                fn()
                void notifyUser({
                    title: notificationTitle,
                    body: "Spoofing " + ((taskName === "WATCH_VIDEO_ON_MOBILE") ? "mobile " : "") + `video quest for ${user.username}: ${questName}.`
                }, "start")
            } else if (taskName === "PLAY_ON_DESKTOP") {
                if (!isApp) {
                    void notifyUser({ title: notificationTitle, body: `This no longer works in browser for non-video quests!\nUse the discord desktop app to complete the ${questName} quest.` }, "error")
                } else {
                    api.get({url: `/applications/public?application_ids=${applicationId}`}).then(res => {
                        const appData = res.body[0]
                        const exeName = appData.executables?.find(x => x.os === "win32")?.name?.replace(">","") ?? appData.name.replace(/[\/\\:*?"<>|]/g, "")

                        const fakeGame = {
                            cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                            exeName,
                            exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
                            hidden: false,
                            isLauncher: false,
                            id: applicationId,
                            name: appData.name,
                            pid: pid,
                            pidPath: [pid],
                            processName: appData.name,
                            start: Date.now(),
                        }
                        const realGames = RunningGameStore.getRunningGames()
                        const fakeGames = [fakeGame]
                        const realGetRunningGames = RunningGameStore.getRunningGames
                        const realGetGameForPID = RunningGameStore.getGameForPID
                        RunningGameStore.getRunningGames = () => fakeGames
                        RunningGameStore.getGameForPID = (pid) => fakeGames.find(x => x.pid === pid)
                        FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames})

                        let fn = data => {
                            let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value)

                            if (progress >= secondsNeeded) {
                                completedQuests++;
                                void notifyUser({
                                    title: notificationTitle,
                                    body: `Game quest completed for ${user.username}: ${questName}!\n${completedQuests}/${totalQuests} quests completed.`
                                }, "finish");

                                RunningGameStore.getRunningGames = realGetRunningGames
                                RunningGameStore.getGameForPID = realGetGameForPID
                                FluxDispatcher.dispatch({type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: []})
                                FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)

                                doJob()
                            }
                        }
                        FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)

                        void notifyUser({ title: notificationTitle, body: `Spoofing game quest for ${user.username}: ` + questName }, "start")
                    })
                }
            } else if (taskName === "STREAM_ON_DESKTOP") {
                if (!isApp) {
                    void notifyUser({ title: notificationTitle, body: `This no longer works in browser for non-video quests!\nUse the discord desktop app to complete the ${questName} quest.` }, "error")
                } else {
                    let realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata
                    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                        id: applicationId,
                        pid,
                        sourceName: null
                    })

                    let fn = data => {
                        let progress = quest.config.configVersion === 1 ? data.userStatus.streamProgressSeconds : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value)

                        if (progress >= secondsNeeded) {
                            completedQuests++;
                            void notifyUser({
                                title: notificationTitle,
                                body: `Stream quest completed for ${user.username}: ${questName}!\n${completedQuests}/${totalQuests} quests completed.`,
                            }, "finish");

                            ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc
                            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)

                            doJob()
                        }
                    }
                    FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn)

                    void notifyUser({
                        title: notificationTitle,
                        body: `Spoofing stream quest for ${user.username}: ${questName}, you must be streaming with at least 1 viewer!`,
                    }, "start")
                }
            } else if (taskName === "PLAY_ACTIVITY") {
                // @ts-ignore
                const channelId = ChannelStore.getSortedPrivateChannels()[0]?.id ?? Object.values(GuildChannelStore.getAllGuilds()).find(x => x != null && x.VOCAL.length > 0).VOCAL[0].channel.id
                const streamKey = `call:${channelId}:1`

                let fn = async () => {
                    void notifyUser({ title: notificationTitle, body: `Spoofing play activity quest for ${user.username}: ${questName}.` }, "start")

                    while (true) {
                        const res = await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: false}})
                        const progress = res.body.progress.PLAY_ACTIVITY.value

                        await new Promise(resolve => setTimeout(resolve, 20 * 1000))

                        if (progress >= secondsNeeded) {
                            await api.post({url: `/quests/${quest.id}/heartbeat`, body: {stream_key: streamKey, terminal: true}})
                            break
                        }
                    }

                    completedQuests++;
                    void notifyUser({
                        title: notificationTitle,
                        body: `Play activity quest completed for ${user.username}: ${questName}!\n${completedQuests}/${totalQuests} quests completed.`
                    }, "finish")
                    doJob()
                }
                fn()
            }
        }
        doJob()
    }
}
