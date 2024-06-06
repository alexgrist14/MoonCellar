import { login } from "@/src/lib/shared/api/auth";
import { LoginDto } from "@/src/lib/shared/types/auth";
import { InputType } from "@/src/lib/shared/types/input.enum";
import { Button } from "@/src/lib/shared/ui/Button";
import Input from "@/src/lib/shared/ui/Input/Input";
import { FC, useState } from "react";
import styles from "./Login.module.scss";
import { useAppDispatch } from "@/src/lib/app/store";
import { setAuth } from "@/src/lib/app/store/slices/authSlice";

const Login: FC = () => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    const loginDto: LoginDto = { email, password };
    try {
      const response = await login(loginDto);
      dispatch(setAuth({email: email, user: "123"}))
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        className={styles.content}
      >
         <h1>Login</h1>
        <div>
          <label>Email:</label>
          <Input
            inputType={InputType.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required={true}
          />
        </div>
        <div>
          <label>Password:</label>
          <Input
            inputType={InputType.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={true}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <Button color="blue" type="submit">Login</Button>
      </form>
    </div>
  );
};

export default Login;
