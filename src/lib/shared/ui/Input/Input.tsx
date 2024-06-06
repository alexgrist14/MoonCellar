import { ChangeEvent, FC } from "react";
import styles from './Input.module.scss';
import { InputType } from "../../types/input.enum";

interface InputProps{
    placeholder?: string;
    width?: number;
    height?: number;
    inputType?: InputType;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>)=>void;
    required?: boolean
}

const Input: FC<InputProps> = ({placeholder, width=200, height=30, inputType = InputType.text,onChange, value, required=false})=>{
    return(
        <div className={styles.container} style={{width: width + 'px', height: height + 'px'}}>
            <input onChange={onChange} value={value} type={inputType} className={styles.input} placeholder={placeholder} required={required}/>
        </div>
    ) 
}

export default Input;