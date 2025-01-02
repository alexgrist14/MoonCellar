import { IAuth } from "@/src/lib/shared/types/auth";
import { Button } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { FC, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useAuth } from "../../hooks/auth";
import Background from "../Background/Background";
import { Loader } from "../Loader";
import { modal } from "../Modal";
import { SvgClose } from "../svg";
import styles from "./AuthModal.module.scss";

export const AuthModal: FC = () => {
  const { login, signup } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<IAuth>({
    mode: "onChange",
  });

  const handleLogin: SubmitHandler<IAuth> = (data) => {
    setError(null);
    setIsLoading(true);

    const loginDto: Omit<IAuth, "userName"> = {
      email: data.email,
      password: data.password,
    };

    login(loginDto);
  };

  const handleSignUp: SubmitHandler<IAuth> = (data) => {
    setError(null);
    setIsLoading(true);

    const singUpDto: IAuth = {
      userName: data.userName,
      email: data.email,
      password: data.password,
    };

    signup(singUpDto);
  };

  return (
    <div className={styles.container}>
      <form
        onSubmit={
          isRegister ? handleSubmit(handleSignUp) : handleSubmit(handleLogin)
        }
        className={styles.content}
        autoComplete="on"
      >
        <div className={styles.content__inputs}>
          {isRegister && (
            <div>
              <label>User Name</label>
              <Input
                type="text"
                {...register("userName", { required: true })}
              />
            </div>
          )}
          <div>
            <label>Email</label>
            <Input
              type="email"
              id="email"
              {...register("email", { required: true })}
            />
          </div>
          <div>
            <label>Password</label>
            <Input
              type="password"
              id="password"
              {...register("password", { required: true, minLength: 6 })}
              autoComplete="current-password"
            />
          </div>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className={styles.content__buttons}>
          {isRegister ? (
            <>
              <Button
                color="accent"
                className={styles.btn}
                type="submit"
                disabled={!isValid}
              >
                {isLoading ? <Loader type="pulse" /> : "Sign up"}
              </Button>
              <p>
                Already have an account?{" "}
                <span
                  onClick={() => setIsRegister(false)}
                  className={styles.link}
                >
                  Sign in
                </span>{" "}
              </p>
            </>
          ) : (
            <>
              <Button
                color="accent"
                className={styles.btn}
                type="submit"
                disabled={!isValid}
              >
                {isLoading ? <Loader type="pulse" /> : "Sign in"}
              </Button>
              <p>
                Don&apos;t have an account?{" "}
                <span
                  onClick={() => setIsRegister(true)}
                  className={styles.link}
                >
                  Sign up
                </span>{" "}
              </p>
            </>
          )}
        </div>
      </form>
      <div
        className={styles.close}
        onClick={() => {
          modal.close();
        }}
      >
        <SvgClose className={styles.svg} />
      </div>
      <Background />
    </div>
  );
};
