import { type BasicInstrument, BasicPreset } from "spessasynth_core";
import "../../bottom_bar.css";
import type { SetViewType } from "../../bank_editor.tsx";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import { DeleteInstrumentAction } from "./delete_instrument_action.ts";
import type SoundBankManager from "../../../core_backend/sound_bank_manager.ts";
import { WaitingInput } from "../../../fancy_inputs/waiting_input/waiting_input.tsx";
import { EditInstrumentAction } from "./edit_instrument_action.ts";

export function LinkedPresets({
    instrument,
    setView,
    setInstruments,
    instruments,
    manager
}: {
    manager: SoundBankManager;
    instrument: BasicInstrument;
    setView: SetViewType;
    setInstruments: (s: BasicInstrument[]) => void;
    instruments: BasicInstrument[];
}) {
    const { t } = useTranslation();
    const linked = useMemo(() => {
        const l = new Set<BasicPreset>();
        instrument.linkedPresets.forEach((p) => l.add(p));
        return l;
    }, [instrument]);

    const deleteInstrument = () => {
        const mainIndex = manager.instruments.indexOf(instrument);
        manager.modifyBank([
            new DeleteInstrumentAction(mainIndex, setInstruments, setView)
        ]);
    };

    return (
        <div className={"bottom_bar"}>
            <WaitingInput
                type={"text"}
                value={instrument.instrumentName}
                setValue={(v) => {
                    const action = new EditInstrumentAction(
                        instruments.indexOf(instrument),
                        "instrumentName",
                        instrument.instrumentName,
                        v,
                        () => setInstruments([...instruments])
                    );
                    manager.modifyBank([action]);
                    return v;
                }}
                maxLength={40}
            />
            {instrument.linkedPresets.length === 0 && (
                <>
                    <div>
                        <strong>
                            {t("instrumentLocale.notLinkedToPreset")}
                        </strong>
                    </div>
                    <div className={"warning"} onClick={deleteInstrument}>
                        {t("instrumentLocale.deleteInstrument")}
                    </div>
                </>
            )}
            {instrument.linkedPresets.length > 0 && (
                <>
                    <div>
                        <b>{t("instrumentLocale.linkedTo")}</b>
                    </div>
                    {Array.from(linked).map((preset, i) => (
                        <div
                            className={"monospaced"}
                            onClick={() => setView(preset)}
                            key={i}
                        >
                            {preset.presetName}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}
