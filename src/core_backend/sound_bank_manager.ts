import {
    type BasicInstrument,
    BasicSoundBank,
    loadSoundFont,
    type ProgressFunction,
    type SoundBankElement,
    type SoundFontInfoType,
    type SFeInfoType,
    SpessaSynthProcessor,
    type SpessaSynthSequencer
} from "spessasynth_core";
import { type HistoryActionGroup, HistoryManager } from "./history.ts";
import { encodeVorbis } from "./encode_vorbis.ts";
import {
    reorderInstrumentZones,
    ZONE_SORTING_FUNCTION
} from "../utils/reorder_zones.ts";

export type BankEditView = "info" | SoundBankElement;

const dummy = await BasicSoundBank.getDummySoundfontFile();

export default class SoundBankManager extends BasicSoundBank {
    processor: SpessaSynthProcessor;
    sequencer: SpessaSynthSequencer;
    history = new HistoryManager();

    currentView: BankEditView = "info";

    // unsaved changes
    dirty = false;

    constructor(
        processor: SpessaSynthProcessor,
        sequencer: SpessaSynthSequencer,
        bank?: BasicSoundBank
    ) {
        super();
        this.processor = processor;
        this.sequencer = sequencer;
        const actualBank: BasicSoundBank = bank ?? loadSoundFont(dummy.slice(), false);
        Object.assign(this, actualBank);
        if (bank === undefined) {
            this.soundFontInfo["ifil"] = "2.4";
            this.soundFontInfo["INAM"] = "";
            this.soundFontInfo["ICRD"] = new Date().toISOString().split("T")[0];
        }
        // fix preset references
        this.presets.forEach((p) => (p.parentSoundBank = this));
        this.sortElements();
        this.sendBankToSynth();
    }

    sortElements() {
        this.presets.sort((a, b) => {
            if (a.bank !== b.bank) {
                return a.bank - b.bank;
            }
            if (a.bankLSB !== b.bankLSB) {
                return a.bankLSB - b.bankLSB;
            }
            return a.program - b.program;
        });
        this.samples.sort((a, b) =>
            a.sampleName > b.sampleName
                ? 1
                : b.sampleName > a.sampleName
                  ? -1
                  : 0
        );
        this.instruments.sort((a, b) =>
            a.instrumentName > b.instrumentName
                ? 1
                : b.instrumentName > a.instrumentName
                  ? -1
                  : 0
        );

        // sort stereo zones
        this.instruments.forEach((i) => this.sortInstrumentZones(i));

        // sort preset zones
        this.presets.forEach((p) => p.presetZones.sort(ZONE_SORTING_FUNCTION));
    }

    sortInstrumentZones(i: BasicInstrument) {
        i.instrumentZones = reorderInstrumentZones(i.instrumentZones);
    }

    getBankName(unnamed: string) {
        return this.getInfo("INAM") || unnamed;
    }

    getInfo(fourCC: SoundFontInfoType) {
        return this.soundFontInfo?.[fourCC]?.toString() || "";
    }

    getSFeInfo(fourCC: SFeInfoType) {
        return this.sfeInfo?.[fourCC]?.toString() || "";
    }

    getTabName(unnamed: string) {
        return `${this.dirty ? "* " : ""}${this.getBankName(unnamed)}`;
    }

    clearCache() {
        this.processor.clearCache();
    }

    close() {
        if (
            this.processor.soundfontManager.soundfontList[0].soundfont === this
        ) {
            this.processor.soundfontManager.reloadManager(
                loadSoundFont(dummy.slice(), false)
            );
        }
        this.clearCache();
        this.destroySoundBank();
    }

    async save(
        format: "sf2" | "sf4" | "dls" | "sf3",
        progressFunction?: ProgressFunction
    ) {
        let binary: Uint8Array;
        switch (format) {
            default:
            case "sf2":
                binary = await this.write({
                    progressFunction,
                    bankVersion: "soundfont2"
                });
                break;

            case "sf4":
                binary = await this.write({
                    progressFunction,
                    bankVersion: "sfe-4.0"
                });
                break;

            case "dls":
                binary = await this.writeDLS({
                    progressFunction
                });
                break;

            case "sf3":
                binary = await this.write({
                    compress: true,
                    compressionFunction: encodeVorbis,
                    progressFunction
                });
        }
        if (this.soundFontInfo["ifil"] === "3.0") {
            format = "sf3";
        }
        const buffer = binary.buffer;
        if (!(buffer instanceof ArrayBuffer)) {
            return;
        }
        let blob: Blob;
        if (buffer.byteLength > 2147483648) {
            const chunks: ArrayBuffer[] = [];
            let toWrite = 0;
            while (toWrite < binary.length) {
                // 50MB chunks (browsers don't like 4GB array buffers)
                const size = Math.min(52428800, binary.length - toWrite);
                chunks.push(
                    buffer.slice(toWrite, toWrite + size) as ArrayBuffer
                );
                toWrite += size;
            }

            blob = new Blob(chunks);
        } else {
            blob = new Blob([buffer]);
        }
        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = `${this.getBankName("Unnamed")}.${format}`;
        a.click();
        this.dirty = false;
        this.changeCallback();

        // clean up the object URL after a short delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
            console.info("Object URL revoked to free memory");
        }, 1000);
    }

    sendBankToSynth() {
        this.processor.soundfontManager.reloadManager(this);
        this.processor.clearCache();
        this.sequencer.currentTime -= 0.1;
    }

    modifyBank(actions: HistoryActionGroup) {
        if (actions.length === 0) {
            return;
        }
        this.history.do(this, actions);
        this.dirty = true;
        this.changeCallback();
    }

    undo() {
        this.history.undo(this);
        if (this.history.length < 1) {
            this.dirty = false;
        }
        this.changeCallback();
    }

    redo() {
        this.history.redo(this);
        this.dirty = true;
        this.changeCallback();
    }

    changeCallback: () => void = () => {};
}
