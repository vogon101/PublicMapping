import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export default function DebouncedRange({
    value,
    onChange,
    innerProps,
}: {
    value: number;
    onChange: (value: number) => void;
    innerProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
    const [localValue, setLocalValue] = useState(value);
    const [debouncedValue] = useDebounce(localValue, 50);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(Number(e.target.value));
    }

    useEffect(() => {
        onChange(debouncedValue);
    }, [debouncedValue]);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);


    return <input type="range" value={localValue} onChange={handleChange} {...innerProps} />;
}

//This gives more resolution to the lower values
export function LogarithmicRange({
    value,
    onChange,
    min, max, 
    innerProps
}: {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    innerProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'min' | 'max' | 'step'>;
}) {
    

    const scaleFactor = Math.log10(max - min + 1) / 100
    const scale = (x: number): number => min + Math.pow(10, x * scaleFactor) - 1
    const unscale = (x: number): number => Math.log10(x - min + 1) / scaleFactor

    const clampedValue = Math.max(min, Math.min(max, value))
    const scaledValue = unscale(clampedValue)

    return <DebouncedRange 
        value={scaledValue} 
        onChange={(v: number) => onChange(scale(v))} 
        innerProps={{
            min: 0,
            max: 100,
            // step: 0.1,
            ...innerProps
        }}
    />
}