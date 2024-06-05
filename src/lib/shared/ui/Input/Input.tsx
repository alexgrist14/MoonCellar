import { ChangeEvent, FC } from "react";
import styles from './Input.module.scss';
import { InputType } from "../../types/input.enum";

interface InputProps{
    placeholder?: string;
    width?: number;
    height?: number;
    inputType?: InputType;
    onChange: (e: ChangeEvent<HTMLInputElement>)=>void;
}

const Input: FC<InputProps> = ({placeholder, width=200, height=30, inputType = InputType.text,onChange})=>{
    return(
        <div className={styles.container} style={{width: width + 'px', height: height + 'px'}}>
            <input onChange={onChange} type={inputType} className={styles.input} placeholder={placeholder}/>
        </div>
    ) 
}

export default Input;