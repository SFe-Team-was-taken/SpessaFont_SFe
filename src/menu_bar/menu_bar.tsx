import { MenuBarDropdown, MenuBarItem } from "./dropdown.tsx";
import type SoundBankManager from "../core_backend/sound_bank_manager.ts";
import { MIDIPlayer } from "./midi_player.tsx";
import { VoiceDisplay } from "./voice_display.tsx";
import "./menu_bar.css";
import { useTranslation } from "react-i18next";
import type { AudioEngine } from "../core_backend/audio_engine.ts";
import { Gear } from "./gear.tsx";
import { useCallback, useEffect } from "react";
import type { BankEditorRef } from "../bank_editor/bank_editor.tsx";
import { ACCEPTED_FORMATS } from "../utils/accepted_formats.ts";
import toast from "react-hot-toast";

// @ts-expect-error chromium check is here
const isChrome: boolean = window["chrome"] !== undefined;

const waitForRefresh = () => new Promise((r) => setTimeout(r, 200));

export function MenuBar({
    toggleSettings,
    audioEngine,
    openTab,
    closeTab,
    manager,
    showMidiPlayer,
    toggleKeyboard,
    bankEditorRef
}: {
    audioEngine: AudioEngine;
    toggleSettings: () => void;
    openTab: (b?: File) => void;
    closeTab: () => void;
    manager: SoundBankManager;
    showMidiPlayer: boolean;
    toggleKeyboard: () => void;
    bankEditorRef: BankEditorRef;
}) {
    const fLoc = "menuBarLocale.file.";
    const eLoc = "menuBarLocale.edit.";
    const { t } = useTranslation();

    function openFile() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ACCEPTED_FORMATS;
        input.click();
        input.onchange = () => {
            const file: File | undefined = input.files?.[0];
            if (!file) {
                return;
            }
            openTab(file);
        };
    }

    function newFile() {
        openTab();
    }

    const saveWithToasts = useCallback(
        async (format: "sf2" | "sf4" | "dls" | "sf3") => {
            const id = toast.loading(t("loadingAndSaving.savingSoundBank"));
            await waitForRefresh();
            await manager.save(
                format,
                async (_sampleName, writtenCount, totalSampleCount) => {
                    toast.loading(
                        `${t("loadingAndSaving.writingSamples")} (${
                            Math.floor(
                                (writtenCount / totalSampleCount) * 100_00
                            ) /
                                100 +
                            "%"
                        })`,
                        {
                            id
                        }
                    );
                }
            );
            toast.success(t("loadingAndSaving.savedSuccessfully"), { id });
        },
        [manager, t]
    );

    // keybinds

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!manager) {
                return;
            }
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case "z":
                        e.preventDefault();
                        manager.undo();
                        break;
                    case "y":
                        e.preventDefault();
                        manager.redo();
                        break;
                    case "s":
                        e.preventDefault();
                        saveWithToasts("sf2").then();
                        break;
                    default:
                        return;
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [manager, saveWithToasts]);

    const about = useCallback(() => {
        toast(
            (tost) => (
                <div className={"toast_col"}>
                    <span>
                        <strong>{t("titleMessage")}</strong>
                    </span>
                    <span>{t("welcome.copyrightTwo")}</span>
                    <span>{"v" + __APP_VERSION__}</span>
                    <span
                        onClick={() => toast.dismiss(tost.id)}
                        className={"pretty_outline"}
                    >
                        {t(fLoc + "close")}
                    </span>
                </div>
            ),
            {
                duration: Infinity
            }
        );
    }, [t]);

    return (
        <div className={"menu_bar_main"}>
            <MenuBarDropdown main={fLoc + "file"}>
                <MenuBarItem click={newFile} text={fLoc + "new"}></MenuBarItem>
                <MenuBarItem
                    click={openFile}
                    text={fLoc + "open"}
                ></MenuBarItem>
                <MenuBarItem
                    click={closeTab}
                    text={fLoc + "close"}
                ></MenuBarItem>
                <MenuBarItem
                    click={() => saveWithToasts("sf2")}
                    text={fLoc + "saveSF2"}
                />
                <MenuBarItem
                    click={() => saveWithToasts("sf4")}
                    text={fLoc + "saveSF4"}
                />
                <MenuBarItem
                    click={() => saveWithToasts("dls")}
                    text={fLoc + "saveDLS"}
                />
                <MenuBarItem
                    click={() => saveWithToasts("sf3")}
                    text={fLoc + "saveSF3"}
                />
                <MenuBarItem
                    click={() => document.body.requestFullscreen()}
                    text={fLoc + "fullscreen"}
                />
                <MenuBarItem click={about} text={fLoc + "about"} />
            </MenuBarDropdown>
            <MenuBarDropdown main={eLoc + "edit"}>
                <MenuBarItem
                    click={() => {
                        if (manager.history.length < 1) {
                            toast(t(eLoc + "nothingToUndo"));
                        }
                        manager.undo();
                    }}
                    text={eLoc + "undo"}
                />
                <MenuBarItem
                    click={() => {
                        if (manager.history.undoLength < 1) {
                            toast(t(eLoc + "nothingToRedo"));
                        }
                        manager.redo();
                    }}
                    text={eLoc + "redo"}
                />
                <MenuBarItem
                    click={() => bankEditorRef?.current?.removeUnusedElements()}
                    text={eLoc + "removeUnusedElements"}
                />
                <MenuBarItem
                    text={eLoc + "autoLinkSamples"}
                    click={() => bankEditorRef?.current?.autoLinkSamples()}
                />
            </MenuBarDropdown>
            {showMidiPlayer && (
                <MIDIPlayer audioEngine={audioEngine}></MIDIPlayer>
            )}
            <a
                className={"menu_bar_button"}
                href={"https://github.com/spessasus/SpessaFont"}
                target={"_blank"}
            >
                {t("githubPage")}
            </a>
            <a
                className={"menu_bar_button"}
                href={"https://spessasus.github.io/SpessaSynth"}
                target={"_blank"}
            >
                {"SpessaSynth"}
            </a>
            {isChrome && <MenuBarDropdown main={"firefox"}></MenuBarDropdown>}
            <div style={{ flex: 1 }}></div>
            <div className={"menu_bar_button"} onClick={toggleKeyboard}>
                {t("keyboard")}
            </div>
            <VoiceDisplay
                analyser={audioEngine.analyser}
                processor={audioEngine.processor}
            ></VoiceDisplay>
            <div
                className={"menu_bar_button settings_button"}
                onClick={toggleSettings}
            >
                <Gear />
            </div>
        </div>
    );
}
