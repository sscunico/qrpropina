"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

type PercentStepperProps = {
  defaultValue: number;
  id: string;
  label: string;
  max?: number;
  min?: number;
  name: string;
  step?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatValue(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export function PercentStepper({
  defaultValue,
  id,
  label,
  max = 40,
  min = 0,
  name,
  step = 0.5
}: PercentStepperProps) {
  const initialValue = clamp(defaultValue, min, max);
  const [value, setValue] = useState(formatValue(initialValue));

  function nudge(direction: -1 | 1) {
    const parsed = Number(value);
    const baseValue = Number.isFinite(parsed) ? parsed : min;
    const nextValue = clamp(baseValue + step * direction, min, max);
    setValue(formatValue(nextValue));
  }

  return (
    <div className="percent-stepper">
      <label htmlFor={id}>{label}</label>
      <div className="number-stepper-control">
        <button aria-label="Restar porcentaje" className="number-stepper-button" onClick={() => nudge(-1)} type="button">
          <Minus size={16} />
        </button>
        <input
          id={id}
          inputMode="decimal"
          max={max}
          min={min}
          name={name}
          onChange={(event) => setValue(event.target.value)}
          step={step}
          type="number"
          value={value}
        />
        <button aria-label="Sumar porcentaje" className="number-stepper-button" onClick={() => nudge(1)} type="button">
          <Plus size={16} />
        </button>
        <span className="number-stepper-suffix">%</span>
      </div>
    </div>
  );
}
