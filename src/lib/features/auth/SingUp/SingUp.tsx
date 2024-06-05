import { ChangeEvent, FC, useState } from "react";
import styles from "./SingUp.module.scss";
import Input from "@/src/lib/shared/ui/Input/Input";
import { InputType } from "@/src/lib/shared/types/input.enum";
import { Button } from "@/src/lib/shared/ui/Button";
import { useAppDispatch } from "@/src/lib/app/store";
import { setAuth } from "@/src/lib/app/store/slices/authSlice";
import { singup } from "@/src/lib/shared/api/auth";

const SingUp: FC = () => {
    const dispatch = useAppDispatch();

    const [email,setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('')
    const [userName, setUserName] = useState<string>('');

    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) =>{
        setEmail(e.target.value);
    }

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>)=>{
        setPassword(e.target.value);
    }

    const handleUserNameChange = (e: ChangeEvent<HTMLInputElement>) =>{
        setUserName(e.target.value);
    }

    const handleButtonClick = ()=>{
       console.log(singup(email,userName,password));
    }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div>
            <label>Email</label>
            <Input onChange={handleEmailChange} inputType={InputType.email}/>
        </div>
        <div>
            <label>Password</label>
            <Input onChange={handlePasswordChange} inputType={InputType.password}/>
        </div>
        <div>
        <label>Username</label>
            <Input onChange={handleUserNameChange}/>
        </div>
        <Button onClick={handleButtonClick} color="blue" >Sign up</Button>
      </div>
    </div>
  );
};

export default SingUp;
