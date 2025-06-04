import { type generatorTypes, Modulator } from "spessasynth_core";
import "./modulator.css";
import { useTranslation } from "react-i18next";
import {
    type ModulatorSource,
    ModulatorSourcePicker
} from "../source_picker/source_picker.tsx";
import {
    ModulatorCurvePicker,
    type ModulatorCurveType
} from "../curve_picker/curve_picker.tsx";
import { ModulatorDiagram } from "../diagram.tsx";
import { DestinationPicker } from "../destination_picker.tsx";

type ModulatorProps = {
    mod: Modulator;
    setModulator: (m: Modulator) => void;
    deleteModulator: () => void;
    modulatorNumber: number;
    activeModPickerId: string | null;
    setActiveModPickerId: (i: string) => void;
    setSelected: (s: boolean) => void;
    selected: boolean;
};

const AMOUNT_PREFIX = "× ";

export function ModulatorView({
    mod,
    setModulator,
    deleteModulator,
    modulatorNumber,
    activeModPickerId,
    setActiveModPickerId,
    setSelected,
    selected
}: ModulatorProps) {
    const { t } = useTranslation();

    function setDestination(dest: generatorTypes) {
        mod.modulatorDestination = dest;
        setModulator(mod);
    }

    function setAmount(amount: number) {
        mod.transformAmount = amount;
        setModulator(mod);
    }

    function setTransformType(t: number) {
        if (t !== 0 && t !== 2) {
            return;
        }

        mod.transformType = t;
        setModulator(mod);
    }

    function setSource(s: ModulatorSource) {
        mod.sourceIndex = s.sourceIndex;
        mod.sourceUsesCC = s.usesCC ? 1 : 0;
        setModulator(mod);
    }

    function setSecSource(s: ModulatorSource) {
        mod.secSrcIndex = s.sourceIndex;
        mod.secSrcUsesCC = s.usesCC ? 1 : 0;
        setModulator(mod);
    }

    function setCurveType(c: ModulatorCurveType) {
        mod.sourceCurveType = c.curveType;
        mod.sourcePolarity = c.bipolar ? 1 : 0;
        mod.sourceDirection = c.positive ? 0 : 1;
        setModulator(mod);
    }

    function setSecCurveType(c: ModulatorCurveType) {
        mod.secSrcCurveType = c.curveType;
        mod.secSrcPolarity = c.bipolar ? 1 : 0;
        mod.secSrcDirection = c.positive ? 0 : 1;
        setModulator(mod);
    }

    return (
        <div
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setSelected(!selected);
                }
            }}
            className={`modulator_main ${selected ? "selected" : ""}`}
        >
            <div className={"modulator_title"}>
                <h3>
                    {t("modulatorLocale.modulator")} #{modulatorNumber}
                </h3>
                <span
                    className={
                        "pretty_outline responsive_button hover_brightness"
                    }
                    onClick={deleteModulator}
                >
                    {t("modulatorLocale.delete")}
                </span>
            </div>
            <div className={"source_pair"}>
                <ModulatorSourcePicker
                    setSource={setSource}
                    source={{
                        usesCC: mod.sourceUsesCC > 0,
                        sourceIndex: mod.sourceIndex
                    }}
                ></ModulatorSourcePicker>
                <ModulatorSourcePicker
                    setSource={setSecSource}
                    source={{
                        usesCC: mod.secSrcUsesCC > 0,
                        sourceIndex: mod.secSrcIndex
                    }}
                ></ModulatorSourcePicker>
            </div>
            <div className={"transform_box"}>
                <div className={"source_pair"}>
                    <ModulatorCurvePicker
                        id={`${modulatorNumber}-1`}
                        isActive={activeModPickerId === `${modulatorNumber}-1`}
                        setActive={() =>
                            setActiveModPickerId(`${modulatorNumber}-1`)
                        }
                        setNotActive={() => setActiveModPickerId("")}
                        curveType={{
                            curveType: mod.sourceCurveType,
                            bipolar: mod.sourcePolarity === 1,
                            positive: mod.sourceDirection === 0
                        }}
                        setCurveType={setCurveType}
                    ></ModulatorCurvePicker>
                    <ModulatorCurvePicker
                        id={`${modulatorNumber}-2`}
                        isActive={activeModPickerId === `${modulatorNumber}-2`}
                        setNotActive={() => setActiveModPickerId("")}
                        setActive={() =>
                            setActiveModPickerId(`${modulatorNumber}-2`)
                        }
                        curveType={{
                            curveType: mod.secSrcCurveType,
                            bipolar: mod.secSrcPolarity === 1,
                            positive: mod.secSrcDirection === 0
                        }}
                        setCurveType={setSecCurveType}
                    ></ModulatorCurvePicker>
                </div>
                <ModulatorDiagram></ModulatorDiagram>
                <input
                    type="text"
                    className="pretty_input amount_input"
                    placeholder={`${AMOUNT_PREFIX} ${t("modulatorLocale.amount")}`}
                    value={`${AMOUNT_PREFIX}${mod.transformAmount}`}
                    onChange={(e) => {
                        const rawValue = e.target.value;
                        const numericPart = rawValue
                            .replace(AMOUNT_PREFIX, "")
                            .trim();

                        if (numericPart === "") {
                            setAmount(0);
                            return;
                        }

                        const parsed = parseInt(numericPart, 10);
                        if (
                            !isNaN(parsed) &&
                            parsed >= -12700 &&
                            parsed <= 12700
                        ) {
                            setAmount(parsed);
                        }
                    }}
                />
                <select
                    className={"pretty_outline transform_selector"}
                    value={mod.transformType}
                    onChange={(e) =>
                        setTransformType(parseInt(e.target.value) || 0)
                    }
                >
                    <option value={0}>
                        {t("modulatorLocale.transforms.noOperation")}
                    </option>
                    <option value={2}>
                        {t("modulatorLocale.transforms.absoluteValue")}
                    </option>
                </select>
            </div>
            <DestinationPicker
                destination={mod.modulatorDestination}
                setDestination={setDestination}
            ></DestinationPicker>
        </div>
    );
}
