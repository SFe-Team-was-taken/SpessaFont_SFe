import type { MappedPresetType } from "../menu_list.tsx";
import "./preset_display.css";
import * as React from "react";
import { useRef } from "react";
import { InstrumentDisplay } from "../instrument_display/instrument_display.tsx";
import type { BankEditView } from "../../core_backend/sound_bank_manager.ts";
import type { SetViewType } from "../../bank_editor/bank_editor.tsx";
import { useTranslation } from "react-i18next";
import { LinkIcon } from "../../utils/icons.tsx";

export type OpenPresetDisplayType = {
    open: boolean;
    openInstruments: Record<string, boolean>;
};

export function PresetDisplay({
    p,
    onClick,
    view,
    openedData,
    setOpenedData,
    setView,
    selected,
    link,
    onLink
}: {
    p: MappedPresetType;
    setView: SetViewType;
    onClick: React.MouseEventHandler<HTMLDivElement>;
    view: BankEditView;
    openedData: OpenPresetDisplayType;
    setOpenedData: (o: OpenPresetDisplayType) => unknown;
    selected: boolean;
    link: boolean;
    onLink?: () => unknown;
}) {
    const { t } = useTranslation();
    const open = openedData.open;
    const openedInstruments: Record<string, boolean> =
        openedData.openInstruments ?? {};
    const elementRef = useRef<HTMLDivElement>(null);
    return (
        <div className={"preset_item_wrapper"} ref={elementRef}>
            <div
                className={`preset_item ${selected ? "selected" : ""}`}
                title={p.preset.presetName}
            >
                <div className={"left_group"}>
                    <span
                        className={"triangle"}
                        onClick={() =>
                            setOpenedData({
                                openInstruments: openedInstruments,
                                open: !open
                            })
                        }
                    >
                        {open ? "\u25BC" : "\u25B6"}
                    </span>
                    <span
                        className={"monospaced"}
                        onClick={() =>
                            setOpenedData({
                                openInstruments: openedInstruments,
                                open: !open
                            })
                        }
                    >
                        {p.searchString.substring(0, 18)}
                    </span>
                    {link && (
                        <span
                            title={t("presetLocale.linkSelectedInstruments")}
                            onClick={onLink}
                        >
                            <LinkIcon />
                        </span>
                    )}
                </div>
                <span
                    className={"monospaced preset_item_name"}
                    onClick={onClick}
                >
                    {p.preset.presetName}
                </span>
            </div>
            <div className={"preset_instruments"}>
                {open &&
                    p.preset.presetZones.map((z, i) => (
                        <InstrumentDisplay
                            open={
                                openedInstruments[
                                    z.instrument.instrumentName
                                ] ?? false
                            }
                            setOpen={(isOpen) =>
                                setOpenedData({
                                    ...openedData,
                                    openInstruments: {
                                        ...openedInstruments,
                                        [z.instrument.instrumentName]: isOpen
                                    }
                                })
                            }
                            selected={view === z.instrument}
                            view={view}
                            key={i}
                            instrument={z.instrument}
                            setView={setView}
                            onClick={() => setView(z.instrument)}
                            link={false}
                        ></InstrumentDisplay>
                    ))}
            </div>
        </div>
    );
}
