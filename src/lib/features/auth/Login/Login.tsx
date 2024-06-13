import { login } from "@/src/lib/shared/api/auth";
import { LoginDto } from "@/src/lib/shared/types/auth";
import { Button } from "@/src/lib/shared/ui/Button";
import { FC, useState } from "react";
import styles from "./Login.module.scss";
import { useAppDispatch } from "@/src/lib/app/store";
import { setAuth } from "@/src/lib/app/store/slices/authSlice";
import { Input } from "@/src/lib/shared/ui/Input";
import { SubmitHandler, useForm } from "react-hook-form";

const Login: FC = () => {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<LoginDto>({
    mode: "onBlur",
  });

  const handleLogin: SubmitHandler<LoginDto> = (data) => {
    setError(null);
    const loginDto: LoginDto = {
      email: data.email,
      password: data.password,
    };

    login(loginDto)
      .then(() => dispatch(setUser({ email: data.email, user: "123" })))
      .catch((err) => setError(err.message));
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit(handleLogin)} className={styles.content}>
        <div className={styles.content__inputs}>
          <div>
            <label>Email:</label>
            <Input type="email" {...register("email", { required: true })} />
          </div>
          <div>
            <label>Password:</label>
            <Input
              type="password"
              {...register("password", { required: true })}
            />
          </div>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className={styles.content__buttons}>
          <Button color="accent" type="submit" disabled={!isValid}>
            Login
          </Button>
          <Button type="button">New Account</Button>
        </div>
      </form>
    </div>
  );
};

export default Login;
function setUser(arg0: { email: string; user: string }): any {
  throw new Error("Function not implemented.");
}
