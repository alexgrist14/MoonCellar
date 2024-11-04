import { IAuth } from "@/src/lib/shared/types/auth";
import { Button } from "@/src/lib/shared/ui/Button";
import { FC, useState } from "react";
import { Input } from "@/src/lib/shared/ui/Input";
import { SubmitHandler, useForm } from "react-hook-form";
import styles from "./AuthModal.module.scss";
import { useRouter } from "next/router";
import { modal } from "../Modal";
import { useAuthStore } from "../../store/auth.store";
import { SvgClose } from "../svg";
import Background from "../Background/Background";
import { authAPI, userAPI } from "../../api";
import { axiosUtils } from "../../utils/axios";
import { setCookie } from "../../utils/cookies";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";

export const AuthModal: FC = () => {
  const [isRegister, setIsRegister] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { setAuth,setProfile } = useAuthStore();
  const { push } = useRouter();
  const { login, signup } = authAPI;

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<IAuth>({
    mode: "onChange",
  });

  const handleLogin: SubmitHandler<IAuth> = (data) => {
    setError(null);

    const loginDto: Omit<IAuth, "userName"> = {
      email: data.email,
      password: data.password,
    };

    login(loginDto)
      .then((res1) => {
        modal.close();

        userAPI.getById(res1.data.userId).then((res) => {
          push(`/user/${res.data.userName}`);

        });
      })
      .catch(axiosUtils.toastError);
  };

  const handleSignUp: SubmitHandler<IAuth> = (data) => {
    setError(null);

    const singUpDto: IAuth = {
      userName: data.userName,
      email: data.email,
      password: data.password,
    };

    signup(singUpDto)
      .then((res) => {
        modal.close();
        push(`/user/${data.userName}`);s
      })
      .catch(axiosUtils.toastError);
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
              <Input type="text" {...register("userName", { required: true })} />
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
                Sign up
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
                Sign in
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
